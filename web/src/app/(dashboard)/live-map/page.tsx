'use client';

import Link from 'next/link';
import AffectedMap from '@/components/maps/AffectedMap';
import RiskBadge from '@/components/ui/RiskBadge';
import { useZoneStore } from '@/store/useZoneStore';
import styles from './page.module.css';

export default function LiveMapPage() {
  const zones = useZoneStore(s => s.zones);
  const highRiskZones = zones.filter((zone) => zone.risk_level === 'HIGH' || zone.risk_level === 'CRITICAL');
  const totalPopulation = zones.reduce((sum, zone) => sum + (zone.population_at_risk || 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Live Affected Map</h1>
          <p className={styles.subtitle}>Live affected flood zones selected by default</p>
        </div>

        <div className={styles.actions}>
          <Link href="/maps/map/heatmap" className={styles.mapBtn}>
            Live Heatmap
          </Link>
          <Link href="/maps/map/temperature" className={styles.mapBtn}>
            Temperature Map
          </Link>
          <Link href="/maps/map/rainfall" className={styles.mapBtn}>
            Rainfall Map
          </Link>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mapArea}>
          <AffectedMap
            height="100%"
            showHeader={false}
            title="Live Affected Map"
            subtitle="Full-country flood zone view"
          />
        </div>

        <aside className={styles.panel}>
          <div>
            <h2 className={styles.panelTitle}>Zone Risk Overview</h2>
            <p className={styles.panelMeta}>
              {highRiskZones.length} high-risk zones • {totalPopulation.toLocaleString()} people at risk
            </p>
          </div>

          <div className={styles.zoneList}>
            {zones.slice(0, 8).map((zone) => (
              <div key={zone.zone_id} className={styles.zoneItem}>
                <div className={styles.zoneInfo}>
                  <span className={styles.zoneName}>{zone.zone_name}</span>
                  <span className={styles.zoneMeta}>{zone.population_at_risk?.toLocaleString() || 0} people</span>
                </div>
                <RiskBadge level={zone.risk_level} />
              </div>
            ))}
            {zones.length === 0 && <p className={styles.emptyState}>No zone data available</p>}
          </div>

          <div className={styles.impactCard}>
            <span className={styles.impactLabel}>Active Layer</span>
            <span className={styles.impactValue}>Affected flood zones</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
