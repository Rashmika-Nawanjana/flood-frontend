 'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  subtitle?: string;
  showEvacuationRoutes?: boolean;
  showAffectedZones?: boolean;
  zones?: unknown[];
  sensors?: unknown[];
  shelters?: unknown[];
  selectedZoneId?: string;
  onZoneClick?: (zoneId: string) => void;
  onSensorClick?: (sensorId: string) => void;
}

type AnyRecord = Record<string, any>;

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeRiskLevel(value: unknown) {
  return String(value || '').toLowerCase();
}

function getZoneId(zone: unknown) {
  if (!isRecord(zone)) return '';
  return String(zone.zone_id || zone.zoneId || zone.id || '');
}

function getZoneName(zone: unknown) {
  if (!isRecord(zone)) return 'Zone';
  return String(zone.zone_name || zone.name || zone.zoneId || zone.zone_id || 'Zone');
}

function getPointCoordinates(point: unknown) {
  if (!isRecord(point)) return null;

  if (isRecord(point.location) && Number.isFinite(point.location.lng) && Number.isFinite(point.location.lat)) {
    return [point.location.lng, point.location.lat] as [number, number];
  }

  if (Number.isFinite(point.lng) && Number.isFinite(point.lat)) {
    return [point.lng, point.lat] as [number, number];
  }

  if (Array.isArray(point.center) && point.center.length >= 2) {
    return [Number(point.center[0]), Number(point.center[1])] as [number, number];
  }

  return null;
}

function getPolygonCentroid(zone: unknown) {
  if (!isRecord(zone)) return null;

  const geometry = zone.geometry;
  if (!isRecord(geometry) || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates?.[0])) {
    return null;
  }

  const ring = geometry.coordinates[0].filter((pair: unknown) => Array.isArray(pair) && pair.length >= 2);
  if (!ring.length) return null;

  const total = ring.reduce(
    (acc: [number, number], pair: number[]) => [acc[0] + Number(pair[0]), acc[1] + Number(pair[1])],
    [0, 0]
  );

  return [total[0] / ring.length, total[1] / ring.length] as [number, number];
}

function getZoneCentroid(zone: unknown) {
  return getPolygonCentroid(zone) || getPointCoordinates(zone) || [80.6333, 7.2944];
}

function toGeoJsonPoints(items: unknown[], getCoordinates: (item: unknown) => [number, number] | null, buildProperties: (item: unknown) => AnyRecord) {
  return {
    type: 'FeatureCollection',
    features: items
      .map((item) => {
        const coordinates = getCoordinates(item);
        if (!coordinates) return null;
        return {
          type: 'Feature',
          properties: buildProperties(item),
          geometry: {
            type: 'Point',
            coordinates,
          },
        };
      })
      .filter(Boolean),
  };
}

function buildRouteFeatures(zones: unknown[], shelters: unknown[]) {
  return {
    type: 'FeatureCollection',
    features: shelters
      .map((shelter) => {
        if (!isRecord(shelter)) return null;
        const shelterCoords = getPointCoordinates(shelter);
        if (!shelterCoords) return null;

        const shelterZoneId = String(shelter.zone_id || '');
        const matchedZone = zones.find((zone) => getZoneId(zone) === shelterZoneId);
        const from = getZoneCentroid(matchedZone || zones[0]);

        return {
          type: 'Feature',
          properties: {
            shelter_id: shelter.shelter_id,
            name: shelter.name,
            zone_id: shelter.zone_id || null,
          },
          geometry: {
            type: 'LineString',
            coordinates: [from, shelterCoords],
          },
        };
      })
      .filter(Boolean),
  };
}

export default function MapPlaceholder({
  height = '500px',
  title = 'Map View',
  subtitle,
  showAffectedZones,
  showEvacuationRoutes,
  zones = [],
  sensors = [],
  shelters = [],
  selectedZoneId,
  onZoneClick,
  onSensorClick,
}: MapPlaceholderProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [hasToken] = useState(Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN));

  const zonesData = useMemo(() => {
    const zoneItems = Array.isArray(zones) ? zones : [];
    return {
      type: 'FeatureCollection',
      features: zoneItems
        .map((zone) => {
          if (!isRecord(zone)) return null;
          const zoneId = getZoneId(zone);
          const geometry = isRecord(zone.geometry) ? zone.geometry : null;
          if (!zoneId || !geometry) return null;

          return {
            type: 'Feature',
            properties: {
              zone_id: zoneId,
              name: getZoneName(zone),
              risk_level: normalizeRiskLevel(zone.risk_level),
              selected: zoneId === selectedZoneId,
              population_at_risk: Number(zone.population_at_risk || 0),
            },
            geometry,
          };
        })
        .filter(Boolean),
    };
  }, [zones, selectedZoneId]);

  const sensorData = useMemo(() => {
    const sensorItems = Array.isArray(sensors) ? sensors : [];
    return toGeoJsonPoints(
      sensorItems,
      getPointCoordinates,
      (sensor) => ({
        sensor_id: isRecord(sensor) ? sensor.sensor_id || sensor.id || '' : '',
        name: isRecord(sensor) ? sensor.name || sensor.sensor_id || 'Sensor' : 'Sensor',
        zone_id: isRecord(sensor) ? sensor.location?.zone_id || sensor.zone_id || null : null,
      })
    );
  }, [sensors]);

  const shelterData = useMemo(() => {
    const shelterItems = Array.isArray(shelters) ? shelters : [];
    return toGeoJsonPoints(
      shelterItems,
      getPointCoordinates,
      (shelter) => ({
        shelter_id: isRecord(shelter) ? shelter.shelter_id || '' : '',
        name: isRecord(shelter) ? shelter.name || shelter.shelter_id || 'Shelter' : 'Shelter',
        status: isRecord(shelter) ? shelter.status || 'OPEN' : 'OPEN',
        zone_id: isRecord(shelter) ? shelter.zone_id || null : null,
      })
    );
  }, [shelters]);

  const routeData = useMemo(() => {
    if (!showEvacuationRoutes) {
      return { type: 'FeatureCollection', features: [] };
    }

    return buildRouteFeatures(Array.isArray(zones) ? zones : [], Array.isArray(shelters) ? shelters : []);
  }, [showEvacuationRoutes, shelters, zones]);

  useEffect(() => {
    let disposed = false;

    async function initMap() {
      if (!hasToken || !mapContainerRef.current || mapRef.current) return;

      const mapboxgl = (await import('mapbox-gl')).default;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [80.6333, 7.2944],
        zoom: 6.4,
        minZoom: 3.5,
      });

      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: true, maxWidth: '260px' });

      map.on('load', () => {
        if (disposed) return;

        map.addSource('zones', { type: 'geojson', data: zonesData as any });
        map.addSource('sensors', { type: 'geojson', data: sensorData as any });
        map.addSource('shelters', { type: 'geojson', data: shelterData as any });
        map.addSource('routes', { type: 'geojson', data: routeData as any });

        map.addLayer({
          id: 'zones-fill',
          type: 'fill',
          source: 'zones',
          paint: {
            'fill-color': [
              'match',
              ['get', 'risk_level'],
              'critical', '#EF4444',
              'high', '#F97316',
              'warning', '#EAB308',
              'watch', '#F59E0B',
              'low', '#22C55E',
              '#3B82F6',
            ],
            'fill-opacity': ['case', ['boolean', ['get', 'selected'], false], 0.7, 0.34],
          },
        });

        map.addLayer({
          id: 'zones-outline',
          type: 'line',
          source: 'zones',
          paint: {
            'line-color': '#94A3B8',
            'line-width': ['case', ['boolean', ['get', 'selected'], false], 3, 1.25],
          },
        });

        map.addLayer({
          id: 'routes-line',
          type: 'line',
          source: 'routes',
          layout: { visibility: showEvacuationRoutes ? 'visible' : 'none' },
          paint: {
            'line-color': '#60A5FA',
            'line-width': 2,
            'line-dasharray': [2, 2],
            'line-opacity': 0.8,
          },
        });

        map.addLayer({
          id: 'sensors-circle',
          type: 'circle',
          source: 'sensors',
          paint: {
            'circle-radius': 5.5,
            'circle-color': '#22C55E',
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#0F172A',
          },
        });

        map.addLayer({
          id: 'shelters-circle',
          type: 'circle',
          source: 'shelters',
          paint: {
            'circle-radius': 6,
            'circle-color': '#F97316',
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#0F172A',
          },
        });

        map.fitBounds([
          [79.4, 5.8],
          [82.2, 10.1],
        ], { padding: 36, duration: 0 });

        const clickHandler = (event: any, sourceId: string, labelKey: string, idKey: string, callback?: (value: string) => void) => {
          const feature = event.features?.[0];
          if (!feature) return;

          const value = String(feature.properties?.[idKey] || '');
          if (callback) callback(value);

          popup
            .setLngLat(event.lngLat)
            .setHTML(`<div style="font-family:sans-serif"><strong>${feature.properties?.[labelKey] || 'Item'}</strong></div>`)
            .addTo(map);
        };

        map.on('click', 'zones-fill', (event) => clickHandler(event, 'zones', 'name', 'zone_id', onZoneClick));
        map.on('click', 'sensors-circle', (event) => clickHandler(event, 'sensors', 'name', 'sensor_id', onSensorClick));

        map.on('mouseenter', 'zones-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'zones-fill', () => { map.getCanvas().style.cursor = ''; });
        map.on('mouseenter', 'sensors-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'sensors-circle', () => { map.getCanvas().style.cursor = ''; });
      });
    }

    initMap();

    return () => {
      disposed = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
  }, [hasToken, onSensorClick, onZoneClick, routeData, sensorData, shelterData, showEvacuationRoutes, zonesData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const zonesSource = map.getSource('zones') as any;
    const sensorsSource = map.getSource('sensors') as any;
    const sheltersSource = map.getSource('shelters') as any;
    const routesSource = map.getSource('routes') as any;

    zonesSource?.setData(zonesData as any);
    sensorsSource?.setData(sensorData as any);
    sheltersSource?.setData(shelterData as any);
    routesSource?.setData(routeData as any);

    if (map.getLayer('routes-line')) {
      map.setLayoutProperty('routes-line', 'visibility', showEvacuationRoutes ? 'visible' : 'none');
    }
  }, [routeData, sensorData, shelterData, showEvacuationRoutes, zonesData]);

  if (!hasToken) {
    return (
      <div className={styles.container} style={{ height }}>
        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <MapPin size={48} strokeWidth={1.2} />
          </div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>
            Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to show the actual map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ height }}>
      <div ref={mapContainerRef} className={styles.mapCanvas} />
      <div className={styles.overlay}>
        <div className={styles.badge}>{title}</div>
        <div className={styles.chipRow}>
          <span className={styles.chip}>{zonesData.features.length} zones</span>
          <span className={styles.chip}>{sensorData.features.length} sensors</span>
          <span className={styles.chip}>{shelterData.features.length} shelters</span>
          {showAffectedZones && <span className={styles.chipAccent}>Affected</span>}
          {showEvacuationRoutes && <span className={styles.chipAccent}>Routes</span>}
        </div>
      </div>
    </div>
  );
}
