'use client';

import { useState, useEffect } from 'react';
import StatCard from '@/components/ui/StatCard';
import RiskBadge from '@/components/ui/RiskBadge';
import RoleGate from '@/components/auth/RoleGate';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { ANOMALY_TYPES } from '@/lib/constants';
import type { Anomaly, ApiResponse } from '@/lib/types';
import styles from './page.module.css';

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role !== 'admin' && !user.zone_id) return;
    api.anomalies.list(undefined, user.zone_id).then((res) => {
      const d = res as ApiResponse<Anomaly[]>;
      setAnomalies(d.data || []);
    }).catch(console.error);
  }, [isAuthenticated, user]);

  const unresolved = anomalies.filter(a => a.status === 'UNRESOLVED').length;
  const autoAlerted = anomalies.filter(a => a.auto_alert_triggered).length;

  const filtered = anomalies.filter(a => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const handleResolve = async (id: string, resolution: string) => {
    try {
      await api.anomalies.resolve(id, { status: 'RESOLVED', resolution_note: resolution, resolved_by: 'ADMIN' });
      setAnomalies(prev => prev.map(a => a.anomaly_id === id ? { ...a, status: 'RESOLVED' as const } : a));
    } catch (e) { console.error(e); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Anomaly Detection</h1>
          <p className={styles.subtitle}>ML-powered anomaly detection using Z-Score and Isolation Forest algorithms</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Total Anomalies (24H)" value={anomalies.length} accentColor="var(--risk-warning)" />
        <StatCard label="Unresolved" value={unresolved} accentColor="var(--risk-critical)" />
        <StatCard label="Auto-Alert Triggered" value={autoAlerted} accentColor="var(--primary)" />
      </div>

      <div className={styles.filters}>
        <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="UNRESOLVED">Unresolved</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Anomaly ID</th>
              <th>Sensor</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Score</th>
              <th>Status</th>
              <th>Detected At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <>
                <tr key={a.anomaly_id} className={styles.row} onClick={() => setExpanded(expanded === a.anomaly_id ? null : a.anomaly_id)}>
                  <td className={styles.monoCell}>{a.anomaly_id}</td>
                  <td>{a.sensor_id}</td>
                  <td>{ANOMALY_TYPES[a.type] || a.type}</td>
                  <td><RiskBadge level={a.severity} /></td>
                  <td className={styles.monoCell}>{a.anomaly_score}</td>
                  <td><span className={`${styles.statusBadge} ${styles[`status${a.status}`]}`}>{a.status}</span></td>
                  <td className={styles.monoCell}>{new Date(a.detected_at).toLocaleString()}</td>
                  <td className={styles.expandIcon}>{expanded === a.anomaly_id ? '∧' : '∨'}</td>
                </tr>
                {expanded === a.anomaly_id && (
                  <tr key={`${a.anomaly_id}-detail`}>
                    <td colSpan={8} className={styles.expandedRow}>
                      <div className={styles.expandedContent}>
                        <div className={styles.expandedLeft}>
                          <h4 className={styles.expandedTitle}>Detailed Analysis</h4>
                          <p className={styles.expandedDesc}>{a.description}</p>
                          <RoleGate allowed={['admin', 'officer']}>
                            <div className={styles.expandedActions}>
                              <button className={styles.resolveBtn} onClick={() => handleResolve(a.anomaly_id, 'Issue resolved')}>Mark as Resolved</button>
                              <button className={styles.actionBtn} onClick={() => handleResolve(a.anomaly_id, 'False alarm')}>False Alarm</button>
                              <button className={styles.actionBtn}>Dispatch Technician</button>
                            </div>
                          </RoleGate>
                        </div>
                        <div className={styles.expandedRight}>
                          <h4 className={styles.expandedTitle}>Reading Deviation</h4>
                          <div className={styles.deviationRow}>
                            <span>Expected Range</span>
                            <span className={styles.deviationValues}>{a.expected_range.min_m}m - {a.expected_range.max_m}m</span>
                          </div>
                          <div className={styles.deviationRow}>
                            <span>Detected Value</span>
                            <span className={styles.deviationDetected}>{a.reading_at_detection.water_level_m}m</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
