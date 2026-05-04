'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import MapPlaceholder from '@/components/maps/MapPlaceholder';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useSensorStore } from '@/store/useSensorStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useMapStore } from '@/store/useMapStore';
import styles from './page.module.css';

export default function SensorsPage() {
  const sensors = useSensorStore(s => s.sensors);
  const zones = useZoneStore(s => s.zones);
  const { selectedZoneId, selectZone } = useMapStore();
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sensor_id: '',
    name: '',
    zone_id: '',
    watch_m: '3.0',
    warning_m: '4.5',
    critical_m: '6.0'
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ sensor_id: '', name: '', zone_id: '', watch_m: '3.0', warning_m: '4.5', critical_m: '6.0' });
    setShowModal(true);
  };

  const handleOpenEdit = (sensor: any) => {
    setEditingId(sensor.sensor_id);
    setFormData({
      sensor_id: sensor.sensor_id,
      name: sensor.name,
      zone_id: sensor.location?.zone_id || '',
      watch_m: sensor.thresholds?.watch_m?.toString() || '3.0',
      warning_m: sensor.thresholds?.warning_m?.toString() || '4.5',
      critical_m: sensor.thresholds?.critical_m?.toString() || '6.0'
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.sensors.update(editingId, {
          thresholds: {
            watch_m: parseFloat(formData.watch_m),
            warning_m: parseFloat(formData.warning_m),
            critical_m: parseFloat(formData.critical_m)
          }
        });
        updateSensor(editingId, {
          name: formData.name,
          location: { lat: 0, lng: 0, zone_id: formData.zone_id, address: '' },
          thresholds: { watch_m: parseFloat(formData.watch_m), advisory_m: parseFloat(formData.watch_m)+1, warning_m: parseFloat(formData.warning_m), critical_m: parseFloat(formData.critical_m) }
        });
      } else {
        await api.sensors.create({
          sensor_id: formData.sensor_id,
          name: formData.name,
          location: { lat: 7.2, lng: 80.6, zone_id: formData.zone_id, address: '' },
          installed_date: new Date().toISOString().split('T')[0],
          firmware_version: 'v1.0.0',
          thresholds: {
            watch_m: parseFloat(formData.watch_m),
            advisory_m: parseFloat(formData.watch_m) + 1,
            warning_m: parseFloat(formData.warning_m),
            critical_m: parseFloat(formData.critical_m)
          }
        });
        // Mock new sensor
        addSensor({
          sensor_id: formData.sensor_id,
          name: formData.name,
          is_active: true,
          installed_date: new Date().toISOString().split('T')[0],
          location: { lat: 7.2, lng: 80.6, zone_id: formData.zone_id, zone_name: zones.find(z => z.zone_id === formData.zone_id)?.zone_name || formData.zone_id, address: '' },
          current_reading: { water_level_m: 0, rainfall_mm_per_hr: 0, flow_velocity_mps: 0, temperature_c: 25, air_pressure_hpa: 1010, recorded_at: new Date().toISOString() },
          status: { device_online: true, battery_percent: 100, signal_strength_dbm: -50, last_seen: new Date().toISOString() },
          thresholds: { watch_m: parseFloat(formData.watch_m), advisory_m: parseFloat(formData.watch_m) + 1, warning_m: parseFloat(formData.warning_m), critical_m: parseFloat(formData.critical_m) }
        } as any);
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.sensors.delete(id);
      removeSensor(id);
      setActiveMenu(null);
    } catch (e) {
      console.error(e);
    }
  };

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
          <button className={styles.addBtn} onClick={handleOpenCreate}><Plus size={16} /> Add Sensor</button>
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

      <div className={styles.mapPanel}>
        <div className={styles.mapHeader}>
          <div>
            <h2 className={styles.mapTitle}>Sensor Placement Map</h2>
            <p className={styles.mapSubtitle}>Sensor pins overlaid with monitored flood zones</p>
          </div>
          <span className={styles.mapMeta}>{filtered.length}/{sensors.length} sensors shown • {zones.length} zones</span>
        </div>
        <MapPlaceholder
          height="420px"
          title="Sensors & Zones"
          zones={zones}
          sensors={filtered}
          selectedZoneId={selectedZoneId || undefined}
          onZoneClick={(zoneId) => selectZone(zoneId)}
          showAffectedZones
        />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`}>
                    {isOnline ? '● Online' : '● Offline'}
                  </span>
                  <RoleGate allowed={['admin']}>
                    <div style={{ position: 'relative' }}>
                      <button className={styles.menuBtn} onClick={() => setActiveMenu(activeMenu === sensor.sensor_id ? null : sensor.sensor_id)}>
                        <MoreVertical size={16} />
                      </button>
                      {activeMenu === sensor.sensor_id && (
                        <div className={styles.dropdownMenu}>
                          <button onClick={() => handleOpenEdit(sensor)}><Edit2 size={14} /> Edit Thresholds</button>
                          <button className={styles.dangerText} onClick={() => handleDelete(sensor.sensor_id)}><Trash2 size={14} /> Deactivate</button>
                        </div>
                      )}
                    </div>
                  </RoleGate>
                </div>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Sensor' : 'Register New Sensor'}>
        <div className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Sensor ID</label>
              <input className={styles.formInput} placeholder="e.g. MR-KND-005" value={formData.sensor_id} onChange={(e) => setFormData(p => ({ ...p, sensor_id: e.target.value }))} disabled={!!editingId} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Location Zone</label>
              <select className={styles.formSelect} value={formData.zone_id} onChange={(e) => setFormData(p => ({ ...p, zone_id: e.target.value }))}>
                <option value="">Select Zone</option>
                {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Sensor Name</label>
            <input className={styles.formInput} placeholder="e.g. Mahaweli River — New Bridge" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
          </div>
          
          <h4 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Water Level Thresholds (m)</h4>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Watch</label>
              <input type="number" step="0.1" className={styles.formInput} value={formData.watch_m} onChange={(e) => setFormData(p => ({ ...p, watch_m: e.target.value }))} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Warning</label>
              <input type="number" step="0.1" className={styles.formInput} value={formData.warning_m} onChange={(e) => setFormData(p => ({ ...p, warning_m: e.target.value }))} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Critical</label>
              <input type="number" step="0.1" className={styles.formInput} value={formData.critical_m} onChange={(e) => setFormData(p => ({ ...p, critical_m: e.target.value }))} />
            </div>
          </div>
          
          <div className={styles.formActions} style={{ marginTop: '24px' }}>
            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button className={styles.submitBtn} onClick={handleSave}>{editingId ? 'Save Changes' : 'Register Sensor'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
