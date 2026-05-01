'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import RiskBadge from '@/components/ui/RiskBadge';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { Zone, ApiResponse } from '@/lib/types';
import { useZoneStore } from '@/store/useZoneStore';
import styles from './page.module.css';

export default function ZonesPage() {
  const { zones, selectedZoneId, selectZone, addZone, updateZone, removeZone } = useZoneStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    zone_id: '',
    zone_name: '',
    description: '',
    color_code: '#22C55E'
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ zone_id: '', zone_name: '', description: '', color_code: '#22C55E' });
    setShowModal(true);
  };

  const handleOpenEdit = (zone: Zone) => {
    setEditingId(zone.zone_id);
    setFormData({
      zone_id: zone.zone_id,
      zone_name: zone.zone_name,
      description: zone.description || '',
      color_code: zone.color_code || '#22C55E'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.zones.update(editingId, formData);
        updateZone(editingId, formData);
      } else {
        const payload = {
          ...formData,
          basin_id: 'BSN-01',
          area_sq_km: 10,
          risk_level: 'LOW' as const,
          risk_score: 10,
          population_at_risk: 0
        };
        await api.zones.create(payload);
        addZone(payload as Zone);
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.zones.delete(id);
      removeZone(id);
      if (selectedZoneId === id) selectZone(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-select first zone if none selected
  useEffect(() => {
    if (zones.length > 0 && !selectedZoneId) {
      selectZone(zones[0].zone_id);
    }
  }, [zones, selectedZoneId, selectZone]);

  const selected = zones.find(z => z.zone_id === selectedZoneId) || null;

  const highRisk = zones.filter(z => z.risk_level === 'HIGH' || z.risk_level === 'CRITICAL').length;
  const moderate = zones.filter(z => z.risk_level === 'WARNING' || z.risk_level === 'WATCH').length;
  const low = zones.filter(z => z.risk_level === 'LOW').length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Zone Management</h1>
          <p className={styles.subtitle}>Manage flood monitoring zones across the Kelani River basin</p>
        </div>
        <RoleGate allowed={['admin']}>
          <button className={styles.createBtn} onClick={handleOpenCreate}><Plus size={16} /> Create Zone</button>
        </RoleGate>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Total Zones" value={zones.length.toString().padStart(2, '0')} accentColor="var(--primary)" />
        <StatCard label="High Risk" value={highRisk.toString().padStart(2, '0')} accentColor="var(--risk-critical)" />
        <StatCard label="Moderate Risk" value={moderate.toString().padStart(2, '0')} accentColor="var(--risk-warning)" />
        <StatCard label="Low Risk" value={low.toString().padStart(2, '0')} accentColor="var(--risk-low)" />
      </div>

      <div className={styles.content}>
        <div className={styles.zoneList}>
          {zones.map(zone => (
            <div key={zone.zone_id} className={`${styles.zoneCard} ${selectedZoneId === zone.zone_id ? styles.zoneSelected : ''}`} onClick={() => selectZone(zone.zone_id)} style={{ borderLeftColor: zone.color_code || 'var(--primary)' }}>
              <div className={styles.zoneCardHeader}>
                <div>
                  <h3 className={styles.zoneCardName}>{zone.zone_name}</h3>
                  <span className={styles.zoneCardId}>{zone.zone_id}</span>
                </div>
                <RiskBadge level={zone.risk_level} />
              </div>
              <div className={styles.zoneCardStats}>
                <div className={styles.zoneCardStat}>
                  <span className={styles.statLabel}>Risk Score</span>
                  <span className={styles.statValue} style={{ color: zone.color_code }}>{zone.risk_score}</span>
                </div>
                <div className={styles.zoneCardStat}>
                  <span className={styles.statLabel}>Population</span>
                  <span className={styles.statValue}>{zone.population_at_risk?.toLocaleString()}</span>
                </div>
                <div className={styles.zoneCardStat}>
                  <span className={styles.statLabel}>Trend</span>
                  <span className={styles.statValue} style={{ color: zone.current_conditions?.trend === 'RISING' ? 'var(--risk-critical)' : zone.current_conditions?.trend === 'FALLING' ? 'var(--risk-low)' : 'var(--text-muted)' }}>
                    {zone.current_conditions?.trend === 'RISING' ? '↑ Rising' : zone.current_conditions?.trend === 'FALLING' ? '↓ Falling' : '— Stable'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 className={styles.detailName}>{selected.zone_name}</h2>
                <RiskBadge level={selected.risk_level} size="md" />
              </div>
              <RoleGate allowed={['admin']}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={styles.iconBtn} onClick={() => handleOpenEdit(selected)}><Edit2 size={16} /></button>
                  <button className={`${styles.iconBtn} ${styles.dangerText}`} onClick={() => handleDelete(selected.zone_id)}><Trash2 size={16} /></button>
                </div>
              </RoleGate>
            </div>
            <span className={styles.detailMeta}>{selected.description} • ID: {selected.zone_id}</span>

            <h3 className={styles.sectionTitle}>Current Conditions</h3>
            <div className={styles.condGrid}>
              <div className={styles.condItem}>
                <span className={styles.condLabel}>Avg Water Level</span>
                <span className={styles.condValue}>{selected.current_conditions?.avg_water_level_m}m</span>
              </div>
              <div className={styles.condItem}>
                <span className={styles.condLabel}>Max Water Level</span>
                <span className={styles.condValue}>{selected.current_conditions?.max_water_level_m}m</span>
              </div>
              <div className={styles.condItem}>
                <span className={styles.condLabel}>Velocity</span>
                <span className={styles.condValue}>{selected.current_conditions?.avg_flow_velocity_mps}m/s</span>
              </div>
              <div className={styles.condItem}>
                <span className={styles.condLabel}>Rainfall (24H)</span>
                <span className={styles.condValue}>{selected.current_conditions?.total_rainfall_mm}mm</span>
              </div>
            </div>

            {selected.prediction && (
              <>
                <h3 className={styles.sectionTitle}>Predictive Analysis</h3>
                <div className={styles.condGrid}>
                  <div className={styles.condItem}>
                    <span className={styles.condLabel}>Flood Probability</span>
                    <span className={styles.condValue} style={{ color: 'var(--risk-critical)' }}>{selected.prediction.flood_probability_percent}%</span>
                  </div>
                  <div className={styles.condItem}>
                    <span className={styles.condLabel}>Predicted Peak</span>
                    <span className={styles.condValue}>{selected.prediction.predicted_peak_level_m}m</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Zone' : 'Create New Zone'}>
        <div className={styles.form}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Zone ID</label>
            <input className={styles.formInput} placeholder="e.g. ZONE-K10" value={formData.zone_id} onChange={(e) => setFormData(p => ({ ...p, zone_id: e.target.value }))} disabled={!!editingId} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Zone Name</label>
            <input className={styles.formInput} placeholder="e.g. New Colombo Basin" value={formData.zone_name} onChange={(e) => setFormData(p => ({ ...p, zone_name: e.target.value }))} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Description</label>
            <textarea className={styles.formTextarea} placeholder="Detailed description of the zone boundary..." value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Marker Color</label>
            <input type="color" className={styles.formInput} style={{ height: '40px', padding: '4px' }} value={formData.color_code} onChange={(e) => setFormData(p => ({ ...p, color_code: e.target.value }))} />
          </div>
          <div className={styles.formActions} style={{ marginTop: '24px' }}>
            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button className={styles.submitBtn} onClick={handleSave}>{editingId ? 'Save Changes' : 'Create Zone'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
