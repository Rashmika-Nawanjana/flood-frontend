'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSensorStore } from '@/store/useSensorStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useAlertStore } from '@/store/useAlertStore';
import { usePredictionStore } from '@/store/usePredictionStore';
import { useAnomalyStore } from '@/store/useAnomalyStore';
import type {
  SensorUpdateEvent,
  ZoneRiskUpdateEvent,
  AlertNewEvent,
  AlertResolvedEvent,
  SensorOfflineEvent,
  AnomalyNewEvent,
  RiskLevel,
  RiskFactor,
} from '@/lib/types';

/**
 * SocketContext — Real-time event bridge
 *
 * Connects to the Socket.IO server and wires all 7 events
 * into the Zustand stores so the dashboard updates live.
 *
 * Connection URL: NEXT_PUBLIC_WS_URL (default: http://localhost:3001)
 * Socket.IO path: /ws/live
 */

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

interface PredictionPayload {
  prediction_id: string;
  zone_id: string;
  zone_name?: string;
  created_at?: string;
  prediction_window?: { from: string; to: string };
  flood_probability_percent?: number;
  predicted_peak_level_m: number;
  estimated_flood_time: string;
  severity: RiskLevel;
  confidence_percent?: number;
  model_version?: string;
  top_risk_factors: RiskFactor[];
}

interface ZoneRiskPayload extends ZoneRiskUpdateEvent {
  population_at_risk?: number;
}

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
      path: '/ws/live',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.info('[FloodSense] Socket.IO connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[FloodSense] Socket.IO disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[FloodSense] Socket.IO connection error:', err.message);
    });

    // ── Event 1: sensor:update ────────────────────────
    socket.on('sensor:update', (data: SensorUpdateEvent) => {
      useSensorStore.getState().updateSensor(data.sensor_id, {
        readings: data.current_reading,
        current_reading: { ...data.current_reading, recorded_at: new Date().toISOString() },
      });
    });

    // ── Event 2: zone:risk:update ─────────────────────
    // Now also carries population_at_risk from the producer
    socket.on('zone:risk:update', (data: ZoneRiskPayload) => {
      const update: Record<string, unknown> = {
        risk_level: data.current_level,
        risk_score: data.risk_score,
        color_code: data.color_code,
        last_updated: new Date().toISOString(),
      };
      if (data.population_at_risk !== undefined) {
        update.population_at_risk = data.population_at_risk;
      }
      useZoneStore.getState().updateZone(data.zone_id, update);
    });

    // ── Event 3: prediction:new ───────────────────────
    socket.on('prediction:new', (data: PredictionPayload) => {
      usePredictionStore.getState().addPrediction({
        prediction_id: data.prediction_id,
        zone_id: data.zone_id,
        zone_name: data.zone_name || data.zone_id,
        created_at: data.created_at || new Date().toISOString(),
        prediction_window: data.prediction_window || { from: new Date().toISOString(), to: new Date(Date.now() + 6 * 3600000).toISOString() },
        flood_probability_percent: data.flood_probability_percent || 0,
        predicted_peak_level_m: data.predicted_peak_level_m,
        estimated_flood_time: data.estimated_flood_time,
        severity: data.severity,
        confidence_percent: data.confidence_percent || 0,
        model_version: data.model_version || 'XGBoost-v2.3.1-SL',
        top_risk_factors: data.top_risk_factors || [],
      });
    });

    // ── Event 4: alert:new ────────────────────────────
    socket.on('alert:new', (data: AlertNewEvent) => {
      useAlertStore.getState().addAlert({
        alert_id: data.alert_id,
        zone_id: data.zone_id,
        zone_name: (data as Record<string, unknown>).zone_name as string || data.zone_id,
        severity: data.severity,
        severity_code: data.severity === 'CRITICAL' ? 4 : data.severity === 'HIGH' ? 3 : 2,
        title: data.title,
        message: data.message,
        triggered_at: new Date().toISOString(),
        triggered_by: 'XGBOOST_AUTOMATED',
        status: 'ACTIVE',
        resolved_at: null,
        affected_population: (data as Record<string, unknown>).affected_population as number || 0,
        recommended_action: data.recommended_action,
        recommended_shelters: data.recommended_shelters,
      });
    });

    // ── Event 5: alert:resolved ───────────────────────
    socket.on('alert:resolved', (data: AlertResolvedEvent) => {
      useAlertStore.getState().resolveAlert(data.alert_id, {
        resolved_at: data.resolved_at,
        resolution_note: data.resolution_note,
      });
    });

    // ── Event 6: sensor:offline ───────────────────────
    socket.on('sensor:offline', (data: SensorOfflineEvent) => {
      useSensorStore.getState().updateSensor(data.sensor_id, {
        status: { device_online: false, battery_percent: 0, signal_strength_dbm: 0, last_seen: data.last_seen },
        device_health: { is_online: false, battery_percent: 0, signal_strength_dbm: 0, last_seen: data.last_seen },
      });
    });

    // ── Event 7: anomaly:new ──────────────────────────
    socket.on('anomaly:new', (data: AnomalyNewEvent) => {
      useAnomalyStore.getState().addAnomaly({
        anomaly_id: data.anomaly_id,
        sensor_id: data.sensor_id,
        detected_at: new Date().toISOString(),
        type: data.type as 'SUDDEN_SPIKE' | 'SENSOR_DRIFT' | 'FLATLINE_ERROR' | 'RAPID_DESCENT' | 'NOISE_THRESHOLD',
        description: data.description,
        severity: data.severity,
        anomaly_score: data.anomaly_score,
        reading_at_detection: (data as Record<string, unknown>).reading_at_detection as { water_level_m: number; rate_of_change_m_per_hr: number } || { water_level_m: 0, rate_of_change_m_per_hr: 0 },
        expected_range: (data as Record<string, unknown>).expected_range as { min_m: number; max_m: number } || { min_m: 0, max_m: 0 },
        status: 'UNRESOLVED',
        auto_alert_triggered: (data as Record<string, unknown>).auto_alert_triggered as boolean || false,
      });
    });

    socketRef.current = socket;

    return () => {
      socket.off('sensor:update');
      socket.off('zone:risk:update');
      socket.off('prediction:new');
      socket.off('alert:new');
      socket.off('alert:resolved');
      socket.off('sensor:offline');
      socket.off('anomaly:new');
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
