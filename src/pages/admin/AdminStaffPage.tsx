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
  Trash2,
  Compass,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  Upload,
} from 'lucide-react';
import { catalogApi, Branch, Account } from '../../features/equipment/catalogApi';
import { markAccountRequiresPasswordChange } from '../../utils/firstLoginUtils';
import { eventGuideApi, type AdminGuide, type GuideRegistrationResponse } from '../../services/eventGuideApi';

export interface PersonnelRow {
  id: number; // staff record id if STAFF, or user.id if GUIDE
  userId: number;
  userName: string;
  email?: string;
  phone?: string;
  role: 'STAFF' | 'GUIDE';
  branchId?: number | null;
  branchName?: string;
  position?: string | null;
  status: string;
  guideId?: number;
  avatarUrl?: string | null;
  bio?: string | null;
  languages?: string[] | null;
  experienceYears?: number | null;
}

interface StaffResponseItem {
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
  specialization: '',
  bio: '',
  languages: '',
};

export const AdminStaffPage: React.FC = () => {
  const [personnel, setPersonnel] = useState<PersonnelRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState<'ALL' | 'STAFF' | 'GUIDE'>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [pageMessage, setPageMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [guideCredentials, setGuideCredentials] = useState<GuideRegistrationResponse | null>(null);

  // Edit Personnel Modal State
  const [editing, setEditing] = useState<PersonnelRow | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    branchId: '',
    position: '',
    specialization: '',
    bio: '',
    languages: '',
  });
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Personnel Modal State
  const [deletingPersonnel, setDeletingPersonnel] = useState<PersonnelRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const notifyPage = (type: 'ok' | 'err', text: string) => {
    setPageMessage({ type, text });
    setTimeout(() => setPageMessage(null), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch branches, all users, and staff list in parallel
      const [bs, allUsers, staffList, guidePage] = await Promise.all([
        catalogApi<Branch[]>('/branches').catch(() => [] as Branch[]),
        catalogApi<Account[]>('/users').catch(() => [] as Account[]),
        catalogApi<StaffResponseItem[]>('/staff').catch(async () => {
          // Fallback: query each branch if /staff list endpoint isn't direct
          const bList = (await catalogApi<Branch[]>('/branches').catch(() => [] as Branch[])) || [];
          const nested = await Promise.all(
            bList.map((b) => catalogApi<StaffResponseItem[]>(`/staff/branch/${b.id}`).catch(() => [] as StaffResponseItem[]))
          );
          return nested.flat();
        }),
        eventGuideApi.listAdminGuides({ size: 100 }).catch(() => ({ items: [] as AdminGuide[] })),
      ]);

      setBranches(bs || []);

      const userMap = new Map<number, Account>();
      (allUsers || []).forEach((u) => userMap.set(u.id, u));

      // 2. Map STAFF rows (assigned to branches)
      const staffRows: PersonnelRow[] = (staffList || []).map((s) => {
        const u = userMap.get(s.userId);
        return {
          id: s.id,
          userId: s.userId,
          userName: s.userName || u?.fullName || `Nhân viên #${s.userId}`,
          email: u?.email,
          phone: u?.phone,
          role: 'STAFF',
          branchId: s.branchId,
          branchName: s.branchName,
          position: s.position,
          status: s.status,
        };
      });

      // 3. Map GUIDE rows (internal tour guides without a fixed branch assignment)
      const guideRows: PersonnelRow[] = guidePage.items.map((guide) => {
        const account = userMap.get(guide.userId);
        return {
        id: guide.guideId,
        guideId: guide.guideId,
        userId: guide.userId,
        userName: guide.displayName,
        email: account?.email,
        phone: account?.phone,
        role: 'GUIDE',
        branchId: null,
        branchName: 'Toàn hệ thống (Tour thám hiểm)',
        position: guide.specialization || 'Hướng dẫn viên leo núi (Guide)',
        status: guide.status,
        avatarUrl: guide.avatarUrl,
        bio: guide.bio,
        languages: guide.languages,
        experienceYears: guide.experienceYears,
      };
      });

      // Combine both Staff & Guides
      setPersonnel([...staffRows, ...guideRows]);
    } catch (err) {
      notifyPage('err', err instanceof Error ? err.message : 'Không thể tải dữ liệu nhân sự & hướng dẫn viên.');
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

    const isStaff = createForm.role === 'STAFF';

    if (isStaff && !createForm.branchId) {
      setCreateError('Vui lòng chọn chi nhánh phân công cho nhân viên.');
      return;
    }

    setSaving(true);
    let user: CreatedUser | null = null;
    try {
      if (!isStaff) {
        const guide = await eventGuideApi.createGuideWithAccount({
          fullName: createForm.fullName.trim(),
          email: createForm.email.trim(),
          phone: createForm.phone.trim() || undefined,
          experienceYears: 0,
          specialization: createForm.specialization.trim(),
          bio: createForm.bio.trim() || undefined,
          languages: createForm.languages.split(',').map((item) => item.trim()).filter(Boolean),
        });
        setGuideCredentials(guide);
        setCreateOpen(false);
        setCreateForm(emptyCreate);
        notifyPage('ok', `Đã tạo tài khoản và hồ sơ hướng dẫn viên "${guide.guide.displayName}".`);
        await load();
        return;
      }

      // 1. Create internal user (STAFF or GUIDE)
      user = await catalogApi<CreatedUser>('/users/internal', {
        method: 'POST',
        body: JSON.stringify({
          fullName: createForm.fullName.trim(),
          email: createForm.email.trim(),
          phone: createForm.phone.trim() || undefined,
          role: 'STAFF',
        }),
      });

      // 2. Assign staff to selected branch ONLY IF ROLE IS STAFF
      if (isStaff) {
        try {
          await catalogApi('/staff', {
            method: 'POST',
            body: JSON.stringify({
              branchId: Number(createForm.branchId),
              userId: user.id,
              position: createForm.position.trim() || undefined,
              status: 'ACTIVE',
            }),
          });
        } catch (assignErr) {
          // Rollback created user if assignment to branch fails
          try {
            await catalogApi(`/users/${user.id}`, { method: 'DELETE' });
          } catch (_) {}
          throw assignErr;
        }
      } else {
        // If GUIDE, register guide profile in /admin/guides so it also shows in Tours & Guides
        try {
          await eventGuideApi.createGuide({
            userId: user.id,
            experienceYears: 1,
            specialization: createForm.position.trim() || 'Hướng dẫn viên leo núi',
          });
        } catch (guideErr) {
          console.warn('Could not auto-register guide profile in /admin/guides:', guideErr);
        }
      }

      const email = createForm.email;
      const staffName = user.fullName || createForm.fullName;
      const roleLabel = isStaff ? 'nhân viên chi nhánh' : 'hướng dẫn viên leo núi (Guide)';

      // Mark that this newly created account requires changing password on first login
      markAccountRequiresPasswordChange(email);

      // Close create modal
      setCreateOpen(false);
      setCreateForm(emptyCreate);

      // Notify success: Admin does not see password, credentials sent via email
      notifyPage(
        'ok',
        `Tạo tài khoản ${roleLabel} "${staffName}" thành công! Mật khẩu và thông tin đăng nhập đã được hệ thống gửi về hòm thư: ${email}.`
      );

      await load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Không thể tạo tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p: PersonnelRow) => {
    setEditing(p);
    setEditError(null);
    setEditForm({
      fullName: p.userName || '',
      phone: p.phone || '',
      branchId: p.branchId ? String(p.branchId) : (branches[0] ? String(branches[0].id) : ''),
      position: p.position || '',
      specialization: p.position || '',
      bio: p.bio || '',
      languages: (p.languages || []).join(', '),
    });
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
      if (editing.role === 'GUIDE' && editing.guideId) {
        await eventGuideApi.updateGuide(editing.guideId, {
          experienceYears: editing.experienceYears ?? 0,
          specialization: editForm.specialization.trim(),
          bio: editForm.bio.trim() || undefined,
          languages: editForm.languages.split(',').map((item) => item.trim()).filter(Boolean),
        });
      }
      if (editing.role === 'STAFF') {
        // Update staff branch & position
        await catalogApi(`/staff/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            branchId: Number(editForm.branchId),
            userId: editing.userId,
            position: editForm.position.trim(),
            status: editing.status,
          }),
        });
      }

      // Update user details (fullName, phone)
      await catalogApi(`/users/${editing.userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          phone: editForm.phone.trim() || undefined,
          role: editing.role,
          status: editing.status,
        }),
      });

      setEditing(null);
      notifyPage('ok', `Đã cập nhật thông tin cho "${editForm.fullName}".`);
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Không thể cập nhật thông tin.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p: PersonnelRow) => {
    const next = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = next === 'ACTIVE' ? 'mở lại' : 'khóa';
    const roleLabel = p.role === 'GUIDE' ? 'hướng dẫn viên' : 'nhân viên';

    if (next === 'INACTIVE' && !window.confirm(`Khóa tài khoản ${roleLabel} "${p.userName}"?`)) return;

    try {
      if (p.role === 'GUIDE' && p.guideId) {
        await eventGuideApi.setGuideStatus(p.guideId, next as 'ACTIVE' | 'INACTIVE');
      }
      if (p.role === 'STAFF') {
        try {
          await catalogApi(`/staff/${p.id}/status?status=${next}`, { method: 'PUT' });
        } catch (_) {}
      }
      if (p.role === 'STAFF') {
        try {
          await catalogApi(`/users/${p.userId}/status?status=${next}`, { method: 'PUT' });
        } catch (_) {
          await catalogApi(`/users/${p.userId}`, {
            method: 'PUT',
            body: JSON.stringify({
              fullName: p.userName,
              phone: p.phone || undefined,
              role: p.role,
              status: next,
            }),
          });
        }
      }

      notifyPage('ok', `Đã ${action} tài khoản "${p.userName}".`);
      await load();
    } catch (err) {
      notifyPage('err', err instanceof Error ? err.message : 'Không thể đổi trạng thái.');
    }
  };

  const uploadGuideAvatar = async (p: PersonnelRow, file?: File) => {
    if (!p.guideId || !file) return;
    setSaving(true);
    try {
      await eventGuideApi.uploadGuideAvatar(p.guideId, file);
      notifyPage('ok', `Đã cập nhật ảnh đại diện cho "${p.userName}".`);
      await load();
    } catch (err) {
      notifyPage('err', err instanceof Error ? err.message : 'Không thể tải ảnh đại diện.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePersonnel = async () => {
    if (!deletingPersonnel) return;
    setDeleting(true);
    try {
      if (deletingPersonnel.role === 'GUIDE' && deletingPersonnel.guideId) {
        await eventGuideApi.setGuideStatus(deletingPersonnel.guideId, 'INACTIVE');
        notifyPage('ok', `Đã ngừng hoạt động hướng dẫn viên "${deletingPersonnel.userName}".`);
        setDeletingPersonnel(null);
        await load();
        return;
      }
      if (deletingPersonnel.role === 'STAFF') {
        // 1. Delete staff assignment from branch
        await catalogApi(`/staff/${deletingPersonnel.id}`, { method: 'DELETE' });
      }

      // 2. Attempt deleting associated user record (or deactivate if constrained by historical orders/tours)
      try {
        await catalogApi(`/users/${deletingPersonnel.userId}`, { method: 'DELETE' });
      } catch (userErr) {
        console.warn('Could not hard delete user record, deactivating:', userErr);
        try {
          await catalogApi(`/users/${deletingPersonnel.userId}/status?status=INACTIVE`, { method: 'PUT' });
        } catch (_) {}
      }

      const roleLabel = deletingPersonnel.role === 'GUIDE' ? 'hướng dẫn viên' : 'nhân viên';
      notifyPage('ok', `Đã xóa ${roleLabel} "${deletingPersonnel.userName}" thành công.`);
      setDeletingPersonnel(null);
      await load();
    } catch (err) {
      notifyPage('err', err instanceof Error ? err.message : 'Không thể xóa tài khoản này.');
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const staffCount = personnel.filter((p) => p.role === 'STAFF').length;
  const guideCount = personnel.filter((p) => p.role === 'GUIDE').length;
  const activeCount = personnel.filter((p) => p.status === 'ACTIVE').length;

  // Filter & Search Logic
  const q = search.trim().toLowerCase();
  const filtered = personnel.filter((p) => {
    const matchRole = roleTab === 'ALL' || p.role === roleTab;
    const matchBranch =
      branchFilter === 'ALL' ||
      (branchFilter === 'GUIDE_GLOBAL' && p.role === 'GUIDE') ||
      (p.branchId !== null && String(p.branchId) === branchFilter);
    const matchSearch =
      !q ||
      p.userName.toLowerCase().includes(q) ||
      (p.position || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q) ||
      (p.branchName || '').toLowerCase().includes(q);

    return matchRole && matchBranch && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      {/* Page Header */}
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary">{personnel.length} NHÂN SỰ NỘI BỘ</Badge>
            <Badge variant="neutral">{staffCount} STAFF</Badge>
            <Badge variant="warning">{guideCount} GUIDE</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Quản Lý Nhân Sự & Hướng Dẫn Viên
          </h1>
          <p className="text-xs text-[#5C665F]">
            Quản lý tập trung toàn bộ đội ngũ Cán bộ trạm (Staff) và Hướng dẫn viên thám hiểm (Guide) trên toàn hệ thống.
          </p>
        </div>
        <Button
          variant="accent"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
        >
          Thêm Nhân Sự Mới
        </Button>
      </div>

      {/* Main Page Alert */}
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
            <span className="font-medium">{pageMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setPageMessage(null)}
            className="text-xs font-bold text-[#111D16] hover:underline cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {guideCredentials && (
        <Card padding="md" className="border-emerald-300 bg-emerald-50">
          <div className="flex items-start justify-between gap-4 text-xs text-emerald-950">
            <div className="space-y-1">
              <p className="font-bold">Tài khoản hướng dẫn viên đã được tạo: {guideCredentials.guide.displayName}</p>
              <p>Email: {guideCredentials.email}</p>
              <p>Mật khẩu tạm: <code className="select-all font-bold">{guideCredentials.temporaryPassword}</code></p>
              <p>{guideCredentials.emailSent ? 'Thông tin đăng nhập đã được gửi qua email.' : 'Email chưa gửi được; hãy bàn giao thông tin này qua kênh bảo mật.'}</p>
              <p className="text-[11px]">Mật khẩu chỉ hiển thị trong phiên hiện tại. Hướng dẫn viên cần đổi mật khẩu sau lần đăng nhập đầu tiên.</p>
            </div>
            <button type="button" onClick={() => setGuideCredentials(null)} className="font-bold underline shrink-0">Đóng</button>
          </div>
        </Card>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] shadow-xs">
          <div className="text-[10px] font-bold text-[#5C665F] uppercase flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#152A20]" />
            <span>Tổng nhân sự</span>
          </div>
          <div className="text-2xl font-bold text-[#111D16] mt-1 font-headline">{personnel.length}</div>
        </div>

        <div className="p-4 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] shadow-xs">
          <div className="text-[10px] font-bold text-[#152A20] uppercase flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#152A20]" />
            <span>Cán bộ chi nhánh (Staff)</span>
          </div>
          <div className="text-2xl font-bold text-[#152A20] mt-1 font-headline">{staffCount}</div>
        </div>

        <div className="p-4 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] shadow-xs">
          <div className="text-[10px] font-bold text-[#D97845] uppercase flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#D97845]" />
            <span>Hướng dẫn viên (Guide)</span>
          </div>
          <div className="text-2xl font-bold text-[#D97845] mt-1 font-headline">{guideCount}</div>
        </div>

        <div className="p-4 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] shadow-xs">
          <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đang hoạt động</span>
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-1 font-headline">{activeCount}</div>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex bg-[#EBE6DC] p-1 rounded-xs border border-[#D8D2C5] max-w-md">
        <button
          type="button"
          onClick={() => setRoleTab('ALL')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xs transition cursor-pointer text-center ${
            roleTab === 'ALL'
              ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
              : 'text-[#5C665F] hover:text-[#111D16]'
          }`}
        >
          Tất Cả ({personnel.length})
        </button>
        <button
          type="button"
          onClick={() => setRoleTab('STAFF')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xs transition cursor-pointer text-center ${
            roleTab === 'STAFF'
              ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
              : 'text-[#5C665F] hover:text-[#111D16]'
          }`}
        >
          Staff ({staffCount})
        </button>
        <button
          type="button"
          onClick={() => setRoleTab('GUIDE')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xs transition cursor-pointer text-center ${
            roleTab === 'GUIDE'
              ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
              : 'text-[#5C665F] hover:text-[#111D16]'
          }`}
        >
          Guide ({guideCount})
        </button>
      </div>

      {/* Filters & Search */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7A857E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className={`${inputCls} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên nhân sự, chức danh, email, số điện thoại..."
            />
          </div>

          <div className="sm:w-72">
            <select
              className={inputCls}
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="ALL">Tất cả chi nhánh & hướng dẫn viên</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  Trực thuộc: {b.name}
                </option>
              ))}
              <option value="GUIDE_GLOBAL">Hướng dẫn viên lưu động (Toàn hệ thống)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Personnel Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#5C665F]">
          <Loader2 className="w-6 h-6 animate-spin text-[#152A20] mx-auto mb-2" />
          Đang tải danh sách nhân sự & hướng dẫn viên...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const isGuide = p.role === 'GUIDE';
            const initials = (p.userName || 'P')
              .split(' ')
              .filter(Boolean)
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card key={`${p.role}-${p.id}`} padding="md" className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {isGuide && p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-[#D8D2C5] shrink-0" />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-xs text-white flex items-center justify-center font-bold text-sm shrink-0 ${
                          isGuide ? 'bg-[#D97845]' : 'bg-[#152A20]'
                        }`}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-[#111D16] font-headline truncate">{p.userName}</h3>
                        <Badge variant={isGuide ? 'warning' : 'primary'}>
                          {isGuide ? 'GUIDE' : 'STAFF'}
                        </Badge>
                      </div>
                      <div className="text-xs text-[#5C665F] flex items-center gap-1 mt-0.5">
                        {isGuide ? <Compass className="w-3 h-3 text-[#D97845]" /> : <Briefcase className="w-3 h-3" />}
                        <span>{p.position || (isGuide ? 'Hướng dẫn viên leo núi' : 'Cán bộ chi nhánh')}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={p.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {p.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5C665F] pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#7A857E] shrink-0" />
                    <span className="truncate">{p.branchName}</span>
                  </div>
                  {p.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#7A857E] shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  {p.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#7A857E] shrink-0" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                </div>

                {isGuide && (p.languages?.length || p.bio) && (
                  <div className="text-xs text-[#5C665F] space-y-1">
                    {p.languages?.length ? <p><strong>Languages:</strong> {p.languages.join(', ')}</p> : null}
                    {p.bio ? <p className="line-clamp-2">{p.bio}</p> : null}
                  </div>
                )}

                <div className="pt-2 border-t border-[#D8D2C5] flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    onClick={() => openEdit(p)}
                  >
                    Sửa
                  </Button>
                  {isGuide && (
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[#D8D2C5] bg-[#EBE6DC] text-[#111D16] text-xs font-bold cursor-pointer hover:bg-white">
                      <Upload className="w-3.5 h-3.5" /> Ảnh
                      <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={(e) => void uploadGuideAvatar(p, e.target.files?.[0])} />
                    </label>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={p.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    onClick={() => toggleStatus(p)}
                  >
                    {p.status === 'ACTIVE' ? 'Khóa' : 'Mở'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => setDeletingPersonnel(p)}
                  >
                    Xóa
                  </Button>
                </div>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full p-8 text-center bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-xs text-[#5C665F]">
              <Users className="w-8 h-8 text-[#7A857E] mx-auto mb-2 opacity-50" />
              Không có nhân sự hoặc hướng dẫn viên nào phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      )}

      {/* POPUP 1: MODAL THÊM MỚI NHÂN SỰ (STAFF / GUIDE) */}
      <Modal isOpen={createOpen} onClose={closeCreateModal} title="Thêm Nhân Sự Mới" maxWidth="lg">
        <form onSubmit={handleCreate} className="space-y-4 font-label">
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
                className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
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
              <label className={labelCls}>Email Đăng Nhập *</label>
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
                placeholder="nhansu@terrapeak.vn"
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
              <label className={labelCls}>Vai trò nhân sự *</label>
              <select
                disabled={saving}
                className={inputCls}
                value={createForm.role}
                onChange={(e) => {
                  const r = e.target.value;
                  setCreateError(null);
                  setCreateForm({
                    ...createForm,
                    role: r,
                    branchId: r === 'GUIDE' ? '' : createForm.branchId,
                  });
                }}
              >
                <option value="STAFF">Nhân viên chi nhánh (STAFF)</option>
                <option value="GUIDE">Hướng dẫn viên leo núi (GUIDE)</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>
                Chi nhánh phân công {createForm.role === 'STAFF' ? '*' : '(Không áp dụng)'}
              </label>
              <select
                required={createForm.role === 'STAFF'}
                disabled={saving || createForm.role === 'GUIDE'}
                className={inputCls}
                value={createForm.branchId}
                onChange={(e) => {
                  setCreateError(null);
                  setCreateForm({ ...createForm, branchId: e.target.value });
                }}
              >
                {createForm.role === 'GUIDE' ? (
                  <option value="">— Hướng dẫn viên không trực thuộc chi nhánh cố định —</option>
                ) : (
                  <>
                    <option value="">— Chọn chi nhánh phân công —</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.status === 'ACTIVE' ? 'Hoạt động' : 'Khóa'})
                      </option>
                    ))}
                  </>
                )}
              </select>
              {createForm.role === 'GUIDE' && (
                <p className="text-[10px] text-[#7A857E] mt-1 italic">
                  * Hướng dẫn viên phụ trách các tour thám hiểm toàn hệ thống, không gán cố định vào chi nhánh trạm.
                </p>
              )}
            </div>

            <div>
              <label className={labelCls}>Chức vụ / Vị trí</label>
              <input
                disabled={saving}
                className={inputCls}
                value={createForm.position}
                onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                placeholder={
                  createForm.role === 'GUIDE'
                    ? 'Trưởng đoàn / Hướng dẫn viên địa hình...'
                    : 'Nhân viên quầy / Quản lý kho...'
                }
              />
            </div>

            {createForm.role === 'GUIDE' && (
              <>
                <div>
                  <label className={labelCls}>Chuyên môn dẫn đoàn *</label>
                  <input
                    required
                    disabled={saving}
                    className={inputCls}
                    value={createForm.specialization}
                    onChange={(e) => setCreateForm({ ...createForm, specialization: e.target.value })}
                    placeholder="Trekking, camping, first aid..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Ngôn ngữ</label>
                  <input
                    disabled={saving}
                    className={inputCls}
                    value={createForm.languages}
                    onChange={(e) => setCreateForm({ ...createForm, languages: e.target.value })}
                    placeholder="Vietnamese, English"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Giới thiệu hồ sơ</label>
                  <textarea
                    disabled={saving}
                    className={inputCls}
                    rows={3}
                    value={createForm.bio}
                    onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                    placeholder="Kinh nghiệm và phong cách dẫn đoàn..."
                  />
                </div>
              </>
            )}
          </div>

          <p className="text-[11px] text-[#7A857E] bg-[#EBE6DC] p-2.5 rounded-xs border border-[#D8D2C5]">
            * Để đảm bảo tính bảo mật, hệ thống sẽ tự động cấp mật khẩu an toàn và gửi trực tiếp vào hòm thư email của nhân sự để đăng nhập.
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
              {saving ? 'Đang tạo...' : 'Tạo Tài Khoản'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* POPUP 2: MODAL SỬA NHÂN SỰ */}
      <Modal
        isOpen={!!editing}
        onClose={closeEdit}
        title={`Chỉnh Sửa ${editing?.role === 'GUIDE' ? 'Hướng Dẫn Viên' : 'Nhân Viên'} — ${editing?.userName || ''}`}
        maxWidth="lg"
      >
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
                className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div>
            <label className={labelCls}>Họ và tên *</label>
            <input
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
            <label className={labelCls}>Số điện thoại</label>
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

          {editing?.role === 'STAFF' && (
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
          )}

          {editing?.role === 'GUIDE' && (
            <>
              <div>
                <label className={labelCls}>Chuyên môn dẫn đoàn *</label>
                <input required disabled={saving} className={inputCls} value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Ngôn ngữ</label>
                <input disabled={saving} className={inputCls} value={editForm.languages} onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })} placeholder="Vietnamese, English" />
              </div>
              <div>
                <label className={labelCls}>Giới thiệu hồ sơ</label>
                <textarea disabled={saving} className={inputCls} rows={3} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
              </div>
            </>
          )}

          <div>
            <label className={labelCls}>Chức vụ / Vị trí</label>
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

      {/* POPUP 3: MODAL XÁC NHẬN XÓA NHÂN SỰ */}
      <Modal
        isOpen={!!deletingPersonnel}
        onClose={() => setDeletingPersonnel(null)}
        title={`Xác Nhận Xóa ${deletingPersonnel?.role === 'GUIDE' ? 'Hướng Dẫn Viên' : 'Nhân Viên'}`}
        maxWidth="md"
      >
        <div className="space-y-4 font-label">
          <p className="text-xs text-[#111D16]">
            Bạn có chắc chắn muốn xóa {deletingPersonnel?.role === 'GUIDE' ? 'hướng dẫn viên' : 'nhân viên'}{' '}
            <strong>{deletingPersonnel?.userName}</strong>
            {deletingPersonnel?.role === 'STAFF' && ` khỏi chi nhánh ${deletingPersonnel?.branchName}`}?
          </p>
          <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xs border border-amber-200 leading-relaxed">
            ⚠️ <strong>Lưu ý:</strong> Thao tác này sẽ gỡ bỏ tài khoản nhân sự. Nếu nhân sự đã từng ký duyệt giao nhận thiết bị hoặc tour thám hiểm, dữ liệu lịch sử sẽ được bảo lưu an toàn.
          </div>
          <div className="pt-3 border-t border-[#D8D2C5] flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={deleting}
              onClick={() => setDeletingPersonnel(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={deleting}
              icon={deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              onClick={handleDeletePersonnel}
            >
              {deleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
