"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import safeZones from '@/app/maps/map/data/safe_zones.json';
import { fetchVisibleZones, zonesToFeatureCollection } from '@/app/maps/map/mapData';
import { DEFAULT_CENTER, MAPBOX_STYLES } from '@/app/maps/map/mapData';
import { getAccessProfile } from '@/app/maps/map/regional/provinceData';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const PUBLIC_RADIUS_KM = 5;

function haversineDistanceKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const value = sinLat * sinLat + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function pointInRing(point, ring) {
  const x = point[0];
  const y = point[1];
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point, geometry) {
  if (!geometry?.coordinates) return false;

  if (geometry.type === 'Polygon') {
    return pointInRing(point, geometry.coordinates[0]);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => pointInRing(point, polygon[0]));
  }

  return false;
}

function boundsFromPoint(point, delta = 0.06) {
  const [lng, lat] = point;
  return [[lng - delta, lat - delta], [lng + delta, lat + delta]];
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('no-geolocation'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
  });
}

function buildDirectionsUrl(travelMode, origin, destination) {
  const originParam = `${origin[0]},${origin[1]}`;
  const destinationParam = `${destination[0]},${destination[1]}`;

  // return `/api/directions/route?profile=${encodeURIComponent(travelMode)}&origin=${encodeURIComponent(originParam)}&destination=${encodeURIComponent(destinationParam)}`;
  return `https://api.mapbox.com/directions/v5/mapbox/${travelMode}/${originParam};${destinationParam}?geometries=geojson&overview=full&steps=true&access_token=${mapboxgl.accessToken}`;
}

function getSafeZoneScope(profile, currentLocation) {
  const allSafeZones = safeZones.features;

  if (profile.role === 'admin') {
    return {
      title: 'Admin access: all evacuation centers',
      zones: allSafeZones,
      note: 'Admin can view all public evacuation centers and routes.',
      nearestZone: null
    };
  }

  if (profile.role === 'regional_officer') {
    const zones = allSafeZones.filter((feature) => feature.properties.province === profile.province);
    return {
      title: `Regional access: ${profile.province || 'assigned province'}`,
      zones,
      note: 'Regional officers only see evacuation centers in their assigned province.',
      nearestZone: null
    };
  }

  if (currentLocation) {
    const scored = allSafeZones
      .map((feature) => ({
        feature,
        distanceKm: haversineDistanceKm(currentLocation, feature.geometry.coordinates)
      }))
      .filter((item) => item.distanceKm <= PUBLIC_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      title: 'Public access: nearby evacuation centers for your area',
      zones: scored.map((item) => item.feature),
      note: scored[0]
        ? `Nearest center: ${scored[0].feature.properties.name} (${scored[0].distanceKm.toFixed(1)} km away)`
        : 'Enable location to see nearby evacuation centers.',
      nearestZone: scored[0]?.feature || null
    };
  }

  return {
    title: 'Public access: enable location to see nearby evacuation centers',
    zones: [],
    note: 'Public users only see evacuation centers after location is enabled.',
    nearestZone: null
  };
}

export default function EvacuationMapPage({ embedded = false } = {}) {
  const mapRef = useRef(null);
  const visibleZonesRef = useRef([]);
  const containerRef = useRef(null);
  const [profile, setProfile] = useState({ role: 'public', province: '' });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedSafeId, setSelectedSafeId] = useState(null);
  const [travelMode, setTravelMode] = useState('walking');
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    setProfile(getAccessProfile());
  }, []);

  const safeZoneScope = useMemo(() => getSafeZoneScope(profile, currentLocation), [profile, currentLocation]);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLES.streets,
      center: DEFAULT_CENTER,
      zoom: 6
    });
    mapRef.current = map;

    map.on('load', async () => {
      const visible = await fetchVisibleZones();
      visibleZonesRef.current = visible;
      map.addSource('flood-zones', { type: 'geojson', data: zonesToFeatureCollection(visible) });
      map.addLayer({
        id: 'flood-zones-fill',
        type: 'fill',
        source: 'flood-zones',
        paint: {
          'fill-color': '#FEE2E2',
          'fill-opacity': 0.35
        }
      });
      map.addLayer({
        id: 'flood-zones-line',
        type: 'line',
        source: 'flood-zones',
        paint: {
          'line-color': '#FCA5A5',
          'line-width': 1
        }
      });

      map.addSource('focus-area', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'focus-area-fill',
        type: 'fill',
        source: 'focus-area',
        paint: {
          'fill-color': '#FBBF24',
          'fill-opacity': 0.2
        }
      });
      map.addLayer({
        id: 'focus-area-line',
        type: 'line',
        source: 'focus-area',
        paint: {
          'line-color': '#F59E0B',
          'line-width': 3
        }
      });

      map.addSource('public-radius', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'public-radius-fill',
        type: 'fill',
        source: 'public-radius',
        paint: {
          'fill-color': '#2563EB',
          'fill-opacity': 0.08
        }
      });
      map.addLayer({
        id: 'public-radius-line',
        type: 'line',
        source: 'public-radius',
        paint: {
          'line-color': '#2563EB',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });

      map.addSource('safe-zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: safeZones.features }
      });
      map.addLayer({
        id: 'safe-zones-circle',
        type: 'circle',
        source: 'safe-zones',
        paint: {
          'circle-radius': 8,
          'circle-color': '#10B981',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });
      map.addLayer({
        id: 'safe-zones-label',
        type: 'symbol',
        source: 'safe-zones',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-offset': [0, 1.2],
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#064E3B',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.25
        }
      });

      map.addSource('evac-path', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'evac-path-line',
        type: 'line',
        source: 'evac-path',
        paint: {
          'line-color': '#EF4444',
          'line-width': 4
        }
      });

      if (profile.role === 'public') {
        map.fitBounds([[79.45, 5.75], [82.05, 10.05]], { padding: 36, duration: 0 });
      }
    });

    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const safeSource = map.getSource('safe-zones');
    if (safeSource) {
      safeSource.setData({ type: 'FeatureCollection', features: safeZoneScope.zones });
    }

    const focusFeatures = [];
    const radiusFeatures = [];
    if (profile.role === 'public' && currentLocation) {
      const nearbyFloodZones = (visibleZonesRef.current || []).filter((zone) => haversineDistanceKm(currentLocation, zone.center) <= PUBLIC_RADIUS_KM);
      nearbyFloodZones.forEach((zone) => {
        focusFeatures.push({
          type: 'Feature',
          properties: {
            name: zone.name,
            risk_level: zone.risk_level
          },
          geometry: {
            type: 'Polygon',
            coordinates: [zone.geometry.coordinates[0]]
          }
        });
      });

      if (!nearbyFloodZones.length && safeZoneScope.nearestZone) {
        focusFeatures.push({
          type: 'Feature',
          properties: {
            name: safeZoneScope.nearestZone.properties.name,
            kind: 'nearest-safe-zone'
          },
          geometry: {
            type: 'Point',
            coordinates: safeZoneScope.nearestZone.geometry.coordinates
          }
        });
      }

      radiusFeatures.push({
        type: 'Feature',
        properties: { radius_km: PUBLIC_RADIUS_KM },
        geometry: {
          type: 'Polygon',
          coordinates: [(() => {
            const steps = 72;
            const [lng, lat] = currentLocation;
            const coords = [];
            const lngScale = Math.cos((lat * Math.PI) / 180);
            for (let i = 0; i < steps; i++) {
              const angle = (i / steps) * Math.PI * 2;
              const dx = (PUBLIC_RADIUS_KM / (111 * lngScale)) * Math.cos(angle);
              const dy = (PUBLIC_RADIUS_KM / 111) * Math.sin(angle);
              coords.push([lng + dx, lat + dy]);
            }
            coords.push(coords[0]);
            return coords;
          })()]
        }
      });
    }

    const focusSource = map.getSource('focus-area');
    if (focusSource) {
      focusSource.setData({ type: 'FeatureCollection', features: focusFeatures });
    }

    const radiusSource = map.getSource('public-radius');
    if (radiusSource) {
      radiusSource.setData({ type: 'FeatureCollection', features: radiusFeatures });
    }

    if (profile.role === 'public' && currentLocation) {
      const target = safeZoneScope.nearestZone?.geometry.coordinates || currentLocation;
      try {
        map.fitBounds(boundsFromPoint(target, 0.08), { padding: 40, duration: 450 });
      } catch {
        // ignore
      }
    }
  }, [safeZoneScope, profile.role, currentLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!selectedSafeId) {
      setRouteInfo(null);
      if (map.getSource('evac-path')) {
        map.getSource('evac-path').setData({ type: 'FeatureCollection', features: [] });
      }
      return;
    }

    (async () => {
      const feat = safeZones.features.find((feature) => feature.properties.id === selectedSafeId);
      if (!feat) return;

      let startLngLat = null;
      if (currentLocation) {
        startLngLat = currentLocation;
      } else {
        try {
          const pos = await getCurrentPosition();
          startLngLat = [pos.coords.longitude, pos.coords.latitude];
          setCurrentLocation(startLngLat);
        } catch {
          const center = map.getCenter();
          startLngLat = [center.lng, center.lat];
        }
      }

      const endLngLat = feat.geometry.coordinates;

      try {
        const response = await fetch(buildDirectionsUrl(travelMode, startLngLat, endLngLat));
        const payload = await response.json();
        if (!response.ok || !payload.routes || payload.routes.length === 0) {
          throw new Error('route-unavailable');
        }

        const route = payload.routes[0];
        const geometry = route.geometry;
        if (map.getSource('evac-path')) {
          map.getSource('evac-path').setData({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: { id: feat.properties.id }, geometry }]
          });
        }
        setRouteInfo({ distance: route.distance, duration: route.duration });

        const coords = geometry.coordinates;
        let minX = 360;
        let minY = 360;
        let maxX = -360;
        let maxY = -360;
        for (const coord of coords) {
          minX = Math.min(minX, coord[0]);
          minY = Math.min(minY, coord[1]);
          maxX = Math.max(maxX, coord[0]);
          maxY = Math.max(maxY, coord[1]);
        }
        try {
          map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 40, duration: 500 });
        } catch {
          // ignore
        }
      } catch {
        const coords = feat.properties.path || [];
        if (map.getSource('evac-path')) {
          map.getSource('evac-path').setData({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: { id: feat.properties.id, name: feat.properties.name }, geometry: { type: 'LineString', coordinates: coords } }]
          });
        }
        setRouteInfo(null);
      }
    })();
  }, [selectedSafeId, travelMode, currentLocation]);

  const handleUseMyLocation = () => {
    console.log("Button clicked...");
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = [position.coords.longitude, position.coords.latitude];
        console.log("Found location:", nextLocation);
        setCurrentLocation(nextLocation);

        mapRef.current?.flyTo({
          center: nextLocation,
          zoom: 14,
          essential: true
        });

        if (profile.role === 'public') {
          console.log("Searching safe zones...");
          // Log your first safeZone to check coordinate format compatibility
          console.log("SafeZone 1 coords:", safeZones.features[0]?.geometry.coordinates);
          
          const nearest = safeZones.features
            .map((feature) => ({
              feature,
              distanceKm: haversineDistanceKm(nextLocation, feature.geometry.coordinates)
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm)[0]?.feature;

          if (nearest) {
            console.log("Nearest zone found:", nearest.properties.id);
            setSelectedSafeId(nearest.properties.id);
          } else {
            console.warn("No nearest zone found - check distance logic.");
          }
        }
      },
      (err) => console.error("GPS Error:", err),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const scopeText = profile.role === 'admin'
    ? 'Admin can see all evacuation centers and routes.'
    : profile.role === 'regional_officer'
      ? `Regional officers only see centers in ${profile.province || 'their province'}.`
      : currentLocation
        ? 'Public users see evacuation centers near their current affected area.'
        : 'Public users can enable location to see nearby evacuation centers.';

  const toolbarButtonStyle = {
    padding: '8px 12px',
    borderRadius: 999,
    border: '1px solid var(--glass-border)',
    background: 'var(--bg-surface-low)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 700
  };

  return (
    <div style={{ width: '100%', height: embedded ? '100%' : '100vh', minHeight: embedded ? 0 : undefined, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: embedded ? 10 : 12, background: 'var(--bg-surface)', borderBottom: '1px solid var(--glass-border)', alignItems: 'center' }}>
        {!embedded && (
          <>
            <Link href="/maps/map/evacuation" style={{ ...toolbarButtonStyle, background: 'var(--primary)', color: '#fff' }}>
              Public Evacuation
            </Link>
            <Link href="/maps/map" style={toolbarButtonStyle}>
              Admin View
            </Link>
            <Link href="/maps/map/regional" style={toolbarButtonStyle}>
              Region View
            </Link>
          </>
        )}
        <button type="button" onClick={() => setSelectedSafeId(null)} style={toolbarButtonStyle}>Clear Path</button>
        <button type="button" onClick={handleUseMyLocation} style={toolbarButtonStyle}>Use My Location</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          Travel mode
          <select value={travelMode} onChange={(event) => setTravelMode(event.target.value)} style={{ padding: '8px 10px', borderRadius: 999, border: '1px solid var(--glass-border)', background: 'var(--bg-surface-low)', color: 'var(--text-primary)' }}>
            <option value="walking">Walking</option>
            <option value="driving">Driving</option>
          </select>
        </label>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Evacuation Map</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{safeZoneScope.title}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <aside style={{ width: embedded ? 280 : 320, flexShrink: 0, background: 'var(--bg-surface)', borderRight: '1px solid var(--glass-border)', padding: 12, overflow: 'auto' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Safe Zones Nearby</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{scopeText}</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {safeZoneScope.zones.map((feature) => (
              <div key={feature.properties.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--bg-surface-low)' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{feature.properties.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{feature.properties.province}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{feature.properties.capacity} capacity</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSafeId(feature.properties.id)}
                  style={{ padding: '6px 8px', borderRadius: 8, background: '#10B981', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Show Path
                </button>
              </div>
            ))}
          </div>

          {routeInfo ? (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'var(--bg-surface-low)', border: '1px solid var(--glass-border)', fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Route info</div>
              <div>Distance: {(routeInfo.distance / 1000).toFixed(1)} km</div>
              <div>Duration: {Math.round(routeInfo.duration / 60)} min</div>
            </div>
          ) : null}
        </aside>
        <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
      </div>
    </div>
  );
}
