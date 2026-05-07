'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
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
};

export default function Sidebar() {
  const pathname = usePathname();

<<<<<<< HEAD
  const { activeNavItem, setActiveNavItem, sidebarOpen } = useUIStore();
  
=======
  const { activeNavItem, setActiveNavItem } = useUIStore();

>>>>>>> origin/main
  useEffect(() => {
    // Sync pathname to store on initial load if needed
    const currentItem = NAV_ITEMS.find(item => 
      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
    );
    if (currentItem) setActiveNavItem(currentItem.label);
  }, [pathname, setActiveNavItem]);

  return (
<<<<<<< HEAD
    <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
      <div className={styles.brand}>
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          className={styles.brandIcon}
        >
          <path
            d="M3 18c2-3 4-5 7-5s5 4 7 4 4-2 7-4"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M3 12c2-3 4-5 7-5s5 4 7 4 4-2 7-4"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M3 24c2-3 4-5 7-5s5 4 7 4 4-2 7-4"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.3"
          />
        </svg>
        {sidebarOpen && <span className={styles.brandText}>FloodSense LK</span>}
      </div>

=======
    <aside className={styles.sidebar}>
>>>>>>> origin/main
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const active = activeNavItem === item.label;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${active ? styles.active : ''}`}
                  onClick={() => setActiveNavItem(item.label)}
                >
                  <Icon size={20} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={styles.spacer} />

        <Link
          href={SETTINGS_NAV.href}
          className={`${styles.navItem} ${activeNavItem === SETTINGS_NAV.label ? styles.active : ''}`}
          onClick={() => setActiveNavItem(SETTINGS_NAV.label)}
        >
          <Settings size={20} strokeWidth={1.8} />
          <span>{SETTINGS_NAV.label}</span>
        </Link>
      </nav>
    </aside>
  );
}
