'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, X, PlusCircle, Globe, Info, Hash, Palette } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import RiskBadge from '@/components/ui/RiskBadge';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { Zone, RiskLevel, GeoJSONPolygon } from '@/lib/types';
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
    color_code: '#22C55E',
    population_at_risk: '',
    coordinates: [{ lat: '', lng: '' }]
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      zone_id: '',
      zone_name: '',
      description: '',
      color_code: '#22C55E',
      population_at_risk: '',
      coordinates: [{ lat: '', lng: '' }]
    });
    setShowModal(true);
  };

  const handleOpenEdit = (zone: Zone) => {
    setEditingId(zone.zone_id);
    // Flatten GeoJSON coordinates back to our form format [lng, lat] -> {lat, lng}
    // We only take the first ring of the polygon
    const coords = zone.geometry?.coordinates[0]?.map(c => ({
      lng: c[0].toString(),
      lat: c[1].toString()
    })) || [{ lat: '', lng: '' }];

    // Remove the last coordinate if it's the same as the first (closed polygon)
    if (coords.length > 1 && coords[0].lat === coords[coords.length - 1].lat && coords[0].lng === coords[coords.length - 1].lng) {
      coords.pop();
    }

    setFormData({
      zone_id: zone.zone_id,
      zone_name: zone.zone_name,
      description: zone.description || '',
      color_code: zone.color_code || '#22C55E',
      population_at_risk: (zone.population_at_risk || 0).toString(),
      coordinates: coords.length > 0 ? coords : [{ lat: '', lng: '' }]
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // Validate coordinates
      const validCoords = formData.coordinates
        .filter(c => c.lat && c.lng)
        .map(c => [parseFloat(c.lng), parseFloat(c.lat)]);

      if (validCoords.length < 3) {
        alert('A polygon boundary requires at least 3 valid coordinates.');
        return;
      }

      // Ensure the polygon is closed for GeoJSON
      if (validCoords[0][0] !== validCoords[validCoords.length - 1][0] ||
        validCoords[0][1] !== validCoords[validCoords.length - 1][1]) {
        validCoords.push([...validCoords[0]]);
      }

      const geometry: GeoJSONPolygon = {
        type: 'Polygon',
        coordinates: [validCoords]
      };

      const payload = {
        zone_id: formData.zone_id,
        zone_name: formData.zone_name,
        description: formData.description,
        color_code: formData.color_code,
        population_at_risk: parseInt(formData.population_at_risk) || 0,
        geometry
      };

      if (editingId) {
        await api.zones.update(editingId, payload);
        updateZone(editingId, payload as any);
      } else {
        const res: any = await api.zones.create(payload);
        addZone({
          ...payload,
          risk_level: 'LOW',
          risk_score: 0,
          current_conditions: {
            avg_water_level_m: 0,
            max_water_level_m: 0,
            avg_flow_velocity_mps: 0,
            total_rainfall_mm: 0,
            trend: 'STABLE'
          }
        } as any);
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const addCoordinate = () => {
    setFormData(prev => ({
      ...prev,
      coordinates: [...prev.coordinates, { lat: '', lng: '' }]
    }));
  };

  const updateCoordinate = (index: number, field: 'lat' | 'lng', value: string) => {
    const newCoords = [...formData.coordinates];
    newCoords[index][field] = value;
    setFormData(prev => ({ ...prev, coordinates: newCoords }));
  };

  const removeCoordinate = (index: number) => {
    if (formData.coordinates.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      coordinates: prev.coordinates.filter((_, i) => i !== index)
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone? This action cannot be undone.')) return;
    try {
      await api.zones.deactivate(id);
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
          <p className={styles.subtitle}>Strategic boundary definitions and risk assessment for Kelani Basin</p>
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
          {zones.length === 0 && <div className={styles.empty}>No zones defined</div>}
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
                  <button className={styles.iconBtn} onClick={() => handleOpenEdit(selected)} title="Edit Zone"><Edit2 size={16} /></button>
                  <button className={`${styles.iconBtn} ${styles.dangerText}`} onClick={() => handleDelete(selected.zone_id)} title="Delete Zone"><Trash2 size={16} /></button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Modify Strategic Zone' : 'Define New Strategic Zone'}>
        <div className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Zone ID</label>
              <div style={{ position: 'relative' }}>
                <Hash size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className={styles.formInput} style={{ paddingLeft: '36px' }} placeholder="e.g. ZONE-K10" value={formData.zone_id} onChange={(e) => setFormData(p => ({ ...p, zone_id: e.target.value }))} disabled={!!editingId} />
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Population at Risk</label>
              <input className={styles.formInput} type="number" placeholder="e.g. 25000" value={formData.population_at_risk} onChange={(e) => setFormData(p => ({ ...p, population_at_risk: e.target.value }))} />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Zone Name</label>
            <input className={styles.formInput} placeholder="e.g. New Colombo Basin" value={formData.zone_name} onChange={(e) => setFormData(p => ({ ...p, zone_name: e.target.value }))} />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Description</label>
            <textarea className={styles.formTextarea} placeholder="Detailed description of the geographical boundary and significance..." value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Marker Color & Identification</label>
            <div className={styles.formRow}>
              <input type="color" className={styles.formInput} style={{ width: '60px', height: '44px', padding: '4px' }} value={formData.color_code} onChange={(e) => setFormData(p => ({ ...p, color_code: e.target.value }))} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                Select a distinct color to identify this zone on the live map.
              </div>
            </div>
          </div>

          {/* Dynamic Boundary Coordinates */}
          <div className={styles.coordSection}>
            <div className={styles.coordHeader}>
              <label className={styles.formLabel}>Boundary Coordinates (Polygon)</label>
              {formData.coordinates[formData.coordinates.length - 1].lat && formData.coordinates[formData.coordinates.length - 1].lng && (
                <button className={styles.addCoordBtn} onClick={addCoordinate}>
                  <PlusCircle size={14} /> Add Next Point
                </button>
              )}
            </div>
            
            {formData.coordinates.map((coord, index) => (
              <div key={index} className={styles.coordRow}>
                <div className={styles.coordInputGroup}>
                  <div className={styles.formField}>
                    {index === 0 && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>LATITUDE</span>}
                    <input className={styles.formInput} type="number" step="any" placeholder="7.2715" value={coord.lat} onChange={(e) => updateCoordinate(index, 'lat', e.target.value)} />
                  </div>
                  <div className={styles.formField}>
                    {index === 0 && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>LONGITUDE</span>}
                    <input className={styles.formInput} type="number" step="any" placeholder="80.6125" value={coord.lng} onChange={(e) => updateCoordinate(index, 'lng', e.target.value)} />
                  </div>
                </div>
                {formData.coordinates.length > 1 && (
                  <button className={styles.removeCoordBtn} onClick={() => removeCoordinate(index)}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {formData.coordinates.length < 3 && (
              <div style={{ fontSize: '12px', color: 'var(--risk-warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={12} /> Min. 3 points required for a valid polygon.
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button className={styles.submitBtn} onClick={handleSave}>{editingId ? 'Save Changes' : 'Create Zone'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
