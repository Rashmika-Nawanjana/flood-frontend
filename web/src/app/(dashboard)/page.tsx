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
import { useAuthStore } from '@/store/useAuthStore';
import WaterLevelChart from '@/components/dashboard/WaterLevelChart';
import ZoneRiskChart from '@/components/dashboard/ZoneRiskChart';
import FloodProbabilityChart from '@/components/dashboard/FloodProbabilityChart';
import XaiRiskFactors from '@/components/dashboard/XaiRiskFactors';
import NextPredictedFlood from '@/components/dashboard/NextPredictedFlood';
import styles from './page.module.css';

export default function DashboardPage() {
  const sensors = useSensorStore(s => s.sensors);
  const setSensors = useSensorStore(s => s.setSensors);
  const zones = useZoneStore(s => s.zones);
  const setZones = useZoneStore(s => s.setZones);
  const alerts = useAlertStore(s => s.alerts);
  const setAlerts = useAlertStore(s => s.setAlerts);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, isAuthenticated } = useAuthStore();

  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const zoneId = user?.zone_id ?? null;

        // Fetch parallel
        const [sensorsRes, zonesRes, alertsRes, predictionsRes] = await Promise.all([
          api.sensors.list(zoneId),
          api.zones.list(zoneId),
          api.alerts.list({}, zoneId),
          api.predictions.list({}, zoneId)
        ]) as [ApiResponse<Sensor[]>, ApiResponse<Zone[]>, ApiResponse<Alert[]>, ApiResponse<Prediction[]>];

        if (sensorsRes.data) setSensors(sensorsRes.data);
        if (zonesRes.data) setZones(zonesRes.data);
        if (alertsRes.data) setAlerts(alertsRes.data);
        if (predictionsRes.data) setPredictions(predictionsRes.data);

        // Fetch History for the first 2 sensors to populate the trend chart
        if (sensorsRes.data && sensorsRes.data.length > 0) {
          const sensorIds = sensorsRes.data.slice(0, 2).map((s: any) => s.sensor_id);
          const historyPromises = sensorIds.map((id: string) => api.sensors.history(id, { interval: '1h' }));
          const histories = await Promise.all(historyPromises);

          // Merge histories into chart format { time: 'HH', [sensorId]: value }
          // We'll use the last 24 points
          const chartMap: Record<string, any> = {};
          
          histories.forEach((h: any, idx: number) => {
            const sensorName = sensorsRes.data[idx].name.toLowerCase().replace(/\s+/g, '');
            if (h.data) {
              h.data.forEach((p: any) => {
                const time = new Date(p.timestamp).getHours().toString().padStart(2, '0');
                if (!chartMap[time]) chartMap[time] = { time };
                chartMap[time][sensorName] = p.water_level_m;
              });
            }
          });

          const sortedHistory = Object.values(chartMap).sort((a, b) => a.time.localeCompare(b.time));
          setHistoryData(sortedHistory);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.zone_id, setSensors, setZones, setAlerts]);

  const onlineSensors = sensors.filter(
    (s) => s.status?.is_online || s.status?.device_online || s.device_health?.is_online
  ).length;
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE').length;
  const highRiskZones = zones.filter(
    (z) => z.risk_level === 'HIGH' || z.risk_level === 'CRITICAL'
  ).length;
  const totalPopulation = zones.reduce((sum, z) => sum + (z.population_at_risk || 0), 0);
  const topPrediction = [...predictions].sort(
    (a, b) => b.flood_probability_percent - a.flood_probability_percent
  )[0];

  const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highAlertsCount = alerts.filter(a => a.severity === 'HIGH').length;
  const uptimePercent = sensors.length > 0 ? Math.round((onlineSensors / sensors.length) * 100) : 0;
  
  const riskLevels = ['CRITICAL', 'HIGH', 'WARNING', 'WATCH'];
  const zonesByRisk = riskLevels.reduce((acc, level) => {
    acc[level] = zones.filter(z => z.risk_level === level).length;
    return acc;
  }, {} as Record<string, number>);

  const zoneColors: Record<string, string> = {
    'LOW': '#4caf50',
    'WATCH': '#5c7cfa',
    'WARNING': '#ffc107',
    'HIGH': '#fd7e14',
    'CRITICAL': '#fa5252'
  };

  const zoneRiskData = ['LOW', 'WATCH', 'WARNING', 'HIGH', 'CRITICAL'].map(level => ({
    name: level,
    value: zones.filter(z => z.risk_level === level).length,
    color: zoneColors[level]
  })).filter(d => d.value > 0);

  const probData = predictions.slice(0, 4).map(p => ({
    zone: p.zone_name,
    probability: p.flood_probability_percent
  }));

  const nextFloodPred = topPrediction;
  const factors = nextFloodPred?.top_risk_factors || [];

  const estimatedTime = nextFloodPred?.estimated_flood_time || new Date().toISOString();

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
          accentColor="var(--risk-critical)"
          icon={<AlertTriangleIcon size={20} />}
        >
          <div className={styles.breakdownGrid}>
            <div className={styles.breakdownBox}>
              <span className={styles.breakdownLabel}>Critical</span>
              <span className={styles.breakdownValue} style={{ color: 'var(--risk-critical)' }}>
                {criticalAlertsCount}
              </span>
            </div>
            <div className={styles.breakdownBox}>
              <span className={styles.breakdownLabel}>High</span>
              <span className={styles.breakdownValue} style={{ color: 'var(--risk-warning)' }}>
                {highAlertsCount}
              </span>
            </div>
          </div>
        </StatCard>

        <StatCard
          label="Sensors Online"
          value={`${onlineSensors}/${sensors.length}`}
          accentColor="var(--risk-low)"
          icon={<Activity size={20} />}
        >
          <div className={styles.progressInfo}>
            <span className={styles.uptimeText}>{uptimePercent}% uptime</span>
            <span className={styles.offlineText}>{sensors.length - onlineSensors} offline</span>
          </div>
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar} style={{ width: `${uptimePercent}%` }} />
          </div>
        </StatCard>

        <StatCard
          label="Zones at Risk"
          value={highRiskZones}
          accentColor="var(--risk-warning)"
          icon={<Droplets size={20} />}
        >
          <div className={styles.pillGrid}>
            {zonesByRisk.CRITICAL > 0 && (
              <div className={styles.pill} style={{ backgroundColor: 'var(--risk-critical-bg)', color: 'var(--risk-critical)' }}>
                CRITICAL ×{zonesByRisk.CRITICAL}
              </div>
            )}
            {zonesByRisk.HIGH > 0 && (
              <div className={styles.pill} style={{ backgroundColor: 'var(--risk-high-bg)', color: 'var(--risk-high)' }}>
                HIGH ×{zonesByRisk.HIGH}
              </div>
            )}
            {zonesByRisk.WARNING > 0 && (
              <div className={styles.pill} style={{ backgroundColor: 'var(--risk-warning-bg)', color: 'var(--risk-warning)' }}>
                WARN ×{zonesByRisk.WARNING}
              </div>
            )}
            {zonesByRisk.WATCH > 0 && (
              <div className={styles.pill} style={{ backgroundColor: 'var(--risk-watch-bg)', color: 'var(--risk-watch)' }}>
                WATCH ×{zonesByRisk.WATCH}
              </div>
            )}
          </div>
        </StatCard>

        <StatCard
          label="Population Affected"
          value={totalPopulation.toLocaleString()}
          subtitle={`Across ${zones.length} zones`}
          accentColor="var(--primary)"
          icon={<Users size={20} />}
        />
      </div>

      {/* Row 2 - Charts */}
      <div className={styles.row2}>
        <WaterLevelChart data={historyData} />
        <ZoneRiskChart data={zoneRiskData} />
      </div>

      {/* Row 3 - AI Intelligence */}
      <div className={styles.row3}>
        <FloodProbabilityChart data={probData} />
        <XaiRiskFactors 
          factors={factors as any} 
          modelVersion={nextFloodPred?.model_version || 'XGB-v1.0'} 
          confidencePercent={nextFloodPred?.confidence_percent || 87} 
        />
        <NextPredictedFlood 
          zoneName={nextFloodPred?.zone_name || 'No Data'}
          severity={nextFloodPred?.severity || 'LOW'}
          estimatedTime={estimatedTime}
          peakLevel={nextFloodPred?.predicted_peak_level_m || 0}
          probability={nextFloodPred?.flood_probability_percent || 0}
        />
      </div>

      {/* Recent Alerts (moved to bottom) */}
      <div className={styles.contentGrid}>
        <div className={styles.card} style={{ gridColumn: 'span 2' }}>
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
      </div>
    </div>
  );
}
