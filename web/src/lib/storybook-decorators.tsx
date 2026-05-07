import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useMapStore } from '@/store/useMapStore';
import { useSensorStore } from '@/store/useSensorStore';
import { useUIStore } from '@/store/useUIStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useShelterStore } from '@/store/useShelterStore';
import type { UserRole } from '@/lib/types';

/**
 * Decorator to mock authenticated user role in Storybook
 */
export const withAuthRole = (role: UserRole) => {
  const WithAuthRole = (Story: React.FC) => {
    useAuthStore.setState({
      user: { id: 'mock-1', name: 'Mock User', email: 'mock@example.com', role, zone_id: null },
      isAuthenticated: true,
    });
    return <Story />;
  };
  WithAuthRole.displayName = 'WithAuthRole';
  return WithAuthRole;
};

/**
 * Decorator to populate sensor data
 */
export const withSensors = (sensors: any[]) => {
  const WithSensors = (Story: React.FC) => {
    useSensorStore.setState({ sensors });
    return <Story />;
  };
  WithSensors.displayName = 'WithSensors';
  return WithSensors;
};

/**
 * Decorator to populate alerts
 */
export const withAlerts = (alerts: any[]) => {
  const WithAlerts = (Story: React.FC) => {
    useAlertStore.setState({ alerts });
    return <Story />;
  };
  WithAlerts.displayName = 'WithAlerts';
  return WithAlerts;
};

/**
 * Decorator to populate zones
 */
export const withZones = (zones: any[]) => {
  const WithZones = (Story: React.FC) => {
    useZoneStore.setState({ zones });
    return <Story />;
  };
  WithZones.displayName = 'WithZones';
  return WithZones;
};

/**
 * Decorator to populate shelters
 */
export const withShelters = (shelters: any[]) => {
  const WithShelters = (Story: React.FC) => {
    useShelterStore.setState({ shelters });
    return <Story />;
  };
  WithShelters.displayName = 'WithShelters';
  return WithShelters;
};
