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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setSidebarCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  return (
    <div 
      className={styles.layoutWrapper}
      style={{ '--sidebar-width': isSidebarCollapsed ? '72px' : '260px' } as React.CSSProperties}
    >
      <AppInitializer />
      <Topbar />
      <Sidebar />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
