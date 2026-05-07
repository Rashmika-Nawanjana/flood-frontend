'use client';

<<<<<<< HEAD
import { useEffect } from 'react';
import FloodMap from '@/components/maps/FloodMap';
import ProgressBar from '@/components/ui/ProgressBar';
import { useZoneStore } from '@/store/useZoneStore';
import { useShelterStore } from '@/store/useShelterStore';
import { useMapStore } from '@/store/useMapStore';
import styles from './page.module.css';

export default function EvacuationPage() {
  const { zones } = useZoneStore();
  const { selectedZoneId, selectZone } = useMapStore();
  const allShelters = useShelterStore((s) => s.shelters);

  // Auto-select first zone if none selected
  useEffect(() => {
    if (zones.length > 0 && !selectedZoneId) {
      selectZone(zones[0].zone_id);
    }
  }, [zones, selectedZoneId, selectZone]);

  // Shelters for selected zone — also look inside zone.shelters in case
  // the shelter store has zone_id populated from AppInitializer extraction
  const selectedZone = zones.find((z) => z.zone_id === selectedZoneId);
  const shelters = allShelters.filter((s) => s.zone_id === selectedZoneId);
=======
import { useState, useEffect } from 'react';
import MapPlaceholder from '@/components/maps/MapPlaceholder';
import ProgressBar from '@/components/ui/ProgressBar';
import { api } from '@/lib/api';
import type { Zone, Shelter, ApiResponse } from '@/lib/types';
import styles from './page.module.css';

export default function EvacuationPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [shelters, setShelters] = useState<Shelter[]>([]);

  useEffect(() => {
    api.zones.list().then((res) => {
      const d = res as ApiResponse<Zone[]>;
      const z = d.data || [];
      setZones(z);
      if (z.length > 0) setSelectedZoneId(z[0].zone_id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedZoneId) return;
    api.zones.get(selectedZoneId).then((res) => {
      const d = res as ApiResponse<Zone>;
      setShelters(d.data?.shelters || []);
    }).catch(console.error);
  }, [selectedZoneId]);
>>>>>>> origin/main

  const totalCapacity = shelters.reduce((s, sh) => s + sh.capacity, 0);
  const totalOccupancy = shelters.reduce((s, sh) => s + (sh.current_occupancy || 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
<<<<<<< HEAD
          <h1 className={styles.title}>Evacuation Routes &amp; Shelters</h1>
          <p className={styles.subtitle}>Emergency evacuation routing and shelter capacity overview</p>
        </div>
        <select
          className={styles.zoneSelect}
          value={selectedZoneId || ''}
          onChange={(e) => selectZone(e.target.value)}
        >
          {zones.map((z) => (
            <option key={z.zone_id} value={z.zone_id}>
              {z.zone_name}
            </option>
          ))}
=======
          <h1 className={styles.title}>Evacuation Routes & Shelters</h1>
          <p className={styles.subtitle}>Emergency evacuation routing and shelter capacity overview</p>
        </div>
        <select className={styles.zoneSelect} value={selectedZoneId} onChange={(e) => setSelectedZoneId(e.target.value)}>
          {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
>>>>>>> origin/main
        </select>
      </div>

      <div className={styles.content}>
        <div className={styles.mapArea}>
<<<<<<< HEAD
          <FloodMap mode="evacuation" />
        </div>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>
            Shelters in {selectedZone?.zone_name ?? '…'}
          </h2>
          <span className={styles.panelMeta}>
            {shelters.length} shelter{shelters.length !== 1 ? 's' : ''} active &bull; Total capacity:{' '}
            {totalCapacity.toLocaleString()}
          </span>
          <div className={styles.shelterList}>
            {shelters.map((sh) => (
              <div
                key={sh.shelter_id}
                className={styles.shelterCard}
                style={{
                  borderLeftColor:
                    sh.status === 'FULL'
                      ? 'var(--risk-critical)'
                      : sh.status === 'FILLING'
                      ? 'var(--risk-warning)'
                      : 'var(--risk-low)',
                }}
              >
                <div className={styles.shelterHeader}>
                  <span className={styles.shelterName}>{sh.name}</span>
                  <span
                    className={`${styles.shelterStatus} ${
                      styles[`shelter${sh.status ?? 'OPEN'}`]
                    }`}
                  >
                    {sh.status ?? 'OPEN'}
                  </span>
                </div>
                <span className={styles.shelterMeta}>
                  Dist: {sh.distance_km ?? '—'} km &bull; Contact: {sh.contact_number}
                </span>
                <div className={styles.shelterCapacity}>
                  <span>Capacity Utilization</span>
                  <span>
                    {sh.current_occupancy || 0}/{sh.capacity} (
                    {Math.round(
                      ((sh.current_occupancy || 0) / Math.max(sh.capacity, 1)) * 100
                    )}
                    %)
                  </span>
                </div>
                <ProgressBar
                  value={sh.current_occupancy || 0}
                  max={sh.capacity}
                  height={6}
                  showLabel={false}
                />
              </div>
            ))}
            {shelters.length === 0 && (
              <p className={styles.empty}>No shelters recorded for this zone</p>
            )}
=======
          <MapPlaceholder height="100%" title="Evacuation Routes" showEvacuationRoutes shelters={shelters} />
        </div>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Shelters in {zones.find(z => z.zone_id === selectedZoneId)?.zone_name}</h2>
          <span className={styles.panelMeta}>{shelters.length} shelters active • Total capacity: {totalCapacity.toLocaleString()}</span>
          <div className={styles.shelterList}>
            {shelters.map(sh => (
              <div key={sh.shelter_id} className={styles.shelterCard} style={{ borderLeftColor: sh.status === 'FULL' ? 'var(--risk-critical)' : sh.status === 'FILLING' ? 'var(--risk-warning)' : 'var(--risk-low)' }}>
                <div className={styles.shelterHeader}>
                  <span className={styles.shelterName}>{sh.name}</span>
                  <span className={`${styles.shelterStatus} ${styles[`shelter${sh.status}`]}`}>{sh.status}</span>
                </div>
                <span className={styles.shelterMeta}>Dist: {sh.distance_km} km • Sector</span>
                <div className={styles.shelterCapacity}>
                  <span>Capacity Utilization</span>
                  <span>{sh.current_occupancy || 0}/{sh.capacity} ({Math.round(((sh.current_occupancy || 0) / sh.capacity) * 100)}%)</span>
                </div>
                <ProgressBar value={sh.current_occupancy || 0} max={sh.capacity} height={6} showLabel={false} />
              </div>
            ))}
            {shelters.length === 0 && <p className={styles.empty}>No shelters in this zone</p>}
>>>>>>> origin/main
          </div>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Capacity Utilization</span>
          <div className={styles.summaryValue}>
<<<<<<< HEAD
            <span>
              {totalOccupancy.toLocaleString()}/{totalCapacity.toLocaleString()} (
              {totalCapacity ? Math.round((totalOccupancy / totalCapacity) * 100) : 0}%)
            </span>
=======
            <span>{totalOccupancy.toLocaleString()}/{totalCapacity.toLocaleString()} ({totalCapacity ? Math.round((totalOccupancy / totalCapacity) * 100) : 0}%)</span>
>>>>>>> origin/main
            <ProgressBar value={totalOccupancy} max={totalCapacity || 1} height={8} showLabel={false} />
          </div>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Est. Evacuation Time</span>
          <span className={styles.summaryTime}>~45 min</span>
        </div>
      </div>
    </div>
  );
}
