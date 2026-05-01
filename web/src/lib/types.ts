// =============================================
// FloodSense LK — TypeScript Interfaces
// Mirrors all API response structures from Group A2
// =============================================

// ---- Generic API Response Wrapper ----
export interface ApiResponse<T> {
  status: 'success' | 'error';
  timestamp?: string;
  count?: number;
  message?: string;
  data: T;
}

// ---- Sensor ----
export interface SensorLocation {
  lat: number;
  lng: number;
  zone_id: string;
  zone_name?: string;
  address?: string;
}

export interface SensorReading {
  water_level_m: number;
  rainfall_mm_per_hr: number;
  flow_velocity_mps: number;
  temperature_c: number;
  air_pressure_hpa: number;
  recorded_at?: string;
}

export interface SensorHealth {
  is_online: boolean;
  device_online?: boolean;
  battery_percent: number;
  signal_strength_dbm: number;
  last_seen: string;
  last_maintenance?: string;
  firmware_version?: string;
}

export interface SensorThresholds {
  watch_m?: number;
  advisory_m?: number;
  warning_m?: number;
  critical_m?: number;
  water_level_warning_m?: number;
  water_level_critical_m?: number;
}

export interface Sensor {
  sensor_id: string;
  name: string;
  location: SensorLocation;
  readings?: SensorReading;
  current_reading?: SensorReading;
  status?: SensorHealth;
  device_health?: SensorHealth;
  thresholds: SensorThresholds;
  installed_date?: string;
  is_active?: boolean;
}

export interface SensorHistoryPoint {
  timestamp: string;
  water_level_m: number;
  rainfall_mm: number;
  flow_velocity_mps: number;
  temperature_c: number;
  air_pressure_hpa: number;
}

export interface SensorHistoryStats {
  max_water_level_m: number;
  min_water_level_m: number;
  avg_water_level_m: number;
  total_rainfall_mm: number;
  max_flow_velocity_mps: number;
}

export interface SensorHistoryResponse {
  status: string;
  sensor_id: string;
  from: string;
  to: string;
  interval: string;
  count: number;
  data: SensorHistoryPoint[];
  statistics: SensorHistoryStats;
}

// ---- Zone ----
export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface ZoneConditions {
  avg_water_level_m: number;
  max_water_level_m: number;
  avg_flow_velocity_mps: number;
  total_rainfall_mm: number;
  trend: 'RISING' | 'STABLE' | 'FALLING';
}

export interface ZonePrediction {
  flood_probability_percent: number;
  predicted_peak_level_m: number;
  estimated_flood_time: string;
  confidence_percent: number;
  model_version: string;
}

export type RiskLevel = 'LOW' | 'WATCH' | 'WARNING' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';

export interface Zone {
  zone_id: string;
  zone_name: string;
  description: string;
  risk_level: RiskLevel;
  risk_score: number;
  color_code: string;
  population_at_risk: number;
  sensors_in_zone?: string[];
  active_alerts?: number;
  last_updated?: string;
  geometry: GeoJSONPolygon;
  current_conditions?: ZoneConditions;
  prediction?: ZonePrediction;
  shelters?: Shelter[];
}

// ---- Shelter ----
export interface Shelter {
  shelter_id: string;
  name: string;
  capacity: number;
  current_occupancy?: number;
  lat: number;
  lng: number;
  distance_km?: number;
  contact_number: string;
  zone_id?: string;
  status?: 'OPEN' | 'FILLING' | 'FULL' | 'CLOSED';
}

// ---- Alert ----
export interface AlertNotification {
  push: number;
  sms: number;
  email: number;
}

export interface Alert {
  alert_id: string;
  zone_id: string;
  zone_name: string;
  source_prediction_id?: string;
  severity: RiskLevel;
  severity_code: number;
  title: string;
  message: string;
  triggered_at: string;
  triggered_by: string;
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED';
  resolved_at: string | null;
  affected_population: number;
  recommended_action: string;
  recommended_shelters?: Shelter[];
  notifications_sent?: AlertNotification;
}

// ---- Prediction ----
export interface RiskFactor {
  factor: string;
  value: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface PredictionWindow {
  from: string;
  to: string;
}

export interface Prediction {
  prediction_id: string;
  zone_id: string;
  zone_name: string;
  created_at: string;
  prediction_window: PredictionWindow;
  flood_probability_percent: number;
  predicted_peak_level_m: number;
  estimated_flood_time: string;
  severity: RiskLevel;
  confidence_percent: number;
  model_version: string;
  top_risk_factors: RiskFactor[];
}

// ---- Anomaly ----
export interface AnomalyReading {
  water_level_m: number;
  rate_of_change_m_per_hr: number;
}

export interface ExpectedRange {
  min_m: number;
  max_m: number;
}

export interface Anomaly {
  anomaly_id: string;
  sensor_id: string;
  detected_at: string;
  type: 'SUDDEN_SPIKE' | 'SENSOR_DRIFT' | 'FLATLINE_ERROR' | 'RAPID_DESCENT' | 'NOISE_THRESHOLD';
  description: string;
  severity: RiskLevel;
  anomaly_score: number;
  reading_at_detection: AnomalyReading;
  expected_range: ExpectedRange;
  status: 'UNRESOLVED' | 'RESOLVED' | 'FALSE_ALARM';
  auto_alert_triggered: boolean;
  alert_id?: string;
}

// ---- WebSocket Event Payloads ----
export interface SensorUpdateEvent {
  sensor_id: string;
  zone_id: string;
  current_reading: {
    water_level_m: number;
    flow_velocity_mps: number;
    rainfall_mm_per_hr: number;
    temperature_c: number;
    air_pressure_hpa: number;
    trend: string;
  };
}

export interface ZoneRiskUpdateEvent {
  zone_id: string;
  zone_name: string;
  previous_level: RiskLevel;
  current_level: RiskLevel;
  risk_score: number;
  color_code: string;
}

export interface PredictionNewEvent {
  prediction_id: string;
  zone_id: string;
  predicted_peak_level_m: number;
  estimated_flood_time: string;
  severity: RiskLevel;
  top_risk_factors: RiskFactor[];
}

export interface AlertNewEvent {
  alert_id: string;
  zone_id: string;
  severity: RiskLevel;
  title: string;
  message: string;
  recommended_action: string;
  recommended_shelters: { shelter_id: string; name: string; lat: number; lng: number }[];
}

export interface AlertResolvedEvent {
  alert_id: string;
  zone_id: string;
  resolved_at: string;
  resolution_note: string;
}

export interface SensorOfflineEvent {
  sensor_id: string;
  zone_id: string;
  last_seen: string;
  status: 'OFFLINE';
}

export interface AnomalyNewEvent {
  anomaly_id: string;
  sensor_id: string;
  type: string;
  severity: RiskLevel;
  anomaly_score: number;
  description: string;
}

// ---- Auth ----
export type UserRole = 'admin' | 'officer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
