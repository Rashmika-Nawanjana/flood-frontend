// =============================================
// FloodSense LK — Seed Data for Mock API Server
// Comprehensive Sri Lankan flood monitoring data
// 8 zones, 6 sensors, 8 shelters + initial alerts/predictions/anomalies
// =============================================

function now() { return new Date().toISOString(); }
function hoursAgo(h) { return new Date(Date.now() - h * 3600000).toISOString(); }

// Helper to generate an irregular polygon within a bounding box
function generatePolygon(minLng, minLat, maxLng, maxLat) {
  const cLng = (minLng + maxLng) / 2;
  const cLat = (minLat + maxLat) / 2;
  const rLng = (maxLng - minLng) / 2;
  const rLat = (maxLat - minLat) / 2;
  const coords = [];
  const numPoints = 16;
  
  // Unique deformation characteristics for this specific polygon
  const phase1 = Math.random() * Math.PI * 2;
  const phase2 = Math.random() * Math.PI * 2;
  const freq1 = 2 + Math.floor(Math.random() * 4); // Random frequency 2-5
  const freq2 = 4 + Math.floor(Math.random() * 5); // Random frequency 4-8
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    // Organic smooth deformation + slight random noise
    const wave = (Math.sin(angle * freq1 + phase1) * 0.15) + (Math.cos(angle * freq2 + phase2) * 0.15);
    const noise = (Math.random() - 0.5) * 0.1;
    const jitter = 0.75 + wave + noise;
    
    coords.push([
      Number((cLng + Math.cos(angle) * rLng * jitter).toFixed(4)),
      Number((cLat + Math.sin(angle) * rLat * jitter).toFixed(4))
    ]);
  }
  coords.push(coords[0]); // Close the polygon
  return [coords];
}

const sensors = [
  {
    sensor_id: 'MR-KND-001', name: 'Mahaweli River — Getambe Bridge',
    is_active: true, installed_date: '2025-11-20',
    location: { lat: 7.2721, lng: 80.6132, zone_id: 'ZONE-K1', zone_name: 'Getambe Basin', address: 'Under Getambe Bridge, Peradeniya Road, Kandy' },
    readings: { water_level_m: 2.15, rainfall_mm_per_hr: 3.2, flow_velocity_mps: 0.45, temperature_c: 28.5, air_pressure_hpa: 1012.5 },
    current_reading: { water_level_m: 2.15, rainfall_mm_per_hr: 3.2, flow_velocity_mps: 0.45, temperature_c: 28.5, air_pressure_hpa: 1012.5, recorded_at: now() },
    status: { device_online: true, battery_percent: 75, signal_strength_dbm: -68, last_seen: now() },
    device_health: { is_online: true, battery_percent: 75, signal_strength_dbm: -68, last_seen: now(), last_maintenance: '2026-03-10', firmware_version: 'v1.0.2-esp32' },
    thresholds: { watch_m: 3.5, advisory_m: 4.5, warning_m: 5.0, critical_m: 6.5 }
  },
  {
    sensor_id: 'MR-KND-002', name: 'Mahaweli River — Peradeniya',
    is_active: true, installed_date: '2025-12-05',
    location: { lat: 7.2520, lng: 80.5921, zone_id: 'ZONE-K2', zone_name: 'Peradeniya Basin', address: 'Near Peradeniya Botanical Gardens, Kandy' },
    readings: { water_level_m: 1.80, rainfall_mm_per_hr: 1.5, flow_velocity_mps: 0.38, temperature_c: 27.8, air_pressure_hpa: 1013.0 },
    current_reading: { water_level_m: 1.80, rainfall_mm_per_hr: 1.5, flow_velocity_mps: 0.38, temperature_c: 27.8, air_pressure_hpa: 1013.0, recorded_at: now() },
    status: { device_online: true, battery_percent: 92, signal_strength_dbm: -55, last_seen: now() },
    device_health: { is_online: true, battery_percent: 92, signal_strength_dbm: -55, last_seen: now(), last_maintenance: '2026-02-15', firmware_version: 'v1.0.2-esp32' },
    thresholds: { watch_m: 3.0, advisory_m: 4.0, warning_m: 4.5, critical_m: 5.5 }
  },
  {
    sensor_id: 'KR-001', name: 'Kelani River — Kolonnawa',
    is_active: true, installed_date: '2026-01-10',
    location: { lat: 6.9200, lng: 79.8600, zone_id: 'ZONE-K3', zone_name: 'Kolonnawa Basin', address: 'Kolonnawa Bridge, Colombo' },
    readings: { water_level_m: 2.40, rainfall_mm_per_hr: 5.0, flow_velocity_mps: 0.55, temperature_c: 29.2, air_pressure_hpa: 1011.0 },
    current_reading: { water_level_m: 2.40, rainfall_mm_per_hr: 5.0, flow_velocity_mps: 0.55, temperature_c: 29.2, air_pressure_hpa: 1011.0, recorded_at: now() },
    status: { device_online: true, battery_percent: 88, signal_strength_dbm: -62, last_seen: now() },
    device_health: { is_online: true, battery_percent: 88, signal_strength_dbm: -62, last_seen: now(), last_maintenance: '2026-03-28', firmware_version: 'v1.0.1-esp32' },
    thresholds: { watch_m: 3.5, advisory_m: 4.5, warning_m: 5.0, critical_m: 6.0 }
  },
  {
    sensor_id: 'KR-002', name: 'Kelani River — Kaduwela',
    is_active: true, installed_date: '2026-01-15',
    location: { lat: 6.9300, lng: 79.9800, zone_id: 'ZONE-K4', zone_name: 'Kaduwela Basin', address: 'Near Kaduwela Town Bridge, Colombo' },
    readings: { water_level_m: 1.95, rainfall_mm_per_hr: 2.0, flow_velocity_mps: 0.40, temperature_c: 29.0, air_pressure_hpa: 1012.0 },
    current_reading: { water_level_m: 1.95, rainfall_mm_per_hr: 2.0, flow_velocity_mps: 0.40, temperature_c: 29.0, air_pressure_hpa: 1012.0, recorded_at: now() },
    status: { device_online: true, battery_percent: 81, signal_strength_dbm: -70, last_seen: now() },
    device_health: { is_online: true, battery_percent: 81, signal_strength_dbm: -70, last_seen: now(), last_maintenance: '2026-04-01', firmware_version: 'v1.0.2-esp32' },
    thresholds: { watch_m: 3.0, advisory_m: 4.0, warning_m: 4.5, critical_m: 5.5 }
  },
  {
    sensor_id: 'KR-003', name: 'Kelani River — Hanwella',
    is_active: true, installed_date: '2026-02-01',
    location: { lat: 6.9010, lng: 80.0850, zone_id: 'ZONE-K5', zone_name: 'Hanwella Basin', address: 'Hanwella Bridge, Hanwella' },
    readings: { water_level_m: 2.60, rainfall_mm_per_hr: 6.5, flow_velocity_mps: 0.62, temperature_c: 28.0, air_pressure_hpa: 1010.5 },
    current_reading: { water_level_m: 2.60, rainfall_mm_per_hr: 6.5, flow_velocity_mps: 0.62, temperature_c: 28.0, air_pressure_hpa: 1010.5, recorded_at: now() },
    status: { device_online: true, battery_percent: 70, signal_strength_dbm: -72, last_seen: now() },
    device_health: { is_online: true, battery_percent: 70, signal_strength_dbm: -72, last_seen: now(), last_maintenance: '2026-03-20', firmware_version: 'v1.0.2-esp32' },
    thresholds: { watch_m: 3.5, advisory_m: 4.5, warning_m: 5.5, critical_m: 6.5 }
  },
  {
    sensor_id: 'KR-004', name: 'Kelani River — Kelaniya',
    is_active: true, installed_date: '2026-02-10',
    location: { lat: 6.9550, lng: 79.9220, zone_id: 'ZONE-K7', zone_name: 'Kelaniya Basin', address: 'Near Kelaniya Temple, Kelaniya' },
    readings: { water_level_m: 2.10, rainfall_mm_per_hr: 3.0, flow_velocity_mps: 0.48, temperature_c: 29.5, air_pressure_hpa: 1011.8 },
    current_reading: { water_level_m: 2.10, rainfall_mm_per_hr: 3.0, flow_velocity_mps: 0.48, temperature_c: 29.5, air_pressure_hpa: 1011.8, recorded_at: now() },
    status: { device_online: true, battery_percent: 85, signal_strength_dbm: -60, last_seen: now() },
    device_health: { is_online: true, battery_percent: 85, signal_strength_dbm: -60, last_seen: now(), last_maintenance: '2026-04-05', firmware_version: 'v1.0.2-esp32' },
    thresholds: { watch_m: 3.0, advisory_m: 4.0, warning_m: 5.0, critical_m: 6.0 }
  }
];

const zones = [
  {
    zone_id: 'ZONE-K1', zone_name: 'Getambe Basin',
    description: 'Lower Mahaweli region near Peradeniya — historically flood-prone during monsoon',
    risk_level: 'LOW', risk_score: 15.0, color_code: '#22C55E',
    population_at_risk: 20500, sensors_in_zone: ['MR-KND-001'], active_alerts: 0, last_updated: now(),
    geometry: { type: 'Polygon', coordinates: generatePolygon(80.605, 7.265, 80.622, 7.280) },
    current_conditions: { avg_water_level_m: 2.15, max_water_level_m: 2.35, avg_flow_velocity_mps: 0.45, total_rainfall_mm: 18.5, trend: 'STABLE' }
  },
  {
    zone_id: 'ZONE-K2', zone_name: 'Peradeniya Basin',
    description: 'Upstream Mahaweli segment — university and botanical garden area',
    risk_level: 'LOW', risk_score: 10.0, color_code: '#22C55E',
    population_at_risk: 15200, sensors_in_zone: ['MR-KND-002'], active_alerts: 0, last_updated: now(),
    geometry: { type: 'Polygon', coordinates: generatePolygon(80.585, 7.245, 80.600, 7.260) },
    current_conditions: { avg_water_level_m: 1.80, max_water_level_m: 2.00, avg_flow_velocity_mps: 0.38, total_rainfall_mm: 8.2, trend: 'STABLE' }
  },
  {
    zone_id: 'ZONE-K3', zone_name: 'Kolonnawa Basin',
    description: 'Kelani River lowlands — dense urban area prone to flash flooding',
    risk_level: 'WATCH', risk_score: 28.0, color_code: '#EAB308',
    population_at_risk: 45200, sensors_in_zone: ['KR-001'], active_alerts: 0, last_updated: now(),
    geometry: { type: 'Polygon', coordinates: generatePolygon(79.850, 6.910, 79.870, 6.940) },
    current_conditions: { avg_water_level_m: 2.40, max_water_level_m: 2.65, avg_flow_velocity_mps: 0.55, total_rainfall_mm: 32.0, trend: 'RISING' }
  },
  {
    zone_id: 'ZONE-K4', zone_name: 'Kaduwela Basin',
    description: 'Mid-stream Kelani segment — residential suburbs with moderate flood risk',
    risk_level: 'LOW', risk_score: 12.0, color_code: '#22C55E',
    population_at_risk: 32800, sensors_in_zone: ['KR-002'], active_alerts: 0, last_updated: now(),
    geometry: { type: 'Polygon', coordinates: generatePolygon(79.970, 6.920, 79.990, 6.945) },
    current_conditions: { avg_water_level_m: 1.95, max_water_level_m: 2.10, avg_flow_velocity_mps: 0.40, total_rainfall_mm: 12.0, trend: 'STABLE' }
  },
  {
    zone_id: 'ZONE-K5', zone_name: 'Hanwella Basin',
    description: 'Upper Kelani region — major upstream flood source during southwest monsoon',
    risk_level: 'WATCH', risk_score: 30.0, color_code: '#EAB308',
    population_at_risk: 28600, sensors_in_zone: ['KR-003'], active_alerts: 0, last_updated: now(),
    geometry: { type: 'Polygon', coordinates: generatePolygon(80.075, 6.890, 80.095, 6.915) },
    current_conditions: { avg_water_level_m: 2.60, max_water_level_m: 2.85, avg_flow_velocity_mps: 0.62, total_rainfall_mm: 42.0, trend: 'RISING' }
  },
  {
    zone_id: 'ZONE-K6', zone_name: 'Pugoda Basin',
    description: 'Rural mid-Kelani area — agricultural land with seasonal flooding',
    risk_level: 'LOW', risk_score: 18.0, color_code: '#22C55E',
    population_at_risk: 12400, sensors_in_zone: [], active_alerts: 0, last_updated: now(),
    geometry: { type: 'Polygon', coordinates: generatePolygon(80.120, 6.960, 80.145, 6.985) },
    current_conditions: { avg_water_level_m: 1.50, max_water_level_m: 1.75, avg_flow_velocity_mps: 0.30, total_rainfall_mm: 10.0, trend: 'STABLE' }
  },
  {
    zone_id: 'ZONE-K7', zone_name: 'Kelaniya Basin',
    description: 'Lower Kelani near river mouth — tidal influence zone, dense population',
    risk_level: 'LOW', risk_score: 14.0, color_code: '#22C55E',
    population_at_risk: 52100, sensors_in_zone: ['KR-004'], active_alerts: 0, last_updated: now(),
    geometry: { type: 'Polygon', coordinates: generatePolygon(79.912, 6.945, 79.932, 6.965) },
    current_conditions: { avg_water_level_m: 2.10, max_water_level_m: 2.30, avg_flow_velocity_mps: 0.48, total_rainfall_mm: 15.0, trend: 'STABLE' }
  },
  {
    zone_id: 'ZONE-K8', zone_name: 'Malwana Basin',
    description: 'Kelani tributary confluence — low-lying area with poor drainage',
    risk_level: 'LOW', risk_score: 16.0, color_code: '#22C55E',
    population_at_risk: 18900, sensors_in_zone: [], active_alerts: 0, last_updated: now(),
    geometry: { type: 'Polygon', coordinates: generatePolygon(80.030, 6.950, 80.050, 6.975) },
    current_conditions: { avg_water_level_m: 1.70, max_water_level_m: 1.90, avg_flow_velocity_mps: 0.35, total_rainfall_mm: 11.0, trend: 'STABLE' }
  }
];

const shelters = [
  { shelter_id: 'SH-K001', name: 'Getambe Temple Hall', zone_id: 'ZONE-K1', lat: 7.2715, lng: 80.6125, capacity: 400, current_occupancy: 45, contact_number: '+94812222222', status: 'OPEN', distance_km: 1.2 },
  { shelter_id: 'SH-K002', name: 'Peradeniya Community Center', zone_id: 'ZONE-K2', lat: 7.2540, lng: 80.5950, capacity: 300, current_occupancy: 120, contact_number: '+94812233333', status: 'OPEN', distance_km: 0.8 },
  { shelter_id: 'SH-K003', name: 'Kolonnawa Municipal Hall', zone_id: 'ZONE-K3', lat: 6.9220, lng: 79.8620, capacity: 600, current_occupancy: 580, contact_number: '+94112444444', status: 'FULL', distance_km: 1.5 },
  { shelter_id: 'SH-K004', name: 'Kaduwela Sports Complex', zone_id: 'ZONE-K4', lat: 6.9320, lng: 79.9820, capacity: 500, current_occupancy: 250, contact_number: '+94112555555', status: 'OPEN', distance_km: 2.0 },
  { shelter_id: 'SH-K005', name: 'Hanwella Town Hall', zone_id: 'ZONE-K5', lat: 6.9030, lng: 80.0870, capacity: 350, current_occupancy: 310, contact_number: '+94362266666', status: 'OPEN', distance_km: 1.0 },
  { shelter_id: 'SH-K006', name: 'Pugoda School Gymnasium', zone_id: 'ZONE-K6', lat: 6.9650, lng: 80.1300, capacity: 250, current_occupancy: 10, contact_number: '+94362277777', status: 'OPEN', distance_km: 0.5 },
  { shelter_id: 'SH-K007', name: 'Kelaniya Temple Annex', zone_id: 'ZONE-K7', lat: 6.9560, lng: 79.9230, capacity: 450, current_occupancy: 200, contact_number: '+94112388888', status: 'OPEN', distance_km: 0.7 },
  { shelter_id: 'SH-K008', name: 'Malwana Community Center', zone_id: 'ZONE-K8', lat: 6.9550, lng: 80.0400, capacity: 280, current_occupancy: 0, contact_number: '+94362299999', status: 'OPEN', distance_km: 1.3 },
];

const alerts = [
  {
    alert_id: 'ALT-SEED-001', zone_id: 'ZONE-K3', zone_name: 'Kolonnawa Basin',
    severity: 'WARNING', severity_code: 2, title: 'Rising Water Levels: Kolonnawa',
    message: 'Water levels have exceeded the watch threshold at Kolonnawa Bridge sensor. Monitor closely.',
    triggered_at: hoursAgo(6), triggered_by: 'XGBOOST_AUTOMATED', status: 'ACTIVE', resolved_at: null,
    affected_population: 45200, recommended_action: 'MONITOR',
    recommended_shelters: [{ shelter_id: 'SH-K003', name: 'Kolonnawa Municipal Hall', lat: 6.9220, lng: 79.8620 }],
    notifications_sent: { push: 1200, sms: 450, email: 85 }
  },
  {
    alert_id: 'ALT-SEED-002', zone_id: 'ZONE-K5', zone_name: 'Hanwella Basin',
    severity: 'HIGH', severity_code: 3, title: 'Flood Warning: Hanwella Basin',
    message: 'Heavy upstream rainfall detected. Flash flooding possible within 2-4 hours.',
    triggered_at: hoursAgo(3), triggered_by: 'XGBOOST_AUTOMATED', status: 'ACTIVE', resolved_at: null,
    affected_population: 28600, recommended_action: 'PREPARE_EVACUATE',
    recommended_shelters: [{ shelter_id: 'SH-K005', name: 'Hanwella Town Hall', lat: 6.9030, lng: 80.0870 }],
    notifications_sent: { push: 800, sms: 320, email: 55 }
  },
  {
    alert_id: 'ALT-SEED-003', zone_id: 'ZONE-K1', zone_name: 'Getambe Basin',
    severity: 'WARNING', severity_code: 2, title: 'Advisory: Getambe Water Level Rising',
    message: 'Mahaweli River levels approaching advisory threshold near Getambe Bridge.',
    triggered_at: hoursAgo(12), triggered_by: 'XGBOOST_AUTOMATED', status: 'RESOLVED', resolved_at: hoursAgo(8),
    affected_population: 20500, recommended_action: 'MONITOR',
    recommended_shelters: [{ shelter_id: 'SH-K001', name: 'Getambe Temple Hall', lat: 7.2715, lng: 80.6125 }],
    notifications_sent: { push: 600, sms: 200, email: 40 }
  },
  {
    alert_id: 'ALT-SEED-004', zone_id: 'ZONE-K7', zone_name: 'Kelaniya Basin',
    severity: 'CRITICAL', severity_code: 4, title: 'Emergency: Kelaniya Flooding (Past Event)',
    message: 'Major flooding in Kelaniya. Immediate evacuation ordered for low-lying areas.',
    triggered_at: hoursAgo(48), triggered_by: 'MANUAL_OFFICER', status: 'RESOLVED', resolved_at: hoursAgo(36),
    affected_population: 52100, recommended_action: 'EVACUATE',
    recommended_shelters: [{ shelter_id: 'SH-K007', name: 'Kelaniya Temple Annex', lat: 6.9560, lng: 79.9230 }],
    notifications_sent: { push: 3500, sms: 1200, email: 200 }
  }
];

const predictions = [
  {
    prediction_id: 'PRED-SEED-001', zone_id: 'ZONE-K3', zone_name: 'Kolonnawa Basin',
    created_at: hoursAgo(2), prediction_window: { from: now(), to: new Date(Date.now() + 6 * 3600000).toISOString() },
    flood_probability_percent: 62, predicted_peak_level_m: 4.2, estimated_flood_time: new Date(Date.now() + 4 * 3600000).toISOString(),
    severity: 'WARNING', confidence_percent: 78, model_version: 'XGBoost-v2.3.1-SL',
    top_risk_factors: [
      { factor: 'Upstream Rainfall (6h)', value: '85mm', impact: 'High' },
      { factor: 'Current Water Level', value: '2.4m', impact: 'High' },
      { factor: 'Soil Saturation Index', value: '0.82', impact: 'Medium' }
    ]
  },
  {
    prediction_id: 'PRED-SEED-002', zone_id: 'ZONE-K5', zone_name: 'Hanwella Basin',
    created_at: hoursAgo(1), prediction_window: { from: now(), to: new Date(Date.now() + 4 * 3600000).toISOString() },
    flood_probability_percent: 78, predicted_peak_level_m: 5.1, estimated_flood_time: new Date(Date.now() + 2.5 * 3600000).toISOString(),
    severity: 'HIGH', confidence_percent: 85, model_version: 'XGBoost-v2.3.1-SL',
    top_risk_factors: [
      { factor: 'Upstream Discharge Rate', value: '1.8 m³/s', impact: 'High' },
      { factor: 'Rainfall Forecast (NWP)', value: '45mm/3h', impact: 'High' },
      { factor: 'Historical Flood Frequency', value: '3x in 5yr', impact: 'Medium' }
    ]
  },
  {
    prediction_id: 'PRED-SEED-003', zone_id: 'ZONE-K4', zone_name: 'Kaduwela Basin',
    created_at: hoursAgo(4), prediction_window: { from: hoursAgo(2), to: new Date(Date.now() + 8 * 3600000).toISOString() },
    flood_probability_percent: 35, predicted_peak_level_m: 3.5, estimated_flood_time: new Date(Date.now() + 6 * 3600000).toISOString(),
    severity: 'WATCH', confidence_percent: 70, model_version: 'XGBoost-v2.3.1-SL',
    top_risk_factors: [
      { factor: 'Downstream Tidal Level', value: '0.8m MSL', impact: 'Medium' },
      { factor: 'Channel Capacity', value: '72%', impact: 'Medium' },
      { factor: 'Antecedent Moisture', value: '0.65', impact: 'Low' }
    ]
  }
];

const anomalies = [
  {
    anomaly_id: 'ANM-SEED-001', sensor_id: 'KR-001', detected_at: hoursAgo(5),
    type: 'SUDDEN_SPIKE', description: 'Water level jumped 0.8m in 15 minutes — exceeds 3σ threshold.',
    severity: 'HIGH', anomaly_score: 0.94,
    reading_at_detection: { water_level_m: 3.8, rate_of_change_m_per_hr: 3.2 },
    expected_range: { min_m: 2.0, max_m: 3.0 },
    status: 'UNRESOLVED', auto_alert_triggered: true, alert_id: 'ALT-SEED-001'
  },
  {
    anomaly_id: 'ANM-SEED-002', sensor_id: 'MR-KND-002', detected_at: hoursAgo(10),
    type: 'SENSOR_DRIFT', description: 'Gradual upward drift detected over 6 hours without corresponding rainfall.',
    severity: 'WARNING', anomaly_score: 0.72,
    reading_at_detection: { water_level_m: 2.5, rate_of_change_m_per_hr: 0.08 },
    expected_range: { min_m: 1.5, max_m: 2.0 },
    status: 'RESOLVED', auto_alert_triggered: false
  },
  {
    anomaly_id: 'ANM-SEED-003', sensor_id: 'KR-003', detected_at: hoursAgo(2),
    type: 'RAPID_DESCENT', description: 'Water level dropped 1.2m in 30 minutes — possible sensor malfunction or dam release.',
    severity: 'HIGH', anomaly_score: 0.88,
    reading_at_detection: { water_level_m: 1.4, rate_of_change_m_per_hr: -2.4 },
    expected_range: { min_m: 2.2, max_m: 3.0 },
    status: 'UNRESOLVED', auto_alert_triggered: true, alert_id: 'ALT-SEED-002'
  },
  {
    anomaly_id: 'ANM-SEED-004', sensor_id: 'KR-002', detected_at: hoursAgo(18),
    type: 'FLATLINE_ERROR', description: 'Sensor reading unchanged for 4 consecutive hours — possible sensor freeze.',
    severity: 'WATCH', anomaly_score: 0.55,
    reading_at_detection: { water_level_m: 1.95, rate_of_change_m_per_hr: 0.0 },
    expected_range: { min_m: 1.8, max_m: 2.2 },
    status: 'RESOLVED', auto_alert_triggered: false
  }
];

module.exports = { sensors, zones, shelters, alerts, predictions, anomalies };
