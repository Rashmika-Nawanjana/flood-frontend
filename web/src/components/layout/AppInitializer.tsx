'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useSensorStore } from '@/store/useSensorStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useShelterStore } from '@/store/useShelterStore';
<<<<<<< HEAD
import { useUIStore } from '@/store/useUIStore';
=======
>>>>>>> origin/main
import type { Sensor, Zone, Alert, Shelter, ApiResponse } from '@/lib/types';

export default function AppInitializer() {
  const initialized = useRef(false);
<<<<<<< HEAD
  const { sidebarOpen } = useUIStore();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--current-sidebar-width',
      sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed-width)'
    );
    
    if (sidebarOpen) {
      document.documentElement.classList.remove('sidebar-collapsed');
    } else {
      document.documentElement.classList.add('sidebar-collapsed');
    }
  }, [sidebarOpen]);
=======
>>>>>>> origin/main

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function loadInitialData() {
      try {
        const [sensorRes, zoneRes, alertRes] = await Promise.allSettled([
          api.sensors.list(),
          api.zones.list(),
          api.alerts.list(),
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
  }, []);

  return null;
}
