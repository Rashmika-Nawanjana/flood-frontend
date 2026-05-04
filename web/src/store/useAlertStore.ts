import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Alert } from '@/lib/types';

interface AlertState {
  alerts: Alert[];
  selectedAlertId: string | null;
  severityFilter: string;
  dismissedAlertIds: string[];
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  selectAlert: (id: string | null) => void;
  setSeverityFilter: (filter: string) => void;
  dismissAlert: (id: string) => void;
}

export const useAlertStore = create<AlertState>()(
  devtools(
    (set) => ({
      alerts: [],
      selectedAlertId: null,
      severityFilter: 'ALL',
      dismissedAlertIds: [],
      setAlerts: (alerts) => set({ alerts }),
      addAlert: (alert) =>
        set((state) => ({ alerts: [alert, ...state.alerts] })),
      selectAlert: (id) => set({ selectedAlertId: id }),
      setSeverityFilter: (filter) => set({ severityFilter: filter }),
      dismissAlert: (id) =>
        set((state) => ({
          dismissedAlertIds: [...state.dismissedAlertIds, id],
        })),
    }),
    { name: 'AlertStore' }
  )
);
