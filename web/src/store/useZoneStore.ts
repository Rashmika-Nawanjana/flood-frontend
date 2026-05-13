import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Zone } from '@/lib/types';

interface ZoneState {
  zones: Zone[];
  selectedZoneId: string | null;
  setZones: (zones: Zone[]) => void;
  addZone: (zone: Zone) => void;
  selectZone: (id: string | null) => void;
}

export const useZoneStore = create<ZoneState>()(
  devtools(
    (set) => ({
      zones: [],
      selectedZoneId: null,
      setZones: (zones) => set({ zones }),
      addZone: (zone) =>
        set((state) => ({
          zones: [zone, ...state.zones],
        })),
      selectZone: (id) => set({ selectedZoneId: id }),
    }),
    { name: 'ZoneStore' }
  )
);
