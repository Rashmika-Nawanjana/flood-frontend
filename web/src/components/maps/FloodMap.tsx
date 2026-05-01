'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useZoneStore } from '@/store/useZoneStore';
import { useSensorStore } from '@/store/useSensorStore';
import { useShelterStore } from '@/store/useShelterStore';
import styles from './FloodMap.module.css';

// Ensure you have NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA'; // Demo token fallback

export default function FloodMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const zones = useZoneStore(s => s.zones);
  const sensors = useSensorStore(s => s.sensors);
  const shelters = useShelterStore(s => s.shelters);
  const selectedZoneId = useZoneStore(s => s.selectedZoneId);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let isMapActuallyReady = false;

    // Failsafe: if mapbox fails silently or doesn't load, drop the loading screen after 3 seconds
    const fallbackTimeout = setTimeout(() => {
      if (!isMapActuallyReady) {
        setMapError('Map initialization timed out. Please check your Mapbox Token.');
        setMapLoaded(true);
      }
    }, 3000);

    if (map.current || !mapContainer.current) return;
    
    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [79.8612, 6.9271],
        zoom: 11
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        isMapActuallyReady = true;
        clearTimeout(fallbackTimeout);
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox GL error:', e);
        setMapError('Failed to load map style or invalid token. Check console.');
        setMapLoaded(true);
        clearTimeout(fallbackTimeout);
      });
    } catch (err) {
      console.error('Mapbox init error:', err);
      setMapError('Map initialization crashed. WebGL might be disabled or unsupported in this browser.');
      setMapLoaded(true);
      clearTimeout(fallbackTimeout);
    }

    return () => {
      clearTimeout(fallbackTimeout);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map data when stores change
  useEffect(() => {
    if (!map.current || !mapLoaded || mapError) return;
    const m = map.current;

    // Remove existing layers/sources if we are re-rendering
    // We'll manage markers manually
    
  }, [mapLoaded, mapError, zones, sensors, shelters, selectedZoneId]);

  // Handle Markers
  useEffect(() => {
    if (!map.current || !mapLoaded || mapError) return;
    const m = map.current;

    // Clear existing DOM markers
    const existingMarkers = document.querySelectorAll('.custom-marker');
    existingMarkers.forEach(n => n.remove());

    // 1. Add Sensor Markers
    sensors.forEach(sensor => {
      if (!sensor.location || !sensor.location.lng) return;
      const el = document.createElement('div');
      el.className = `custom-marker ${styles.sensorMarker} ${
        sensor.status?.device_online ? styles.sensorOnline : styles.sensorOffline
      }`;
      el.title = `${sensor.name} (${sensor.current_reading?.water_level_m}m)`;
      
      new mapboxgl.Marker(el)
        .setLngLat([sensor.location.lng, sensor.location.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <strong>${sensor.name}</strong><br/>
          Water Level: ${sensor.current_reading?.water_level_m}m<br/>
          Rainfall: ${sensor.current_reading?.rainfall_mm_per_hr}mm/hr<br/>
          Status: ${sensor.status?.device_online ? 'Online' : 'Offline'}
        `))
        .addTo(m);
    });

    // 2. Add Shelter Markers
    shelters.forEach(shelter => {
      if (!shelter.lng || !shelter.lat) return; // If missing
      const el = document.createElement('div');
      el.className = `custom-marker ${styles.shelterMarker} ${
        shelter.status === 'FULL' ? styles.shelterFull : styles.shelterOpen
      }`;
      el.title = `${shelter.name} (Cap: ${shelter.current_occupancy}/${shelter.capacity})`;

      new mapboxgl.Marker(el)
        .setLngLat([shelter.lng, shelter.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <strong>${shelter.name}</strong><br/>
          Status: ${shelter.status || 'OPEN'}<br/>
          Occupancy: ${shelter.current_occupancy || 0}/${shelter.capacity}<br/>
          Contact: ${shelter.contact_number}
        `))
        .addTo(m);
    });

  }, [mapLoaded, mapError, sensors, shelters]);

  // Center on selected zone
  useEffect(() => {
    if (!map.current || !mapLoaded || mapError || !selectedZoneId) return;
    const m = map.current;
    
    // In a real app we'd get a bounding box or center point for the zone.
    // We'll try to find a sensor in this zone to center on.
    const zoneSensor = sensors.find(s => s.location.zone_id === selectedZoneId);
    if (zoneSensor && zoneSensor.location.lng) {
      m.flyTo({ center: [zoneSensor.location.lng, zoneSensor.location.lat], zoom: 13 });
    }
  }, [selectedZoneId, mapLoaded, mapError, sensors]);

  return (
    <div className={styles.mapContainer} style={{ minHeight: '500px', display: 'flex', flex: 1 }}>
      <div ref={mapContainer} className={styles.mapCanvas} style={{ position: 'absolute', inset: 0, minHeight: '500px' }} />
      {!mapLoaded && !mapError && (
        <div className={styles.loadingOverlay}>
          Initializing Map Engine...
        </div>
      )}
      {mapError && (
        <div className={styles.loadingOverlay} style={{ color: '#ef4444', textAlign: 'center', padding: '20px', flexDirection: 'column', gap: '10px' }}>
          <strong>Map Error</strong>
          <p>{mapError}</p>
        </div>
      )}
    </div>
  );
}
