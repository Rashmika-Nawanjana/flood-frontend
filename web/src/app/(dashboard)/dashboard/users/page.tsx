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
  User as UserIcon
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import RoleGate from '@/components/auth/RoleGate';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { User, UserRole, Zone } from '@/lib/types';
import styles from './page.module.css';

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.admin.users.list();
      setUsers(res.data || []);
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
      const res = await api.zones.list();
      setZones(res.data || []);
    } catch (err) {
      console.error('Failed to fetch zones:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchZones();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const fieldOfficers = users.filter(u => u.role === 'field_officer').length;
    const citizens = users.filter(u => u.role === 'citizen').length;
    return { total, admins, fieldOfficers, citizens };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || 
                           (statusFilter === 'ACTIVE' ? u.is_active : !u.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

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
            <StatCard 
              label="Total Users" 
              value={stats.total} 
              accentColor="#3b82f6" 
              icon={<UsersIcon size={20} />} 
            />
          </div>
          <div className={styles.statCard}>
            <StatCard 
              label="Admins" 
              value={stats.admins} 
              accentColor="#3b82f6" 
              icon={<ShieldCheck size={20} />} 
            />
          </div>
          <div className={styles.statCard}>
            <StatCard 
              label="Field Officers" 
              value={stats.fieldOfficers} 
              accentColor="#f97316" 
              icon={<UserCog size={20} />} 
            />
          </div>
          <div className={styles.statCard}>
            <StatCard 
              label="Citizens" 
              value={stats.citizens} 
              accentColor="#6b7280" 
              icon={<UserIcon size={20} />} 
            />
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
              {filteredUsers.map((u) => (
                <tr key={u.clerk_id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>{u.full_name.charAt(0)}</div>
                      <span>{u.full_name}</span>
                    </div>
                  </td>
                  <td className={styles.email}>{u.email}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`role_${u.role}`]}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{u.zone_id || '—'}</td>
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
                        onClick={() => {
                          setSelectedUser(u);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      {u.is_active ? (
                        <button 
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          title="Deactivate User"
                          onClick={() => {
                            setSelectedUser(u);
                            setIsDeactivateModalOpen(true);
                          }}
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
                              fetchUsers();
                            } catch (err) {
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
              ))}
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? 'No users matching filters found.' : 'No users found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modals */}
        <CreateUserModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchUsers();
          }}
          zones={zones}
        />

        {selectedUser && (
          <>
            <EditUserModal 
              isOpen={isEditModalOpen} 
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              }}
              onSuccess={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
                fetchUsers();
              }}
              user={selectedUser}
              zones={zones}
            />

            <DeactivateModal 
              isOpen={isDeactivateModalOpen}
              onClose={() => {
                setIsDeactivateModalOpen(false);
                setSelectedUser(null);
              }}
              onSuccess={() => {
                setIsDeactivateModalOpen(false);
                setSelectedUser(null);
                fetchUsers();
              }}
              user={selectedUser}
            />
          </>
        )}
      </div>
    </RoleGate>
  );
}

// Internal Modal Components
function CreateUserModal({ isOpen, onClose, onSuccess, zones }: any) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'citizen',
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
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
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
            <button 
              type="button" 
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
            >
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
            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
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
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ isOpen, onClose, onSuccess, user, zones }: any) {
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    role: user.role,
    zone_id: user.zone_id,
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
            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
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

function DeactivateModal({ isOpen, onClose, onSuccess, user }: any) {
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await api.admin.users.deactivate(user.clerk_id);
      onSuccess();
    } catch (err) {
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
