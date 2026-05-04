// =============================================
// FloodSense LK — Constants
// Single source of truth for nav items, risk colors, etc.
// =============================================

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Live Map', href: '/live-map', icon: 'Map' },
  { label: 'Alerts', href: '/alerts', icon: 'Bell' },
  { label: 'Sensors', href: '/sensors', icon: 'Radio' },
  { label: 'Predictions', href: '/predictions', icon: 'BrainCircuit' },
  { label: 'Evacuation', href: '/evacuation', icon: 'Route' },
  { label: 'Anomalies', href: '/anomalies', icon: 'AlertTriangle' },
  { label: 'Zones', href: '/zones', icon: 'Layers' },
  { label: 'Shelters', href: '/shelters', icon: 'Building2' },
] as const;

export const SETTINGS_NAV = {
  label: 'Settings',
  href: '/settings',
  icon: 'Settings',
} as const;

export const RISK_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  LOW: { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', label: 'Low' },
  WATCH: { color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)', label: 'Watch' },
  WARNING: { color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', label: 'Warning' },
  HIGH: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'High' },
  CRITICAL: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Critical' },
  EMERGENCY: { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', label: 'Emergency' },
  MODERATE: { color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', label: 'Moderate' },
};

export const ANOMALY_TYPES: Record<string, string> = {
  SUDDEN_SPIKE: 'Spike Detection',
  SENSOR_DRIFT: 'Sensor Drift',
  FLATLINE_ERROR: 'Flatline Error',
  RAPID_DESCENT: 'Rapid Descent',
  NOISE_THRESHOLD: 'Noise Threshold',
};

export const ALERT_STATUSES = ['ACTIVE', 'RESOLVED', 'EXPIRED'] as const;
export const ANOMALY_STATUSES = ['UNRESOLVED', 'RESOLVED', 'FALSE_ALARM'] as const;
export const SHELTER_STATUSES = ['OPEN', 'FILLING', 'FULL', 'CLOSED'] as const;

export const SENSOR_STATUS_COLORS: Record<string, string> = {
  online: '#22C55E',
  offline: '#EF4444',
  maintenance: '#F97316',
};
