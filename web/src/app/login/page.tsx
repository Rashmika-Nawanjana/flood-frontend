'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/types';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleKeycloakLogin = () => {
    // TODO: When Group A4 provides Keycloak, replace with:
    // signIn('keycloak', { callbackUrl: '/' });
    alert('Keycloak SSO not yet configured. Use Dev Login below.');
  };

  const setUser = useAuthStore(state => state.setUser);

  const handleDevLogin = () => {
    setIsLoading(true);
    setUser({
      id: 'dev-001',
      name: selectedRole === 'admin' ? 'Admin User' : 'Field Officer',
      email: `${selectedRole}@floodsense.lk`,
      role: selectedRole,
    });
    // Add small delay for visual feedback before redirect
    setTimeout(() => router.push('/'), 500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.heroSide}>
        <div className={styles.heroContent}>
          <svg width="56" height="56" viewBox="0 0 28 28" fill="none" className={styles.heroIcon}>
            <path d="M3 18c2-3 4-5 7-5s5 4 7 4 4-2 7-4" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M3 12c2-3 4-5 7-5s5 4 7 4 4-2 7-4" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
            <path d="M3 24c2-3 4-5 7-5s5 4 7 4 4-2 7-4" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
          </svg>
          <h1 className={styles.heroTitle}>FloodSense LK</h1>
          <p className={styles.heroSubtitle}>Intelligence Portal</p>
          <p className={styles.heroDesc}>
            Real-time flood monitoring, AI-powered predictions, and
            emergency response management for Sri Lanka&apos;s river basins.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>52</span>
              <span className={styles.heroStatLabel}>Sensors</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>8</span>
              <span className={styles.heroStatLabel}>Zones</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>24/7</span>
              <span className={styles.heroStatLabel}>Monitoring</span>
            </div>
          </div>
        </div>
        <div className={styles.heroGradient} />
      </div>

      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Sign In</h2>
          <p className={styles.formSubtitle}>Access the FloodSense Intelligence Portal</p>

          <button className={styles.ssoButton} onClick={handleKeycloakLogin}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect width="20" height="20" rx="4" fill="#4D4D4D"/>
              <path d="M10 4l4 3v6l-4 3-4-3V7l4-3z" fill="#3B82F6" opacity="0.8"/>
            </svg>
            Sign in with FloodSense SSO
          </button>

          <div className={styles.divider}>
            <span>Development Access</span>
          </div>

          <div className={styles.roleSelector}>
            <label className={styles.roleLabel}>Select Role</label>
            <div className={styles.roleOptions}>
              <button
                className={`${styles.roleOption} ${selectedRole === 'admin' ? styles.roleActive : ''}`}
                onClick={() => setSelectedRole('admin')}
              >
                <span className={styles.roleIcon}>🛡️</span>
                <span className={styles.roleName}>Admin</span>
                <span className={styles.roleDesc}>Full system access</span>
              </button>
              <button
                className={`${styles.roleOption} ${selectedRole === 'officer' ? styles.roleActive : ''}`}
                onClick={() => setSelectedRole('officer')}
              >
                <span className={styles.roleIcon}>📋</span>
                <span className={styles.roleName}>Officer</span>
                <span className={styles.roleDesc}>Monitoring & response</span>
              </button>
            </div>
          </div>

          <button
            className={styles.devLoginBtn}
            onClick={handleDevLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : `Dev Login as ${selectedRole}`}
          </button>

          <p className={styles.disclaimer}>
            Dev login bypasses Keycloak authentication.
            For production, use the SSO button above.
          </p>
        </div>
      </div>
    </div>
  );
}
