'use client';

import { FormEvent, useState } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import RoleGate from '@/components/auth/RoleGate';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { ApiResponse, Shelter } from '@/lib/types';
import { useShelterStore } from '@/store/useShelterStore';
import { useZoneStore } from '@/store/useZoneStore';
import styles from './page.module.css';

type ShelterFormData = {
  zone_id: string;
  name: string;
  lat: string;
  lng: string;
  capacity: string;
  contact_number: string;
  status: NonNullable<Shelter['status']>;
};

const initialFormData: ShelterFormData = {
  zone_id: 'ZONE-K1',
  name: 'Getambe Temple Hall',
  lat: '7.2715',
  lng: '80.6125',
  capacity: '400',
  contact_number: '+94812222222',
  status: 'OPEN',
};

export default function SheltersPage() {
  const shelters = useShelterStore((s) => s.shelters);
  const addShelter = useShelterStore((s) => s.addShelter);
  const zones = useZoneStore((s) => s.zones);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<ShelterFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalCapacity = shelters.reduce((s, sh) => s + sh.capacity, 0);
  const totalOccupancy = shelters.reduce((s, sh) => s + (sh.current_occupancy || 0), 0);
  const fullCount = shelters.filter((s) => s.status === 'FULL').length;
  const openCount = shelters.filter((s) => s.status === 'OPEN' || !s.status).length;

  const closeCreateForm = () => {
    setShowCreate(false);
    setFormError(null);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      zone_id: formData.zone_id.trim(),
      name: formData.name.trim(),
      lat: Number(formData.lat),
      lng: Number(formData.lng),
      capacity: Number(formData.capacity),
      contact_number: formData.contact_number.trim(),
      status: formData.status,
    };

    if (!payload.zone_id || !payload.name || !payload.contact_number) {
      setFormError('Zone, shelter name, and contact number are required.');
      setIsSubmitting(false);
      return;
    }

    if (!Number.isFinite(payload.lat) || !Number.isFinite(payload.lng) || !Number.isFinite(payload.capacity)) {
      setFormError('Latitude, longitude, and capacity must be valid numbers.');
      setIsSubmitting(false);
      return;
    }

    if (payload.capacity <= 0) {
      setFormError('Capacity must be greater than zero.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = (await api.shelters.create(payload)) as ApiResponse<Shelter> | Shelter;
      const createdShelter = 'data' in res ? res.data : res;
      addShelter(createdShelter);
      setShowCreate(false);
      setFormData(initialFormData);
    } catch (e) {
      console.error(e);
      setFormError('Failed to register shelter. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Shelter Management</h1>
          <p className={styles.subtitle}>Strategic coordination of emergency housing and humanitarian resources</p>
        </div>
        <RoleGate allowed={['admin']}>
          <button className={styles.addBtn} onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add New Shelter
          </button>
        </RoleGate>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Total Shelters" value={shelters.length} accentColor="var(--primary)" />
        <StatCard label="Open" value={openCount} accentColor="var(--risk-low)" />
        <StatCard label="Full" value={fullCount} accentColor="var(--risk-critical)" />
        <StatCard label="Total Capacity" value={totalCapacity.toLocaleString()} accentColor="var(--risk-watch)" />
      </div>

      <div className={styles.capacityBar}>
        <span className={styles.capacityLabel}>
          Overall Capacity: {totalOccupancy.toLocaleString()}/{totalCapacity.toLocaleString()}
        </span>
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
                    <button className={styles.menuBtn} aria-label={`Manage ${sh.name}`}>
                      <MoreVertical size={16} />
                    </button>
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

      <Modal isOpen={showCreate} onClose={closeCreateForm} title="Register New Shelter">
        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Shelter Name</label>
            <input
              className={styles.formInput}
              placeholder="Getambe Temple Hall"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Strategic Zone</label>
              <select
                className={styles.formSelect}
                value={formData.zone_id}
                onChange={(e) => setFormData((p) => ({ ...p, zone_id: e.target.value }))}
                required
              >
                <option value="">Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.zone_id} value={zone.zone_id}>
                    {zone.zone_name || zone.zone_id}
                  </option>
                ))}
                {zones.length === 0 && <option value="ZONE-K1">ZONE-K1</option>}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Total Capacity</label>
              <input
                className={styles.formInput}
                type="number"
                min="1"
                placeholder="400"
                value={formData.capacity}
                onChange={(e) => setFormData((p) => ({ ...p, capacity: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Latitude</label>
              <input
                className={styles.formInput}
                type="number"
                step="any"
                placeholder="7.2715"
                value={formData.lat}
                onChange={(e) => setFormData((p) => ({ ...p, lat: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Longitude</label>
              <input
                className={styles.formInput}
                type="number"
                step="any"
                placeholder="80.6125"
                value={formData.lng}
                onChange={(e) => setFormData((p) => ({ ...p, lng: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Primary Contact Number</label>
              <input
                className={styles.formInput}
                placeholder="+94812222222"
                value={formData.contact_number}
                onChange={(e) => setFormData((p) => ({ ...p, contact_number: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Status</label>
              <select
                className={styles.formSelect}
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as ShelterFormData['status'] }))}
              >
                <option value="OPEN">OPEN</option>
                <option value="FILLING">FILLING</option>
                <option value="FULL">FULL</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>
          {formError && <p className={styles.formError}>{formError}</p>}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} type="button" onClick={closeCreateForm}>Cancel</button>
            <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
