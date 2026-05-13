'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  UserMinus,
  UserCheck,
  Eye,
  EyeOff,
  Users as UsersIcon,
  ShieldCheck,
  UserCog,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import RoleGate from '@/components/auth/RoleGate';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { User, UserRole, Zone } from '@/lib/types';
import styles from './page.module.css';

const PAGE_SIZE = 15;

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters (applied client-side on the current page)
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.push('/');
    }
  }, [currentUser, router]);

  const fetchUsers = async (targetPage = page) => {
    try {
      setLoading(true);
      const res = await api.admin.users.list({ page: targetPage, page_size: PAGE_SIZE }) as any;
      setUsers(res.data || []);
      setTotal(res.total ?? 0);
      setTotalPages(res.total_pages ?? 1);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await api.zones.list() as any;
      setZones(res.data || []);
    } catch (err) {
      console.error('Failed to fetch zones:', err);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  useEffect(() => {
    fetchZones();
  }, []);

  // Stats computed from all loaded users on this page
  const stats = useMemo(() => {
    const admins = users.filter(u => u.role === 'admin').length;
    const fieldOfficers = users.filter(u => u.role === 'field_officer').length;
    const citizens = users.filter(u => u.role === 'citizen').length;
    return { total, admins, fieldOfficers, citizens };
  }, [users, total]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' ? u.is_active : !u.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  if (currentUser?.role !== 'admin') return null;

  return (
    <RoleGate allowed={['admin']}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>User Management</h1>
            <p className={styles.subtitle}>Manage system accounts and zone assignments</p>
          </div>
          <button className={styles.addBtn} onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Add User
          </button>
        </div>

        {/* Stats Row */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <StatCard label="Total Users" value={stats.total} accentColor="#3b82f6" icon={<UsersIcon size={20} />} />
          </div>
          <div className={styles.statCard}>
            <StatCard label="Admins" value={stats.admins} accentColor="#3b82f6" icon={<ShieldCheck size={20} />} />
          </div>
          <div className={styles.statCard}>
            <StatCard label="Field Officers" value={stats.fieldOfficers} accentColor="#f97316" icon={<UserCog size={20} />} />
          </div>
          <div className={styles.statCard}>
            <StatCard label="Citizens" value={stats.citizens} accentColor="#6b7280" icon={<UserIcon size={20} />} />
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className={styles.select} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="admin">Admin</option>
            <option value="field_officer">Field Officer</option>
            <option value="citizen">Citizen</option>
          </select>
          <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* Users Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                      ? 'No users matching filters found.'
                      : 'No users found.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.clerk_id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>{(u.full_name || u.email).charAt(0).toUpperCase()}</div>
                        <span>{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className={styles.email}>{u.email}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`role_${u.role}`]}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{u.zone_id ? (zones.find(z => z.zone_id === u.zone_id)?.zone_name ?? u.zone_id) : '—'}</td>
                    <td>
                      <span className={`${styles.statusPill} ${u.is_active ? styles.statusActive : styles.statusInactive}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                          title="Edit User"
                          onClick={() => { setSelectedUser(u); setIsEditModalOpen(true); }}
                        >
                          <Edit2 size={16} />
                        </button>
                        {u.is_active ? (
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            title="Deactivate User"
                            onClick={() => { setSelectedUser(u); setIsDeactivateModalOpen(true); }}
                          >
                            <UserMinus size={16} />
                          </button>
                        ) : (
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnActivate}`}
                            title="Reactivate User"
                            onClick={async () => {
                              try {
                                await api.admin.users.update(u.clerk_id, { is_active: true });
                                fetchUsers(page);
                              } catch {
                                alert('Failed to reactivate user');
                              }
                            }}
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} users
            </span>
            <div className={styles.paginationControls}>
              <button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>…</span>
                  ) : (
                    <button
                      key={item}
                      className={`${styles.pageBtn} ${page === item ? styles.pageBtnActive : ''}`}
                      onClick={() => handlePageChange(item as number)}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                className={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => { setIsCreateModalOpen(false); fetchUsers(page); }}
          zones={zones}
        />

        {selectedUser && (
          <>
            <EditUserModal
              isOpen={isEditModalOpen}
              onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
              onSuccess={() => { setIsEditModalOpen(false); setSelectedUser(null); fetchUsers(page); }}
              user={selectedUser}
              zones={zones}
            />
            <DeactivateModal
              isOpen={isDeactivateModalOpen}
              onClose={() => { setIsDeactivateModalOpen(false); setSelectedUser(null); }}
              onSuccess={() => { setIsDeactivateModalOpen(false); setSelectedUser(null); fetchUsers(page); }}
              user={selectedUser}
            />
          </>
        )}
      </div>
    </RoleGate>
  );
}

// ── Create User Modal ────────────────────────────────────────────────
// Only admins and field officers can be created here.
// Citizens register themselves via the sign-up form.
function CreateUserModal({ isOpen, onClose, onSuccess, zones }: any) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'field_officer' as UserRole,
    zone_id: null as string | null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.admin.users.create(formData);
      setFormData({ full_name: '', email: '', password: '', role: 'field_officer', zone_id: null });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.role === 'admin') {
      setFormData(prev => ({ ...prev, zone_id: null }));
    }
  }, [formData.role]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User">
      <form onSubmit={handleSubmit}>
        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name</label>
          <input
            className={styles.input}
            placeholder="e.g. Kasun Perera"
            required
            value={formData.full_name}
            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address</label>
          <input
            className={styles.input}
            type="email"
            placeholder="email@floodsense.lk"
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password</label>
          <div className={styles.passwordWrapper}>
            <input
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 characters"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Role</label>
          <select
            className={styles.select}
            style={{ width: '100%' }}
            value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
          >
            <option value="admin">Admin</option>
            <option value="field_officer">Field Officer</option>
          </select>
          <span className={styles.fieldHint}>Citizens register via the public sign-up form.</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Zone Assignment</label>
          <select
            className={styles.select}
            style={{ width: '100%' }}
            value={formData.zone_id || ''}
            disabled={formData.role === 'admin'}
            required={formData.role === 'field_officer'}
            onChange={e => setFormData({ ...formData, zone_id: e.target.value || null })}
          >
            <option value="">No Zone Assigned</option>
            {zones.map((z: Zone) => (
              <option key={z.zone_id} value={z.zone_id}>{z.zone_name} ({z.zone_id})</option>
            ))}
          </select>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit User Modal ──────────────────────────────────────────────────
function EditUserModal({ isOpen, onClose, onSuccess, user, zones }: any) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    role: user.role as UserRole,
    zone_id: user.zone_id as string | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.admin.users.update(user.clerk_id, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.role === 'admin' || formData.role === 'citizen') {
      setFormData(prev => ({ ...prev, zone_id: null }));
    }
  }, [formData.role]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <form onSubmit={handleSubmit}>
        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name</label>
          <input
            className={styles.input}
            required
            value={formData.full_name}
            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Role</label>
          <select
            className={styles.select}
            style={{ width: '100%' }}
            value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
          >
            <option value="admin">Admin</option>
            <option value="field_officer">Field Officer</option>
            <option value="citizen">Citizen</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Zone Assignment</label>
          <select
            className={styles.select}
            style={{ width: '100%' }}
            value={formData.zone_id || ''}
            disabled={formData.role === 'admin' || formData.role === 'citizen'}
            required={formData.role === 'field_officer'}
            onChange={e => setFormData({ ...formData, zone_id: e.target.value || null })}
          >
            <option value="">No Zone Assigned</option>
            {zones.map((z: Zone) => (
              <option key={z.zone_id} value={z.zone_id}>{z.zone_name} ({z.zone_id})</option>
            ))}
          </select>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Deactivate Modal ─────────────────────────────────────────────────
function DeactivateModal({ isOpen, onClose, onSuccess, user }: any) {
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await api.admin.users.deactivate(user.clerk_id);
      onSuccess();
    } catch {
      alert('Failed to deactivate user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deactivate User">
      <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
        Are you sure you want to deactivate <strong>{user.full_name}</strong>? They will lose access to the dashboard immediately.
      </div>
      <div className={styles.modalActions}>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        <button
          type="button"
          className={`${styles.submitBtn} ${styles.submitBtnDestructive}`}
          disabled={loading}
          onClick={handleDeactivate}
        >
          {loading ? 'Deactivating...' : 'Deactivate'}
        </button>
      </div>
    </Modal>
  );
}
