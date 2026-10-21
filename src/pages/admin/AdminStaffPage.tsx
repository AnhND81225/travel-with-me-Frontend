import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Input, Select } from '../../components/ui';
import {
  Users,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Search,
  Filter,
  Lock,
  Award,
  Sparkles,
} from 'lucide-react';
import { catalogApi, Account, Branch } from '../../features/equipment/catalogApi';

interface StaffMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  station: string;
  certifications: string[];
  status: 'ON_DUTY' | 'IN_FIELD' | 'STANDBY';
}

const AVAILABLE_CERTIFICATIONS = [
  'UIAGM Alpine Rigging',
  'Autoclave Bio-Clear',
  'Wilderness First Responder (WFR)',
  'IFMGA Mountain Guide',
  'Avalanche Safety Level 3',
  'Cave Rescue Level 2',
  'Single Rope Technique (SRT)',
  'Radio Telemetry Operator',
  'ISO 9001 Lead Auditor',
  'High-Altitude Medical Specialist',
];

export const AdminStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [tempPasswordNotice, setTempPasswordNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real users and branches from backend API on mount
  React.useEffect(() => {
    let alive = true;

    // Load branches from /branches
    catalogApi<Branch[]>('/branches')
      .then((apiBranches) => {
        if (alive && apiBranches && apiBranches.length > 0) {
          setBranches(apiBranches);
        }
      })
      .catch((err) => {
        console.warn('Không thể tải danh sách chi nhánh từ backend:', err);
      });

    // Load users from /users
    catalogApi<Account[]>('/users')
      .then((users) => {
        if (alive && users && users.length > 0) {
          // Filter staff / guide / admin users
          const internalUsers = users.filter(
            (u) => u.role === 'ADMIN' || u.role === 'STAFF' || u.role === 'GUIDE'
          );

          const mapped: StaffMember[] = internalUsers.map((u) => ({
            id: `usr-${u.id}`,
            name: u.fullName,
            email: u.email,
            phone: u.phone || 'Chưa cập nhật',
            role:
              u.role === 'ADMIN'
                ? 'Head Station Armourer'
                : u.role === 'GUIDE'
                ? 'Lead Mountain Guide'
                : 'Station Operations Staff',
            station: 'Toàn hệ thống Outpost',
            certifications:
              u.role === 'GUIDE'
                ? ['IFMGA Mountain Guide', 'Wilderness First Responder (WFR)']
                : ['UIAGM Alpine Rigging', 'Autoclave Bio-Clear'],
            status: u.status === 'ACTIVE' ? 'ON_DUTY' : 'STANDBY',
          }));
          setStaffList(mapped);
        }
      })
      .catch((err) => {
        console.warn('Không thể tải danh sách nhân sự từ backend /users:', err);
      });

    return () => {
      alive = false;
    };
  }, []);

  // Form State for Registering New Staff / Field Ranger
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Station Operations Staff',
    station: '',
    branchId: '',
    status: 'ON_DUTY' as 'ON_DUTY' | 'IN_FIELD' | 'STANDBY',
    certifications: [] as string[],
  });

  const toggleCertification = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert('Vui lòng điền đầy đủ họ tên và email công vụ.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine role for internal user API: 'STAFF' | 'GUIDE'
      const apiRole = formData.role.includes('Guide') ? 'GUIDE' : 'STAFF';

      // 1. Call real backend API: POST /api/users/internal
      const createdUser = await catalogApi<{
        id: number;
        fullName: string;
        email: string;
        phone?: string;
        role: string;
        status: string;
        temporaryPassword?: string;
        message?: string;
      }>('/users/internal', {
        method: 'POST',
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone || '0901234567',
          role: apiRole,
        }),
      });

      // 2. If branch selected, assign staff to branch via POST /api/staff
      if (formData.branchId && createdUser?.id) {
        await catalogApi('/staff', {
          method: 'POST',
          body: JSON.stringify({
            branchId: Number(formData.branchId),
            userId: createdUser.id,
            position: formData.role,
            status: 'ACTIVE',
          }),
        }).catch((err) => console.warn('Could not link staff to branch:', err));
      }

      // Add to local state
      const newStaff: StaffMember = {
        id: `usr-${createdUser?.id || Date.now()}`,
        name: createdUser?.fullName || formData.name,
        email: createdUser?.email || formData.email,
        phone: createdUser?.phone || formData.phone || '0901 234 567',
        role: formData.role,
        station: formData.station,
        certifications:
          formData.certifications.length > 0
            ? formData.certifications
            : ['Wilderness First Responder (WFR)'],
        status: formData.status,
      };

      setStaffList([newStaff, ...staffList]);
      setIsRegisterModalOpen(false);

      if (createdUser?.temporaryPassword) {
        setTempPasswordNotice(
          `Cán bộ ${newStaff.name} đã được cấp tài khoản thành công! Mật khẩu khởi tạo: ${createdUser.temporaryPassword}`
        );
      } else {
        setNotification(`Đã tạo tài khoản cán bộ ${newStaff.name} thành công trên hệ thống SBA TreekTour!`);
        setTimeout(() => setNotification(null), 5000);
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Station Operations Staff',
        station: '',
        branchId: '',
        status: 'ON_DUTY',
        certifications: [],
      });
    } catch (err: any) {
      alert(`Lỗi khi tạo nhân sự: ${err?.message || 'Không thể kết nối đến máy chủ BE'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.certifications.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStation = stationFilter === 'ALL' || m.station === stationFilter;
    return matchesSearch && matchesStation;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      {/* Page Header */}
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">HUMAN CAPITAL & ARMOURERS</Badge>
            <span className="text-xs text-[#5C665F]">
              {staffList.length} CÁN BỘ / FIELD RANGERS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Quản Lý & Đăng Ký Tài Khoản Nhân Sự
          </h1>
          <p className="text-xs text-[#5C665F]">
            Hồ sơ nhân viên trực trạm, trưởng đoàn hướng dẫn IFMGA và chuyên viên kiểm định khử khuẩn tại các Outpost.
          </p>
        </div>

        <Button
          variant="accent"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsRegisterModalOpen(true)}
        >
          Đăng Ký Tài Khoản Nhân Sự
        </Button>
      </div>

      {/* Temporary Password Notification Banner */}
      {tempPasswordNotice && (
        <div className="p-4 rounded-xs bg-amber-50 border-2 border-amber-400 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-amber-950 font-headline">Cấp Tài Khoản Cán Bộ Thành Công!</p>
              <p className="mt-0.5 text-xs text-amber-800">{tempPasswordNotice}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                const pwd = tempPasswordNotice.split('Mật khẩu khởi tạo: ')[1];
                if (pwd) navigator.clipboard.writeText(pwd.trim());
                alert('Đã sao chép mật khẩu tạm vào clipboard!');
              }}
              className="px-3 py-1.5 rounded-xs bg-amber-200 text-amber-900 font-bold text-xs hover:bg-amber-300 transition"
            >
              Sao chép mật khẩu
            </button>
            <button
              onClick={() => setTempPasswordNotice(null)}
              className="text-xs text-amber-700 font-bold hover:underline px-2"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {notification && (
        <div className="p-3.5 rounded-xs bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#F8F6F1] p-3 rounded-xs border border-[#D8D2C5]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#7A857E] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên nhân sự, chức danh hoặc chứng chỉ chuyên môn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#5C665F] shrink-0" />
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 px-3 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
          >
            <option value="ALL">Tất cả chi nhánh ({staffList.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStaff.map((member) => (
          <Card key={member.id} padding="md" className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xs bg-[#152A20] text-white flex items-center justify-center font-bold text-sm">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#111D16] font-headline">{member.name}</h3>
                  <div className="text-xs text-[#D97845] font-semibold">{member.role}</div>
                </div>
              </div>
              <Badge
                variant={
                  member.status === 'ON_DUTY'
                    ? 'success'
                    : member.status === 'IN_FIELD'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {member.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="text-xs text-[#5C665F] space-y-1 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#152A20]" />
                <span>
                  Trạm phân công: <strong className="text-[#111D16]">{member.station}</strong>
                </span>
              </div>
              {member.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#7A857E]" />
                  <span className="font-mono-spec text-[11px] text-[#111D16]">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#7A857E]" />
                  <span className="font-mono-spec text-[11px] text-[#5C665F]">{member.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#D8D2C5]">
              <span className="text-[10px] text-[#7A857E] font-bold block uppercase mb-1">
                CHỨNG CHỈ & GIẤY PHÉP THỰC ĐỊA:
              </span>
              <div className="flex flex-wrap gap-1">
                {member.certifications.map((c) => (
                  <span
                    key={c}
                    className="text-[9px] px-1.5 py-0.5 rounded-xs bg-[#EBE6DC] text-[#111D16] border border-[#D8D2C5] font-semibold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {filteredStaff.length === 0 && (
          <div className="col-span-full p-8 text-center bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-[#5C665F]">
            <Users className="w-8 h-8 text-[#7A857E] mx-auto mb-2 opacity-50" />
            <p className="font-bold text-xs">Không tìm thấy cán bộ phù hợp với điều kiện tìm kiếm.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearchQuery('');
                setStationFilter('ALL');
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Modal: Đăng ký Tài Khoản Nhân Sự / Field Ranger */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Đăng Ký Tài Khoản Cán Bộ / Field Ranger"
        badge="HQ CREDENTIALS"
        maxWidth="2xl"
      >
        <form onSubmit={handleRegisterStaff} className="space-y-4 font-label">
          <p className="text-xs text-[#5C665F] font-body">
            Khởi tạo hồ sơ định danh nhân sự, phân bổ trạm công tác và cấp quyền truy cập hệ thống POS / Quản lý kho dã ngoại.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Họ và Tên Nhân Sự *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ranger Lê Văn Hùng"
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Email Công Vụ *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vanhung.ranger@terrapeak.vn"
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Số Điện Thoại Trực Ban
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912 889 001"
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Cơ Chế Bảo Mật & Mật Khẩu
              </label>
              <div className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-[11px] text-[#5C665F] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D97845] shrink-0" />
                <span>Backend SBA sẽ tự động cấp mật khẩu an toàn & gửi mã kích hoạt.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Vị Trí / Chức Danh Công Tác
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              >
                <option value="Head Station Armourer">Head Station Armourer (Trưởng Kho Trang Bị)</option>
                <option value="Lead Mountain Guide">Lead Mountain Guide (Trưởng Đoàn Dẫn Núi)</option>
                <option value="Highland Logistics Coordinator">Highland Logistics (Điều Phối Vận Hành)</option>
                <option value="Speleo Operations Specialist">Speleo Specialist (Chuyên Viên Hang Động)</option>
                <option value="Station Operations Staff">Station Staff (Nhân Viên Quầy POS & Kho)</option>
                <option value="Depot Quartermaster">Depot Quartermaster (Quản Lý Trạm Chi Nhánh)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Phân Bổ Chi Nhánh / Outpost Trực Thuộc
              </label>
              <select
                value={formData.station}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const foundBranch = branches.find((b) => b.name === selectedName);
                  setFormData({
                    ...formData,
                    station: selectedName,
                    branchId: foundBranch ? String(foundBranch.id) : '',
                  });
                }}
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              >
                {branches.length > 0 ? (
                  branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} (Mã: #{b.id} — {b.status})
                    </option>
                  ))
                ) : (
                  <option value="">Chưa có chi nhánh nào được cấu hình</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
              Trạng Thái Ban Đầu
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['ON_DUTY', 'IN_FIELD', 'STANDBY'] as const).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setFormData({ ...formData, status: st })}
                  className={`py-1.5 px-2 rounded-xs border text-xs font-bold uppercase transition ${
                    formData.status === st
                      ? 'bg-[#152A20] text-white border-[#152A20]'
                      : 'bg-[#EBE6DC] text-[#5C665F] border-[#D8D2C5]'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#5C665F] block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#D97845]" />
              Chứng Chỉ & Bằng Cấp Kỹ Thuật (Chọn nhiều):
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5]">
              {AVAILABLE_CERTIFICATIONS.map((cert) => {
                const isSelected = formData.certifications.includes(cert);
                return (
                  <button
                    type="button"
                    key={cert}
                    onClick={() => toggleCertification(cert)}
                    className={`p-1.5 rounded-xs text-[10px] font-semibold text-left transition border ${
                      isSelected
                        ? 'bg-[#152A20] text-white border-[#152A20]'
                        : 'bg-[#F8F6F1] text-[#111D16] border-[#D8D2C5] hover:bg-[#F3EFE6]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cert}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#D8D2C5] flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsRegisterModalOpen(false)}
            >
              Hủy Bỏ
            </Button>
            <Button type="submit" variant="accent" size="md">
              Xác Nhận Đăng Ký Tài Khoản
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
