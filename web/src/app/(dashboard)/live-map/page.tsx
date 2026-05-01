'use client';

import { useState, useEffect } from 'react';
import FloodMap from '@/components/maps/FloodMap';
import RiskBadge from '@/components/ui/RiskBadge';
import { api } from '@/lib/api';
import type { Zone, ApiResponse } from '@/lib/types';
import { useZoneStore } from '@/store/useZoneStore';
import { useMapStore } from '@/store/useMapStore';
import styles from './page.module.css';

export default function LiveMapPage() {
  const zones = useZoneStore(s => s.zones);
  const { selectedZoneId, selectZone } = useMapStore();

  const totalPopulation = zones.reduce((s, z) => s + (z.population_at_risk || 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Live Flood Map</h1>
        <p className={styles.subtitle}>Real-time zone monitoring and sensor tracking</p>
      </div>

      <div className={styles.content}>
        <div className={styles.mapArea}>
          <FloodMap />
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Zone Risk Overview</h2>
          <div className={styles.zoneList}>
            {zones.map((zone) => (
              <div
                key={zone.zone_id}
                className={`${styles.zoneItem} ${selectedZoneId === zone.zone_id ? styles.zoneSelected : ''}`}
                onClick={() => selectZone(zone.zone_id)}
              >
                <div className={styles.zoneInfo}>
                  <span className={styles.zoneName}>{zone.zone_name}</span>
                  <RiskBadge level={zone.risk_level} />
                </div>
                <div className={styles.zoneScore}>
                  <span className={styles.scoreValue}>{zone.risk_score}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.impactCard}>
            <span className={styles.impactLabel}>Total Impact Prediction</span>
            <span className={styles.impactValue}>
              Population at Risk: {totalPopulation.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
