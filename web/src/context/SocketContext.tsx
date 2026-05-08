'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import { getAuthToken } from '@/lib/api';
import {
  buildSocketUrl,
  getDefaultSocketNamespace,
} from '@/lib/socket';

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

function normalizeSocketUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    url.pathname = url.pathname.replace(/\/(?:ws\/live|public|officer|admin)\/?$/, '') || '/';
    return url.toString().replace(/\/$/, '');
  } catch {
    return rawUrl;
  }
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const rawUrl = process.env.NEXT_PUBLIC_WS_URL;
    const socketPath = process.env.NEXT_PUBLIC_WS_PATH || '/ws/live';
    const namespace = getDefaultSocketNamespace(
      user?.role,
      process.env.NEXT_PUBLIC_WS_NAMESPACE,
    );
    const isAuthNamespace = namespace === '/admin' || namespace === '/officer';

    if (!rawUrl) {
      console.info('[FloodSense] Socket.IO: offline mode (NEXT_PUBLIC_WS_URL not set)');
      return;
    }

    if (isAuthNamespace && !isAuthenticated) {
      console.info(
        '[FloodSense] Socket.IO: waiting for auth to connect to namespace',
        namespace,
      );
      return;
    }

    let cancelled = false;

    async function connectSocket() {
      const token = await getAuthToken();
      if (cancelled) return;

      if (isAuthNamespace && !token) {
        console.warn(
          '[FloodSense] Socket.IO: authenticated namespace requires a valid token',
        );
        return;
      }

      const socketUrl = buildSocketUrl(rawUrl, namespace);
      console.info('[FloodSense] Socket.IO connecting to', socketUrl, 'path', socketPath);

      const socket = io(socketUrl, {
        path: socketPath,
        transports: ['websocket'],
        auth: token ? { token } : undefined,
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
    }

    connectSocket();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.role, isAuthenticated]);

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
