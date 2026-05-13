import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Sensor } from '@/lib/types';

interface SensorState {
  sensors: Sensor[];
  selectedSensorId: string | null;
  setSensors: (sensors: Sensor[]) => void;
  addSensor: (sensor: Sensor) => void;
  updateSensor: (id: string, data: Partial<Sensor>) => void;
  selectSensor: (id: string | null) => void;
}

export const useSensorStore = create<SensorState>()(
  devtools(
    (set) => ({
      sensors: [],
      selectedSensorId: null,
      setSensors: (sensors) => set({ sensors }),
      addSensor: (sensor) =>
        set((state) => ({
          sensors: [sensor, ...state.sensors],
        })),
      updateSensor: (id, data) =>
        set((state) => ({
          sensors: state.sensors.map((s) =>
            s.sensor_id === id ? { ...s, ...data } : s
          ),
        })),
      selectSensor: (id) => set({ selectedSensorId: id }),
    }),
    { name: 'SensorStore' }
  )
);
