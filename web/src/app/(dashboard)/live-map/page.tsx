'use client';

import FloodMap from '@/components/maps/FloodMap';
import RiskBadge from '@/components/ui/RiskBadge';
import { useZoneStore } from '@/store/useZoneStore';
import { useMapStore } from '@/store/useMapStore';
import styles from './page.module.css';

export default function LiveMapPage() {
  const zones = useZoneStore((s) => s.zones);
  const { selectedZoneId, selectZone } = useMapStore();
<<<<<<< HEAD

=======
>>>>>>> origin/main
  const totalPopulation = zones.reduce((s, z) => s + (z.population_at_risk || 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Live Flood Map</h1>
        <p className={styles.subtitle}>Real-time zone monitoring and sensor tracking</p>
      </div>

      <div className={styles.content}>
        <div className={styles.mapArea}>
          <FloodMap mode="live-map" />
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Zone Risk Overview</h2>
          <div className={styles.zoneList}>
            {zones.map((zone) => (
              <div
                key={zone.zone_id}
                className={`${styles.zoneItem} ${selectedZoneId === zone.zone_id ? styles.zoneSelected : ''}`}
                onClick={() => selectZone(zone.zone_id)}
                style={
                  selectedZoneId === zone.zone_id
                    ? { borderColor: zone.color_code, boxShadow: `0 0 0 1px ${zone.color_code}22` }
                    : {}
                }
              >
                <div className={styles.zoneInfo}>
                  <span className={styles.zoneName}>{zone.zone_name}</span>
                  <RiskBadge level={zone.risk_level} />
                </div>
                <div className={styles.zoneScore}>
                  <span
                    className={styles.scoreValue}
                    style={{ color: zone.color_code }}
                  >
                    {Math.round(zone.risk_score)}
                  </span>
                </div>
              </div>
            ))}
            {zones.length === 0 && (
              <p className={styles.empty}>Loading zones…</p>
            )}
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
