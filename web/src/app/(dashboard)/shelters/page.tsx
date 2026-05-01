'use client';

import { useState } from 'react';
import { Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { Zone, Shelter } from '@/lib/types';
import { useShelterStore } from '@/store/useShelterStore';
import { useZoneStore } from '@/store/useZoneStore';
import styles from './page.module.css';

export default function SheltersPage() {
  const shelters = useShelterStore(s => s.shelters);
  const addShelter = useShelterStore(s => s.addShelter);
  const updateShelter = useShelterStore(s => s.updateShelter);
  const removeShelter = useShelterStore(s => s.removeShelter);
  const zones = useZoneStore(s => s.zones);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', zone_id: '', capacity: '', contact_number: '', status: 'OPEN'
  });

  const totalCapacity = shelters.reduce((s, sh) => s + sh.capacity, 0);
  const fullCount = shelters.filter(s => s.status === 'FULL').length;
  const openCount = shelters.filter(s => s.status === 'OPEN' || !s.status).length;

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', zone_id: '', capacity: '', contact_number: '', status: 'OPEN' });
    setShowModal(true);
  };

  const handleOpenEdit = (shelter: Shelter) => {
    setEditingId(shelter.shelter_id);
    setFormData({
      name: shelter.name,
      zone_id: shelter.zone_id,
      capacity: shelter.capacity.toString(),
      contact_number: shelter.contact_number,
      status: shelter.status || 'OPEN'
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        zone_id: formData.zone_id,
        capacity: parseInt(formData.capacity),
        contact_number: formData.contact_number,
        status: formData.status as 'OPEN' | 'FULL',
        lat: 7.27,
        lng: 80.61,
      };

      if (editingId) {
        await api.shelters.update(editingId, payload);
        updateShelter(editingId, payload);
      } else {
        // mock id for local state
        const tempId = `SH-${Date.now().toString(36).toUpperCase()}`;
        await api.shelters.create(payload);
        addShelter({ ...payload, shelter_id: tempId } as Shelter);
      }
      setShowModal(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.shelters.delete(id);
      removeShelter(id);
      setActiveMenu(null);
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
          <button className={styles.addBtn} onClick={handleOpenCreate}><Plus size={16} /> Add New Shelter</button>
        </RoleGate>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Total Shelters" value={shelters.length} accentColor="var(--primary)" />
        <StatCard label="Open" value={openCount} accentColor="var(--risk-low)" />
        <StatCard label="Full" value={fullCount} accentColor="var(--risk-critical)" />
        <StatCard label="Total Capacity" value={totalCapacity.toLocaleString()} accentColor="var(--risk-watch)" />
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
                <td>{sh.capacity}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[`status${sh.status || 'OPEN'}`]}`}>
                    {sh.status || 'OPEN'}
                  </span>
                </td>
                <td className={styles.monoCell}>{sh.contact_number}</td>
                <td>
                  <RoleGate allowed={['admin']}>
                    <div style={{ position: 'relative' }}>
                      <button className={styles.menuBtn} onClick={() => setActiveMenu(activeMenu === sh.shelter_id ? null : sh.shelter_id)}>
                        <MoreVertical size={16} />
                      </button>
                      {activeMenu === sh.shelter_id && (
                        <div className={styles.dropdownMenu}>
                          <button onClick={() => handleOpenEdit(sh)}><Edit2 size={14} /> Edit Details</button>
                          <button className={styles.dangerText} onClick={() => handleDelete(sh.shelter_id)}><Trash2 size={14} /> Remove</button>
                        </div>
                      )}
                    </div>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Shelter' : 'Register New Shelter'}>
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
                {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Total Capacity</label>
              <input className={styles.formInput} type="number" placeholder="500" value={formData.capacity} onChange={(e) => setFormData(p => ({ ...p, capacity: e.target.value }))} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Status</label>
              <select className={styles.formSelect} value={formData.status} onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}>
                <option value="OPEN">OPEN</option>
                <option value="FULL">FULL</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Primary Contact Number</label>
              <input className={styles.formInput} placeholder="+94 XX XXX XXXX" value={formData.contact_number} onChange={(e) => setFormData(p => ({ ...p, contact_number: e.target.value }))} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button className={styles.submitBtn} onClick={handleSave}>{editingId ? 'Save Changes' : 'Register Shelter'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
