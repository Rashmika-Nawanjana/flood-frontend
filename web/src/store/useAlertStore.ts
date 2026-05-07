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
<<<<<<< HEAD
  resolveAlert: (id: string, data: { resolved_at: string; resolution_note: string }) => void;
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
      resolveAlert: (id, data) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.alert_id === id
              ? { ...a, status: 'RESOLVED' as const, resolved_at: data.resolved_at }
              : a
          ),
        })),
=======
>>>>>>> origin/main
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
