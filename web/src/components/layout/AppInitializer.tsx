'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useSensorStore } from '@/store/useSensorStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useShelterStore } from '@/store/useShelterStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Sensor, Zone, Alert, Shelter, ApiResponse } from '@/lib/types';

export default function AppInitializer() {
  const initialized = useRef(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only initialize once, and only when user has been loaded with a zone_id
    if (initialized.current || !isAuthenticated || !user) return;
    if (user.role !== 'admin' && !user.zone_id) return;
    initialized.current = true;

    async function loadInitialData() {
      try {
        const [sensorRes, zoneRes, alertRes] = await Promise.allSettled([
          api.sensors.list(user!.zone_id),
          api.zones.list(user!.zone_id),
          api.alerts.list(undefined, user!.zone_id),
          // Add shelters.list() when API supports it, for now extract from zones
        ]);

        if (sensorRes.status === 'fulfilled') {
          const d = sensorRes.value as ApiResponse<Sensor[]>;
          useSensorStore.getState().setSensors(d.data || []);
        }

        if (zoneRes.status === 'fulfilled') {
          const d = zoneRes.value as ApiResponse<Zone[]>;
          const zones = d.data || [];
          useZoneStore.getState().setZones(zones);

          // Extract shelters from zones since they are nested in the API response currently
          const shelters = zones.flatMap((z) => z.shelters || []);
          useShelterStore.getState().setShelters(shelters as Shelter[]);
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
  }, [isAuthenticated, user]);

  return null;
}
