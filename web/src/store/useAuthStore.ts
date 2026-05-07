<<<<<<< HEAD
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/lib/types';
=======
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { UserRole } from "@/lib/types";
>>>>>>> origin/main

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
<<<<<<< HEAD
  persist(
=======
  devtools(
>>>>>>> origin/main
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
<<<<<<< HEAD
    {
      name: 'auth-storage', // key for localStorage
    }
  )
=======
    { name: "auth-store" },
  ),
>>>>>>> origin/main
);
