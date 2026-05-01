// =============================================
// FloodSense LK — Mock API Server
// In-memory REST API matching docs/apis.txt
// All 18 endpoints with mutable state
//
// Runs on: http://localhost:5000
// =============================================

const express = require('express');
const cors = require('cors');
const seed = require('./data/seed');

const app = express();
const PORT = parseInt(process.env.API_PORT || '5000', 10);

app.use(cors());
app.use(express.json());

// ── In-memory data store (mutable copies of seed) ────
const db = {
  sensors: JSON.parse(JSON.stringify(seed.sensors)),
  zones: JSON.parse(JSON.stringify(seed.zones)),
  shelters: JSON.parse(JSON.stringify(seed.shelters)),
  alerts: JSON.parse(JSON.stringify(seed.alerts)),
  predictions: JSON.parse(JSON.stringify(seed.predictions)),
  anomalies: JSON.parse(JSON.stringify(seed.anomalies)),
};

// Helper: deep merge (for PATCH)
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Helper: generate history data
function generateHistory(sensorId) {
  const now = new Date();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const points = [];
  let waterLevel = 1.8 + Math.random() * 0.5;

  for (let i = 0; i < 24; i++) {
    const t = new Date(from.getTime() + i * 60 * 60 * 1000);
    const delta = (Math.random() - 0.4) * 0.15;
    waterLevel = Math.max(1.0, waterLevel + delta);
    points.push({
      timestamp: t.toISOString(),
      water_level_m: parseFloat(waterLevel.toFixed(2)),
      rainfall_mm: parseFloat((Math.random() * 5).toFixed(1)),
      flow_velocity_mps: parseFloat((0.3 + Math.random() * 0.4).toFixed(2)),
      temperature_c: parseFloat((24 + Math.random() * 5).toFixed(1)),
      air_pressure_hpa: parseFloat((1010 + Math.random() * 4).toFixed(1)),
    });
  }

  const waterLevels = points.map(p => p.water_level_m);
  return {
    status: 'success',
    sensor_id: sensorId,
    from: from.toISOString(),
    to: now.toISOString(),
    interval: '1h',
    count: points.length,
    data: points,
    statistics: {
      max_water_level_m: Math.max(...waterLevels),
      min_water_level_m: Math.min(...waterLevels),
      avg_water_level_m: parseFloat((waterLevels.reduce((a, b) => a + b, 0) / waterLevels.length).toFixed(2)),
      total_rainfall_mm: parseFloat(points.reduce((s, p) => s + p.rainfall_mm, 0).toFixed(1)),
      max_flow_velocity_mps: Math.max(...points.map(p => p.flow_velocity_mps)),
    },
  };
}

// ── Request logger ───────────────────────────────────
app.use((req, res, next) => {
  console.log(`[MockAPI] ${req.method} ${req.path}`);
  next();
});

// ═══════════════════════════════════════════════════════
// SENSORS (6 endpoints)
// ═══════════════════════════════════════════════════════

// 1. GET /api/v1/sensors
app.get('/api/v1/sensors', (req, res) => {
  const active = db.sensors.filter(s => s.is_active !== false);
  res.json({ status: 'success', timestamp: new Date().toISOString(), count: active.length, data: active });
});

// 2. GET /api/v1/sensors/:id
app.get('/api/v1/sensors/:id', (req, res) => {
  const s = db.sensors.find(s => s.sensor_id === req.params.id);
  if (!s) return res.status(404).json({ status: 'error', message: `Sensor ${req.params.id} not found` });
  res.json({ status: 'success', data: s });
});

// 3. POST /api/v1/admin/sensors
app.post('/api/v1/admin/sensors', (req, res) => {
  const newSensor = { is_active: true, ...req.body };
  if (!newSensor.sensor_id) return res.status(400).json({ status: 'error', message: 'sensor_id is required' });
  if (db.sensors.find(s => s.sensor_id === newSensor.sensor_id)) {
    return res.status(409).json({ status: 'error', message: `Sensor ${newSensor.sensor_id} already exists` });
  }
  db.sensors.push(newSensor);
  console.log(`[MockAPI] Created sensor: ${newSensor.sensor_id}`);
  res.status(201).json({ status: 'success', message: `Sensor ${newSensor.sensor_id} created`, data: newSensor });
});

// 4. PATCH /api/v1/admin/sensors/:id
app.patch('/api/v1/admin/sensors/:id', (req, res) => {
  const s = db.sensors.find(s => s.sensor_id === req.params.id);
  if (!s) return res.status(404).json({ status: 'error', message: `Sensor ${req.params.id} not found` });
  deepMerge(s, req.body);
  console.log(`[MockAPI] Updated sensor: ${req.params.id}`);
  res.json({ status: 'success', message: `Sensor ${req.params.id} updated`, data: s });
});

// 5. DELETE /api/v1/admin/sensors/:id
app.delete('/api/v1/admin/sensors/:id', (req, res) => {
  const s = db.sensors.find(s => s.sensor_id === req.params.id);
  if (!s) return res.status(404).json({ status: 'error', message: `Sensor ${req.params.id} not found` });
  s.is_active = false;
  console.log(`[MockAPI] Deactivated sensor: ${req.params.id}`);
  res.json({
    status: 'success',
    message: `Sensor ${req.params.id} has been successfully deactivated.`,
    deactivated_at: new Date().toISOString(),
    note: 'Historical data preserved for XGBoost model training and audit.',
  });
});

// 6. GET /api/v1/sensors/:id/history
app.get('/api/v1/sensors/:id/history', (req, res) => {
  const s = db.sensors.find(s => s.sensor_id === req.params.id);
  if (!s) return res.status(404).json({ status: 'error', message: `Sensor ${req.params.id} not found` });
  res.json(generateHistory(req.params.id));
});

// ═══════════════════════════════════════════════════════
// ZONES (5 endpoints)
// ═══════════════════════════════════════════════════════

// 7. GET /api/v1/zones
app.get('/api/v1/zones', (req, res) => {
  // Attach shelters to each zone
  const zonesWithShelters = db.zones.map(z => ({
    ...z,
    shelters: db.shelters.filter(s => s.zone_id === z.zone_id),
  }));
  res.json({ status: 'success', timestamp: new Date().toISOString(), count: zonesWithShelters.length, data: zonesWithShelters });
});

// 8. GET /api/v1/zones/:id
app.get('/api/v1/zones/:id', (req, res) => {
  const z = db.zones.find(z => z.zone_id === req.params.id);
  if (!z) return res.status(404).json({ status: 'error', message: `Zone ${req.params.id} not found` });
  const zoneShelters = db.shelters.filter(s => s.zone_id === z.zone_id);
  res.json({ status: 'success', data: { ...z, shelters: zoneShelters } });
});

// 9. POST /api/v1/admin/zones
app.post('/api/v1/admin/zones', (req, res) => {
  const newZone = { risk_level: 'LOW', risk_score: 0, color_code: '#22C55E', active_alerts: 0, ...req.body };
  if (!newZone.zone_id) return res.status(400).json({ status: 'error', message: 'zone_id is required' });
  db.zones.push(newZone);
  console.log(`[MockAPI] Created zone: ${newZone.zone_id}`);
  res.status(201).json({ status: 'success', message: `Zone ${newZone.zone_id} created`, data: newZone });
});

// 10. PATCH /api/v1/admin/zones/:id
app.patch('/api/v1/admin/zones/:id', (req, res) => {
  const z = db.zones.find(z => z.zone_id === req.params.id);
  if (!z) return res.status(404).json({ status: 'error', message: `Zone ${req.params.id} not found` });
  deepMerge(z, req.body);
  console.log(`[MockAPI] Updated zone: ${req.params.id}`);
  res.json({ status: 'success', message: `Zone ${req.params.id} updated`, data: z });
});

// 11. DELETE /api/v1/admin/zones/:id
app.delete('/api/v1/admin/zones/:id', (req, res) => {
  const idx = db.zones.findIndex(z => z.zone_id === req.params.id);
  if (idx === -1) return res.status(404).json({ status: 'error', message: `Zone ${req.params.id} not found` });
  db.zones.splice(idx, 1);
  console.log(`[MockAPI] Deleted zone: ${req.params.id}`);
  res.json({ status: 'success', message: `Zone ${req.params.id} deactivated. All historical sensor links preserved for audit.` });
});

// ═══════════════════════════════════════════════════════
// SHELTERS (3 endpoints)
// ═══════════════════════════════════════════════════════

// 12. POST /api/v1/admin/shelters
app.post('/api/v1/admin/shelters', (req, res) => {
  const id = `SH-${Date.now().toString(36).toUpperCase()}`;
  const newShelter = { shelter_id: id, current_occupancy: 0, ...req.body };
  db.shelters.push(newShelter);
  console.log(`[MockAPI] Created shelter: ${id}`);
  res.status(201).json({ status: 'success', message: `Shelter ${id} created`, data: newShelter });
});

// 13. PATCH /api/v1/admin/shelters/:id
app.patch('/api/v1/admin/shelters/:id', (req, res) => {
  const s = db.shelters.find(s => s.shelter_id === req.params.id);
  if (!s) return res.status(404).json({ status: 'error', message: `Shelter ${req.params.id} not found` });
  deepMerge(s, req.body);
  console.log(`[MockAPI] Updated shelter: ${req.params.id}`);
  res.json({ status: 'success', message: `Shelter ${req.params.id} updated`, data: s });
});

// 14. DELETE /api/v1/admin/shelters/:id
app.delete('/api/v1/admin/shelters/:id', (req, res) => {
  const idx = db.shelters.findIndex(s => s.shelter_id === req.params.id);
  if (idx === -1) return res.status(404).json({ status: 'error', message: `Shelter ${req.params.id} not found` });
  db.shelters.splice(idx, 1);
  console.log(`[MockAPI] Deleted shelter: ${req.params.id}`);
  res.json({ status: 'success', message: `Shelter ${req.params.id} has been removed from the registry. Historical data preserved for audit.` });
});

// ═══════════════════════════════════════════════════════
// PREDICTIONS (1 endpoint)
// ═══════════════════════════════════════════════════════

// 15. GET /api/v1/predictions
app.get('/api/v1/predictions', (req, res) => {
  let results = [...db.predictions];
  if (req.query.severity) {
    const severities = req.query.severity.split(',');
    results = results.filter(p => severities.includes(p.severity));
  }
  if (req.query.zone_id) {
    results = results.filter(p => p.zone_id === req.query.zone_id);
  }
  res.json({ status: 'success', count: results.length, data: results });
});

// 15b. POST /api/v1/predictions (producer ingest)
app.post('/api/v1/predictions', (req, res) => {
  const pred = req.body;
  if (!pred.prediction_id) return res.status(400).json({ status: 'error', message: 'prediction_id required' });
  db.predictions.unshift(pred);
  res.status(201).json({ status: 'success', data: pred });
});

// ═══════════════════════════════════════════════════════
// ALERTS (1 endpoint)
// ═══════════════════════════════════════════════════════

// 16. GET /api/v1/alerts
app.get('/api/v1/alerts', (req, res) => {
  let results = [...db.alerts];
  if (req.query.severity) {
    const severities = req.query.severity.split(',');
    results = results.filter(a => severities.includes(a.severity));
  }
  if (req.query.status) {
    results = results.filter(a => a.status === req.query.status);
  }
  if (req.query.zone_id) {
    results = results.filter(a => a.zone_id === req.query.zone_id);
  }
  res.json({ status: 'success', count: results.length, data: results });
});

// 16b. POST /api/v1/alerts (producer ingest)
app.post('/api/v1/alerts', (req, res) => {
  const alert = req.body;
  if (!alert.alert_id) return res.status(400).json({ status: 'error', message: 'alert_id required' });
  db.alerts.unshift(alert);
  res.status(201).json({ status: 'success', data: alert });
});

// ═══════════════════════════════════════════════════════
// ANOMALIES (2 endpoints)
// ═══════════════════════════════════════════════════════

// 17. GET /api/v1/anomalies
app.get('/api/v1/anomalies', (req, res) => {
  let results = [...db.anomalies];
  if (req.query.status) {
    results = results.filter(a => a.status === req.query.status);
  }
  if (req.query.sensor_id) {
    results = results.filter(a => a.sensor_id === req.query.sensor_id);
  }
  res.json({ status: 'success', count: results.length, data: results });
});

// 17b. POST /api/v1/anomalies (producer ingest)
app.post('/api/v1/anomalies', (req, res) => {
  const anomaly = req.body;
  if (!anomaly.anomaly_id) return res.status(400).json({ status: 'error', message: 'anomaly_id required' });
  db.anomalies.unshift(anomaly);
  res.status(201).json({ status: 'success', data: anomaly });
});

// 18. PATCH /api/v1/admin/anomalies/:id
app.patch('/api/v1/admin/anomalies/:id', (req, res) => {
  const a = db.anomalies.find(a => a.anomaly_id === req.params.id);
  if (!a) return res.status(404).json({ status: 'error', message: `Anomaly ${req.params.id} not found` });
  deepMerge(a, req.body);
  console.log(`[MockAPI] Updated anomaly: ${req.params.id}`);
  res.json({ status: 'success', message: `Anomaly ${req.params.id} updated`, data: a });
});

// ── Expose db for external mutation (used by start-test-env) ─
app.locals.db = db;

// ── Start ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[MockAPI] Server running on http://localhost:${PORT}`);
  console.log(`[MockAPI] Data loaded: ${db.sensors.length} sensors, ${db.zones.length} zones, ${db.shelters.length} shelters`);
});

module.exports = app;
