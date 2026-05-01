import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Zone } from '@/lib/types';

interface ZoneState {
  zones: Zone[];
  selectedZoneId: string | null;
  setZones: (zones: Zone[]) => void;
  addZone: (zone: Zone) => void;
  updateZone: (id: string, data: Partial<Zone>) => void;
  removeZone: (id: string) => void;
  selectZone: (id: string | null) => void;
}

export const useZoneStore = create<ZoneState>()(
  devtools(
    (set) => ({
      zones: [],
      selectedZoneId: null,
      setZones: (zones) => set({ zones }),
      addZone: (zone) =>
        set((state) => ({ zones: [...state.zones, zone] })),
      updateZone: (id, data) =>
        set((state) => ({
          zones: state.zones.map((z) =>
            z.zone_id === id ? { ...z, ...data } : z
          ),
        })),
      removeZone: (id) =>
        set((state) => ({
          zones: state.zones.filter((z) => z.zone_id !== id),
        })),
      selectZone: (id) => set({ selectedZoneId: id }),
    }),
    { name: 'ZoneStore' }
  )
);
