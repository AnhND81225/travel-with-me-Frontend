import React, { useCallback, useEffect, useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import {
  Users,
  Plus,
  MapPin,
  Search,
  Pencil,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { catalogApi, Branch } from '../../features/equipment/catalogApi';

interface StaffRow {
  id: number;
  branchId: number;
  branchName: string;
  userId: number;
  userName: string;
  position: string | null;
  status: string;
}

interface CreatedUser {
  id: number;
  fullName: string;
}

const inputCls =
  'w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20] disabled:opacity-60 disabled:cursor-not-allowed';
const labelCls = 'text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider';

const emptyCreate = {
  fullName: '',
  email: '',
  phone: '',
  role: 'STAFF',
  branchId: '',
  position: '',
};

export const AdminStaffPage: React.FC = () => {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [pageMessage, setPageMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Create Staff Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit Staff Modal State
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [editForm, setEditForm] = useState({ branchId: '', position: '' });
  const [editError, setEditError] = useState<string | null>(null);

  const notifyPage = (type: 'ok' | 'err', text: string) => {
    setPageMessage({ type, text });
    setTimeout(() => setPageMessage(null), 5000);
  };

  const load = useCallback(async () => {
    try {
      const bs = (await catalogApi<Branch[]>('/branches')) || [];
      setBranches(bs);
      const lists = await Promise.all(
        bs.map((b) => catalogApi<StaffRow[]>(`/staff/branch/${b.id}`).catch(() => [] as StaffRow[])),
      );
      setStaff(lists.flat());
    } catch (err) {
      notifyPage('err', err instanceof Error ? err.message : 'Không thể tải dữ liệu nhân sự.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateModal = () => {
    setCreateForm(emptyCreate);
    setCreateError(null);
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (saving) return;
    setCreateOpen(false);
    setCreateError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.branchId) {
      setCreateError('Vui lòng chọn chi nhánh phân công.');
      return;
    }

    setSaving(true);
    try {
      // 1. Create internal user
      const user = await catalogApi<CreatedUser>('/users/internal', {
        method: 'POST',
        body: JSON.stringify({
          fullName: createForm.fullName.trim(),
          email: createForm.email.trim(),
          phone: createForm.phone.trim() || undefined,
          role: createForm.role,
        }),
      });

      // 2. Assign staff to selected branch
      await catalogApi('/staff', {
        method: 'POST',
        body: JSON.stringify({
          branchId: Number(createForm.branchId),
          userId: user.id,
          position: createForm.position.trim() || undefined,
          status: 'ACTIVE',
        }),
      });

      const email = createForm.email;
      const staffName = user.fullName || createForm.fullName;

      // Close create modal
      setCreateOpen(false);
      setCreateForm(emptyCreate);

      // Notify success: Admin does not see password, credentials sent via email
      notifyPage(
        'ok',
        `Tạo tài khoản cán bộ "${staffName}" thành công! Mật khẩu và thông tin đăng nhập đã được hệ thống gửi về hòm thư: ${email}.`
      );

      await load();
    } catch (err) {
      // Display error DIRECTLY inside the modal so user sees it instantly
      setCreateError(err instanceof Error ? err.message : 'Không thể tạo nhân viên.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (s: StaffRow) => {
    setEditing(s);
    setEditError(null);
    setEditForm({ branchId: String(s.branchId), position: s.position || '' });
  };

  const closeEdit = () => {
    if (saving) return;
    setEditing(null);
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setEditError(null);
    try {
      await catalogApi(`/staff/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          branchId: Number(editForm.branchId),
          userId: editing.userId,
          position: editForm.position.trim(),
          status: editing.status,
        }),
      });
      setEditing(null);
      notifyPage('ok', `Đã cập nhật thông tin cho cán bộ "${editing.userName}".`);
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Không thể cập nhật nhân viên.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (s: StaffRow) => {
    const next = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (next === 'INACTIVE' && !window.confirm(`Khóa tài khoản nhân viên "${s.userName}"?`)) return;
    try {
      await catalogApi(`/staff/${s.id}/status?status=${next}`, { method: 'PUT' });
      notifyPage('ok', next === 'ACTIVE' ? `Đã mở lại tài khoản "${s.userName}".` : `Đã khóa tài khoản "${s.userName}".`);
      await load();
    } catch (err) {
      notifyPage('err', err instanceof Error ? err.message : 'Không thể đổi trạng thái.');
    }
  };

  const handleCopyPassword = () => {
    if (!successInfo?.temporaryPassword) return;
    navigator.clipboard.writeText(successInfo.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const q = search.trim().toLowerCase();
  const filtered = staff.filter(
    (s) =>
      (branchFilter === 'ALL' || String(s.branchId) === branchFilter) &&
      (!q || s.userName.toLowerCase().includes(q) || (s.position || '').toLowerCase().includes(q)),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      {/* Page Header */}
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Badge variant="primary">{staff.length} NHÂN VIÊN</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Quản Lý Nhân Sự
          </h1>
          <p className="text-xs text-[#5C665F]">
            Tạo tài khoản, phân bổ chi nhánh/chức vụ và khóa/mở quyền truy cập nhân viên.
          </p>
        </div>
        <Button
          variant="accent"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
        >
          Thêm Nhân Viên
        </Button>
      </div>

      {/* Main Page Alert (Success/Error from non-modal actions) */}
      {pageMessage && (
        <div
          className={`p-3.5 rounded-xs border text-xs flex items-center justify-between gap-2 shadow-xs ${
            pageMessage.type === 'ok'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {pageMessage.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-bold">{pageMessage.text}</span>
          </div>
          <button
            onClick={() => setPageMessage(null)}
            className="text-xs font-bold hover:underline opacity-80"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#F8F6F1] p-3 rounded-xs border border-[#D8D2C5]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#7A857E] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc chức vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-[#152A20]"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 px-3 text-xs focus:outline-none"
        >
          <option value="ALL">Tất cả chi nhánh ({staff.length})</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#5C665F] flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#152A20]" />
          <span>Đang tải danh sách nhân sự...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} padding="md" className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xs bg-[#152A20] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {s.userName
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-[#111D16] font-headline truncate">{s.userName}</h3>
                    <div className="text-xs text-[#5C665F] flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {s.position || 'Chưa có chức vụ'}
                    </div>
                  </div>
                </div>
                <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {s.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                </Badge>
              </div>
              <div className="text-xs text-[#5C665F] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Chi nhánh: <strong className="text-[#111D16]">{s.branchName}</strong>
              </div>
              <div className="pt-2 border-t border-[#D8D2C5] flex gap-2">
                <Button size="sm" variant="secondary" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(s)}>
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={s.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  onClick={() => toggleStatus(s)}
                >
                  {s.status === 'ACTIVE' ? 'Khóa' : 'Mở'}
                </Button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full p-8 text-center bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-xs text-[#5C665F]">
              <Users className="w-8 h-8 text-[#7A857E] mx-auto mb-2 opacity-50" />
              Không có nhân viên nào phù hợp.
            </div>
          )}
        </div>
      )}

      {/* POPUP 1: MODAL THÊM MỚI NHÂN VIÊN */}
      <Modal isOpen={createOpen} onClose={closeCreateModal} title="Thêm Nhân Viên Mới" maxWidth="lg">
        <form onSubmit={handleCreate} className="space-y-4 font-label">
          {/* In-Modal Error Alert */}
          {createError && (
            <div className="p-3 rounded-xs bg-red-50 border border-red-300 text-red-700 text-xs flex items-start justify-between gap-2 shadow-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Không thể tạo tài khoản:</strong>
                  <span>{createError}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateError(null)}
                className="text-xs font-bold text-red-700 hover:underline"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Họ và tên *</label>
              <input
                required
                disabled={saving}
                className={inputCls}
                value={createForm.fullName}
                onChange={(e) => {
                  setCreateError(null);
                  setCreateForm({ ...createForm, fullName: e.target.value });
                }}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input
                required
                type="email"
                disabled={saving}
                className={inputCls}
                value={createForm.email}
                onChange={(e) => {
                  setCreateError(null);
                  setCreateForm({ ...createForm, email: e.target.value });
                }}
                placeholder="canbo@terrapeak.vn"
              />
            </div>
            <div>
              <label className={labelCls}>Số điện thoại</label>
              <input
                type="tel"
                disabled={saving}
                className={inputCls}
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="0912 345 678"
              />
            </div>
            <div>
              <label className={labelCls}>Vai trò</label>
              <select
                disabled={saving}
                className={inputCls}
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              >
                <option value="STAFF">Nhân viên (STAFF)</option>
                <option value="GUIDE">Hướng dẫn viên (GUIDE)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Chi nhánh *</label>
              <select
                required
                disabled={saving}
                className={inputCls}
                value={createForm.branchId}
                onChange={(e) => {
                  setCreateError(null);
                  setCreateForm({ ...createForm, branchId: e.target.value });
                }}
              >
                <option value="">— Chọn chi nhánh —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.status === 'ACTIVE' ? 'Hoạt động' : 'Khóa'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Chức vụ</label>
              <input
                disabled={saving}
                className={inputCls}
                value={createForm.position}
                onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                placeholder="Nhân viên quầy / Quản lý kho..."
              />
            </div>
          </div>

          <p className="text-[11px] text-[#7A857E] bg-[#EBE6DC] p-2.5 rounded-xs border border-[#D8D2C5]">
            * Để đảm bảo tính bảo mật, hệ thống sẽ tự động cấp mật khẩu an toàn và gửi trực tiếp vào hòm thư email của cán bộ để đăng nhập.
          </p>

          <div className="pt-3 border-t border-[#D8D2C5] flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={saving}
              onClick={closeCreateModal}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              disabled={saving}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            >
              {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* POPUP 2: MODAL SỬA NHÂN VIÊN */}
      <Modal isOpen={!!editing} onClose={closeEdit} title={`Sửa Nhân Viên — ${editing?.userName || ''}`} maxWidth="lg">
        <form onSubmit={handleEdit} className="space-y-4 font-label">
          {editError && (
            <div className="p-3 rounded-xs bg-red-50 border border-red-300 text-red-700 text-xs flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editError}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditError(null)}
                className="text-xs font-bold text-red-700 hover:underline"
              >
                ✕
              </button>
            </div>
          )}

          <div>
            <label className={labelCls}>Chi nhánh phân công *</label>
            <select
              disabled={saving}
              className={inputCls}
              value={editForm.branchId}
              onChange={(e) => {
                setEditError(null);
                setEditForm({ ...editForm, branchId: e.target.value });
              }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Chức vụ</label>
            <input
              disabled={saving}
              className={inputCls}
              value={editForm.position}
              onChange={(e) => {
                setEditError(null);
                setEditForm({ ...editForm, position: e.target.value });
              }}
              placeholder="Chức vụ công tác..."
            />
          </div>
          <div className="pt-3 border-t border-[#D8D2C5] flex justify-end gap-2">
            <Button type="button" variant="secondary" size="md" disabled={saving} onClick={closeEdit}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              disabled={saving}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
