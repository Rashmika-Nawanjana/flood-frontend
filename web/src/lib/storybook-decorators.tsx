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
export const withAuthRole = (role: UserRole) => (Story: React.FC) => {
  useAuthStore.setState({
    user: { id: 'mock-1', name: 'Mock User', email: 'mock@example.com', role },
    isAuthenticated: true,
  });
  return <Story />;
};

/**
 * Decorator to populate sensor data
 */
export const withSensors = (sensors: any[]) => (Story: React.FC) => {
  useSensorStore.setState({ sensors });
  return <Story />;
};

/**
 * Decorator to populate alerts
 */
export const withAlerts = (alerts: any[]) => (Story: React.FC) => {
  useAlertStore.setState({ alerts });
  return <Story />;
};

/**
 * Decorator to populate zones
 */
export const withZones = (zones: any[]) => (Story: React.FC) => {
  useZoneStore.setState({ zones });
  return <Story />;
};

/**
 * Decorator to populate shelters
 */
export const withShelters = (shelters: any[]) => (Story: React.FC) => {
  useShelterStore.setState({ shelters });
  return <Story />;
};
