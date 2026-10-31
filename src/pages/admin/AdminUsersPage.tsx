import React, { useCallback, useEffect, useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import {
  Users,
  Search,
  Pencil,
  Lock,
  Unlock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { catalogApi, Account } from '../../features/equipment/catalogApi';

const inputCls =
  'w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20] disabled:opacity-60 disabled:cursor-not-allowed';
const labelCls = 'text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'STAFF' | 'GUIDE' | 'ADMIN'>('CUSTOMER');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<Account | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete Confirm Modal State
  const [deletingUser, setDeletingUser] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);

  const notify = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5500);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await catalogApi<Account[]>('/users');
      setUsers(data || []);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Unable to load user accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openEdit = (user: Account) => {
    setEditingUser(user);
    setEditError(null);
    setEditForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      role: user.role || 'CUSTOMER',
      status: user.status || 'ACTIVE',
    });
  };

  const closeEdit = () => {
    if (saving) return;
    setEditingUser(null);
    setEditError(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editForm.fullName.trim()) {
      setEditError('Full name is required.');
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      await catalogApi<Account>(`/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          phone: editForm.phone.trim() || undefined,
          role: editForm.role,
          status: editForm.status,
        }),
      });

      notify('ok', `Updated account "${editForm.fullName}" successfully.`);
      closeEdit();
      await loadUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Unable to update user account.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: Account) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = nextStatus === 'ACTIVE' ? 'unlock' : 'lock';

    if (
      nextStatus === 'INACTIVE' &&
      !window.confirm(`Are you sure you want to ${actionText} account "${user.fullName}" (${user.email})?`)
    ) {
      return;
    }

    try {
      await catalogApi(`/users/${user.id}/status?status=${nextStatus}`, { method: 'PUT' });
      notify('ok', `Account "${user.fullName}" has been ${nextStatus === 'ACTIVE' ? 'unlocked' : 'locked'}.`);
      await loadUsers();
    } catch (err) {
      notify('err', err instanceof Error ? err.message : `Unable to ${actionText} account.`);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const permanentlyDeleted = await catalogApi<boolean>(`/users/${deletingUser.id}`, { method: 'DELETE' });
      if (permanentlyDeleted) {
        notify('ok', `Account "${deletingUser.fullName}" has been permanently deleted.`);
      } else {
        notify(
          'ok',
          `Account "${deletingUser.fullName}" has linked order or booking history and has been moved to Locked (INACTIVE) to preserve audit records.`
        );
      }
      setDeletingUser(null);
      await loadUsers();
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Unable to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter & Search Logic
  const q = search.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchSearch =
      !q ||
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q);
    return matchRole && matchStatus && matchSearch;
  });

  // Metrics
  const totalCount = users.length;
  const customerCount = users.filter((u) => u.role === 'CUSTOMER').length;
  const activeCustomerCount = users.filter((u) => u.role === 'CUSTOMER' && u.status === 'ACTIVE').length;
  const inactiveCustomerCount = users.filter((u) => u.role === 'CUSTOMER' && u.status === 'INACTIVE').length;
  const internalCount = users.filter((u) => u.role === 'STAFF' || u.role === 'GUIDE' || u.role === 'ADMIN').length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="secondary">Administrator (Admin)</Badge>;
      case 'STAFF':
        return <Badge variant="primary">Branch Staff (Staff)</Badge>;
      case 'GUIDE':
        return <Badge variant="warning">Tour Guide (Guide)</Badge>;
      default:
        return <Badge variant="neutral">Customer</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      {/* Header */}
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary">{customerCount} CUSTOMERS</Badge>
            <Badge variant="neutral">{totalCount} TOTAL ACCOUNTS</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline">
            User & Customer Account Management
          </h1>
          <p className="text-xs text-[#5C665F]">
            Monitor customer profiles, contact details, role permissions, and lock/unlock account access.
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={loadUsers}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-3.5 rounded-xs border text-xs flex items-center justify-between gap-2 shadow-xs ${
            message.type === 'ok'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] shadow-xs">
          <div className="text-[10px] font-bold text-[#5C665F] uppercase flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#152A20]" />
            <span>Total Customers</span>
          </div>
          <div className="text-2xl font-bold text-[#111D16] mt-1 font-headline">{customerCount}</div>
        </div>

        <div className="p-4 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] shadow-xs">
          <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Customers</span>
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-1 font-headline">{activeCustomerCount}</div>
        </div>

        <div className="p-4 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] shadow-xs">
          <div className="text-[10px] font-bold text-red-800 uppercase flex items-center gap-1.5">
            <UserX className="w-3.5 h-3.5 text-red-600" />
            <span>Locked Customers</span>
          </div>
          <div className="text-2xl font-bold text-red-800 mt-1 font-headline">{inactiveCustomerCount}</div>
        </div>

        <div className="p-4 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] shadow-xs">
          <div className="text-[10px] font-bold text-[#D97845] uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D97845]" />
            <span>Internal Personnel</span>
          </div>
          <div className="text-2xl font-bold text-[#152A20] mt-1 font-headline">
            {internalCount} <span className="text-xs text-[#5C665F] font-normal font-body">staff / guides</span>
          </div>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex bg-[#EBE6DC] p-1 rounded-xs border border-[#D8D2C5] max-w-xl">
        <button
          type="button"
          onClick={() => setRoleFilter('CUSTOMER')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xs transition cursor-pointer text-center ${
            roleFilter === 'CUSTOMER'
              ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
              : 'text-[#5C665F] hover:text-[#111D16]'
          }`}
        >
          Customers ({customerCount})
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter('ALL')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xs transition cursor-pointer text-center ${
            roleFilter === 'ALL'
              ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
              : 'text-[#5C665F] hover:text-[#111D16]'
          }`}
        >
          All Accounts ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter('STAFF')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xs transition cursor-pointer text-center ${
            roleFilter === 'STAFF'
              ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
              : 'text-[#5C665F] hover:text-[#111D16]'
          }`}
        >
          Staff
        </button>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative flex items-center">
            <Search className="w-4 h-4 text-[#5C665F] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by full name, email address, or phone number..."
              className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              className={inputCls}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active (ACTIVE)</option>
              <option value="INACTIVE">Locked (INACTIVE)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EBE6DC] text-[#5C665F] uppercase tracking-wider text-[10px] border-b border-[#D8D2C5]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Login Email</th>
                <th className="p-3">Phone Number</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D2C5]">
              {loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#5C665F]">
                    <Loader2 className="w-6 h-6 animate-spin text-[#152A20] mx-auto mb-2" />
                    Loading user accounts...
                  </td>
                </tr>
              )}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#5C665F]">
                    No user accounts found matching the current filters.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredUsers.map((u) => {
                  const isActive = u.status === 'ACTIVE';
                  const initials = (u.fullName || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={u.id} className="hover:bg-[#EBE6DC]/50 transition">
                      <td className="p-3 font-mono text-[#5C665F]">#{u.id}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#152A20] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#111D16]">{u.fullName}</div>
                            {u.role === 'CUSTOMER' && (
                              <span className="text-[10px] text-[#7A857E]">Expedition Member</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-[#5C665F]">
                          <Mail className="w-3.5 h-3.5 text-[#7A857E] shrink-0" />
                          <span>{u.email || '—'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-[#5C665F]">
                          <Phone className="w-3.5 h-3.5 text-[#7A857E] shrink-0" />
                          <span>{u.phone || 'Not provided'}</span>
                        </div>
                      </td>
                      <td className="p-3">{getRoleBadge(u.role)}</td>
                      <td className="p-3">
                        <Badge variant={isActive ? 'success' : 'danger'}>
                          {isActive ? 'Active' : 'Locked'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-xs border border-[#D8D2C5] bg-[#F8F6F1] hover:bg-[#EBE6DC] text-[#111D16] transition cursor-pointer"
                            title="Edit Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-xs border transition cursor-pointer ${
                              isActive
                                ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'Lock Access' : 'Unlock Account'}
                          >
                            {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 rounded-xs border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={closeEdit}
        title={`Edit User Account #${editingUser?.id} — ${editingUser?.fullName || ''}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4 font-label">
          {editError && (
            <div className="p-3 rounded-xs bg-red-50 border border-red-300 text-red-700 text-xs flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editError}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditError(null)}
                className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div>
            <label className={labelCls}>Full Name *</label>
            <input
              type="text"
              required
              disabled={saving}
              className={inputCls}
              value={editForm.fullName}
              onChange={(e) => {
                setEditError(null);
                setEditForm({ ...editForm, fullName: e.target.value });
              }}
            />
          </div>

          <div>
            <label className={labelCls}>Email Address</label>
            <input
              type="text"
              disabled
              className={inputCls}
              value={editingUser?.email || ''}
            />
            <span className="text-[10px] text-[#7A857E] mt-1 block">
              * Email is the unique login / Google identifier and cannot be edited.
            </span>
          </div>

          <div>
            <label className={labelCls}>Phone Number</label>
            <input
              type="tel"
              disabled={saving}
              className={inputCls}
              value={editForm.phone}
              onChange={(e) => {
                setEditError(null);
                setEditForm({ ...editForm, phone: e.target.value });
              }}
              placeholder="0912 345 678"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Role</label>
              <select
                disabled={saving}
                className={inputCls}
                value={editForm.role}
                onChange={(e) => {
                  setEditError(null);
                  setEditForm({ ...editForm, role: e.target.value });
                }}
              >
                <option value="CUSTOMER">CUSTOMER (Customer)</option>
                <option value="STAFF">STAFF (Branch Staff)</option>
                <option value="GUIDE">GUIDE (Tour Guide)</option>
                <option value="ADMIN">ADMIN (Administrator)</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Account Status</label>
              <select
                disabled={saving}
                className={inputCls}
                value={editForm.status}
                onChange={(e) => {
                  setEditError(null);
                  setEditForm({ ...editForm, status: e.target.value });
                }}
              >
                <option value="ACTIVE">ACTIVE (Active)</option>
                <option value="INACTIVE">INACTIVE (Locked)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D8D2C5] flex justify-end gap-2">
            <Button type="button" variant="secondary" size="md" disabled={saving} onClick={closeEdit}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              disabled={saving}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Confirm Account Deletion"
        maxWidth="md"
      >
        <div className="space-y-4 font-label">
          <p className="text-xs text-[#111D16]">
            Are you sure you want to delete user account <strong>{deletingUser?.fullName}</strong> ({deletingUser?.email})?
          </p>
          <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xs border border-amber-200 leading-relaxed">
            💡 <strong>Data Protection Policy:</strong> If the user has existing rental orders or tour bookings, the system will automatically switch the account to <strong>[LOCKED - INACTIVE]</strong> to preserve accounting and audit history.
          </div>
          <div className="pt-3 border-t border-[#D8D2C5] flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={deleting}
              onClick={() => setDeletingUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={deleting}
              icon={deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              onClick={handleDeleteUser}
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
