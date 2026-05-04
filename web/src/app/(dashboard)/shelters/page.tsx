'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { Zone, Shelter, ApiResponse } from '@/lib/types';
import { useShelterStore } from '@/store/useShelterStore';
import styles from './page.module.css';

export default function SheltersPage() {
  const shelters = useShelterStore(s => s.shelters);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', zone_id: '', capacity: '', contact_number: '' });

  const totalCapacity = shelters.reduce((s, sh) => s + sh.capacity, 0);
  const totalOccupancy = shelters.reduce((s, sh) => s + (sh.current_occupancy || 0), 0);
  const fullCount = shelters.filter(s => s.status === 'FULL').length;
  const openCount = shelters.filter(s => s.status === 'OPEN' || !s.status).length;

  const handleCreate = async () => {
    try {
      await api.shelters.create({
        name: formData.name,
        zone_id: formData.zone_id,
        capacity: parseInt(formData.capacity),
        contact_number: formData.contact_number,
        lat: 7.27,
        lng: 80.61,
        status: 'OPEN',
      });
      setShowCreate(false);
      setFormData({ name: '', zone_id: '', capacity: '', contact_number: '' });
    } catch (e) { console.error(e); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Shelter Management</h1>
          <p className={styles.subtitle}>Strategic coordination of emergency housing and humanitarian resources</p>
        </div>
        <RoleGate allowed={['admin']}>
          <button className={styles.addBtn} onClick={() => setShowCreate(true)}><Plus size={16} /> Add New Shelter</button>
        </RoleGate>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Total Shelters" value={shelters.length} accentColor="var(--primary)" />
        <StatCard label="Open" value={openCount} accentColor="var(--risk-low)" />
        <StatCard label="Full" value={fullCount} accentColor="var(--risk-critical)" />
        <StatCard label="Total Capacity" value={totalCapacity.toLocaleString()} accentColor="var(--risk-watch)" />
      </div>

      <div className={styles.capacityBar}>
        <span className={styles.capacityLabel}>Overall Capacity: {totalOccupancy.toLocaleString()}/{totalCapacity.toLocaleString()}</span>
        <ProgressBar value={totalOccupancy} max={totalCapacity || 1} height={10} />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Shelter Name</th>
              <th>Zone</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shelters.map((sh) => (
              <tr key={sh.shelter_id} className={styles.row}>
                <td className={styles.monoCell}>{sh.shelter_id}</td>
                <td className={styles.shelterName}>{sh.name}</td>
                <td>{sh.zone_id}</td>
                <td>
                  <div className={styles.capacityCell}>
                    <ProgressBar value={sh.current_occupancy || 0} max={sh.capacity} height={4} showLabel={false} />
                    <span className={styles.capacityText}>{sh.current_occupancy || 0}/{sh.capacity}</span>
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[`status${sh.status || 'OPEN'}`]}`}>
                    {sh.status || 'OPEN'}
                  </span>
                </td>
                <td className={styles.monoCell}>{sh.contact_number}</td>
                <td>
                  <RoleGate allowed={['admin']}>
                    <button className={styles.menuBtn}>⋮</button>
                  </RoleGate>
                </td>
              </tr>
            ))}
            {shelters.length === 0 && (
              <tr><td colSpan={7} className={styles.empty}>No shelters registered</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Register New Shelter">
        <div className={styles.form}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Shelter Name</label>
            <input className={styles.formInput} placeholder="e.g. Community Center Annex" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Strategic Zone</label>
              <select className={styles.formSelect} value={formData.zone_id} onChange={(e) => setFormData(p => ({ ...p, zone_id: e.target.value }))}>
                <option value="">Select Zone</option>
                <option value="ZONE-K1">Central Zone</option>
                <option value="ZONE-K2">Western Zone</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Total Capacity</label>
              <input className={styles.formInput} type="number" placeholder="500" value={formData.capacity} onChange={(e) => setFormData(p => ({ ...p, capacity: e.target.value }))} />
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Primary Contact Number</label>
            <input className={styles.formInput} placeholder="+94 XX XXX XXXX" value={formData.contact_number} onChange={(e) => setFormData(p => ({ ...p, contact_number: e.target.value }))} />
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
            <button className={styles.submitBtn} onClick={handleCreate}>Register</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
