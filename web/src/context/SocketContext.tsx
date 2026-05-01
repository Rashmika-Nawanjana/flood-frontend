'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * SocketContext — HANDOFF FOR MEMBER 4
 * 
 * Set NEXT_PUBLIC_WS_URL to auto-connect.
 * If not set, runs in offline/demo mode.
 * 
 * Connection URL format: ws://<server>/ws/live
 */

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
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.info('[FloodSense] Socket.IO connected');
      setIsConnected(true);

      // TODO: Activate when Socket.IO is live (Member 4)
      // socket.on('sensor:update', (data) => useSensorStore.getState().updateSensor(data.sensor_id, data));
      // socket.on('alert:new', (data) => useAlertStore.getState().addAlert(data));
    });

    socket.on('disconnect', () => {
      console.warn('[FloodSense] Socket.IO disconnected');
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      // TODO: Clean up event listeners here when activated
      // socket.off('sensor:update');
      // socket.off('alert:new');
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
