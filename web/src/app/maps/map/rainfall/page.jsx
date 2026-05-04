'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  WEATHER_REFRESH_MS,
  DEFAULT_CENTER,
  SRI_LANKA_VIEW_BOUNDS,
  MAPBOX_STYLES,
  fetchLiveWeatherForLocations,
  buildPointWeatherFeatureCollections
} from '../mapData';

const MAIN_CITIES = [
  { zone_id: 'city-colombo', name: 'Colombo', center: [79.8612, 6.9271] },
  { zone_id: 'city-kandy', name: 'Kandy', center: [80.6337, 7.2906] },
  { zone_id: 'city-galle', name: 'Galle', center: [80.217, 6.0329] },
  { zone_id: 'city-jaffna', name: 'Jaffna', center: [80.0074, 9.6615] },
  { zone_id: 'city-trincomalee', name: 'Trincomalee', center: [81.2335, 8.5874] },
  { zone_id: 'city-ampara', name: 'Ampara', center: [81.6708, 7.2906] },
  { zone_id: 'city-anu', name: 'Anuradhapura', center: [80.4037, 8.3114] },
  { zone_id: 'city-kurunegala', name: 'Kurunegala', center: [80.3647, 7.4863] },
  { zone_id: 'city-ratnapura', name: 'Ratnapura', center: [80.4037, 6.6828] },
  { zone_id: 'city-badulla', name: 'Badulla', center: [81.055, 6.9895] },
  { zone_id: 'city-NuwaraEliya', name: 'Nuwara Eliya', center: [80.787, 6.9497] }
];

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

export default function RainfallMapPage() {
  const router = useRouter();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const weatherDataRef = useRef(buildPointWeatherFeatureCollections(MAIN_CITIES, {}).rainfall);
  const [displayMode, setDisplayMode] = useState('heat');

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const heatVis = displayMode === 'heat' ? 'visible' : 'none';
    const markersVis = displayMode === 'markers' ? 'visible' : 'none';

    if (map.getLayer('rainfall-heat')) map.setLayoutProperty('rainfall-heat', 'visibility', heatVis);
    if (map.getLayer('rainfall-city-points')) map.setLayoutProperty('rainfall-city-points', 'visibility', markersVis);
    if (map.getLayer('rainfall-labels')) map.setLayoutProperty('rainfall-labels', 'visibility', markersVis);
  }, [displayMode]);

  useEffect(() => {
    let isDisposed = false;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLES.light,
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

    const updateWeatherSource = () => {
      if (isDisposed) return;
      if (!map.isStyleLoaded()) return;

      const source = map.getSource('rainfall-cities');
      if (source) {
        source.setData(weatherDataRef.current);
      }
    };

    const refreshLiveWeather = async () => {
      const weatherByZone = await fetchLiveWeatherForLocations(MAIN_CITIES);
      if (isDisposed) return;
      weatherDataRef.current = buildPointWeatherFeatureCollections(MAIN_CITIES, weatherByZone).rainfall;
      updateWeatherSource();
    };

    map.on('load', () => {
      fitToSriLanka(map, mediaQuery.matches);

      map.addSource('rainfall-cities', {
        type: 'geojson',
        data: weatherDataRef.current
      });

      map.addLayer({
        id: 'rainfall-heat',
        type: 'heatmap',
        source: 'rainfall-cities',
        layout: { visibility: displayMode === 'heat' ? 'visible' : 'none' },
        paint: {
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'rain_mm'],
            0, 0,
            5, 0.2,
            15, 0.45,
            30, 0.7,
            45, 0.9,
            60, 1
          ],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            5, 0.8,
            8, 1.2
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(49,54,149,0)',
            0.2, '#313695',
            0.4, '#4575B4',
            0.55, '#74ADD1',
            0.7, '#ABD9E9',
            0.82, '#FDAE61',
            0.92, '#F46D43',
            1, '#D73027'
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            5, 20,
            8, 34
          ],
          'heatmap-opacity': 0.85
        }
      });

      map.addLayer({
        id: 'rainfall-city-points',
        type: 'circle',
        source: 'rainfall-cities',
        layout: { visibility: displayMode === 'markers' ? 'visible' : 'none' },
        paint: {
          'circle-radius': 5.5,
          'circle-color': [
            'interpolate', ['linear'], ['get', 'rain_mm'],
            0, '#313695',
            5, '#4575B4',
            15, '#74ADD1',
            30, '#ABD9E9',
            45, '#FDAE61',
            60, '#D73027'
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      map.addLayer({
        id: 'rainfall-labels',
        type: 'symbol',
        source: 'rainfall-cities',
        layout: {
          'text-field': ['concat', ['get', 'name'], '\n', ['to-string', ['round', ['get', 'rain_mm']]], ' mm'],
          'text-size': 11,
          'text-offset': [0, 1.6],
          'text-anchor': 'top',
          visibility: displayMode === 'markers' ? 'visible' : 'none'
        },
        paint: {
          'text-color': '#1F2937',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        }
      });
    });

    refreshLiveWeather();
    const refreshId = window.setInterval(refreshLiveWeather, WEATHER_REFRESH_MS);
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      window.removeEventListener('resize', handleResize);
      window.clearInterval(refreshId);
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setDisplayMode('heat')}
            style={{
              border: '1px solid var(--glass-border)',
              background: displayMode === 'heat' ? 'var(--primary)' : 'var(--bg-surface-low)',
              color: displayMode === 'heat' ? '#FFFFFF' : 'var(--text-primary)',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Heat
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('markers')}
            style={{
              border: '1px solid var(--glass-border)',
              background: displayMode === 'markers' ? 'var(--primary)' : 'var(--bg-surface-low)',
              color: displayMode === 'markers' ? '#FFFFFF' : 'var(--text-primary)',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Markers
          </button>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Live Rainfall Heatmap</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Major cities with live rainfall</div>
        </div>
      </div>
      <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}
