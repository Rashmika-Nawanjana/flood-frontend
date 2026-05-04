'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import styles from './Topbar.module.css';

export default function Topbar() {
  const { toggleSidebar, sidebarOpen } = useUIStore();

  return (
    <header className={styles.topbar}>
      <button 
        className={styles.toggleButton} 
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        <Menu size={20} />
      </button>

      <div className={styles.searchContainer}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search systems..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.iconButton} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.notifDot} />
        </button>

        <div className={styles.userInfo}>
          <div className={styles.avatar}>YA</div>
          <span className={styles.userName}>Admin</span>
        </div>
      </div>
    </header>
  );
}
