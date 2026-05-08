'use client';

import { useState, useEffect } from 'react';
import { Activity, Droplets, AlertTriangle as AlertTriangleIcon, Users } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import RiskBadge from '@/components/ui/RiskBadge';
import { api } from '@/lib/api';
import type { Sensor, Zone, Alert, Prediction, ApiResponse } from '@/lib/types';
import { useSensorStore } from '@/store/useSensorStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useAlertStore } from '@/store/useAlertStore';
import styles from './page.module.css';

export default function DashboardPage() {
  const sensors = useSensorStore(s => s.sensors);
  const zones = useZoneStore(s => s.zones);
  const alerts = useAlertStore(s => s.alerts);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const predRes = await api.predictions.list();
        const d = predRes as ApiResponse<Prediction[]>;
        setPredictions(d.data || []);
      } catch (err) {
        console.error('Dashboard predictions fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPredictions();
  }, []);

  const onlineSensors = sensors.filter(
    (s) => s.status?.device_online || s.device_health?.is_online
  ).length;
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE').length;
  const highRiskZones = zones.filter(
    (z) => z.risk_level === 'HIGH' || z.risk_level === 'CRITICAL'
  ).length;
  const totalPopulation = zones.reduce((sum, z) => sum + (z.population_at_risk || 0), 0);
  const topPrediction = predictions.sort(
    (a, b) => b.flood_probability_percent - a.flood_probability_percent
  )[0];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Real-time overview of Sri Lanka&apos;s flood monitoring network
          </p>
        </div>
        <span className={styles.timestamp}>
          {loading ? 'Loading...' : `Last updated: ${new Date().toLocaleTimeString()} UTC`}
        </span>
      </div>

      {/* KPI Row */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Active Alerts"
          value={activeAlerts}
          subtitle={`${alerts.filter(a => a.severity === 'CRITICAL').length} Critical, ${alerts.filter(a => a.severity === 'HIGH').length} High`}
          accentColor="var(--risk-critical)"
          icon={<AlertTriangleIcon size={20} />}
        />
        <StatCard
          label="Sensors Online"
          value={`${onlineSensors}/${sensors.length}`}
          subtitle={`${sensors.length - onlineSensors} offline`}
          accentColor="var(--risk-low)"
          icon={<Activity size={20} />}
        />
        <StatCard
          label="Zones at Risk"
          value={highRiskZones}
          subtitle={zones.map(z => `${z.risk_level}`).join(', ').slice(0, 40)}
          accentColor="var(--risk-warning)"
          icon={<Droplets size={20} />}
        />
        <StatCard
          label="Population Affected"
          value={totalPopulation.toLocaleString()}
          subtitle={`Across ${zones.length} zones`}
          accentColor="var(--primary)"
          icon={<Users size={20} />}
        />
      </div>

      {/* Main content row */}
      <div className={styles.contentGrid}>
        {/* Recent Alerts */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Alerts</h2>
          </div>
          <div className={styles.alertList}>
            {alerts.length === 0 && !loading && (
              <p className={styles.emptyState}>No active alerts</p>
            )}
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.alert_id} className={styles.alertItem}>
                <div className={styles.alertDot} style={{
                  backgroundColor: alert.severity === 'CRITICAL' ? 'var(--risk-critical)' :
                    alert.severity === 'HIGH' ? 'var(--risk-high)' : 'var(--risk-warning)'
                }} />
                <div className={styles.alertContent}>
                  <span className={styles.alertTitle}>{alert.title}</span>
                  <span className={styles.alertMeta}>
                    {alert.zone_name} • {new Date(alert.triggered_at).toLocaleTimeString()}
                  </span>
                </div>
                <RiskBadge level={alert.severity} />
              </div>
            ))}
          </div>
        </div>

        {/* AI Prediction Summary */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>AI Prediction Summary</h2>
          </div>
          {topPrediction ? (
            <div className={styles.predictionContent}>
              <span className={styles.predLabel}>Next Predicted Risk</span>
              <div className={styles.predZone}>
                <span className={styles.predZoneName}>{topPrediction.zone_name}</span>
                <span className={styles.predProb}>
                  ({topPrediction.flood_probability_percent}% probability)
                </span>
              </div>
              <div className={styles.predMeta}>
                <span>Confidence Level</span>
                <span className={styles.predConfidence}>
                  {topPrediction.confidence_percent}%
                </span>
              </div>
              <div className={styles.predModel}>
                Model: {topPrediction.model_version}
              </div>
            </div>
          ) : (
            <p className={styles.emptyState}>No predictions available</p>
          )}
        </div>
      </div>

      {/* System Health */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>System Health</h2>
        </div>
        <div className={styles.healthGrid}>
          {['Primary API', 'WebSocket', 'ML Inference', 'Global DB'].map((service) => (
            <div key={service} className={styles.healthItem}>
              <span className={styles.healthDot} />
              <span>{service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
