'use client';

import React, { useState, useEffect } from 'react';
import StatCard from '@/components/ui/StatCard';
import RiskBadge from '@/components/ui/RiskBadge';
import RoleGate from '@/components/auth/RoleGate';
import { useAuthStore } from '@/store/useAuthStore';
import { useAnomalyStore } from '@/store/useAnomalyStore';
import { api } from '@/lib/api';
import { ANOMALY_TYPES } from '@/lib/constants';
import type { Anomaly, ApiResponse } from '@/lib/types';
import styles from './page.module.css';

export default function AnomaliesPage() {
  const { anomalies, setAnomalies, resolveAnomaly } = useAnomalyStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resolutionForm, setResolutionForm] = useState<{ id: string; status: 'RESOLVED' | 'FALSE_ALARM'; note: string; by: string; } | null>(null);

  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // TEMPORARY DEBUG: Print the user's Clerk token and backend role info
    api.auth.me().then(res => console.log('BACKEND ROLE DATA:', res)).catch(console.error);
    
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

  const submitResolution = async () => {
    if (!resolutionForm) return;
    try {
      await api.anomalies.resolve(resolutionForm.id, { 
        status: resolutionForm.status, 
        resolution_note: resolutionForm.note, 
        resolved_by: user?.name || 'ADMIN'
      });
      resolveAnomaly(resolutionForm.id, resolutionForm.status);
      setResolutionForm(null);
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
              <React.Fragment key={a.anomaly_id}>
                <tr className={styles.row} onClick={() => setExpanded(expanded === a.anomaly_id ? null : a.anomaly_id)}>
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
                          <p className={styles.expandedDesc}>{a.description || 'No description available.'}</p>
                          <RoleGate allowed={['admin', 'field_officer']}>
                            {resolutionForm?.id === a.anomaly_id ? (
                              <div className={styles.resolutionFormContainer}>
                                <textarea 
                                  placeholder="Resolution Note" 
                                  value={resolutionForm.note}
                                  onChange={e => setResolutionForm({ ...resolutionForm, note: e.target.value })}
                                  className={styles.textareaField}
                                  rows={3}
                                />
                                <div className={styles.formActions}>
                                  <button className={styles.submitBtn} onClick={submitResolution}>Submit</button>
                                  <button className={styles.cancelBtn} onClick={() => setResolutionForm(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className={styles.expandedActions}>
                                <button className={styles.resolveBtn} onClick={() => setResolutionForm({ id: a.anomaly_id, status: 'RESOLVED', note: '', by: user?.name || '' })}>Mark as Resolved</button>
                                <button className={styles.actionBtn} onClick={() => setResolutionForm({ id: a.anomaly_id, status: 'FALSE_ALARM', note: '', by: user?.name || '' })}>False Alarm</button>
                              </div>
                            )}
                          </RoleGate>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
