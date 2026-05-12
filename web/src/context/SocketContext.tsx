'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSensorStore } from '@/store/useSensorStore';
import { useAlertStore } from '@/store/useAlertStore';
import { api } from '@/lib/api';
import type { Sensor, ApiResponse, SensorUpdateEvent, Alert } from '@/lib/types';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      console.info('[FloodSense] Socket.IO: offline mode (NEXT_PUBLIC_WS_URL not set)');
      return;
    }

    const socket = io(wsUrl, {
      path: '/ws/live/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.info('[FloodSense] Socket.IO connected');
      setIsConnected(true);
      // Refresh all sensors from REST on (re)connect so every sensor shows
      // current readings immediately, not just ones that emit WS events.
      api.sensors.list().then((res) => {
        const d = res as ApiResponse<Sensor[]>;
        if (d.data) useSensorStore.getState().setSensors(d.data);
      }).catch(() => {});
    });

    socket.on('sensor:update', (payload: { data: SensorUpdateEvent }) => {
      const d = payload?.data;
      if (!d?.sensor_id) return;
      const existing = useSensorStore.getState().sensors.find(s => s.sensor_id === d.sensor_id);
      useSensorStore.getState().updateSensor(d.sensor_id, {
        readings: {
          water_level_m: d.current_reading.water_level_m,
          rainfall_mm_per_hr: d.current_reading.rainfall_mm_per_hr,
          flow_velocity_mps: d.current_reading.flow_velocity_mps,
          temperature_c: d.current_reading.temperature_c,
          air_pressure_hpa: d.current_reading.air_pressure_hpa,
        },
        device_health: {
          is_online: true,
          battery_percent: existing?.device_health?.battery_percent ?? 0,
          signal_strength_dbm: existing?.device_health?.signal_strength_dbm ?? 0,
          last_seen: new Date().toISOString(),
        },
      });
    });

    socket.on('sensor:offline', (payload: { data: { sensor_id: string; last_seen: string } }) => {
      const d = payload?.data;
      if (!d?.sensor_id) return;
      const existing = useSensorStore.getState().sensors.find(s => s.sensor_id === d.sensor_id);
      useSensorStore.getState().updateSensor(d.sensor_id, {
        device_health: {
          is_online: false,
          battery_percent: existing?.device_health?.battery_percent ?? 0,
          signal_strength_dbm: existing?.device_health?.signal_strength_dbm ?? 0,
          last_seen: d.last_seen,
        },
      });
    });

    socket.on('alert:new', (payload: { data: Alert }) => {
      if (payload?.data) useAlertStore.getState().addAlert(payload.data);
    });

    socket.on('disconnect', () => {
      console.warn('[FloodSense] Socket.IO disconnected');
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.off('sensor:update');
      socket.off('sensor:offline');
      socket.off('alert:new');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * useSocket — Subscribe to a Socket.IO event
 * 
 * Usage:
 *   useSocket('sensor:update', (data) => { ... });
 */
export function useSocket<T>(event: string, handler: (data: T) => void) {
  const { socket, isConnected } = useContext(SocketContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;

    const listener = (data: T) => handlerRef.current(data);
    socket.on(event, listener);
    return () => { socket.off(event, listener); };
  }, [socket, event]);

  return { isConnected };
}

export default SocketContext;
