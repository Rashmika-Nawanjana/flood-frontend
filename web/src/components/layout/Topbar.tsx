'use client';

<<<<<<< HEAD
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
=======
import { Bell, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProfileDropdown from './ProfileDropdown';
import styles from './Topbar.module.css';
import { useAuthStore } from '@/store/useAuthStore';

export default function Topbar() {
  const [isMounted, setIsMounted] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';

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
    <>
      {isStaging && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '24px',
            background: 'linear-gradient(90deg, #FF6B00 0%, #F97316 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            zIndex: 999,
          }}
        >
          🧪 STAGING ENVIRONMENT
        </div>
      )}
      <header className={styles.topbar} style={isStaging ? { top: '24px' } : {}}>
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
    </>
>>>>>>> origin/main
  );
}
