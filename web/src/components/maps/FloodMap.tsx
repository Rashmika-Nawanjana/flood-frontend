'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useZoneStore } from '@/store/useZoneStore';
import { useSensorStore } from '@/store/useSensorStore';
import { useShelterStore } from '@/store/useShelterStore';
import { useMapStore } from '@/store/useMapStore';
import type { Zone, Sensor, Shelter } from '@/lib/types';
import styles from './FloodMap.module.css';

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

export type FloodMapMode = 'live-map' | 'evacuation';

interface FloodMapProps {
  mode?: FloodMapMode;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function zonesToGeoJSON(zones: Zone[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => ({
      type: 'Feature',
      id: z.zone_id,
      properties: {
        zone_id: z.zone_id,
        zone_name: z.zone_name,
        risk_level: z.risk_level,
        risk_score: z.risk_score,
        color_code: z.color_code,
        population_at_risk: z.population_at_risk,
        trend: z.current_conditions?.trend ?? 'STABLE',
      },
      geometry: z.geometry,
    })),
  };
}

function sensorsToGeoJSON(sensors: Sensor[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: sensors
      .filter((s) => s.location?.lat && s.location?.lng)
      .map((s) => ({
        type: 'Feature',
        id: s.sensor_id,
        properties: {
          sensor_id: s.sensor_id,
          name: s.name,
          water_level: s.current_reading?.water_level_m ?? s.readings?.water_level_m ?? 0,
          rainfall: s.current_reading?.rainfall_mm_per_hr ?? s.readings?.rainfall_mm_per_hr ?? 0,
          online: s.status?.device_online ?? s.device_health?.is_online ?? true,
        },
        geometry: {
          type: 'Point',
          coordinates: [s.location.lng, s.location.lat],
        },
      })),
  };
}

function sheltersToGeoJSON(shelters: Shelter[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: shelters
      .filter((sh) => sh.lat && sh.lng)
      .map((sh) => ({
        type: 'Feature',
        id: sh.shelter_id,
        properties: {
          shelter_id: sh.shelter_id,
          name: sh.name,
          status: sh.status ?? 'OPEN',
          capacity: sh.capacity,
          current_occupancy: sh.current_occupancy ?? 0,
          contact_number: sh.contact_number,
        },
        geometry: {
          type: 'Point',
          coordinates: [sh.lng, sh.lat],
        },
      })),
  };
}

function getBoundsFromZone(zone: Zone): mapboxgl.LngLatBoundsLike | null {
  try {
    const coords = zone.geometry.coordinates[0];
    if (!coords || coords.length === 0) return null;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
  } catch {
    return null;
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export default function FloodMap({ mode = 'live-map' }: FloodMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);

  const zones = useZoneStore((s) => s.zones);
  const sensors = useSensorStore((s) => s.sensors);
  const shelters = useShelterStore((s) => s.shelters);
  const selectedZoneId = useMapStore((s) => s.selectedZoneId);
  const selectZone = useMapStore((s) => s.selectZone);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const iconsLoaded = useRef(false);

  // ─── initialise map ─────────────────────────────────────────────────────────
  useEffect(() => {
    let isReady = false;
    const fallback = setTimeout(() => {
      if (!isReady) {
        setMapError('Map timed out. Check your Mapbox token.');
        setMapLoaded(true);
      }
    }, 5000);

    if (map.current || !mapContainer.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [79.8612, 6.9271],
        zoom: 9,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      popup.current = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: '280px',
        className: 'flood-popup',
      });

      map.current.on('load', () => {
        isReady = true;
        clearTimeout(fallback);

        // Register canvas-drawn icons (transparent background, no PNG needed)
        // Mapbox accepts ImageData — extract it from the canvas context.
        if (!map.current!.hasImage('sensor-icon')) {
          const sc = createSensorCanvas();
          const sCtx = sc.getContext('2d')!;
          map.current!.addImage('sensor-icon', sCtx.getImageData(0, 0, sc.width, sc.height));
        }
        if (!map.current!.hasImage('shelter-icon')) {
          const shc = createShelterCanvas();
          const shCtx = shc.getContext('2d')!;
          map.current!.addImage('shelter-icon', shCtx.getImageData(0, 0, shc.width, shc.height));
        }
        iconsLoaded.current = true;

        // ── Add sources ──────────────────────────────────────────────────────
        map.current!.addSource('zones-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.current!.addSource('sensors-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.current!.addSource('shelters-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        // ── Zone fill layer ──────────────────────────────────────────────────
        map.current!.addLayer({
          id: 'zones-fill',
          type: 'fill',
          source: 'zones-source',
          paint: {
            'fill-color': ['get', 'color_code'],
            'fill-opacity': 0.3,
          },
        });

        // ── Zone outline — all zones dim line ────────────────────────────────
        map.current!.addLayer({
          id: 'zones-border',
          type: 'line',
          source: 'zones-source',
          paint: {
            'line-color': ['get', 'color_code'],
            'line-width': 1,
            'line-opacity': 0.5,
          },
        });

        // ── Zone outline — selected zone highlighted ──────────────────────────
        map.current!.addLayer({
          id: 'zones-selected',
          type: 'line',
          source: 'zones-source',
          filter: ['==', ['get', 'zone_id'], ''],
          paint: {
            'line-color': ['get', 'color_code'],
            'line-width': 3,
            'line-opacity': 0.9,
          },
        });

        // ── Sensor symbol layer ───────────────────────────────────────────────
        map.current!.addLayer({
          id: 'sensors-layer',
          type: 'symbol',
          source: 'sensors-source',
          layout: {
            'icon-image': 'sensor-icon',
            'icon-size': 1.0,
            'icon-allow-overlap': true,
            'icon-anchor': 'center',
            visibility: mode === 'live-map' ? 'visible' : 'none',
          },
        });

        // ── Shelter symbol layer ──────────────────────────────────────────────
        map.current!.addLayer({
          id: 'shelters-layer',
          type: 'symbol',
          source: 'shelters-source',
          layout: {
            'icon-image': 'shelter-icon',
            'icon-size': 1.0,
            'icon-allow-overlap': true,
            'icon-anchor': 'center',
            visibility: mode === 'evacuation' ? 'visible' : 'none',
          },
        });

        // ── Interaction: zone click ───────────────────────────────────────────
        map.current!.on('click', 'zones-fill', (e) => {
          if (!e.features?.length) return;
          const f = e.features[0];
          const props = f.properties as {
            zone_id: string;
            zone_name: string;
            risk_level: string;
            risk_score: number;
            population_at_risk: number;
            trend: string;
          };
          selectZone(props.zone_id);
          popup.current!
            .setLngLat(e.lngLat)
            .setHTML(
              `<div class="flood-popup-inner">
                <strong>${props.zone_name}</strong>
                <div class="flood-popup-row"><span>Risk Level</span><span class="flood-popup-risk">${props.risk_level}</span></div>
                <div class="flood-popup-row"><span>Risk Score</span><span>${props.risk_score}</span></div>
                <div class="flood-popup-row"><span>Population</span><span>${(props.population_at_risk || 0).toLocaleString()}</span></div>
                <div class="flood-popup-row"><span>Trend</span><span>${props.trend}</span></div>
              </div>`
            )
            .addTo(map.current!);
        });

        // ── Interaction: sensor click ─────────────────────────────────────────
        map.current!.on('click', 'sensors-layer', (e) => {
          if (!e.features?.length) return;
          const f = e.features[0];
          const props = f.properties as {
            name: string;
            water_level: number;
            rainfall: number;
            online: boolean;
          };
          const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
          popup.current!
            .setLngLat(coords)
            .setHTML(
              `<div class="flood-popup-inner">
                <strong>${props.name}</strong>
                <div class="flood-popup-row"><span>Status</span><span style="color:${props.online ? '#22C55E' : '#9CA3AF'}">${props.online ? 'Online' : 'Offline'}</span></div>
                <div class="flood-popup-row"><span>Water Level</span><span>${Number(props.water_level).toFixed(2)} m</span></div>
                <div class="flood-popup-row"><span>Rainfall</span><span>${Number(props.rainfall).toFixed(1)} mm/hr</span></div>
              </div>`
            )
            .addTo(map.current!);
        });

        // ── Interaction: shelter click ────────────────────────────────────────
        map.current!.on('click', 'shelters-layer', (e) => {
          if (!e.features?.length) return;
          const f = e.features[0];
          const props = f.properties as {
            name: string;
            status: string;
            capacity: number;
            current_occupancy: number;
            contact_number: string;
          };
          const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
          const pct = Math.round(((props.current_occupancy || 0) / Math.max(props.capacity, 1)) * 100);
          const statusColor = props.status === 'FULL' ? '#EF4444' : props.status === 'FILLING' ? '#F97316' : '#22C55E';
          popup.current!
            .setLngLat(coords)
            .setHTML(
              `<div class="flood-popup-inner">
                <strong>${props.name}</strong>
                <div class="flood-popup-row"><span>Status</span><span style="color:${statusColor}">${props.status || 'OPEN'}</span></div>
                <div class="flood-popup-row"><span>Occupancy</span><span>${props.current_occupancy || 0}/${props.capacity} (${pct}%)</span></div>
                <div class="flood-popup-row"><span>Contact</span><span>${props.contact_number}</span></div>
              </div>`
            )
            .addTo(map.current!);
        });

        // ── Cursors ───────────────────────────────────────────────────────────
        ['zones-fill', 'sensors-layer', 'shelters-layer'].forEach((layerId) => {
          map.current!.on('mouseenter', layerId, () => {
            map.current!.getCanvas().style.cursor = 'pointer';
          });
          map.current!.on('mouseleave', layerId, () => {
            map.current!.getCanvas().style.cursor = '';
          });
        });

        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox GL error:', e);
        setMapError('Failed to load map. Check token or network.');
        setMapLoaded(true);
        clearTimeout(fallback);
      });
    } catch (err) {
      console.error('Mapbox init error:', err);
      setMapError('Map crashed. WebGL may be unsupported.');
      setMapLoaded(true);
      clearTimeout(fallback);
    }

    return () => {
      clearTimeout(fallback);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── sync zone data → map source (fires when zones change incl. color_code) ─
  useEffect(() => {
    if (!mapLoaded || mapError || !map.current) return;
    const src = map.current.getSource('zones-source') as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(zonesToGeoJSON(zones));
  }, [mapLoaded, mapError, zones]);

  // ─── sync sensor data → map source ──────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || mapError || !map.current) return;
    const src = map.current.getSource('sensors-source') as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(sensorsToGeoJSON(sensors));
  }, [mapLoaded, mapError, sensors]);

  // ─── sync shelter data → map source ─────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || mapError || !map.current) return;
    const src = map.current.getSource('shelters-source') as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(sheltersToGeoJSON(shelters));
  }, [mapLoaded, mapError, shelters]);

  // ─── update zone layer visibility based on mode ──────────────────────────────
  useEffect(() => {
    if (!mapLoaded || mapError || !map.current) return;
    const m = map.current;
    const sensorVis = mode === 'live-map' ? 'visible' : 'none';
    const shelterVis = mode === 'evacuation' ? 'visible' : 'none';
    if (m.getLayer('sensors-layer')) {
      m.setLayoutProperty('sensors-layer', 'visibility', sensorVis);
    }
    if (m.getLayer('shelters-layer')) {
      m.setLayoutProperty('shelters-layer', 'visibility', shelterVis);
    }
  }, [mapLoaded, mapError, mode]);

  // ─── selected zone → highlight outline + fitBounds ──────────────────────────
  useEffect(() => {
    if (!mapLoaded || mapError || !map.current) return;
    const m = map.current;

    // Update the selected-zone filter to highlight only selected zone
    if (m.getLayer('zones-selected')) {
      m.setFilter('zones-selected', [
        '==',
        ['get', 'zone_id'],
        selectedZoneId ?? '',
      ]);
    }

    if (!selectedZoneId) return;

    // Fit map bounds to selected zone geometry
    const zone = zones.find((z) => z.zone_id === selectedZoneId);
    if (!zone) return;

    const bounds = getBoundsFromZone(zone);
    if (bounds) {
      m.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 15,
        duration: 800,
      });
    }
  }, [mapLoaded, mapError, selectedZoneId, zones]);

  return (
    <>
      {/* Global popup styles injected once */}
      <style>{`
        .mapboxgl-popup-content { background:#171f33 !important; color:#dbe2fd !important; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px 14px; box-shadow:0 8px 24px rgba(0,0,0,0.5); font-family:inherit; }
        .mapboxgl-popup-tip { border-top-color:#171f33 !important; border-bottom-color:#171f33 !important; }
        .mapboxgl-popup-close-button { color:#8c909f; font-size:18px; top:4px; right:6px; }
        .mapboxgl-popup-close-button:hover { background:rgba(255,255,255,0.08); border-radius:4px; }
        .flood-popup-inner strong { display:block; font-size:14px; font-weight:700; color:#dbe2fd; margin-bottom:8px; }
        .flood-popup-row { display:flex; justify-content:space-between; gap:16px; font-size:12px; color:#a0a6b8; padding:2px 0; }
        .flood-popup-row span:last-child { color:#dbe2fd; font-weight:600; }
        .flood-popup-risk { font-family:monospace; letter-spacing:0.05em; }
      `}</style>

      <div className={styles.mapContainer}>
        <div ref={mapContainer} className={styles.mapCanvas} />
        {!mapLoaded && !mapError && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner} />
            <span>Initializing Map Engine…</span>
          </div>
        )}
        {mapError && (
          <div className={styles.errorOverlay}>
            <strong>Map Error</strong>
            <p>{mapError}</p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── canvas icon helpers ──────────────────────────────────────────────────────
// Icons are drawn programmatically so they have perfectly transparent backgrounds.
// Canvas size = final pixel size on the map (icon-size: 1.0).

/** Signal/broadcast icon — 3 concentric arc pairs + centre dot */
function createSensorCanvas(): HTMLCanvasElement {
  const S = 28;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  const cx = S / 2, cy = S / 2;
  const blue = '#3B82F6';

  ctx.strokeStyle = blue;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // 3 arc pairs radiating left & right
  [4, 7, 10].forEach((r) => {
    // right
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();
    // left
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.58, Math.PI * 1.42);
    ctx.stroke();
  });

  // centre dot
  ctx.fillStyle = blue;
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

/** Tent / shelter icon — filled triangle roof + door cutout + two stakes */
function createShelterCanvas(): HTMLCanvasElement {
  const S = 28;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  const blue = '#3B82F6';

  // ── Tent body (filled triangle) ───────────────────────────────────────────
  ctx.fillStyle = blue;
  ctx.beginPath();
  ctx.moveTo(14, 2);   // peak
  ctx.lineTo(1, 22);   // bottom-left
  ctx.lineTo(27, 22);  // bottom-right
  ctx.closePath();
  ctx.fill();

  // ── Door opening (punched out with destination-out) ───────────────────────
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(10, 14, 8, 8);
  ctx.globalCompositeOperation = 'source-over';

  // ── Stakes (two small rectangles at the bottom) ───────────────────────────
  ctx.fillStyle = blue;
  ctx.fillRect(1, 22, 2, 5);   // left stake
  ctx.fillRect(25, 22, 2, 5);  // right stake

  return c;
}
