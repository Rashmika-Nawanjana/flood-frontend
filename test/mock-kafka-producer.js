// =============================================
// FloodSense LK — Mock Kafka Producer
// Realistic zone-specific flood escalation simulation
//
// Each zone escalates independently at different rates:
//   - Hanwella (upstream) peaks first → triggers downstream cascade
//   - Kolonnawa peaks next → urban flash flood
//   - Kaduwela follows → suburban spread
//   - Other zones respond with delay
//
// Cycle: 12 steps UP + 12 steps DOWN = 240s per cycle
// Events are zone-correlated: when a zone hits WARNING,
// predictions fire for THAT zone. When HIGH, alerts fire for THAT zone.
// =============================================

const WebSocket = require('ws');
const http = require('http');

const KAFKA_URL = process.env.KAFKA_URL || 'ws://127.0.0.1:19092';
const API_URL = process.env.API_URL || 'http://127.0.0.1:5000';
const INTERVAL_MS = 10000; // 10 seconds

// ── Zone profiles: each zone has its own escalation offset and peak ──
const ZONE_PROFILES = [
  { zone_id: 'ZONE-K5', zone_name: 'Hanwella Basin',   sensor_id: 'KR-003',    offset: 0, peakStep: 8,  basePop: 28600, shelter_id: 'SH-K005' },
  { zone_id: 'ZONE-K3', zone_name: 'Kolonnawa Basin',  sensor_id: 'KR-001',    offset: 2, peakStep: 10, basePop: 45200, shelter_id: 'SH-K003' },
  { zone_id: 'ZONE-K4', zone_name: 'Kaduwela Basin',   sensor_id: 'KR-002',    offset: 3, peakStep: 10, basePop: 32800, shelter_id: 'SH-K004' },
  { zone_id: 'ZONE-K7', zone_name: 'Kelaniya Basin',   sensor_id: 'KR-004',    offset: 4, peakStep: 11, basePop: 52100, shelter_id: 'SH-K007' },
  { zone_id: 'ZONE-K1', zone_name: 'Getambe Basin',    sensor_id: 'MR-KND-001', offset: 5, peakStep: 11, basePop: 20500, shelter_id: 'SH-K001' },
  { zone_id: 'ZONE-K2', zone_name: 'Peradeniya Basin', sensor_id: 'MR-KND-002', offset: 6, peakStep: 12, basePop: 15200, shelter_id: 'SH-K002' },
];

const BASELINE = { water_level_m: 2.0, flow_velocity_mps: 0.40, rainfall_mm_per_hr: 2.0, temperature_c: 28.5, air_pressure_hpa: 1013.0, risk_score: 15 };
const STEP_INC = { water_level_m: 0.35, flow_velocity_mps: 0.08, rainfall_mm_per_hr: 2.5, temperature_c: -0.3, air_pressure_hpa: -0.4, risk_score: 8 };
const TOTAL_STEPS = 12;

function riskLevel(score) {
  if (score >= 85) return { level: 'CRITICAL', color: '#EF4444' };
  if (score >= 65) return { level: 'HIGH',     color: '#F97316' };
  if (score >= 45) return { level: 'WARNING',  color: '#EAB308' };
  if (score >= 25) return { level: 'WATCH',    color: '#EAB308' };
  return { level: 'LOW', color: '#22C55E' };
}

function populationAtRisk(basePop, riskLvl) {
  const multipliers = { LOW: 0, WATCH: 0.1, WARNING: 0.35, HIGH: 0.7, CRITICAL: 1.0 };
  return Math.round(basePop * (multipliers[riskLvl] || 0));
}

// ── Per-zone state ──
const zoneState = {};
ZONE_PROFILES.forEach(zp => {
  zoneState[zp.zone_id] = { previousLevel: 'LOW', alertId: null, predictionEmitted: false, anomalyEmitted: false };
});

let globalStep = 0;
let escalating = true;
let cycleCount = 0;

// ── Connect to Mock Kafka ──
let kafka = null;
let intervalHandle = null;

function connect() {
  console.log(`[Producer] Connecting to Kafka at ${KAFKA_URL}...`);
  kafka = new WebSocket(KAFKA_URL, { headers: { 'x-client-id': 'mock-producer' } });

  kafka.on('open', () => {
    console.log('[Producer] Connected to Kafka broker');
    console.log(`[Producer] ${ZONE_PROFILES.length} zones, staggered escalation, ${INTERVAL_MS/1000}s interval`);
    console.log('[Producer] ──────────────────────────────────────');
    tick();
    intervalHandle = setInterval(tick, INTERVAL_MS);
  });

  kafka.on('close', () => {
    console.warn('[Producer] Kafka connection lost. Reconnecting in 3s...');
    if (intervalHandle) clearInterval(intervalHandle);
    setTimeout(connect, 3000);
  });

  kafka.on('error', (err) => { console.error('[Producer] Kafka error:', err.message); });
}

function publish(topic, message) {
  if (kafka && kafka.readyState === WebSocket.OPEN) {
    kafka.send(JSON.stringify({ action: 'publish', topic, message }));
  }
}

function postToAPI(endpoint, data) {
  const body = JSON.stringify(data);
  const url = new URL(`${API_URL}${endpoint}`);
  const options = { method: 'POST', hostname: url.hostname, port: url.port, path: url.pathname, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
  const req = http.request(options);
  req.on('error', () => {});
  req.write(body);
  req.end();
}

// ── Main tick ──
function tick() {
  const ts = new Date().toISOString();
  const arrow = escalating ? '▲' : '▼';
  console.log(`\n[Producer] ── Global step ${globalStep}/${TOTAL_STEPS} ${arrow} (cycle ${cycleCount}) ──`);

  ZONE_PROFILES.forEach((zp, i) => {
    // Each zone's effective step is offset from the global step
    const effectiveStep = Math.max(0, Math.min(zp.peakStep, globalStep - zp.offset));
    const zoneRiskScore = BASELINE.risk_score + (effectiveStep * STEP_INC.risk_score);
    const { level: currentLevel, color: currentColor } = riskLevel(zoneRiskScore);
    const state = zoneState[zp.zone_id];

    // Sensor readings scale with this zone's effective step
    const wl = BASELINE.water_level_m + (effectiveStep * STEP_INC.water_level_m);
    const fv = BASELINE.flow_velocity_mps + (effectiveStep * STEP_INC.flow_velocity_mps);
    const rf = BASELINE.rainfall_mm_per_hr + (effectiveStep * STEP_INC.rainfall_mm_per_hr);
    const tc = BASELINE.temperature_c + (effectiveStep * STEP_INC.temperature_c);
    const ap = BASELINE.air_pressure_hpa + (effectiveStep * STEP_INC.air_pressure_hpa);
    const trend = effectiveStep > 0 && escalating ? 'RISING' : effectiveStep > 0 ? 'FALLING' : 'STABLE';

    console.log(`  ${zp.zone_name.padEnd(20)} step=${effectiveStep} risk=${zoneRiskScore.toFixed(0)} (${currentLevel})`);

    // 1. Sensor telemetry (always)
    const jitter = Math.random() * 0.1;
    publish('sensor-updates', {
      sensor_id: zp.sensor_id, zone_id: zp.zone_id,
      current_reading: {
        water_level_m: parseFloat((wl + jitter).toFixed(2)),
        flow_velocity_mps: parseFloat((fv + jitter * 0.05).toFixed(2)),
        rainfall_mm_per_hr: parseFloat((rf + jitter * 0.5).toFixed(1)),
        temperature_c: parseFloat((tc - jitter * 0.2).toFixed(1)),
        air_pressure_hpa: parseFloat((ap + jitter * 0.1).toFixed(1)),
        trend,
      },
      timestamp: ts,
    });

    // 2. Zone risk update (when level changes for this zone)
    if (state.previousLevel !== currentLevel) {
      const pop = populationAtRisk(zp.basePop, currentLevel);
      publish('zone-risk-updates', {
        zone_id: zp.zone_id, zone_name: zp.zone_name,
        previous_level: state.previousLevel, current_level: currentLevel,
        risk_score: parseFloat(zoneRiskScore.toFixed(1)), color_code: currentColor,
        population_at_risk: pop, timestamp: ts,
      });
      state.previousLevel = currentLevel;
      console.log(`    → Risk changed to ${currentLevel} | pop_at_risk=${pop}`);
    }

    // 3. Prediction (when THIS zone enters WARNING — zone-specific)
    if (escalating && currentLevel === 'WARNING' && !state.predictionEmitted) {
      state.predictionEmitted = true;
      const predId = `PRED-${zp.zone_id}-${Date.now().toString(36).toUpperCase()}`;
      const predData = {
        prediction_id: predId, zone_id: zp.zone_id, zone_name: zp.zone_name,
        created_at: ts,
        prediction_window: { from: ts, to: new Date(Date.now() + 6 * 3600000).toISOString() },
        flood_probability_percent: 55 + Math.round(Math.random() * 25),
        predicted_peak_level_m: parseFloat((wl + STEP_INC.water_level_m * 4).toFixed(2)),
        estimated_flood_time: new Date(Date.now() + (3 + Math.random() * 3) * 3600000).toISOString(),
        severity: 'WARNING', confidence_percent: 70 + Math.round(Math.random() * 15),
        model_version: 'XGBoost-v2.3.1-SL',
        top_risk_factors: [
          { factor: 'Upstream Water Level', value: `${wl.toFixed(1)}m`, impact: 'High' },
          { factor: 'Rainfall (Last 6h)', value: `${(rf * 6).toFixed(0)}mm`, impact: 'High' },
          { factor: 'Flow Velocity', value: `${fv.toFixed(2)} m/s`, impact: 'Medium' },
        ],
        timestamp: ts,
      };
      publish('predictions', predData);
      postToAPI('/api/v1/predictions', predData);
      console.log(`    → Prediction emitted: ${predId}`);
    }

    // 4. Alert NEW (when THIS zone enters HIGH — zone-specific)
    if (escalating && currentLevel === 'HIGH' && !state.alertId) {
      const alertId = `ALT-${zp.zone_id}-${Date.now().toString(36).toUpperCase()}`;
      state.alertId = alertId;
      const alertData = {
        alert_id: alertId, zone_id: zp.zone_id, zone_name: zp.zone_name,
        severity: 'HIGH', severity_code: 3,
        title: `Flood Warning: ${zp.zone_name}`,
        message: `Water levels rising rapidly in ${zp.zone_name}. Prepare for possible evacuation.`,
        triggered_at: ts, triggered_by: 'XGBOOST_AUTOMATED',
        status: 'ACTIVE', resolved_at: null,
        affected_population: populationAtRisk(zp.basePop, 'HIGH'),
        recommended_action: 'PREPARE_EVACUATE',
        recommended_shelters: [{ shelter_id: zp.shelter_id, name: zp.zone_name + ' Shelter', lat: 0, lng: 0 }],
        notifications_sent: { push: Math.round(zp.basePop * 0.3), sms: Math.round(zp.basePop * 0.1), email: Math.round(zp.basePop * 0.02) },
        timestamp: ts,
      };
      publish('alerts-new', alertData);
      postToAPI('/api/v1/alerts', alertData);
      console.log(`    → Alert emitted: ${alertId}`);
    }

    // 5. Alert RESOLVED (when THIS zone de-escalates from HIGH to WARNING)
    if (!escalating && currentLevel === 'WARNING' && state.alertId) {
      publish('alerts-resolved', {
        alert_id: state.alertId, zone_id: zp.zone_id,
        resolved_at: ts, resolution_note: `Water levels receding in ${zp.zone_name}. All clear.`,
      });
      console.log(`    → Alert resolved: ${state.alertId}`);
      state.alertId = null;
    }

    // 6. Anomaly (once per zone during escalation at different steps)
    const anomalyStep = 3 + i;
    if (escalating && effectiveStep === anomalyStep && !state.anomalyEmitted) {
      state.anomalyEmitted = true;
      const types = ['SUDDEN_SPIKE', 'SENSOR_DRIFT', 'RAPID_DESCENT', 'FLATLINE_ERROR', 'NOISE_THRESHOLD'];
      const anomType = types[i % types.length];
      const anomId = `ANM-${zp.zone_id}-${Date.now().toString(36).toUpperCase()}`;
      const anomData = {
        anomaly_id: anomId, sensor_id: zp.sensor_id,
        detected_at: ts, type: anomType, severity: currentLevel === 'LOW' ? 'WATCH' : currentLevel,
        anomaly_score: parseFloat((0.7 + Math.random() * 0.25).toFixed(2)),
        description: `${anomType.replace(/_/g, ' ')} detected on ${zp.sensor_id} in ${zp.zone_name}.`,
        reading_at_detection: { water_level_m: parseFloat(wl.toFixed(2)), rate_of_change_m_per_hr: parseFloat((Math.random() * 3).toFixed(1)) },
        expected_range: { min_m: parseFloat((wl - 1).toFixed(2)), max_m: parseFloat((wl - 0.2).toFixed(2)) },
        status: 'UNRESOLVED', auto_alert_triggered: currentLevel === 'HIGH' || currentLevel === 'CRITICAL',
        timestamp: ts,
      };
      publish('anomalies', anomData);
      postToAPI('/api/v1/anomalies', anomData);
      console.log(`    → Anomaly emitted: ${anomId} (${anomType})`);
    }

    // 7. Sensor offline (Peradeniya goes offline at global step 9)
    if (zp.zone_id === 'ZONE-K2' && escalating && globalStep === 9) {
      publish('sensor-offline', {
        sensor_id: 'MR-KND-002', zone_id: 'ZONE-K2',
        last_seen: new Date(Date.now() - 5 * 60000).toISOString(), status: 'OFFLINE',
      });
      console.log(`    → Sensor MR-KND-002 went OFFLINE`);
    }
  });

  // ── Advance global step ──
  if (escalating) {
    globalStep++;
    if (globalStep >= TOTAL_STEPS) {
      escalating = false;
      console.log('\n[Producer] ════ PEAK REACHED — Beginning de-escalation ════');
    }
  } else {
    globalStep--;
    if (globalStep <= 0) {
      globalStep = 0;
      escalating = true;
      cycleCount++;
      // Reset per-zone state for next cycle
      ZONE_PROFILES.forEach(zp => {
        zoneState[zp.zone_id].predictionEmitted = false;
        zoneState[zp.zone_id].anomalyEmitted = false;
      });
      console.log('\n[Producer] ════ BASELINE REACHED — Restarting cycle ════');
    }
  }
}

connect();

process.on('SIGINT', () => {
  console.log('\n[Producer] Shutting down...');
  if (intervalHandle) clearInterval(intervalHandle);
  if (kafka) kafka.close();
  process.exit(0);
});
