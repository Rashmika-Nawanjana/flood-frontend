import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Shelter } from '@/lib/types';

interface ShelterState {
  shelters: Shelter[];
  selectedShelterId: string | null;
  setShelters: (shelters: Shelter[]) => void;
<<<<<<< HEAD
  addShelter: (shelter: Shelter) => void;
  updateShelter: (id: string, data: Partial<Shelter>) => void;
  removeShelter: (id: string) => void;
=======
>>>>>>> origin/main
  selectShelter: (id: string | null) => void;
}

export const useShelterStore = create<ShelterState>()(
  devtools(
    (set) => ({
      shelters: [],
      selectedShelterId: null,
      setShelters: (shelters) => set({ shelters }),
<<<<<<< HEAD
      addShelter: (shelter) =>
        set((state) => ({ shelters: [...state.shelters, shelter] })),
      updateShelter: (id, data) =>
        set((state) => ({
          shelters: state.shelters.map((s) =>
            s.shelter_id === id ? { ...s, ...data } : s
          ),
        })),
      removeShelter: (id) =>
        set((state) => ({
          shelters: state.shelters.filter((s) => s.shelter_id !== id),
        })),
=======
>>>>>>> origin/main
      selectShelter: (id) => set({ selectedShelterId: id }),
    }),
    { name: 'ShelterStore' }
  )
);
