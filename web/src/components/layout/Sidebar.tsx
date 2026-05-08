'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  Map,
  Bell,
  Radio,
  BrainCircuit,
  Route,
  AlertTriangle,
  Layers,
  Building2,
  Settings,
  Users,
} from 'lucide-react';
import { NAV_ITEMS, SETTINGS_NAV } from '@/lib/constants';
import styles from './Sidebar.module.css';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Map,
  Bell,
  Radio,
  BrainCircuit,
  Route,
  AlertTriangle,
  Layers,
  Building2,
  Settings,
  Users,
};

export default function Sidebar() {
  const pathname = usePathname();

  const { activeNavItem, setActiveNavItem, isSidebarCollapsed, isMobileDrawerOpen, setMobileDrawerOpen } = useUIStore();

  useEffect(() => {
    // Sync pathname to store on initial load if needed
    const currentItem = NAV_ITEMS.find(item => 
      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
    );
    if (currentItem) setActiveNavItem(currentItem.label);
  }, [pathname, setActiveNavItem]);

  const { user } = useAuthStore();

  const handleNavClick = (label: string) => {
    setActiveNavItem(label);
    setMobileDrawerOpen(false);
  };

  return (
    <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''} ${isMobileDrawerOpen ? styles.drawerOpen : ''}`}>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            if (item.label === 'Users' && user?.role !== 'admin') return null;

            const Icon = ICON_MAP[item.icon];
            const active = activeNavItem === item.label;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${active ? styles.active : ''}`}
                  onClick={() => handleNavClick(item.label)}
                  title={isSidebarCollapsed && !isMobileDrawerOpen ? item.label : ''}
                >
                  <Icon size={20} strokeWidth={1.8} />
                  {(!isSidebarCollapsed || isMobileDrawerOpen) && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={styles.spacer} />

        <Link
          href={SETTINGS_NAV.href}
          className={`${styles.navItem} ${activeNavItem === SETTINGS_NAV.label ? styles.active : ''}`}
          onClick={() => handleNavClick(SETTINGS_NAV.label)}
          title={isSidebarCollapsed && !isMobileDrawerOpen ? SETTINGS_NAV.label : ''}
        >
          <Settings size={20} strokeWidth={1.8} />
          {(!isSidebarCollapsed || isMobileDrawerOpen) && <span>{SETTINGS_NAV.label}</span>}
        </Link>
      </nav>
    </aside>
  );
}
