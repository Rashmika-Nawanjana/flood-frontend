'use client';

import { useState, useEffect } from 'react';
import FloodMap from '@/components/maps/FloodMap';
import ProgressBar from '@/components/ui/ProgressBar';
import { useZoneStore } from '@/store/useZoneStore';
import { useShelterStore } from '@/store/useShelterStore';
import { useMapStore } from '@/store/useMapStore';
import styles from './page.module.css';

export default function EvacuationPage() {
  const { zones } = useZoneStore();
  const { selectedZoneId, selectZone } = useMapStore();
  const allShelters = useShelterStore(s => s.shelters);
  
  // Auto-select first zone if none selected
  useEffect(() => {
    if (zones.length > 0 && !selectedZoneId) {
      selectZone(zones[0].zone_id);
    }
  }, [zones, selectedZoneId, selectZone]);

  const shelters = allShelters.filter(s => s.zone_id === selectedZoneId);



  const totalCapacity = shelters.reduce((s, sh) => s + sh.capacity, 0);
  const totalOccupancy = shelters.reduce((s, sh) => s + (sh.current_occupancy || 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Evacuation Routes & Shelters</h1>
          <p className={styles.subtitle}>Emergency evacuation routing and shelter capacity overview</p>
        </div>
        <select className={styles.zoneSelect} value={selectedZoneId || ''} onChange={(e) => selectZone(e.target.value)}>
          {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
        </select>
      </div>

      <div className={styles.content}>
        <div className={styles.mapArea}>
          <FloodMap />
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
                  <span>{sh.current_occupancy || 0}/{sh.capacity} ({Math.round(((sh.current_occupancy || 0) / Math.max(sh.capacity, 1)) * 100)}%)</span>
                </div>
                <ProgressBar value={sh.current_occupancy || 0} max={sh.capacity} height={6} showLabel={false} />
              </div>
            ))}
            {shelters.length === 0 && <p className={styles.empty}>No shelters in this zone</p>}
          </div>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Capacity Utilization</span>
          <div className={styles.summaryValue}>
            <span>{totalOccupancy.toLocaleString()}/{totalCapacity.toLocaleString()} ({totalCapacity ? Math.round((totalOccupancy / totalCapacity) * 100) : 0}%)</span>
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
