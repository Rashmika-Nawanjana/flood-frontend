'use client';

import { Bell, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProfileDropdown from './ProfileDropdown';
import styles from './Topbar.module.css';
import { useAuthStore } from '@/store/useAuthStore';

export default function Topbar() {
  const [isMounted, setIsMounted] = useState(false);
  const user = useAuthStore((state) => state.user);

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
        </div>

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
            <div className={styles.avatar}>--</div>
            <span className={styles.userName}>Loading...</span>
          </div>
        </div>
      </header>
    );
  }

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
      </div>

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
