'use client';
 
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProfileDropdown from './ProfileDropdown';
import styles from './Topbar.module.css';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

export default function Topbar() {
  const [isMounted, setIsMounted] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { isSidebarCollapsed, toggleSidebarCollapse } = useUIStore();
 
  useEffect(() => {
    setIsMounted(true);
  }, []);
 
  if (!isMounted) {
    return (
      <header className={styles.topbar}>
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
          <span className={styles.brandText}>FloodSense LK</span>
          <button className={styles.menuToggle} aria-label="Toggle Sidebar">
            <Menu size={20} />
          </button>
        </div>
 

 
        <div className={styles.actions}>

 
          <div className={styles.userInfo}>
            <div className={styles.avatar}>--</div>
            <span className={styles.userName}>Loading...</span>
          </div>
        </div>
      </header>
    );
  }
 
  return (
    <header className={`${styles.topbar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
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
        <span className={styles.brandText}>FloodSense LK</span>
        <button 
          className={styles.menuToggle} 
          onClick={toggleSidebarCollapse}
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
      </div>
 

 
      <div className={styles.actions}>

 
        {user ? (
          <ProfileDropdown
            userName={user.name}
            userEmail={user.email}
            userRole={user.role}
          />
        ) : (
          <div className={styles.userInfo}>
            <div className={styles.avatar}>--</div>
            <span className={styles.userName}>Guest</span>
          </div>
        )}
      </div>
    </header>
  );
}
