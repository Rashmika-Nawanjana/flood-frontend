'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  DEFAULT_CENTER,
  SRI_LANKA_VIEW_BOUNDS,
  MAPBOX_STYLES,
  fetchVisibleZones,
  zonesToHeatPoints
} from '../mapData';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function fitToSriLanka(map, isSmallScreen) {
  map.fitBounds(SRI_LANKA_VIEW_BOUNDS, {
    padding: isSmallScreen
      ? { top: 36, right: 20, bottom: 36, left: 20 }
      : { top: 48, right: 48, bottom: 48, left: 48 },
    duration: 0
  });

  map.setMinZoom(map.getZoom());
}

export default function HeatMapPage() {
  const router = useRouter();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: 3.5,
      minZoom: 1
    });
    mapRef.current = map;

    const mediaQuery = window.matchMedia('(max-width: 900px)');
    const handleResize = () => {
      map.resize();
      fitToSriLanka(map, mediaQuery.matches);
    };

    map.on('load', async () => {
      fitToSriLanka(map, mediaQuery.matches);
      const visible = await fetchVisibleZones();
      const heatPointsData = zonesToHeatPoints(visible);

      map.addSource('heat-points', {
        type: 'geojson',
        data: heatPointsData
      });

      map.addLayer({
        id: 'flood-heat',
        type: 'heatmap',
        source: 'heat-points',
        maxzoom: 12,
        paint: {
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'heat_weight'],
            0, 0,
            1, 1
          ],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.7,
            8, 1.5,
            12, 2
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(21,101,192,0)',
            0.2, '#2E7D32',
            0.45, '#F9A825',
            0.7, '#EF6C00',
            1, '#C62828'
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, 18,
            8, 26,
            12, 34
          ],
          'heatmap-opacity': 0.85
        }
      });

      map.addLayer({
        id: 'heat-point-labels',
        type: 'symbol',
        source: 'heat-points',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 1.2],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#F5F7FA',
          'text-halo-color': '#111827',
          'text-halo-width': 0.9
        }
      });

      map.on('click', 'heat-point-labels', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        new mapboxgl.Popup({ maxWidth: '260px' })
          .setLngLat(feature.geometry.coordinates)
          .setHTML(`<div style="font-family:sans-serif"><strong>${feature.properties.name}</strong><br/>Affected population: ${Number(feature.properties.affected_population).toLocaleString()}</div>`)
          .addTo(map);
      });
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-surface)' }}>
        <button
          type="button"
          onClick={() => router.push('/live-map')}
          style={{
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-surface-low)',
            color: 'var(--text-primary)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Back to Live Affected Map
        </button>
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            fitToSriLanka(map, window.matchMedia('(max-width: 900px)').matches);
          }}
          style={{
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-surface-low)',
            color: 'var(--text-primary)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Reset View
        </button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Heat Map View</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Impact intensity view</div>
        </div>
      </div>
      <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}
