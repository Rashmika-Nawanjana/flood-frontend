'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useSensorStore } from '@/store/useSensorStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useShelterStore } from '@/store/useShelterStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Sensor, Zone, Alert, Shelter, ApiResponse } from '@/lib/types';

const SENSOR_POLL_INTERVAL_MS = 30_000;

export default function AppInitializer() {
  const initialized = useRef(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only initialize once, and only when user has been loaded
    if (initialized.current || !isAuthenticated || !user) return;
    initialized.current = true;

    async function loadSensors() {
      try {
        const res = await api.sensors.list(user!.zone_id);
        const d = res as ApiResponse<Sensor[]>;
        if (d.data) useSensorStore.getState().setSensors(d.data);
      } catch {}
    }

    async function loadInitialData() {
      try {
        const [sensorRes, zoneRes, alertRes] = await Promise.allSettled([
          api.sensors.list(user!.zone_id),
          api.zones.list(user!.zone_id, true), // Fetch shelters too
          api.alerts.list(undefined, user!.zone_id),
        ]);

        if (sensorRes.status === 'fulfilled') {
          const d = sensorRes.value as ApiResponse<Sensor[]>;
          useSensorStore.getState().setSensors(d.data || []);
        }

        if (zoneRes.status === 'fulfilled') {
          const d = zoneRes.value as ApiResponse<Zone[]>;
          const zones = d.data || [];
          useZoneStore.getState().setZones(zones);

          // Both admins and officers now get zones with nested shelters
          // Aggregate them into the ShelterStore
          const allShelters = zones.flatMap((z) => z.shelters || []);
          useShelterStore.getState().setShelters(allShelters as Shelter[]);
        }

        if (alertRes.status === 'fulfilled') {
          const d = alertRes.value as ApiResponse<Alert[]>;
          useAlertStore.getState().setAlerts(d.data || []);
        }
      } catch (error) {
        console.error('[FloodSense] Failed to load initial data:', error);
      }
    }

    loadInitialData();

    // Poll sensor readings every 30s so all sensors stay current
    // even if WS events are missing for some sensors.
    const poll = setInterval(loadSensors, SENSOR_POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [isAuthenticated, user]);

  return null;
}
