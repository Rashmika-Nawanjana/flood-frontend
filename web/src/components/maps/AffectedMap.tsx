'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  DEFAULT_CENTER,
  SRI_LANKA_VIEW_BOUNDS,
  MAPBOX_STYLES,
  riskColors,
  buildPopupHTML,
  fetchVisibleZones,
  zonesToFeatureCollection,
} from '@/app/maps/map/mapData';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface AffectedMapProps {
  height?: string;
  showHeader?: boolean;
  backHref?: string;
  backLabel?: string;
  title?: string;
  subtitle?: string;
}

function fitToSriLanka(map: mapboxgl.Map, isSmallScreen: boolean) {
  map.fitBounds(SRI_LANKA_VIEW_BOUNDS as mapboxgl.LngLatBoundsLike, {
    padding: isSmallScreen
      ? { top: 36, right: 20, bottom: 36, left: 20 }
      : { top: 48, right: 48, bottom: 48, left: 48 },
    duration: 0,
  });

  map.setMinZoom(map.getZoom());
}

export default function AffectedMap({
  height = '100vh',
  showHeader = true,
  backHref = '/maps/map',
  backLabel = 'Back to 4 Maps',
  title = 'Affected Area Map',
  subtitle = 'Full-country flood zone view',
}: AffectedMapProps) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLES.streets,
      center: DEFAULT_CENTER as mapboxgl.LngLatLike,
      zoom: 3.5,
      minZoom: 1,
    });
    mapRef.current = map;

    const mediaQuery = window.matchMedia('(max-width: 900px)');
    const handleResize = () => {
      map.resize();
      fitToSriLanka(map, mediaQuery.matches);
    };

    map.on('load', async () => {
      fitToSriLanka(map, mediaQuery.matches);

      const visibleZones = await fetchVisibleZones();
      const floodZones = zonesToFeatureCollection(visibleZones);

      map.addSource('flood-zones', {
        type: 'geojson',
        data: floodZones as any,
      });

      map.addLayer({
        id: 'flood-zones-fill',
        type: 'fill',
        source: 'flood-zones',
        paint: {
          'fill-color': [
            'match', ['get', 'risk_level'],
            'low', riskColors.low,
            'medium', riskColors.medium,
            'high', riskColors.high,
            'critical', riskColors.critical,
            '#cccccc',
          ],
          'fill-opacity': 0.45,
        },
      });

      map.addLayer({
        id: 'flood-zones-outline',
        type: 'line',
        source: 'flood-zones',
        paint: {
          'line-color': [
            'match', ['get', 'risk_level'],
            'low', riskColors.low,
            'medium', riskColors.medium,
            'high', riskColors.high,
            'critical', riskColors.critical,
            '#cccccc',
          ],
          'line-width': 2,
        },
      });

      map.on('click', 'flood-zones-fill', (event) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: ['flood-zones-fill'],
        });
        if (!features.length) return;

        const priority: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        const mostCritical = features.reduce((top, current) =>
          (priority[String(current.properties?.risk_level)] || 0) >
          (priority[String(top.properties?.risk_level)] || 0)
            ? current
            : top
        );

        new mapboxgl.Popup({ maxWidth: '280px' })
          .setLngLat(event.lngLat)
          .setHTML(buildPopupHTML(mostCritical.properties as any, features.length))
          .addTo(map);
      });

      map.on('mouseenter', 'flood-zones-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'flood-zones-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    fitToSriLanka(map, window.matchMedia('(max-width: 900px)').matches);
  };

  return (
    <div style={{ width: '100%', height, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {showHeader && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-surface)' }}>
          <button
            type="button"
            onClick={() => router.push(backHref)}
            style={{
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-surface-low)',
              color: 'var(--text-primary)',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {backLabel}
          </button>
          <button
            type="button"
            onClick={resetView}
            style={{
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-surface-low)',
              color: 'var(--text-primary)',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Reset View
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</div>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}
