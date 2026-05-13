import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Anomaly } from '@/lib/types';

interface AnomalyState {
  anomalies: Anomaly[];
  setAnomalies: (anomalies: Anomaly[]) => void;
  addAnomaly: (anomaly: Anomaly) => void;
  resolveAnomaly: (id: string, status?: 'RESOLVED' | 'FALSE_ALARM') => void;
}

export const useAnomalyStore = create<AnomalyState>()(
  devtools(
    (set) => ({
      anomalies: [],
      setAnomalies: (anomalies) => set({ anomalies }),
      addAnomaly: (anomaly) =>
        set((state) => ({ anomalies: [anomaly, ...state.anomalies] })),
  resolveAnomaly: (id, status = 'RESOLVED') =>
    set((state) => ({
      anomalies: state.anomalies.map((a) =>
        a.anomaly_id === id ? { ...a, status: status as 'RESOLVED' | 'FALSE_ALARM' } : a
      ),
    })),
    }),
    { name: 'AnomalyStore' }
  )
);
