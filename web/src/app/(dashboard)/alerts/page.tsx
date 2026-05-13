'use client';

import { FormEvent, useEffect, useState } from 'react';
import RiskBadge from '@/components/ui/RiskBadge';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import type { Alert, ApiResponse } from '@/lib/types';
import styles from './page.module.css';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showResolve, setShowResolve] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role !== 'admin' && !user.zone_id) return;
    api.alerts.list(undefined, user.zone_id).then((res) => {
      const d = res as ApiResponse<Alert[]>;
      setAlerts(d.data || []);
    }).catch(console.error);
  }, [isAuthenticated, user]);

  const filtered = alerts.filter((a) => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    return true;
  });

  const openResolve = () => {
    setResolveError(null);
    setResolutionNote('');
    setShowResolve(true);
  };

  const closeResolve = () => {
    setShowResolve(false);
    setResolveError(null);
  };

  const handleResolve = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;

    const note = resolutionNote.trim();
    if (!note) {
      setResolveError('Resolution note is required.');
      return;
    }

    setIsResolving(true);
    setResolveError(null);
    try {
      const res = await api.admin.alerts.resolve(selected.alert_id, { resolution_note: note });
      const resolvedAt = (res as any)?.data?.resolved_at || new Date().toISOString();
      setAlerts((prev) =>
        prev.map((a) =>
          a.alert_id === selected.alert_id
            ? { ...a, status: 'RESOLVED', resolved_at: resolvedAt }
            : a
        )
      );
      setSelected((prev) =>
        prev && prev.alert_id === selected.alert_id
          ? { ...prev, status: 'RESOLVED', resolved_at: resolvedAt }
          : prev
      );
      setShowResolve(false);
      setResolutionNote('');
    } catch (err) {
      console.error(err);
      setResolveError('Failed to resolve alert. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Alert Management</h1>
          <p className={styles.subtitle}>Monitor and manage emergency alerts across the monitored catchments.</p>
        </div>
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
            <RoleGate allowed={['admin']}>
              <div className={styles.detailActions}>
                <button
                  className={styles.resolveBtn}
                  onClick={openResolve}
                  disabled={selected.status !== 'ACTIVE'}
                >
                  Resolve Alert & Close Case
                </button>
              </div>
            </RoleGate>
          </div>
        )}
      </div>

      <Modal isOpen={showResolve} onClose={closeResolve} title="Resolve Alert" width="520px">
        <form className={styles.form} onSubmit={handleResolve}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Resolution Note</label>
            <textarea
              className={styles.formTextarea}
              rows={4}
              placeholder="Technician confirmed evacuation complete."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              required
            />
          </div>
          {resolveError && <p className={styles.formError}>{resolveError}</p>}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} type="button" onClick={closeResolve}>Cancel</button>
            <button className={styles.submitBtn} type="submit" disabled={isResolving}>
              {isResolving ? 'Resolving...' : 'Resolve Alert'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
