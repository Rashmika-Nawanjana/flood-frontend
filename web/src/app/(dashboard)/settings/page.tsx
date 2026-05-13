'use client';

import { useAuthStore } from '@/store/useAuthStore';
import {
  Bell,
  Monitor,
  Shield,
  Info,
} from 'lucide-react';
import styles from './page.module.css';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Application preferences and account configuration</p>
      </div>

      <div className={styles.sections}>

        {/* Notifications */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Bell size={18} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Notifications</h2>
          </div>
          <div className={styles.settingsList}>
            <ToggleSetting
              label="Alert notifications"
              description="Receive in-app notifications when new flood alerts are triggered"
              defaultOn={true}
            />
            <ToggleSetting
              label="Sensor offline warnings"
              description="Get notified when a sensor in your zone goes offline"
              defaultOn={true}
            />
            <ToggleSetting
              label="Prediction updates"
              description="Show a notification when new ML predictions are published"
              defaultOn={false}
            />
            <ToggleSetting
              label="Anomaly alerts"
              description="Be alerted when a statistical anomaly is detected"
              defaultOn={user?.role !== 'citizen'}
            />
          </div>
        </section>

        {/* Display */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Monitor size={18} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Display</h2>
          </div>
          <div className={styles.settingsList}>
            <ToggleSetting
              label="Compact sidebar"
              description="Collapse sidebar to icon-only mode by default"
              defaultOn={false}
            />
            <ToggleSetting
              label="Animate risk badges"
              description="Pulse animation on CRITICAL and EMERGENCY risk levels"
              defaultOn={true}
            />
            <SelectSetting
              label="Map default zoom"
              description="Starting zoom level when opening the Live Map"
              options={['Country (8)', 'Region (10)', 'City (12)', 'Street (14)']}
              defaultValue="Region (10)"
            />
            <SelectSetting
              label="Data refresh interval"
              description="How often sensor readings are polled from the API"
              options={['15 seconds', '30 seconds', '1 minute', '5 minutes']}
              defaultValue="30 seconds"
            />
          </div>
        </section>

        {/* Security */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield size={18} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Security</h2>
          </div>
          <div className={styles.settingsList}>
            <InfoRow
              label="Authentication provider"
              value="Clerk (SSO)"
            />
            <InfoRow
              label="Session token"
              value="RS256 signed JWT"
            />
            <InfoRow
              label="Role"
              value={
                user?.role === 'admin'
                  ? 'Administrator'
                  : user?.role === 'field_officer'
                  ? 'Field Officer'
                  : 'Citizen'
              }
            />
            <InfoRow
              label="Zone access"
              value={
                user?.role === 'admin'
                  ? 'All zones'
                  : user?.zone_id
                  ? user.zone_id
                  : 'No zone assigned'
              }
            />
          </div>
          <p className={styles.note}>
            To change your password or email, visit your account settings in the Clerk dashboard.
            Contact an administrator to change your role or zone assignment.
          </p>
        </section>

        {/* About */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Info size={18} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>About</h2>
          </div>
          <div className={styles.settingsList}>
            <InfoRow label="Application" value="FloodSense LK — Intelligence Portal" />
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="API gateway" value="Kong 3.4" />
            <InfoRow label="ML model" value="XGBoost (multi-horizon)" />
            <InfoRow label="Real-time" value="Socket.IO over WebSocket" />
          </div>
        </section>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function ToggleSetting({
  label,
  description,
  defaultOn,
}: {
  label: string;
  description: string;
  defaultOn: boolean;
}) {
  return (
    <div className={styles.settingRow}>
      <div className={styles.settingText}>
        <div className={styles.settingLabel}>{label}</div>
        <div className={styles.settingDescription}>{description}</div>
      </div>
      <label className={styles.toggle}>
        <input type="checkbox" defaultChecked={defaultOn} />
        <span className={styles.slider} />
      </label>
    </div>
  );
}

function SelectSetting({
  label,
  description,
  options,
  defaultValue,
}: {
  label: string;
  description: string;
  options: string[];
  defaultValue: string;
}) {
  return (
    <div className={styles.settingRow}>
      <div className={styles.settingText}>
        <div className={styles.settingLabel}>{label}</div>
        <div className={styles.settingDescription}>{description}</div>
      </div>
      <select className={styles.select} defaultValue={defaultValue}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}
