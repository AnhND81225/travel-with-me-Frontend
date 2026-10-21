import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import {
  MapPin,
  Radio,
  Thermometer,
  Wind,
  ShieldCheck,
  PhoneCall,
  Layers,
  Plus,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Building,
  Compass,
} from 'lucide-react';
import { OutpostStation, StationStatus } from '../../interfaces';
import { catalogApi, Branch } from '../../features/equipment/catalogApi';

export const AdminBranchesPage: React.FC = () => {
  const [branchesList, setBranchesList] = useState<OutpostStation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch branches directly from backend API on mount
  React.useEffect(() => {
    let alive = true;
    catalogApi<Branch[]>('/branches')
      .then((apiBranches) => {
        if (alive && apiBranches) {
          const mapped: OutpostStation[] = apiBranches.map((b) => ({
            id: `branch-${b.id}`,
            name: b.name,
            code: `DEPOT-${b.id}`,
            elevation: '1,500M',
            coordinates: '21.0285° N, 105.8542° E',
            region: b.address || 'Việt Nam',
            address: b.address || 'Chưa cập nhật địa chỉ',
            phone: b.phone || 'Chưa cập nhật SĐT',
            operatingHours: '06:00 - 21:00 Hàng ngày',
            staffCount: 0,
            depotManager: 'Trưởng trạm quản lý',
            status: b.status === "ACTIVE" ? "OPTIMAL" : "ALPINE_WARNING",
            weather: {
              temp: '18°C',
              condition: 'Ổn định',
              wind: '12 km/h',
              visibility: '10 km',
            },
            inventorySummary: {
              tentsAvailable: 0,
              packsAvailable: 0,
              hardwareAvailable: 0,
              totalUnits: 0,
            },
          }));
          setBranchesList(mapped);
        }
      })
      .catch((err) => {
        console.warn("Không thể tải danh sách chi nhánh từ backend /branches:", err);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Form State for Registering New Branch / Outpost Station
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    region: 'Tây Bắc',
    elevation: '1,600m MSL',
    coordinates: '22.3033° N, 103.7753° E',
    address: '',
    phone: '1900-TERRAPEAK',
    depotManager: 'Ranger Phan Anh',
    status: 'OPTIMAL' as StationStatus,
    temp: '14°C',
    wind: '18 km/h NNW',
    visibility: '12 km Clear',
    tentsAvailable: 25,
    packsAvailable: 35,
    hardwareAvailable: 50,
  });

  const handleRegisterBranch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.address) {
      alert('Vui lòng điền đầy đủ Tên chi nhánh, Mã phân khu và Địa chỉ trạm.');
      return;
    }

    const totalUnits =
      Number(formData.tentsAvailable) +
      Number(formData.packsAvailable) +
      Number(formData.hardwareAvailable);

    const newBranch: OutpostStation = {
      id: `outpost-${formData.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
      name: formData.name,
      code: formData.code.toUpperCase(),
      elevation: formData.elevation,
      coordinates: formData.coordinates,
      region: formData.region,
      address: formData.address,
      phone: formData.phone,
      depotManager: formData.depotManager,
      status: formData.status,
      weather: {
        temp: formData.temp,
        condition: 'Stable Alpine Ridge',
        wind: formData.wind,
        visibility: formData.visibility,
      },
      inventorySummary: {
        tentsAvailable: Number(formData.tentsAvailable),
        packsAvailable: Number(formData.packsAvailable),
        hardwareAvailable: Number(formData.hardwareAvailable),
        totalUnits: totalUnits,
      },
    };

    setBranchesList([newBranch, ...branchesList]);
    setIsRegisterModalOpen(false);
    setNotification(`Đã đăng ký chi nhánh trạm mới: "${newBranch.name}" (${newBranch.code}) thành công!`);
    setTimeout(() => setNotification(null), 5000);

    // Call backend API to persist if endpoint is available
    // Call backend API to persist to database
    catalogApi<Branch>('/branches', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        status: formData.status === 'OPTIMAL' ? 'ACTIVE' : 'INACTIVE',
      }),
    })
      .then((createdBranch) => {
        if (createdBranch?.id) {
          setBranchesList((prev) =>
            prev.map((b) => (b.id === newBranch.id ? { ...b, id: `branch-${createdBranch.id}`, name: createdBranch.name } : b))
          );
        }
      })
      .catch((err) => {
        console.info('Backend /branches creation endpoint error or fallback:', err);
      });

    // Reset Form
    setFormData({
      name: '',
      code: '',
      region: 'Tây Bắc',
      elevation: '1,600m MSL',
      coordinates: '22.3033° N, 103.7753° E',
      address: '',
      phone: '1900-TERRAPEAK',
      depotManager: 'Ranger Phan Anh',
      status: 'OPTIMAL',
      temp: '14°C',
      wind: '18 km/h NNW',
      visibility: '12 km Clear',
      tentsAvailable: 25,
      packsAvailable: 35,
      hardwareAvailable: 50,
    });
  };

  const filteredBranches = branchesList.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || st.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      {/* Page Header */}
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">LOGISTICS INFRASTRUCTURE</Badge>
            <span className="text-xs text-[#5C665F]">
              {branchesList.length} TRẠM DEPOTS TRÊN TOÀN QUỐC
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Quản Lý & Đăng Ký Chi Nhánh Trạm Outpost
          </h1>
          <p className="text-xs text-[#5C665F]">
            Mạng lưới điều phối kho trang bị leo núi, trạm tiếp sóng viễn thông và trung tâm giao nhận thiết bị hiện trường.
          </p>
        </div>

        <Button
          variant="accent"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsRegisterModalOpen(true)}
        >
          Đăng Ký Chi Nhánh Mới
        </Button>
      </div>

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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#F8F6F1] p-3 rounded-xs border border-[#D8D2C5]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#7A857E] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm chi nhánh theo tên trạm, mã phân khu, khu vực địa lý hoặc địa chỉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#5C665F] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 px-3 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
          >
            <option value="ALL">Tất cả trạng thái ({branchesList.length})</option>
            <option value="OPTIMAL">OPTIMAL (Ổn định)</option>
            <option value="HIGH_DEMAND">HIGH DEMAND (Nhu cầu cao)</option>
            <option value="ALPINE_WARNING">ALPINE WARNING (Cảnh báo thời tiết)</option>
          </select>
        </div>
      </div>

      {/* Grid of Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((st) => (
          <Card key={st.id} padding="md" className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#D8D2C5]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xs bg-[#152A20] flex items-center justify-center text-white shrink-0">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#111D16] font-headline">{st.name}</h3>
                    <span className="text-[10px] text-[#7A857E] font-mono-spec">
                      SECTOR {st.code} • {st.region}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    st.status === 'OPTIMAL'
                      ? 'success'
                      : st.status === 'HIGH_DEMAND'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {st.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div className="text-xs text-[#5C665F] space-y-1">
                <div>
                  Địa chỉ: <strong className="text-[#111D16] font-body">{st.address}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>
                    Độ cao: <strong className="text-[#111D16]">{st.elevation}</strong>
                  </span>
                  {st.depotManager && (
                    <span className="text-[11px] text-[#5C665F]">
                      Trưởng trạm: <strong className="text-[#152A20]">{st.depotManager}</strong>
                    </span>
                  )}
                </div>
                <div>
                  Tọa độ GPS:{' '}
                  <span className="font-mono-spec text-[11px] text-[#7A857E]">
                    {st.coordinates}
                  </span>
                </div>
                <div>
                  Hotline trạm:{' '}
                  <span className="font-mono-spec text-[11px] text-[#111D16] font-bold">
                    {st.phone}
                  </span>
                </div>
              </div>

              {/* Station Weather Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#D8D2C5]">
                <div className="p-2 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5]">
                  <span className="text-[9px] text-[#7A857E] font-bold block uppercase flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-[#D97845]" />
                    NHIỆT ĐỘ TRẠM
                  </span>
                  <span className="font-bold text-[#D97845] font-mono-spec">{st.weather.temp}</span>
                </div>
                <div className="p-2 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5]">
                  <span className="text-[9px] text-[#7A857E] font-bold block uppercase flex items-center gap-1">
                    <Wind className="w-3 h-3 text-[#152A20]" />
                    SỨC GIÓ
                  </span>
                  <span className="font-bold text-[#111D16] font-mono-spec">{st.weather.wind}</span>
                </div>
              </div>

              {/* Inventory Breakdown */}
              <div className="p-2.5 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5] text-xs space-y-1">
                <span className="text-[10px] text-[#7A857E] font-bold block uppercase">
                  TỒN KHO TRANG BỊ HIỆN TẠI:
                </span>
                <div className="grid grid-cols-3 gap-1 text-center font-mono-spec text-[11px]">
                  <div>
                    <strong className="text-[#111D16]">{st.inventorySummary.tentsAvailable}</strong>{' '}
                    Lều
                  </div>
                  <div>
                    <strong className="text-[#111D16]">{st.inventorySummary.packsAvailable}</strong>{' '}
                    Balo
                  </div>
                  <div>
                    <strong className="text-[#111D16]">
                      {st.inventorySummary.hardwareAvailable}
                    </strong>{' '}
                    Kỹ thuật
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#D8D2C5] flex justify-between items-center text-xs">
              <span className="text-[11px] text-[#7A857E] font-mono-spec">
                Sức chứa: {st.inventorySummary.totalUnits} Units
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  alert(`Đã chọn điều hướng quản lý trạm: ${st.name} (Code: ${st.code})`)
                }
              >
                Quản Lý Kho Trạm
              </Button>
            </div>
          </Card>
        ))}

        {filteredBranches.length === 0 && (
          <div className="col-span-full p-8 text-center bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-[#5C665F]">
            <MapPin className="w-8 h-8 text-[#7A857E] mx-auto mb-2 opacity-50" />
            <p className="font-bold text-xs">Không tìm thấy chi nhánh nào khớp với bộ lọc.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
            >
              Đặt lại tìm kiếm
            </Button>
          </div>
        )}
      </div>

      {/* Modal: Đăng Ký Chi Nhánh Mới (Outpost Station Registration) */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Đăng Ký Trạm Chi Nhánh Mới (Outpost Depot)"
        badge="LOGISTICS EXPANSION"
        maxWidth="2xl"
      >
        <form onSubmit={handleRegisterBranch} className="space-y-4 font-label">
          <p className="text-xs text-[#5C665F] font-body">
            Thiết lập trạm Outpost mới vào mạng lưới hậu cần quốc gia TerraPeak. Thông số sau khi lưu sẽ đồng bộ với hệ thống bản đồ trạm và kho thiết bị.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Tên Chi Nhánh / Trạm Outpost *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Fansipan Alpine Ridge Outpost"
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Mã Phân Khu (Sector Code) *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="FP-05"
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Khu Vực Địa Lý
              </label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              >
                <option value="Tây Bắc">Tây Bắc (Hoàng Liên Sơn)</option>
                <option value="Đông Bắc">Đông Bắc (Hà Giang, Cao Bằng)</option>
                <option value="Bắc Trung Bộ">Bắc Trung Bộ (Phong Nha, Kẻ Bàng)</option>
                <option value="Tây Nguyên">Tây Nguyên (Đà Lạt, Bidoup)</option>
                <option value="Nam Trung Bộ">Duyên hải Nam Trung Bộ (Đà Nẵng, Bạch Mã)</option>
                <option value="Đông Nam Bộ">Đông Nam Bộ (TP. Hồ Chí Minh)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Độ Cao So Với Mực Nước Biển (Elevation)
              </label>
              <input
                type="text"
                value={formData.elevation}
                onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                placeholder="2,800m MSL"
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
              Địa Chỉ Thực Tế Của Trạm *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Trạm kiểm lâm Tôn Đức Thắng, Bản Cát Cát, Sa Pa, Lào Cai"
              className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Tọa Độ GPS (GPS Coordinates)
              </label>
              <input
                type="text"
                value={formData.coordinates}
                onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                placeholder="22.3033° N, 103.7753° E"
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Hotline Trực Ban Khẩn Cấp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+84 214 387 1999"
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Trưởng Trạm / Quản Lý Phụ Trách
              </label>
              <input
                type="text"
                value={formData.depotManager}
                onChange={(e) => setFormData({ ...formData, depotManager: e.target.value })}
                placeholder="Ranger Nguyễn Quốc Hưng"
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                Trạng Thái Ban Đầu Của Trạm
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StationStatus })}
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              >
                <option value="OPTIMAL">OPTIMAL (Sẵn sàng phục vụ)</option>
                <option value="HIGH_DEMAND">HIGH DEMAND (Đang đón lượng khách lớn)</option>
                <option value="ALPINE_WARNING">ALPINE WARNING (Khuyến cáo thời tiết khắc nghiệt)</option>
              </select>
            </div>
          </div>

          {/* Initial Inventory Allocation */}
          <div className="p-3 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5] space-y-2">
            <span className="text-[10px] font-bold text-[#152A20] uppercase block tracking-wider">
              PHÂN BỔ TRANG BỊ BAN ĐẦU CHO TRẠM (INITIAL INVENTORY):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-[#5C665F] block font-bold">Số Lượng Lều (Tents)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.tentsAvailable}
                  onChange={(e) => setFormData({ ...formData, tentsAvailable: Number(e.target.value) })}
                  className="w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-1.5 text-xs text-[#111D16]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#5C665F] block font-bold">Balo Dã Ngoại (Packs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.packsAvailable}
                  onChange={(e) => setFormData({ ...formData, packsAvailable: Number(e.target.value) })}
                  className="w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-1.5 text-xs text-[#111D16]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#5C665F] block font-bold">Đồ Cứng Kỹ Thuật (Axes/Crampons)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.hardwareAvailable}
                  onChange={(e) => setFormData({ ...formData, hardwareAvailable: Number(e.target.value) })}
                  className="w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-1.5 text-xs text-[#111D16]"
                />
              </div>
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
              Xác Nhận Đăng Ký Chi Nhánh
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
