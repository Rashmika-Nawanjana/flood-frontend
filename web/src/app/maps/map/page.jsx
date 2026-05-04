'use client';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  riskColors,
  WEATHER_REFRESH_MS,
  DEFAULT_CENTER,
  SRI_LANKA_VIEW_BOUNDS,
  DEFAULT_BOUNDS,
  MAPBOX_STYLES,
  buildPopupHTML,
  fetchVisibleZones,
  zonesToFeatureCollection,
  zonesToHeatPoints,
  fetchLiveWeatherForLocations,
  buildPointWeatherFeatureCollections
} from './mapData';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function fitToSriLanka(map, { isSmallScreen, isExpanded }) {
  if (!map) return;

  map.fitBounds(SRI_LANKA_VIEW_BOUNDS, {
    padding: isExpanded
      ? { top: 16, right: 16, bottom: 16, left: 16 }
      : isSmallScreen
        ? { top: 40, right: 28, bottom: 40, left: 28 }
        : { top: 40, right: 40, bottom: 40, left: 40 },
    duration: 0
  });

  // Keep Sri Lanka from appearing smaller than the baseline fitted view.
  map.setMinZoom(map.getZoom());
}

const panelRoutes = {
  affected: '/live-map',
  heat: '/maps/map/heatmap',
  temperature: '/maps/map/temperature',
  rainfall: '/maps/map/rainfall'
};

const TEMPERATURE_CITIES = [
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

const RAINFALL_CITIES = [
  { zone_id: 'city-colombo', name: 'Colombo', center: [79.8612, 6.9271] },
  { zone_id: 'city-kandy', name: 'Kandy', center: [80.6337, 7.2906] },
  { zone_id: 'city-galle', name: 'Galle', center: [80.217, 6.0329] },
  { zone_id: 'city-jaffna', name: 'Jaffna', center: [80.0074, 9.6615] },
  { zone_id: 'city-trincomalee', name: 'Trincomalee', center: [81.2335, 8.5874] },
  { zone_id: 'city-batticaloa', name: 'Batticaloa', center: [81.701, 7.717] },
  { zone_id: 'city-anu', name: 'Anuradhapura', center: [80.4037, 8.3114] },
  { zone_id: 'city-kurunegala', name: 'Kurunegala', center: [80.3647, 7.4863] },
  { zone_id: 'city-ratnapura', name: 'Ratnapura', center: [80.4037, 6.6828] },
  { zone_id: 'city-badulla', name: 'Badulla', center: [81.055, 6.9895] }
];

export default function MapPage() {
  const router = useRouter();
  const [expandedPanel] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 900px)').matches;
  });
  const affectedMapContainer = useRef(null);
  const heatMapContainer = useRef(null);
  const tempMapContainer = useRef(null);
  const rainMapContainer = useRef(null);
  const mapsRef = useRef({
    affected: null,
    heat: null,
    temperature: null,
    rainfall: null
  });
  const weatherDataRef = useRef({
    temperature: buildPointWeatherFeatureCollections(TEMPERATURE_CITIES, {}).temperature,
    rainfall: buildPointWeatherFeatureCollections(RAINFALL_CITIES, {}).rainfall
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    const handleMediaChange = (event) => {
      setIsSmallScreen(event.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      Object.values(mapsRef.current).forEach((map) => {
        if (map) map.resize();
      });

      if (isSmallScreen || expandedPanel !== null) {
        Object.entries(mapsRef.current).forEach(([panelId, map]) => {
          fitToSriLanka(map, {
            isSmallScreen,
            isExpanded: expandedPanel === panelId
          });
        });
      }
    }, 220);

    return () => window.clearTimeout(timerId);
  }, [expandedPanel, isSmallScreen]);

  useEffect(() => {
    let isDisposed = false;

    const affectedMap = new mapboxgl.Map({
      container: affectedMapContainer.current,
      style: MAPBOX_STYLES.streets,
      center: DEFAULT_CENTER,
      zoom: 3.5,
      minZoom: 3,
      maxBounds: DEFAULT_BOUNDS
    });

    const heatMap = new mapboxgl.Map({
      container: heatMapContainer.current,
      style: MAPBOX_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: 3.5,
      minZoom: 3,
      maxBounds: DEFAULT_BOUNDS
    });

    const temperatureMap = new mapboxgl.Map({
      container: tempMapContainer.current,
      style: MAPBOX_STYLES.light,
      center: DEFAULT_CENTER,
      zoom: 3.5,
      minZoom: 3,
      maxBounds: DEFAULT_BOUNDS
    });

    const rainfallMap = new mapboxgl.Map({
      container: rainMapContainer.current,
      style: MAPBOX_STYLES.light,
      center: DEFAULT_CENTER,
      zoom: 3.5,
      minZoom: 3,
      maxBounds: DEFAULT_BOUNDS
    });

    mapsRef.current = {
      affected: affectedMap,
      heat: heatMap,
      temperature: temperatureMap,
      rainfall: rainfallMap
    };

    // placeholders for data populated from API
    let floodZonesData = null;
    let heatPointsData = null;

    const updateWeatherSources = () => {
      if (isDisposed) return;

      if (temperatureMap.isStyleLoaded()) {
        const tempSource = temperatureMap.getSource('temperature-cities');
        if (tempSource) {
          tempSource.setData(weatherDataRef.current.temperature);
        }
      }

      if (rainfallMap.isStyleLoaded()) {
        const rainSource = rainfallMap.getSource('rainfall-cities');
        if (rainSource) {
          rainSource.setData(weatherDataRef.current.rainfall);
        }
      }
    };

    const refreshLiveWeather = async () => {
      const [temperatureWeatherByCity, rainfallWeatherByCity] = await Promise.all([
        fetchLiveWeatherForLocations(TEMPERATURE_CITIES),
        fetchLiveWeatherForLocations(RAINFALL_CITIES)
      ]);
      if (isDisposed) return;
      weatherDataRef.current = {
        temperature: buildPointWeatherFeatureCollections(TEMPERATURE_CITIES, temperatureWeatherByCity).temperature,
        rainfall: buildPointWeatherFeatureCollections(RAINFALL_CITIES, rainfallWeatherByCity).rainfall
      };
      updateWeatherSources();
    };

    affectedMap.on('load', async () => {
      fitToSriLanka(affectedMap, {
        isSmallScreen,
        isExpanded: false
      });

      const visible = await fetchVisibleZones();
      floodZonesData = zonesToFeatureCollection(visible);
      heatPointsData = zonesToHeatPoints(visible);

      affectedMap.addSource('flood-zones', {
        type: 'geojson',
        data: floodZonesData
      });

      affectedMap.addLayer({
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
            '#cccccc'
          ],
          'fill-opacity': 0.45
        }
      });

      affectedMap.addLayer({
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
            '#cccccc'
          ],
          'line-width': 2
        }
      });

      affectedMap.on('click', 'flood-zones-fill', (e) => {
        const features = affectedMap.queryRenderedFeatures(e.point, {
          layers: ['flood-zones-fill']
        });
        if (!features.length) return;

        const priority = { critical: 4, high: 3, medium: 2, low: 1 };
        const mostCritical = features.reduce((top, cur) =>
          (priority[cur.properties.risk_level] || 0) >
          (priority[top.properties.risk_level] || 0) ? cur : top
        );

        const selectedZoneId = mostCritical.properties.zone_id;
        if (heatMap.getSource('selected-zone') && heatPointsData) {
          heatMap.getSource('selected-zone').setData({
            type: 'FeatureCollection',
            features: heatPointsData.features.filter(
              (feature) => feature.properties.zone_id === selectedZoneId
            )
          });
        }

        new mapboxgl.Popup({ maxWidth: '280px' })
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHTML(mostCritical.properties, features.length))
          .addTo(affectedMap);
      });

      affectedMap.on('mouseenter', 'flood-zones-fill', () => {
        affectedMap.getCanvas().style.cursor = 'pointer';
      });
      affectedMap.on('mouseleave', 'flood-zones-fill', () => {
        affectedMap.getCanvas().style.cursor = '';
      });
    });

    heatMap.on('load', () => {
      fitToSriLanka(heatMap, {
        isSmallScreen,
        isExpanded: false
      });

      heatMap.addSource('heat-points', {
        type: 'geojson',
        data: heatPointsData || { type: 'FeatureCollection', features: [] }
      });

      heatMap.addSource('selected-zone', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      heatMap.addLayer({
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

      heatMap.addLayer({
        id: 'selected-zone-marker',
        type: 'circle',
        source: 'selected-zone',
        paint: {
          'circle-radius': 5,
          'circle-color': '#1565C0',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      heatMap.addLayer({
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

      heatMap.on('click', 'heat-point-labels', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        new mapboxgl.Popup({ maxWidth: '260px' })
          .setLngLat(feature.geometry.coordinates)
          .setHTML(`<div style="font-family:sans-serif"><strong>${feature.properties.name}</strong><br/>Affected population: ${Number(feature.properties.affected_population).toLocaleString()}</div>`)
          .addTo(heatMap);
      });

      heatMap.on('mouseenter', 'heat-point-labels', () => {
        heatMap.getCanvas().style.cursor = 'pointer';
      });

      heatMap.on('mouseleave', 'heat-point-labels', () => {
        heatMap.getCanvas().style.cursor = '';
      });
    });

    temperatureMap.on('load', () => {
      fitToSriLanka(temperatureMap, {
        isSmallScreen,
        isExpanded: false
      });

      temperatureMap.addSource('temperature-cities', {
        type: 'geojson',
        data: weatherDataRef.current.temperature
      });

      // add heatmap (initial visibility controlled via layout)
      temperatureMap.addLayer({
        id: 'temperature-heat',
        type: 'heatmap',
        source: 'temperature-cities',
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'temp_heat'],
            20, 0.25,
            24, 0.4,
            28, 0.6,
            32, 0.78,
            36, 0.9,
            40, 1
          ],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            3, 1.15,
            8, 1.75
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(43,131,186,0)',
            0.2, '#2B83BA',
            0.4, '#6FC8D7',
            0.55, '#4DAF4A',
            0.7, '#FEE08B',
            0.85, '#F46D43',
            1, '#D73027'
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, 28,
            8, 48
          ],
          'heatmap-opacity': 0.95
        }
      });

      // add markers and labels (visibility controlled by layout)
      temperatureMap.addLayer({
        id: 'temperature-city-points',
        type: 'circle',
        source: 'temperature-cities',
        layout: { visibility: 'visible' },
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, 4,
            8, 6
          ],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'temperature_c'],
            0, '#2B83BA',
            10, '#6FC8D7',
            20, '#4DAF4A',
            30, '#FEE08B',
            40, '#F46D43',
            50, '#D73027'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      temperatureMap.addLayer({
        id: 'temperature-labels',
        type: 'symbol',
        source: 'temperature-cities',
        layout: Object.assign({
          'text-field': ['concat', ['get', 'name'], '\n', ['to-string', ['round', ['get', 'temperature_c']]], '°C'],
          'text-size': 11,
          'text-offset': [0, 1.6],
          'text-anchor': 'top'
        }, { visibility: 'visible' }),
        paint: {
          'text-color': '#1F2937',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        }
      });
    });

    rainfallMap.on('load', () => {
      fitToSriLanka(rainfallMap, {
        isSmallScreen,
        isExpanded: false
      });

      // add source, heatmap, markers and labels for rainfall (visibility controlled by layout)
      rainfallMap.addSource('rainfall-cities', {
        type: 'geojson',
        data: weatherDataRef.current.rainfall
      });

      // add heatmap (initial visibility controlled via layout)
      rainfallMap.addLayer({
        id: 'rainfall-heat',
        type: 'heatmap',
        source: 'rainfall-cities',
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'rain_heat'],
            1, 0.25,
            5, 0.4,
            15, 0.65,
            30, 0.82,
            45, 0.92,
            60, 1
          ],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            3, 1.15,
            8, 1.75
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
            3, 28,
            8, 48
          ],
          'heatmap-opacity': 0.95
        }
      });

      // add markers and labels (visibility controlled by layout)
      rainfallMap.addLayer({
        id: 'rainfall-city-points',
        type: 'circle',
        source: 'rainfall-cities',
        layout: { visibility: 'visible' },
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, 4,
            8, 6
          ],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'rain_mm'],
            0, '#313695',
            5, '#4575B4',
            15, '#74ADD1',
            30, '#ABD9E9',
            45, '#FDAE61',
            60, '#D73027'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      rainfallMap.addLayer({
        id: 'rainfall-labels',
        type: 'symbol',
        source: 'rainfall-cities',
        layout: Object.assign({
          'text-field': ['concat', ['get', 'name'], '\n', ['to-string', ['round', ['get', 'rain_mm']]], ' mm'],
          'text-size': 11,
          'text-offset': [0, 1.6],
          'text-anchor': 'top'
        }, { visibility: 'visible' }),
        paint: {
          'text-color': '#1F2937',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        }
      });
    });

    // initial fetch and polling
    refreshLiveWeather();
    const pollId = window.setInterval(() => refreshLiveWeather(), WEATHER_REFRESH_MS);

    return () => {
      isDisposed = true;
      window.clearInterval(pollId);
      Object.values(mapsRef.current).forEach((m) => {
        try { if (m && m.remove) m.remove(); } catch (e) { /* ignore */ }
      });
    };
  }, []);

  const isExpandedView = expandedPanel !== null;
  const titleStyle = { fontSize: 12, fontWeight: 700, color: '#6B7280' };
  const panelStyle = (id) => ({ border: '1px solid #E5E7EB', borderRadius: 16, background: '#FFFFFF', padding: 14, position: 'relative', minHeight: 68, cursor: 'pointer' });

  return (
    <div style={{ padding: 12, height: '160vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, flex: '0 0 auto' }}>
        <section style={panelStyle('regional')} onClick={() => router.push('/maps/map/regional')}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 }}>Regional Officer</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>Region-only</div>
          <p style={{ margin: '4px 0 10px', color: '#6B7280', fontSize: 12.5, lineHeight: 1.4 }}>Province-scoped flood layers and evacuation centers for the assigned region.</p>
          <Link href="/maps/map/regional" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '7px 10px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#111827', color: '#fff', cursor: 'pointer', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Open Regional View</Link>
        </section>
        <section style={panelStyle('public')} onClick={() => router.push('/maps/map/evacuation')}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 }}>Public</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>Nearby only</div>
          <p style={{ margin: '4px 0 10px', color: '#6B7280', fontSize: 12.5, lineHeight: 1.4 }}>Evacuation points and affected areas around the user&apos;s location within a 5 km radius.</p>
          <Link href="/maps/map/evacuation" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '7px 10px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#111827', color: '#fff', cursor: 'pointer', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Open Public Evacuation</Link>
        </section>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isExpandedView ? '1fr' : (isSmallScreen ? '1fr' : 'repeat(2, minmax(0, 1fr))'),
        gridTemplateRows: isExpandedView ? '1fr' : (isSmallScreen ? 'repeat(4, minmax(280px, auto))' : 'repeat(2, minmax(0, 1fr))'),
        gap: '12px',
        flex: '1 1 auto',
        minHeight: 0
      }}>

        <section style={panelStyle('affected')} onClick={() => router.push(panelRoutes.affected)}>
          <div style={{ ...titleStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Affected Area Map</span>
            <Link href={panelRoutes.affected} onClick={(e) => e.stopPropagation()} style={{ color: '#1565C0', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Open</Link>
          </div>
          <div ref={affectedMapContainer} style={{ width: '100%', height: '100%' }} />
        </section>

        <section style={panelStyle('heat')} onClick={() => router.push(panelRoutes.heat)}>
          <div style={{ ...titleStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Heat Map View</span>
            <Link href={panelRoutes.heat} onClick={(e) => e.stopPropagation()} style={{ color: '#1565C0', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Open</Link>
          </div>
          <div ref={heatMapContainer} style={{ width: '100%', height: '100%' }} />
        </section>

        <section style={panelStyle('temperature')} onClick={() => router.push(panelRoutes.temperature)}>
          <div style={{ ...titleStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Live Temperature Map</span>
            <Link href={panelRoutes.temperature} onClick={(e) => e.stopPropagation()} style={{ color: '#1565C0', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Open</Link>
          </div>
          <div ref={tempMapContainer} style={{ width: '100%', height: '100%' }} />
        </section>

        <section style={panelStyle('rainfall')} onClick={() => router.push(panelRoutes.rainfall)}>
          <div style={{ ...titleStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Live Rainfall Map</span>
            <Link href={panelRoutes.rainfall} onClick={(e) => e.stopPropagation()} style={{ color: '#1565C0', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Open</Link>
          </div>
          <div ref={rainMapContainer} style={{ width: '100%', height: '100%' }} />
        </section>

      </div>
    </div>
  );
  }
