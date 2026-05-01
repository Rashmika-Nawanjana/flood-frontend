import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Prediction } from '@/lib/types';

interface PredictionState {
  predictions: Prediction[];
  setPredictions: (predictions: Prediction[]) => void;
  addPrediction: (prediction: Prediction) => void;
}

export const usePredictionStore = create<PredictionState>()(
  devtools(
    (set) => ({
      predictions: [],
      setPredictions: (predictions) => set({ predictions }),
      addPrediction: (prediction) =>
        set((state) => ({ predictions: [prediction, ...state.predictions] })),
    }),
    { name: 'PredictionStore' }
  )
);
