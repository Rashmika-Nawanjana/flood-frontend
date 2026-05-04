'use client';

import { useAuth } from '@clerk/nextjs';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import styles from './ProfileDropdown.module.css';

export default function ProfileDropdown({
  userName,
  userEmail,
  userRole,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '#EF4444'; // red
      case 'field_officer':
        return '#F97316'; // orange
      default:
        return '#6B7280'; // gray
    }
  };

  return (
    <div className={styles.profileDropdown} ref={dropdownRef}>
      <button
        className={styles.triggerButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <div className={styles.avatar}>
          {getInitials(userName)}
        </div>
        <div className={styles.userDetails}>
          <div className={styles.userName}>{userName}</div>
          <div className={styles.userEmail}>{userEmail}</div>
        </div>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {/* Profile Section */}
          <div className={styles.profileSection}>
            <div className={styles.largeAvatar}>
              {getInitials(userName)}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{userName}</div>
              <div className={styles.profileEmail}>{userEmail}</div>
              <div
                className={styles.roleBadge}
                style={{ background: getRoleBadgeColor(userRole) }}
              >
                {userRole || 'citizen'}
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Menu Items */}
          <button className={styles.menuItem} disabled>
            <User size={18} />
            <span>View Profile</span>
          </button>
          <button className={styles.menuItem} disabled>
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <div className={styles.divider} />

          {/* Logout */}
          <button
            className={`${styles.menuItem} ${styles.logoutItem}`}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
