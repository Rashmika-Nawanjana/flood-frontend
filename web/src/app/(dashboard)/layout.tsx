'use client';

import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Footer from '@/components/layout/Footer';
import AppInitializer from '@/components/layout/AppInitializer';
import { useUIStore } from '@/store/useUIStore';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);
  const isMobileDrawerOpen = useUIStore((state) => state.isMobileDrawerOpen);
  const setMobileDrawerOpen = useUIStore((state) => state.setMobileDrawerOpen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
        setMobileDrawerOpen(false);
      } else if (window.innerWidth < 1100) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed, setMobileDrawerOpen]);

  return (
    <div
      className={styles.layoutWrapper}
      style={{ '--sidebar-width': isSidebarCollapsed ? '72px' : '260px' } as React.CSSProperties}
    >
      <AppInitializer />
      <Topbar />
      <Sidebar />
      {isMobileDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setMobileDrawerOpen(false)} />
      )}
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
