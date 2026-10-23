import React, { useCallback, useEffect, useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import {
  MapPin,
  Phone,
  Plus,
  Search,
  Pencil,
  Lock,
  Unlock,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { catalogApi, Branch } from '../../features/equipment/catalogApi';

interface StaffRow {
  id: number;
  userName: string;
  position: string | null;
  status: string;
}

const emptyForm = { name: '', phone: '', address: '', status: 'ACTIVE' };
const inputCls =
  'w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]';
const labelCls = 'text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider';

export const AdminBranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [staffBranch, setStaffBranch] = useState<Branch | null>(null);
  const [staffRows, setStaffRows] = useState<StaffRow[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const notify = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4500);
  };

  const load = useCallback(async () => {
    try {
      setBranches((await catalogApi<Branch[]>('/branches')) || []);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Không thể tải danh sách chi nhánh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditing(b);
    setFormError(null);
    setForm({
      name: b.name,
      phone: b.phone || '',
      address: b.address || '',
      status: b.status,
    });
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body = JSON.stringify({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        status: form.status,
      });
      if (editing) {
        await catalogApi<Branch>(`/branches/${editing.id}`, { method: 'PUT', body });
        notify('ok', `Đã cập nhật chi nhánh "${form.name}".`);
      } else {
        await catalogApi<Branch>('/branches', { method: 'POST', body });
        notify('ok', `Đã tạo chi nhánh mới "${form.name}".`);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể lưu chi nhánh.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (b: Branch) => {
    const next = b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (
      next === 'INACTIVE' &&
      !window.confirm(`Khóa chi nhánh "${b.name}"? Chi nhánh sẽ ngừng hoạt động.`)
    )
      return;
    try {
      try {
        await catalogApi<Branch>(`/branches/${b.id}/status?status=${next}`, { method: 'PUT' });
      } catch (_) {
        await catalogApi<Branch>(`/branches/${b.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: b.name,
            phone: b.phone || '',
            address: b.address || '',
            status: next,
          }),
        });
      }
      notify('ok', next === 'ACTIVE' ? 'Đã mở lại chi nhánh.' : 'Đã khóa chi nhánh.');
      await load();
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Không thể đổi trạng thái.');
    }
  };

  const openStaff = async (b: Branch) => {
    setStaffBranch(b);
    setStaffRows([]);
    setStaffLoading(true);
    try {
      setStaffRows((await catalogApi<StaffRow[]>(`/staff/branch/${b.id}`)) || []);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Không thể tải nhân viên.');
    } finally {
      setStaffLoading(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = branches.filter(
    (b) =>
      (statusFilter === 'ALL' || b.status === statusFilter) &&
      (!q ||
        b.name.toLowerCase().includes(q) ||
        (b.address || '').toLowerCase().includes(q) ||
        (b.phone || '').includes(q)),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Badge variant="primary">{branches.length} CHI NHÁNH</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Quản Lý Chi Nhánh
          </h1>
          <p className="text-xs text-[#5C665F]">Tạo, chỉnh sửa và khóa/mở chi nhánh.</p>
        </div>
        <Button variant="accent" size="md" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Thêm Chi Nhánh
        </Button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xs border text-xs flex items-center gap-2 ${
            message.type === 'ok'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-700'
          }`}
        >
          {message.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#F8F6F1] p-3 rounded-xs border border-[#D8D2C5]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#7A857E] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên, địa chỉ hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-[#152A20]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 px-3 text-xs focus:outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Đã khóa</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-[#5C665F]">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b) => (
            <Card key={b.id} padding="md" className="space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xs bg-[#152A20] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[#111D16] font-headline truncate">
                        {b.name}
                      </h3>
                      <span className="text-[10px] text-[#7A857E]">Mã #{b.id}</span>
                    </div>
                  </div>
                  <Badge variant={b.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {b.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                  </Badge>
                </div>
                <div className="text-xs text-[#5C665F] space-y-1">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{b.address || 'Chưa cập nhật địa chỉ'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{b.phone || 'Chưa cập nhật SĐT'}</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-[#D8D2C5] flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(b)}>
                  Sửa
                </Button>
                <Button size="sm" variant="secondary" icon={<Users className="w-3.5 h-3.5" />} onClick={() => openStaff(b)}>
                  Nhân viên
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={b.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  onClick={() => toggleStatus(b)}
                >
                  {b.status === 'ACTIVE' ? 'Khóa' : 'Mở'}
                </Button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full p-8 text-center bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-xs text-[#5C665F]">
              Không có chi nhánh nào.
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Sửa Chi Nhánh' : 'Thêm Chi Nhánh Mới'}
        maxWidth="lg"
      >
        <form onSubmit={submit} className="space-y-4 font-label">
          {formError && (
            <div className="p-3 rounded-xs bg-red-50 border border-red-300 text-red-700 text-xs flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-xs font-bold text-red-700 hover:underline"
              >
                ✕
              </button>
            </div>
          )}

          <div>
            <label className={labelCls}>Tên chi nhánh *</label>
            <input
              required
              disabled={saving}
              className={inputCls}
              value={form.name}
              onChange={(e) => {
                setFormError(null);
                setForm({ ...form, name: e.target.value });
              }}
              placeholder="VD: Sa Pa Alpine Outpost"
            />
          </div>
          <div>
            <label className={labelCls}>Địa chỉ</label>
            <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Số điện thoại</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Trạng thái</label>
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Đã khóa</option>
              </select>
            </div>
          </div>
          <div className="pt-3 border-t border-[#D8D2C5] flex justify-end gap-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setFormOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="accent" size="md" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!staffBranch}
        onClose={() => setStaffBranch(null)}
        title={`Nhân viên — ${staffBranch?.name || ''}`}
        maxWidth="lg"
      >
        <div className="space-y-2 font-label">
          {staffLoading && <p className="text-xs text-[#5C665F]">Đang tải...</p>}
          {!staffLoading && staffRows.length === 0 && (
            <p className="text-xs text-[#5C665F]">Chi nhánh chưa có nhân viên.</p>
          )}
          {staffRows.map((s) => (
            <div key={s.id} className="p-3 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-[#111D16]">{s.userName}</div>
                <div className="text-[#5C665F]">{s.position || 'Chưa có chức vụ'}</div>
              </div>
              <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>
                {s.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
              </Badge>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
