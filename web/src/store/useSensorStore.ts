import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Sensor } from '@/lib/types';

interface SensorState {
  sensors: Sensor[];
  selectedSensorId: string | null;
  setSensors: (sensors: Sensor[]) => void;
<<<<<<< HEAD
  addSensor: (sensor: Sensor) => void;
  updateSensor: (id: string, data: Partial<Sensor>) => void;
  removeSensor: (id: string) => void;
=======
  updateSensor: (id: string, data: Partial<Sensor>) => void;
>>>>>>> origin/main
  selectSensor: (id: string | null) => void;
}

export const useSensorStore = create<SensorState>()(
  devtools(
    (set) => ({
      sensors: [],
      selectedSensorId: null,
      setSensors: (sensors) => set({ sensors }),
<<<<<<< HEAD
      addSensor: (sensor) =>
        set((state) => ({ sensors: [...state.sensors, sensor] })),
=======
>>>>>>> origin/main
      updateSensor: (id, data) =>
        set((state) => ({
          sensors: state.sensors.map((s) =>
            s.sensor_id === id ? { ...s, ...data } : s
          ),
        })),
<<<<<<< HEAD
      removeSensor: (id) =>
        set((state) => ({
          sensors: state.sensors.filter((s) => s.sensor_id !== id),
        })),
=======
>>>>>>> origin/main
      selectSensor: (id) => set({ selectedSensorId: id }),
    }),
    { name: 'SensorStore' }
  )
);
