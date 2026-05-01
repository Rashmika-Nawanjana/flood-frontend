import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Anomaly } from '@/lib/types';

interface AnomalyState {
  anomalies: Anomaly[];
  setAnomalies: (anomalies: Anomaly[]) => void;
  addAnomaly: (anomaly: Anomaly) => void;
  resolveAnomaly: (id: string) => void;
}

export const useAnomalyStore = create<AnomalyState>()(
  devtools(
    (set) => ({
      anomalies: [],
      setAnomalies: (anomalies) => set({ anomalies }),
      addAnomaly: (anomaly) =>
        set((state) => ({ anomalies: [anomaly, ...state.anomalies] })),
      resolveAnomaly: (id) =>
        set((state) => ({
          anomalies: state.anomalies.map((a) =>
            a.anomaly_id === id ? { ...a, status: 'RESOLVED' as const } : a
          ),
        })),
    }),
    { name: 'AnomalyStore' }
  )
);
