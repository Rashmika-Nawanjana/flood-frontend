'use client';

import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { Sensor, ApiResponse } from '@/lib/types';
import { useSensorStore } from '@/store/useSensorStore';
import { useZoneStore } from '@/store/useZoneStore';
import styles from './page.module.css';

type SensorFormData = {
  sensor_id: string;
  name: string;
  zone_id: string;
  address: string;
  lat: string;
  lng: string;
  installed_date: string;
  firmware_version: string;
  watch_m: string;
  advisory_m: string;
  warning_m: string;
  critical_m: string;
};

const initialFormData: SensorFormData = {
  sensor_id: '',
  name: '',
  zone_id: '',
  address: '',
  lat: '',
  lng: '',
  installed_date: '',
  firmware_version: '',
  watch_m: '',
  advisory_m: '',
  warning_m: '',
  critical_m: '',
};

export default function SensorsPage() {
  const sensors = useSensorStore(s => s.sensors);
  const addSensor = useSensorStore(s => s.addSensor);
  const zones = useZoneStore(s => s.zones);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<SensorFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const closeCreateForm = () => {
    setShowCreate(false);
    setFormError(null);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      sensor_id: formData.sensor_id.trim(),
      name: formData.name.trim(),
      location: {
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        zone_id: formData.zone_id.trim(),
        address: formData.address.trim(),
      },
      installed_date: formData.installed_date.trim(),
      firmware_version: formData.firmware_version.trim(),
      thresholds: {
        watch_m: Number(formData.watch_m),
        advisory_m: Number(formData.advisory_m),
        warning_m: Number(formData.warning_m),
        critical_m: Number(formData.critical_m),
      },
    };

    if (!payload.sensor_id || !payload.name || !payload.location.zone_id || !payload.location.address) {
      setFormError('Sensor ID, name, zone, and address are required.');
      setIsSubmitting(false);
      return;
    }

    if (!payload.installed_date || !payload.firmware_version) {
      setFormError('Installed date and firmware version are required.');
      setIsSubmitting(false);
      return;
    }

    const numericFields = [payload.location.lat, payload.location.lng, payload.thresholds.watch_m, payload.thresholds.advisory_m, payload.thresholds.warning_m, payload.thresholds.critical_m];
    if (!numericFields.every(Number.isFinite)) {
      setFormError('Latitude, longitude, and thresholds must be valid numbers.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = (await api.sensors.create(payload)) as ApiResponse<Sensor> | Sensor;
      const createdSensor = 'data' in res ? res.data : res;
      addSensor(createdSensor);
      setFormData(initialFormData);
      setShowCreate(false);
    } catch (e) {
      console.error(e);
      setFormError('Failed to create sensor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sensor Network</h1>
          <p className={styles.subtitle}>Real-time telemetry from the Kelani River Basin & Colombo Metropolitan Area.</p>
        </div>
        <RoleGate allowed={['admin']}>
          <button className={styles.addBtn} onClick={() => setShowCreate(true)}><Plus size={16} /> Add Sensor</button>
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

      <Modal isOpen={showCreate} onClose={closeCreateForm} title="Register New Sensor" width="620px">
        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Sensor ID</label>
              <input
                className={styles.formInput}
                placeholder="MR-KND-003"
                value={formData.sensor_id}
                onChange={(e) => setFormData((p) => ({ ...p, sensor_id: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Zone</label>
              <select
                className={styles.formSelect}
                value={formData.zone_id}
                onChange={(e) => setFormData((p) => ({ ...p, zone_id: e.target.value }))}
                required
              >
                <option value="">Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.zone_id} value={zone.zone_id}>
                    {zone.zone_name || zone.zone_id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Sensor Name</label>
            <input
              className={styles.formInput}
              placeholder="Mahaweli River — Katugastota"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Address</label>
            <input
              className={styles.formInput}
              placeholder="Under Getambe Bridge, Peradeniya Road, Kandy"
              value={formData.address}
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              required
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Latitude</label>
              <input
                className={styles.formInput}
                type="number"
                step="any"
                placeholder="7.2721"
                value={formData.lat}
                onChange={(e) => setFormData((p) => ({ ...p, lat: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Longitude</label>
              <input
                className={styles.formInput}
                type="number"
                step="any"
                placeholder="80.6132"
                value={formData.lng}
                onChange={(e) => setFormData((p) => ({ ...p, lng: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Installed Date</label>
              <input
                className={styles.formInput}
                type="date"
                value={formData.installed_date}
                onChange={(e) => setFormData((p) => ({ ...p, installed_date: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Firmware Version</label>
              <input
                className={styles.formInput}
                placeholder="v1.0.0"
                value={formData.firmware_version}
                onChange={(e) => setFormData((p) => ({ ...p, firmware_version: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Watch (m)</label>
              <input
                className={styles.formInput}
                type="number"
                step="any"
                placeholder="3.0"
                value={formData.watch_m}
                onChange={(e) => setFormData((p) => ({ ...p, watch_m: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Advisory (m)</label>
              <input
                className={styles.formInput}
                type="number"
                step="any"
                placeholder="4.0"
                value={formData.advisory_m}
                onChange={(e) => setFormData((p) => ({ ...p, advisory_m: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Warning (m)</label>
              <input
                className={styles.formInput}
                type="number"
                step="any"
                placeholder="5.0"
                value={formData.warning_m}
                onChange={(e) => setFormData((p) => ({ ...p, warning_m: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Critical (m)</label>
              <input
                className={styles.formInput}
                type="number"
                step="any"
                placeholder="6.0"
                value={formData.critical_m}
                onChange={(e) => setFormData((p) => ({ ...p, critical_m: e.target.value }))}
                required
              />
            </div>
          </div>
          {formError && <p className={styles.formError}>{formError}</p>}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} type="button" onClick={closeCreateForm}>Cancel</button>
            <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Sensor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
