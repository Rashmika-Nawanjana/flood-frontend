'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import RiskBadge from '@/components/ui/RiskBadge';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { Zone, ApiResponse } from '@/lib/types';
import { useZoneStore } from '@/store/useZoneStore';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './page.module.css';

type ZoneFormData = {
  zone_id: string;
  zone_name: string;
  description: string;
  population_at_risk: string;
  river_id: string;
  prev_zone_id: string;
  next_zone_id: string;
  geometry_json: string;
};

const initialFormData: ZoneFormData = {
  zone_id: '',
  zone_name: '',
  description: '',
  population_at_risk: '',
  river_id: '',
  prev_zone_id: '',
  next_zone_id: '',
  geometry_json: '{"type":"Polygon","coordinates":[[[80.61,7.27],[80.62,7.27],[80.62,7.28],[80.61,7.27]]]}',
};

type River = {
  river_id: number;
  river_name: string;
};

export default function ZonesPage() {
  const { zones, selectedZoneId, selectZone, addZone } = useZoneStore();
  const { isAuthenticated, user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<ZoneFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rivers, setRivers] = useState<River[]>([]);
  const [riversError, setRiversError] = useState<string | null>(null);

  // Auto-select first zone if none selected
  useEffect(() => {
    if (zones.length > 0 && !selectedZoneId) {
      selectZone(zones[0].zone_id);
    }
  }, [zones, selectedZoneId, selectZone]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role !== 'admin' && user.role !== 'field_officer') return;

    let mounted = true;
    api.admin.rivers.list()
      .then((res) => {
        if (!mounted) return;
        setRivers(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setRiversError('Failed to load rivers.');
      });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user]);

  const selected = zones.find(z => z.zone_id === selectedZoneId) || null;

  const highRisk = zones.filter(z => z.risk_level === 'HIGH' || z.risk_level === 'CRITICAL').length;
  const moderate = zones.filter(z => z.risk_level === 'WARNING' || z.risk_level === 'WATCH').length;
  const low = zones.filter(z => z.risk_level === 'LOW').length;

  const closeCreateForm = () => {
    setShowCreate(false);
    setFormError(null);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    let geometry: unknown;
    try {
      geometry = JSON.parse(formData.geometry_json);
    } catch {
      setFormError('Geometry must be valid JSON.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      zone_id: formData.zone_id.trim(),
      zone_name: formData.zone_name.trim(),
      geometry,
      population_at_risk: Number(formData.population_at_risk),
      description: formData.description.trim(),
      river_id: Number(formData.river_id),
      prev_zone_id: formData.prev_zone_id.trim() || null,
      next_zone_id: formData.next_zone_id.trim() || null,
    };

    if (!payload.zone_id || !payload.zone_name || !payload.description) {
      setFormError('Zone ID, name, and description are required.');
      setIsSubmitting(false);
      return;
    }

    if (!Number.isFinite(payload.population_at_risk) || payload.population_at_risk < 0) {
      setFormError('Population at risk must be a valid number.');
      setIsSubmitting(false);
      return;
    }

    if (!Number.isFinite(payload.river_id) || payload.river_id <= 0) {
      setFormError('River ID must be a valid number.');
      setIsSubmitting(false);
      return;
    }

    if (!payload.geometry || typeof payload.geometry !== 'object') {
      setFormError('Geometry must be a valid GeoJSON Polygon.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = (await api.zones.create(payload)) as ApiResponse<Zone> | Zone;
      const createdZone = 'data' in res ? res.data : res;
      addZone(createdZone);
      selectZone(createdZone.zone_id);
      setFormData(initialFormData);
      setShowCreate(false);
    } catch (e) {
      console.error(e);
      setFormError('Failed to create zone. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Zone Management</h1>
          <p className={styles.subtitle}>Manage flood monitoring zones across the Kelani River basin</p>
        </div>
        <RoleGate allowed={['admin']}>
          <button className={styles.createBtn} onClick={() => setShowCreate(true)}><Plus size={16} /> Create Zone</button>
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
              <h2 className={styles.detailName}>{selected.zone_name}</h2>
              <RiskBadge level={selected.risk_level} size="md" />
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

      <Modal isOpen={showCreate} onClose={closeCreateForm} title="Create New Zone" width="640px">
        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Zone ID</label>
              <input
                className={styles.formInput}
                placeholder="ZONE-K1"
                value={formData.zone_id}
                onChange={(e) => setFormData((p) => ({ ...p, zone_id: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Zone Name</label>
              <input
                className={styles.formInput}
                placeholder="Getambe Basin"
                value={formData.zone_name}
                onChange={(e) => setFormData((p) => ({ ...p, zone_name: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Description</label>
            <input
              className={styles.formInput}
              placeholder="Lower Mahaweli region near Peradeniya"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              required
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Population at Risk</label>
              <input
                className={styles.formInput}
                type="number"
                min="0"
                placeholder="20500"
                value={formData.population_at_risk}
                onChange={(e) => setFormData((p) => ({ ...p, population_at_risk: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>River</label>
              <select
                className={styles.formSelect}
                value={formData.river_id}
                onChange={(e) => setFormData((p) => ({ ...p, river_id: e.target.value }))}
                required
              >
                <option value="">Select River</option>
                {rivers.map((river) => (
                  <option key={river.river_id} value={river.river_id}>
                    {river.river_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Previous Zone ID (optional)</label>
              <input
                className={styles.formInput}
                placeholder="ZONE-M3"
                value={formData.prev_zone_id}
                onChange={(e) => setFormData((p) => ({ ...p, prev_zone_id: e.target.value }))}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Next Zone ID (optional)</label>
              <input
                className={styles.formInput}
                placeholder="ZONE-X1"
                value={formData.next_zone_id}
                onChange={(e) => setFormData((p) => ({ ...p, next_zone_id: e.target.value }))}
              />
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Geometry (GeoJSON)</label>
            <textarea
              className={styles.formTextarea}
              rows={5}
              value={formData.geometry_json}
              onChange={(e) => setFormData((p) => ({ ...p, geometry_json: e.target.value }))}
              required
            />
          </div>
          {riversError && <p className={styles.formError}>{riversError}</p>}
          {formError && <p className={styles.formError}>{formError}</p>}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} type="button" onClick={closeCreateForm}>Cancel</button>
            <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Zone'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
