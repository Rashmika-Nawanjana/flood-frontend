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
  function AuthRoleDecorator() {
  useAuthStore.setState({
    user: { id: 'mock-1', name: 'Mock User', email: 'mock@example.com', role },
    isAuthenticated: true,
  });
  return <Story />;
  }

  AuthRoleDecorator.displayName = 'AuthRoleDecorator';
  return AuthRoleDecorator;
};

/**
 * Decorator to populate sensor data
 */
export const withSensors = (sensors: any[]) => (Story: React.FC) => {
  function SensorsDecorator() {
  useSensorStore.setState({ sensors });
  return <Story />;
  }

  SensorsDecorator.displayName = 'SensorsDecorator';
  return SensorsDecorator;
};

/**
 * Decorator to populate alerts
 */
export const withAlerts = (alerts: any[]) => (Story: React.FC) => {
  function AlertsDecorator() {
  useAlertStore.setState({ alerts });
  return <Story />;
  }

  AlertsDecorator.displayName = 'AlertsDecorator';
  return AlertsDecorator;
};

/**
 * Decorator to populate zones
 */
export const withZones = (zones: any[]) => (Story: React.FC) => {
  function ZonesDecorator() {
  useZoneStore.setState({ zones });
  return <Story />;
  }

  ZonesDecorator.displayName = 'ZonesDecorator';
  return ZonesDecorator;
};

/**
 * Decorator to populate shelters
 */
export const withShelters = (shelters: any[]) => (Story: React.FC) => {
  function SheltersDecorator() {
  useShelterStore.setState({ shelters });
  return <Story />;
  }

  SheltersDecorator.displayName = 'SheltersDecorator';
  return SheltersDecorator;
};
