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
  const { user, isAuthenticated } = useAuthStore();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable snapshot of zone_id used by the polling closure.
  const zoneIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Wait until we have a fully-resolved user (zone_id is no longer undefined —
    // ClerkSync sets it to null for admins/citizens or a string for field officers
    // after its async getZone call completes, so we treat undefined as "still loading").
    if (!isAuthenticated || !user) return;

    // For non-admin users, wait until ClerkSync has finished its async zone fetch.
    // ClerkSync initialises zone_id to null (not undefined), so once setUser() fires
    // the value is always null | string, never undefined.
    // We detect "still loading" by checking if the role is field_officer and zone_id
    // is still null — but actually we just let it load and re-run when zone_id changes.

    const zoneId = user.zone_id;
    zoneIdRef.current = zoneId;

    async function loadSensors() {
      try {
        const res = await api.sensors.list(zoneIdRef.current);
        const d = res as ApiResponse<Sensor[]>;
        if (d.data) useSensorStore.getState().setSensors(d.data);
      } catch {}
    }

    async function loadInitialData() {
      try {
        const [sensorRes, zoneRes, alertRes] = await Promise.allSettled([
          api.sensors.list(zoneId),
          api.zones.list(zoneId),
          api.alerts.list(undefined, zoneId),
        ]);

        if (sensorRes.status === 'fulfilled') {
          const d = sensorRes.value as ApiResponse<Sensor[]>;
          useSensorStore.getState().setSensors(d.data || []);
        }

        if (zoneRes.status === 'fulfilled') {
          const d = zoneRes.value as ApiResponse<Zone[]>;
          const zones = d.data || [];
          useZoneStore.getState().setZones(zones);
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

    // Clear any existing poll and start a fresh one scoped to the current zone.
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(loadSensors, SENSOR_POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // Re-run when the user or their zone changes (ClerkSync updates zone_id async).
  }, [isAuthenticated, user?.id, user?.zone_id]);

  return null;
}
