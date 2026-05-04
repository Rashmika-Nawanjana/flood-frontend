import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type MapLayer = 'flood_zones' | 'sensors' | 'evacuation' | 'predictions';

interface MapState {
  activeLayer: MapLayer;
  selectedZoneId: string | null;
  setActiveLayer: (layer: MapLayer) => void;
  selectZone: (id: string | null) => void;
}

export const useMapStore = create<MapState>()(
  devtools(
    (set) => ({
      activeLayer: 'flood_zones',
      selectedZoneId: null,
      setActiveLayer: (layer) => set({ activeLayer: layer }),
      selectZone: (id) => set({ selectedZoneId: id }),
    }),
    { name: 'MapStore' }
  )
);
