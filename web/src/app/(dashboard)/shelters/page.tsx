'use client';
import React, { useState } from 'react';
import { Plus, MoreVertical, Edit2, Trash2, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    zone_id: '',
    capacity: '',
    current_occupancy: '0',
    contact_number: '',
    status: 'OPEN',
    lat: '',
    lng: ''
  });

  const totalCapacity = shelters.reduce((s, sh) => s + sh.capacity, 0);
  const fullCount = shelters.filter(s => s.status === 'FULL').length;
  const openCount = shelters.filter(s => s.status === 'OPEN' || !s.status).length;

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      zone_id: '',
      capacity: '',
      current_occupancy: '0',
      contact_number: '',
      status: 'OPEN',
      lat: '',
      lng: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (shelter: Shelter) => {
    setEditingId(shelter.shelter_id);
    setFormData({
      name: shelter.name,
      zone_id: shelter.zone_id || '',
      capacity: shelter.capacity.toString(),
      current_occupancy: (shelter.current_occupancy || 0).toString(),
      contact_number: shelter.contact_number,
      status: shelter.status || 'OPEN',
      lat: (shelter.lat || 0).toString(),
      lng: (shelter.lng || 0).toString()
    });
    setShowModal(true);
    setExpandedId(null);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const patchPayload = {
          current_occupancy: parseInt(formData.current_occupancy) || 0,
          status: formData.status as 'OPEN' | 'FULL',
        };
        await api.shelters.update(editingId, patchPayload);
        updateShelter(editingId, patchPayload);
      } else {
        const postPayload = {
          name: formData.name,
          zone_id: formData.zone_id,
          capacity: parseInt(formData.capacity) || 0,
          current_occupancy: parseInt(formData.current_occupancy) || 0,
          contact_number: formData.contact_number,
          status: formData.status as 'OPEN' | 'FULL',
          lat: parseFloat(formData.lat) || 0,
          lng: parseFloat(formData.lng) || 0,
        };
        const res: any = await api.shelters.create(postPayload);
        // Use ID from response if available, otherwise fallback to tempId
        const newId = res?.data?.shelter_id || `SH-${Date.now().toString(36).toUpperCase()}`;
        addShelter({ ...postPayload, shelter_id: newId } as Shelter);
      }
      setShowModal(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this shelter?')) return;
    try {
      await api.shelters.remove(id);
      removeShelter(id);
      setExpandedId(null);
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
              <React.Fragment key={sh.shelter_id}>
                <tr className={`${styles.row} ${expandedId === sh.shelter_id ? styles.expanded : ''}`} onClick={() => setExpandedId(expandedId === sh.shelter_id ? null : sh.shelter_id)}>
                  <td className={styles.monoCell}>{sh.shelter_id}</td>
                  <td className={styles.shelterName}>{sh.name}</td>
                  <td>{sh.zone_id}</td>
                  <td>{sh.capacity}</td>
                  <td>
                    <div className={styles.statusCell}>
                      <ProgressBar value={sh.current_occupancy || 0} max={sh.capacity} showLabel={false} height={6} />
                      <div className={styles.statusInfo}>
                        <span className={`${styles.statusBadge} ${styles[`status${sh.status || 'OPEN'}`]}`}>
                          {sh.status || 'OPEN'}
                        </span>
                        <span className={styles.occupancyText}>
                          {sh.current_occupancy || 0} / {sh.capacity}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.monoCell}>{sh.contact_number}</td>
                  <td>
                    <RoleGate allowed={['admin']}>
                      <button className={styles.menuBtn}>
                        <MoreVertical size={16} />
                      </button>
                    </RoleGate>
                  </td>
                </tr>
                {expandedId === sh.shelter_id && (
                  <tr className={styles.expandedRow}>
                    <td colSpan={7}>
                      <div className={styles.expandedContent}>
                        <div className={styles.expandedActions}>
                          <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); handleOpenEdit(sh); }}>
                            <Edit2 size={14} /> Edit Details
                          </button>
                          <button className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); handleDelete(sh.shelter_id); }}>
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                        <div className={styles.expandedInfo}>
                          <MapPin size={14} /> <span>Location: {sh.lat}, {sh.lng}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {shelters.length === 0 && (
              <tr><td colSpan={7} className={styles.empty}>No shelters registered</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Shelter' : 'Register New Shelter'}>
        <div className={styles.form}>
          {editingId ? (
            /* Edit Mode: Only Occupancy and Status */
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Current Occupancy</label>
                <div style={{ position: 'relative' }}>
                  <Users size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className={styles.formInput} style={{ paddingLeft: '36px' }} type="number" placeholder="0" value={formData.current_occupancy} onChange={(e) => setFormData(p => ({ ...p, current_occupancy: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Status</label>
                <select className={styles.formSelect} value={formData.status} onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}>
                  <option value="OPEN">OPEN</option>
                  <option value="FULL">FULL</option>
                </select>
              </div>
            </div>
          ) : (
            /* Create Mode: Full Details */
            <>
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
                  <label className={styles.formLabel}>Latitude</label>
                  <input className={styles.formInput} type="number" step="any" placeholder="7.2715" value={formData.lat} onChange={(e) => setFormData(p => ({ ...p, lat: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Longitude</label>
                  <input className={styles.formInput} type="number" step="any" placeholder="80.6125" value={formData.lng} onChange={(e) => setFormData(p => ({ ...p, lng: e.target.value }))} />
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
                  <label className={styles.formLabel}>Primary Contact</label>
                  <input className={styles.formInput} placeholder="+94 XX XXX XXXX" value={formData.contact_number} onChange={(e) => setFormData(p => ({ ...p, contact_number: e.target.value }))} />
                </div>
              </div>
            </>
          )}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button className={styles.submitBtn} onClick={handleSave}>{editingId ? 'Save Changes' : 'Register Shelter'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
