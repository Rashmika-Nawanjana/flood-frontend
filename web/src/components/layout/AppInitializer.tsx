'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useSensorStore } from '@/store/useSensorStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useShelterStore } from '@/store/useShelterStore';
import type { Sensor, Zone, Alert, Shelter, ApiResponse } from '@/lib/types';
import { mockAlerts, mockSensors, mockShelters, mockZones } from '@/lib/mockData';

export default function AppInitializer() {
  const initialized = useRef(false);

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
          useSensorStore.getState().setSensors(d.data?.length ? d.data : mockSensors);
        } else {
          useSensorStore.getState().setSensors(mockSensors);
        }

        if (zoneRes.status === 'fulfilled') {
          const d = zoneRes.value as ApiResponse<Zone[]>;
          const zones = d.data?.length ? d.data : mockZones;
          useZoneStore.getState().setZones(zones);

          // Extract shelters from zones since they are nested in the API response currently
          const shelters = zones.flatMap((z) => z.shelters || []);
          useShelterStore.getState().setShelters(shelters as Shelter[]);
        } else {
          useZoneStore.getState().setZones(mockZones);
          useShelterStore.getState().setShelters(mockShelters);
        }

        if (alertRes.status === 'fulfilled') {
          const d = alertRes.value as ApiResponse<Alert[]>;
          useAlertStore.getState().setAlerts(d.data?.length ? d.data : mockAlerts);
        } else {
          useAlertStore.getState().setAlerts(mockAlerts);
        }
      } catch (error) {
        console.error('[FloodSense] Failed to load initial data:', error);
        useSensorStore.getState().setSensors(mockSensors);
        useZoneStore.getState().setZones(mockZones);
        useAlertStore.getState().setAlerts(mockAlerts);
        useShelterStore.getState().setShelters(mockShelters);
      }
    }

    loadInitialData();
  }, []);

  return null;
}
