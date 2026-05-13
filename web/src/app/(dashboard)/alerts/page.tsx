'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import RiskBadge from '@/components/ui/RiskBadge';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { useZoneStore } from '@/store/useZoneStore';
import { api } from '@/lib/api';
import type { Alert, ApiResponse } from '@/lib/types';
import styles from './page.module.css';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    zone_id: '',
    severity: 'WARNING',
    title: '',
    message: '',
    affected_population: '',
    recommended_action: 'EVACUATE',
  });
  const [showResolve, setShowResolve] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const zones = useZoneStore((s) => s.zones);

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

  const openCreate = () => {
    setCreateError(null);
    setCreateForm({
      zone_id: '',
      severity: 'WARNING',
      title: '',
      message: '',
      affected_population: '',
      recommended_action: 'EVACUATE',
    });
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setCreateError(null);
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const population = Number(createForm.affected_population);
    if (!createForm.zone_id.trim()) {
      setCreateError('Zone selection is required.');
      return;
    }

    const selectedZone = zones.find((z) => z.zone_id === createForm.zone_id.trim());
    if (!selectedZone) {
      setCreateError('Selected zone is not available.');
      return;
    }
    if (!createForm.title.trim() || !createForm.message.trim()) {
      setCreateError('Title and message are required.');
      return;
    }
    if (!Number.isFinite(population) || population < 0) {
      setCreateError('Affected population must be a valid number.');
      return;
    }

    const severity = createForm.severity as Alert['severity'];
    const severityCode = {
      LOW: 1,
      WARNING: 2,
      HIGH: 3,
      CRITICAL: 4,
      EMERGENCY: 5,
    }[severity] || 0;
    const timestamp = new Date().toISOString();
    const newAlert: Alert = {
      alert_id: `UI-${Date.now()}`,
      zone_id: createForm.zone_id.trim(),
      zone_name: selectedZone.zone_name || selectedZone.zone_id,
      severity,
      severity_code: severityCode,
      title: createForm.title.trim(),
      message: createForm.message.trim(),
      triggered_at: timestamp,
      triggered_by: 'MANUAL_ADMIN',
      status: 'ACTIVE',
      resolved_at: null,
      affected_population: population,
      recommended_action: createForm.recommended_action.trim() || 'EVACUATE',
      notifications_sent: { push: 0, sms: 0, email: 0 },
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setSelected(newAlert);
    setShowCreate(false);
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
        <RoleGate allowed={['admin']}>
          <button className={styles.createBtn} onClick={openCreate}><Plus size={16} /> Create Alert</button>
        </RoleGate>
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

      <Modal isOpen={showCreate} onClose={closeCreate} title="Create Alert" width="640px">
        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Zone ID</label>
              <select
                className={styles.formSelect}
                value={createForm.zone_id}
                onChange={(e) => setCreateForm((p) => ({ ...p, zone_id: e.target.value }))}
                required
              >
                <option value="">Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.zone_id} value={zone.zone_id}>
                    {zone.zone_name || zone.zone_id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Severity</label>
              <select
                className={styles.formSelect}
                value={createForm.severity}
                onChange={(e) => setCreateForm((p) => ({ ...p, severity: e.target.value }))}
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="WARNING">WARNING</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Affected Population</label>
              <input
                className={styles.formInput}
                type="number"
                min="0"
                placeholder="12500"
                value={createForm.affected_population}
                onChange={(e) => setCreateForm((p) => ({ ...p, affected_population: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Title</label>
            <input
              className={styles.formInput}
              placeholder="Evacuation Warning: Getambe Lowlands"
              value={createForm.title}
              onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Message</label>
            <textarea
              className={styles.formTextarea}
              rows={4}
              placeholder="Water levels are rising rapidly. Please evacuate to the nearest designated shelter immediately."
              value={createForm.message}
              onChange={(e) => setCreateForm((p) => ({ ...p, message: e.target.value }))}
              required
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Recommended Action</label>
            <input
              className={styles.formInput}
              placeholder="EVACUATE"
              value={createForm.recommended_action}
              onChange={(e) => setCreateForm((p) => ({ ...p, recommended_action: e.target.value }))}
            />
          </div>
          {createError && <p className={styles.formError}>{createError}</p>}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} type="button" onClick={closeCreate}>Cancel</button>
            <button className={styles.submitBtn} type="submit">Create Alert</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
