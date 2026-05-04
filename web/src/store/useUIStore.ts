import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  activeNavItem: string;
  toggleSidebar: () => void;
  setActiveNavItem: (item: string) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      activeNavItem: 'Dashboard',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setActiveNavItem: (item) => set({ activeNavItem: item }),
    }),
    { name: 'UIStore' }
  )
);
