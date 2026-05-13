'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useZoneStore } from '@/store/useZoneStore';
import {
  User,
  Mail,
  Shield,
  MapPin,
  Calendar,
  Radio,
  Bell,
  Activity,
} from 'lucide-react';
import styles from './page.module.css';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  field_officer: 'Field Officer',
  citizen: 'Citizen',
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444',
  field_officer: '#F97316',
  citizen: '#6B7280',
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  const zones = useZoneStore((s) => s.zones);

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading profile…</div>
      </div>
    );
  }

  const assignedZone = user.zone_id
    ? zones.find((z) => z.zone_id === user.zone_id)
    : null;

  const initials = user.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const roleColor = ROLE_COLORS[user.role] ?? '#6B7280';

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>Your account details and zone assignment</p>
      </div>

      <div className={styles.grid}>
        {/* Identity Card */}
        <div className={styles.card}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <div className={styles.name}>{user.name}</div>
              <div className={styles.email}>{user.email}</div>
              <span
                className={styles.roleBadge}
                style={{ background: roleColor }}
              >
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Account Information</h2>
          <div className={styles.fieldList}>
            <div className={styles.field}>
              <User size={16} className={styles.fieldIcon} />
              <div>
                <div className={styles.fieldLabel}>Full Name</div>
                <div className={styles.fieldValue}>{user.name}</div>
              </div>
            </div>
            <div className={styles.field}>
              <Mail size={16} className={styles.fieldIcon} />
              <div>
                <div className={styles.fieldLabel}>Email Address</div>
                <div className={styles.fieldValue}>{user.email}</div>
              </div>
            </div>
            <div className={styles.field}>
              <Shield size={16} className={styles.fieldIcon} />
              <div>
                <div className={styles.fieldLabel}>Role</div>
                <div className={styles.fieldValue}>{roleLabel}</div>
              </div>
            </div>
            <div className={styles.field}>
              <MapPin size={16} className={styles.fieldIcon} />
              <div>
                <div className={styles.fieldLabel}>Assigned Zone</div>
                <div className={styles.fieldValue}>
                  {assignedZone
                    ? `${assignedZone.zone_name} (${assignedZone.zone_id})`
                    : user.zone_id
                    ? user.zone_id
                    : user.role === 'admin'
                    ? 'All zones (Admin)'
                    : 'No zone assigned'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access & Permissions */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Access & Permissions</h2>
          <div className={styles.permissionList}>
            <PermissionRow
              label="View live sensor data"
              granted={true}
            />
            <PermissionRow
              label="View flood predictions"
              granted={true}
            />
            <PermissionRow
              label="View zone alerts"
              granted={true}
            />
            <PermissionRow
              label="Manage sensors & zones"
              granted={user.role === 'admin' || user.role === 'field_officer'}
            />
            <PermissionRow
              label="Resolve anomalies"
              granted={user.role === 'admin' || user.role === 'field_officer'}
            />
            <PermissionRow
              label="User management"
              granted={user.role === 'admin'}
            />
          </div>
        </div>

        {/* Zone Summary (only if assigned) */}
        {assignedZone && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Zone Overview</h2>
            <div className={styles.fieldList}>
              <div className={styles.field}>
                <MapPin size={16} className={styles.fieldIcon} />
                <div>
                  <div className={styles.fieldLabel}>Zone Name</div>
                  <div className={styles.fieldValue}>{assignedZone.zone_name}</div>
                </div>
              </div>
              <div className={styles.field}>
                <Activity size={16} className={styles.fieldIcon} />
                <div>
                  <div className={styles.fieldLabel}>Risk Level</div>
                  <div className={styles.fieldValue}>{assignedZone.risk_level ?? '—'}</div>
                </div>
              </div>
              <div className={styles.field}>
                <Radio size={16} className={styles.fieldIcon} />
                <div>
                  <div className={styles.fieldLabel}>Sensors in Zone</div>
                  <div className={styles.fieldValue}>
                    {assignedZone.sensors_in_zone?.length ?? 0}
                  </div>
                </div>
              </div>
              <div className={styles.field}>
                <Bell size={16} className={styles.fieldIcon} />
                <div>
                  <div className={styles.fieldLabel}>Active Alerts</div>
                  <div className={styles.fieldValue}>
                    {assignedZone.active_alerts ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PermissionRow({ label, granted }: { label: string; granted: boolean }) {
  return (
    <div className={styles.permissionRow}>
      <span
        className={styles.permissionDot}
        style={{ background: granted ? '#22C55E' : '#374151' }}
      />
      <span
        className={styles.permissionLabel}
        style={{ color: granted ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        {label}
      </span>
      <span
        className={styles.permissionStatus}
        style={{ color: granted ? '#22C55E' : 'var(--text-muted)' }}
      >
        {granted ? 'Granted' : 'Denied'}
      </span>
    </div>
  );
}
