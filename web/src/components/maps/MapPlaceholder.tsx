import { MapPin } from 'lucide-react';
import styles from './MapPlaceholder.module.css';

/**
 * =============================================
 * MapPlaceholder — HANDOFF COMPONENT FOR MEMBER 3
 * =============================================
 * 
 * Replace this component with your real Mapbox implementation.
 * 
 * Interface contract:
 * - zones: GeoJSON polygon data from GET /api/v1/zones
 * - sensors: Pin marker data from GET /api/v1/sensors
 * - shelters: Shelter pin data (from zone.shelters[])
 * - selectedZoneId: Currently selected zone (highlight on map)
 * - onZoneClick: Callback when user clicks a zone polygon
 * - onSensorClick: Callback when user clicks a sensor pin
 * - showEvacuationRoutes: Toggle route lines between zones and shelters
 * 
 * Environment variable needed: NEXT_PUBLIC_MAPBOX_TOKEN
 */

interface MapPlaceholderProps {
  height?: string;
  title?: string;
  showEvacuationRoutes?: boolean;
  zones?: unknown[];
  sensors?: unknown[];
  shelters?: unknown[];
  selectedZoneId?: string;
  onZoneClick?: (zoneId: string) => void;
  onSensorClick?: (sensorId: string) => void;
}

export default function MapPlaceholder({
  height = '500px',
  title = 'Map View',
}: MapPlaceholderProps) {
  return (
    <div className={styles.container} style={{ height }}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <MapPin size={48} strokeWidth={1.2} />
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>
          Mapbox integration pending — Member 3
        </p>
        <div className={styles.coordGrid}>
          <span>7.2713° N</span>
          <span>80.5925° E</span>
          <span>Kelani River Basin</span>
        </div>
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={styles.gridLine} />
        ))}
      </div>
    </div>
  );
}
