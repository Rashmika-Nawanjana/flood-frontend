import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  activeNavItem: string;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setActiveNavItem: (item: string) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: false,
      isSidebarCollapsed: false,
      isMobileDrawerOpen: false,
      activeNavItem: 'Dashboard',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
      setActiveNavItem: (item) => set({ activeNavItem: item }),
    }),
    { name: 'UIStore' }
  )
);
