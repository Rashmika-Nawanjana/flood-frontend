'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import RoleGate from '@/components/auth/RoleGate';
import { api } from '@/lib/api';
import type { Sensor, ApiResponse } from '@/lib/types';
import { useSensorStore } from '@/store/useSensorStore';
import styles from './page.module.css';

export default function SensorsPage() {
  const sensors = useSensorStore(s => s.sensors);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const online = sensors.filter(s => s.status?.device_online || s.device_health?.is_online).length;
  const offline = sensors.length - online;
  const avgBattery = sensors.length
    ? Math.round(sensors.reduce((s, x) => s + (x.status?.battery_percent || x.device_health?.battery_percent || 0), 0) / sensors.length)
    : 0;

  const filtered = sensors.filter(s => {
    const isOnline = s.status?.device_online || s.device_health?.is_online;
    if (statusFilter === 'ONLINE' && !isOnline) return false;
    if (statusFilter === 'OFFLINE' && isOnline) return false;
    if (filter && !s.name.toLowerCase().includes(filter.toLowerCase()) && !s.sensor_id.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sensor Network</h1>
          <p className={styles.subtitle}>Real-time telemetry from the Kelani River Basin & Colombo Metropolitan Area.</p>
        </div>
        <RoleGate allowed={['admin']}>
          <button className={styles.addBtn}><Plus size={16} /> Add Sensor</button>
        </RoleGate>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Total" value={sensors.length} accentColor="var(--primary)" />
        <StatCard label="Online" value={online} accentColor="var(--risk-low)" />
        <StatCard label="Offline" value={offline} accentColor="var(--risk-critical)" />
        <StatCard label="Avg Battery" value={`${avgBattery}%`} accentColor="var(--risk-warning)" />
      </div>

      <div className={styles.filters}>
        <input className={styles.searchInput} placeholder="Filter by ID or location..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Status: All</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      <div className={styles.grid}>
        {filtered.map((sensor) => {
          const isOnline = sensor.status?.device_online || sensor.device_health?.is_online;
          const battery = sensor.status?.battery_percent || sensor.device_health?.battery_percent || 0;
          const readings = sensor.readings || sensor.current_reading;
          return (
            <div key={sensor.sensor_id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.sensorId}>{sensor.sensor_id}</span>
                  <h3 className={styles.sensorName}>{sensor.name.split('—')[0]?.trim()}</h3>
                  <span className={styles.sensorLocation}>{sensor.location.zone_name || sensor.name.split('—')[1]?.trim()}</span>
                </div>
                <span className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`}>
                  {isOnline ? '● Online' : '● Offline'}
                </span>
              </div>

              {readings && isOnline ? (
                <div className={styles.readings}>
                  <div className={styles.reading}>
                    <span className={styles.readingLabel}>Water Level</span>
                    <span className={styles.readingValue} style={{ color: 'var(--primary)' }}>{readings.water_level_m}m</span>
                  </div>
                  <div className={styles.reading}>
                    <span className={styles.readingLabel}>Rainfall</span>
                    <span className={styles.readingValue}>{readings.rainfall_mm_per_hr}mm</span>
                  </div>
                  {readings.flow_velocity_mps !== undefined && (
                    <div className={styles.reading}>
                      <span className={styles.readingLabel}>Flow Rate</span>
                      <span className={styles.readingValue}>{readings.flow_velocity_mps}m/s</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.offlineMsg}>
                  <span>Last seen: {sensor.status?.last_seen || sensor.device_health?.last_seen || 'Unknown'}</span>
                </div>
              )}

              <div className={styles.batteryRow}>
                <span className={styles.batteryLabel}>Battery Life</span>
                <ProgressBar value={battery} max={100} height={4} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
