import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Shelter } from '@/lib/types';

interface ShelterState {
  shelters: Shelter[];
  selectedShelterId: string | null;
  setShelters: (shelters: Shelter[]) => void;
  selectShelter: (id: string | null) => void;
}

export const useShelterStore = create<ShelterState>()(
  devtools(
    (set) => ({
      shelters: [],
      selectedShelterId: null,
      setShelters: (shelters) => set({ shelters }),
      selectShelter: (id) => set({ selectedShelterId: id }),
    }),
    { name: 'ShelterStore' }
  )
);
