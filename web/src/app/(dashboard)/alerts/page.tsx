'use client';

<<<<<<< HEAD
import { useState } from 'react';
import RiskBadge from '@/components/ui/RiskBadge';
import RoleGate from '@/components/auth/RoleGate';
import { useAlertStore } from '@/store/useAlertStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import type { Alert } from '@/lib/types';
import styles from './page.module.css';

export default function AlertsPage() {
  const user = useAuthStore(s => s.user);
  const alerts = useAlertStore(s => s.alerts);
  const resolveAlertStore = useAlertStore(s => s.resolveAlert);
=======
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import RiskBadge from '@/components/ui/RiskBadge';
import RoleGate from '@/components/auth/RoleGate';
import { api } from '@/lib/api';
import type { Alert, ApiResponse } from '@/lib/types';
import styles from './page.module.css';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
>>>>>>> origin/main
  const [selected, setSelected] = useState<Alert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

<<<<<<< HEAD
=======
  useEffect(() => {
    api.alerts.list().then((res) => {
      const d = res as ApiResponse<Alert[]>;
      setAlerts(d.data || []);
    }).catch(console.error);
  }, []);

>>>>>>> origin/main
  const filtered = alerts.filter((a) => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    return true;
  });

<<<<<<< HEAD
  const handleResolve = async () => {
    if (!selected) return;
    try {
      await api.alerts.resolve(selected.alert_id, {
        status: 'RESOLVED',
        resolution_note: 'Resolved via dashboard',
        resolved_by: user?.role.toUpperCase() || 'UNKNOWN'
      });
      resolveAlertStore(selected.alert_id, {
        resolved_at: new Date().toISOString(),
        resolution_note: 'Resolved via dashboard'
      });
      setSelected(null);
    } catch (e) {
      console.error('Alert resolution error:', e);
    }
  };

=======
>>>>>>> origin/main
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Alert Management</h1>
          <p className={styles.subtitle}>Monitor and manage emergency alerts across the monitored catchments.</p>
        </div>
<<<<<<< HEAD
=======
        <RoleGate allowed={['admin']}>
          <button className={styles.createBtn}><Plus size={16} /> Create Alert</button>
        </RoleGate>
>>>>>>> origin/main
      </div>

      <div className={styles.filters}>
        <select className={styles.select} value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
          <option value="ALL">Severity: All</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="WARNING">Warning</option>
          <option value="LOW">Low</option>
        </select>
        <select className={styles.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="ALL">Status: All</option>
          <option value="ACTIVE">Active</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <div className={styles.content}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Zone</th>
                <th>Severity</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert) => (
                <tr key={alert.alert_id} className={`${styles.row} ${selected?.alert_id === alert.alert_id ? styles.rowSelected : ''}`} onClick={() => setSelected(alert)}>
                  <td className={styles.monoCell}>{alert.alert_id}</td>
                  <td>{alert.zone_name}</td>
                  <td><RiskBadge level={alert.severity} /></td>
                  <td className={styles.monoCell}>{new Date(alert.triggered_at).toLocaleString()}</td>
                  <td><span className={`${styles.statusBadge} ${styles[`status${alert.status}`]}`}>{alert.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>No alerts found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <RiskBadge level={selected.severity} size="md" />
              <h3 className={styles.detailTitle}>{selected.title}</h3>
              <span className={styles.detailMeta}>{selected.alert_id} • {new Date(selected.triggered_at).toLocaleString()}</span>
            </div>
            <p className={styles.detailMessage}>{selected.message}</p>
            <div className={styles.detailGrid}>
              <div className={styles.detailStat}>
                <span className={styles.detailLabel}>Impact Population</span>
                <span className={styles.detailValue}>{selected.affected_population?.toLocaleString()}</span>
              </div>
              <div className={styles.detailStat}>
                <span className={styles.detailLabel}>Source</span>
                <span className={styles.detailValue}>{selected.triggered_by}</span>
              </div>
              <div className={styles.detailStat}>
                <span className={styles.detailLabel}>Action</span>
                <span className={styles.detailValue}>{selected.recommended_action}</span>
              </div>
            </div>
<<<<<<< HEAD
            <RoleGate allowed={['admin', 'officer']}>
              <div className={styles.detailActions}>
                <button 
                  className={styles.resolveBtn} 
                  onClick={handleResolve}
                  disabled={selected.status === 'RESOLVED'}
                >
                  {selected.status === 'RESOLVED' ? 'Alert Resolved' : 'Resolve Alert & Close Case'}
                </button>
=======
            <RoleGate allowed={['admin']}>
              <div className={styles.detailActions}>
                <button className={styles.resolveBtn}>Resolve Alert & Close Case</button>
>>>>>>> origin/main
              </div>
            </RoleGate>
          </div>
        )}
      </div>
    </div>
  );
}
