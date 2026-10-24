import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  ShoppingBag,
  Package,
  MapPin,
  LogOut,
  Save,
  Loader2,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { catalogApi, Account } from '../features/equipment/catalogApi';
import { Button } from './ui';
import { doesAccountRequirePasswordChange, clearAccountPasswordChangeRequirement } from '../utils/firstLoginUtils';

export interface UserProfileViewProps {
  custodyItems?: unknown[];
}

export const UserProfileView: React.FC<UserProfileViewProps> = () => {
  const { account, loading, checkAuth, logout } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');

  // Password tab state
  const isPwdChangeRequired = account?.email ? doesAccountRequirePasswordChange(account.email) : false;
  const [activeTab, setActiveTab] = useState<'INFO' | 'PASSWORD'>(isPwdChangeRequired ? 'PASSWORD' : 'INFO');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    if (account) {
      setFullName(account.fullName || '');
      setPhone(account.phone || '');
      if (doesAccountRequirePasswordChange(account.email)) {
        setActiveTab('PASSWORD');
      }
    }
  }, [account]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (!currentPassword) {
      setPwdError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setIsChangingPwd(true);
    try {
      await catalogApi('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (account?.email) {
        clearAccountPasswordChangeRequirement(account.email);
      }

      setPwdSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err: unknown) {
      setPwdError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setUpdateError('Họ và tên không được để trống.');
      return;
    }

    setIsUpdating(true);
    setUpdateSuccess('');
    setUpdateError('');

    try {
      await catalogApi<Account>('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      await checkAuth();
      setUpdateSuccess('Cập nhật thông tin tài khoản thành công!');
      setTimeout(() => setUpdateSuccess(''), 4000);
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : 'Không thể cập nhật hồ sơ.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center font-label">
        <Loader2 className="w-8 h-8 animate-spin text-[#152A20] mx-auto mb-3" />
        <p className="text-sm text-[#5C665F]">Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center font-label">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#152A20]">Chưa đăng nhập</h3>
        <p className="text-xs text-[#5C665F] mt-1 mb-4">
          Vui lòng đăng nhập để xem thông tin tài khoản của bạn.
        </p>
        <Link to="/login">
          <Button variant="primary">Đăng Nhập Ngay</Button>
        </Link>
      </div>
    );
  }

  const roleLabel =
    account.role === 'ADMIN'
      ? 'Quản trị viên (Admin)'
      : account.role === 'STAFF'
      ? 'Cán bộ trạm (Staff)'
      : 'Thành viên thám hiểm (Customer)';

  const initials = account.fullName
    ? account.fullName
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'TP';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-label">
      {/* Header */}
      <div className="border-b border-[#D8D2C5] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] text-[10px] tracking-wider text-[#152A20] font-bold uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D97845]" />
            <span>HỒ SƠ TÀI KHOẢN • PASSPORT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#152A20] tracking-tight font-headline">
            Thông Tin Cá Nhân
          </h2>
          <p className="text-xs sm:text-sm text-[#5C665F] mt-1 font-body">
            Xem và cập nhật thông tin thành viên kết nối trực tiếp với hệ thống TerraPeak.
          </p>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xs transition cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng Xuất</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Member ID Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Thẻ thành viên phong cách sang trọng */}
          <div className="rounded-xs bg-[#152A20] text-white p-6 shadow-xl relative overflow-hidden font-label space-y-5">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2C4938]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold tracking-wider text-[#D7ECE1]">
                  TERRAPEAK CLIMBER PASSPORT
                </span>
              </div>
              <span className="text-[10px] text-[#ADCBBB] px-2 py-0.5 rounded-xs bg-[#1F3D2B] border border-[#2B4E3C] font-mono font-bold">
                ID #{account.id.toString().padStart(6, '0')}
              </span>
            </div>

            {/* Profile Avatar & Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xs bg-[#1F3D2B] border-2 border-[#D97845] flex items-center justify-center text-xl font-bold text-[#D7ECE1] font-headline shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-white font-headline truncate">
                  {account.fullName}
                </h3>
                <div className="text-xs text-[#ADCBBB] font-body truncate">
                  {account.email || 'Chưa có email'}
                </div>
                <div className="text-xs text-[#D97845] font-bold mt-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#D97845] shrink-0" />
                  <span className="truncate">{roleLabel}</span>
                </div>
              </div>
            </div>

            {/* Key Information Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#1C362A] p-3.5 rounded-xs border border-[#2B4E3C]">
              <div>
                <span className="text-[10px] text-[#ADCBBB] block font-semibold">TRẠNG THÁI</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {account.status === 'ACTIVE' ? 'Đang hoạt động' : account.status}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#ADCBBB] block font-semibold">VAI TRÒ</span>
                <span className="text-white font-bold text-xs mt-0.5 block font-headline">
                  {account.role}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#2B4E3C]">
                <span className="text-[10px] text-[#ADCBBB] block font-semibold">SỐ ĐIỆN THOẠI</span>
                <span className="text-white text-xs font-medium">
                  {account.phone || 'Chưa cập nhật số điện thoại'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Shortcuts */}
          <div className="bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-5 space-y-3 font-label">
            <h4 className="text-xs font-bold text-[#152A20] uppercase tracking-wider mb-2">
              Lối Tắt Truy Cập Nhanh
            </h4>
            <Link
              to="/orders"
              className="flex items-center justify-between p-3 rounded-xs bg-[#EBE6DC] hover:bg-[#E2DDD1] border border-[#D8D2C5] text-xs font-bold text-[#152A20] transition group"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-[#D97845]" />
                <span>Xem Đơn Hàng & Đơn Thuê Của Bạn</span>
              </div>
              <span className="text-[#5C665F] group-hover:text-[#152A20] text-sm">→</span>
            </Link>

            <Link
              to="/shop"
              className="flex items-center justify-between p-3 rounded-xs bg-[#EBE6DC] hover:bg-[#E2DDD1] border border-[#D8D2C5] text-xs font-bold text-[#152A20] transition group"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-[#152A20]" />
                <span>Khám Phá Cửa Hàng Trang Bị</span>
              </div>
              <span className="text-[#5C665F] group-hover:text-[#152A20] text-sm">→</span>
            </Link>

            <Link
              to="/outposts"
              className="flex items-center justify-between p-3 rounded-xs bg-[#EBE6DC] hover:bg-[#E2DDD1] border border-[#D8D2C5] text-xs font-bold text-[#152A20] transition group"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Mạng Lưới Trạm Outpost Toàn Quốc</span>
              </div>
              <span className="text-[#5C665F] group-hover:text-[#152A20] text-sm">→</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Update Profile or Change Password Tabs */}
        <div className="lg:col-span-7 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-6 sm:p-8 space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-[#EBE6DC] p-1 rounded-xs border border-[#D8D2C5]">
            <button
              type="button"
              onClick={() => setActiveTab('INFO')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition cursor-pointer text-center ${
                activeTab === 'INFO'
                  ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
                  : 'text-[#5C665F] hover:text-[#111D16]'
              }`}
            >
              Thông Tin Hồ Sơ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PASSWORD')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'PASSWORD'
                  ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
                  : 'text-[#5C665F] hover:text-[#111D16]'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Đổi Mật Khẩu</span>
              {isPwdChangeRequired && (
                <span className="w-2 h-2 rounded-full bg-[#D97845] animate-pulse"></span>
              )}
            </button>
          </div>

          {/* TAB 1: UPDATE PROFILE */}
          {activeTab === 'INFO' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#152A20] font-headline">
                  Cập Nhật Thông Tin Tài Khoản
                </h3>
                <p className="text-xs text-[#5C665F] font-body mt-1">
                  Thông tin này được đồng bộ và lưu trữ trực tiếp trên cơ sở dữ liệu hệ thống.
                </p>
              </div>

              {updateSuccess && (
                <div className="p-3.5 rounded-xs bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{updateSuccess}</span>
                </div>
              )}

              {updateError && (
                <div className="p-3.5 rounded-xs bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-medium">{updateError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                    Họ và tên
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên đầy đủ"
                      className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2.5 pl-9 pr-3 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20] transition font-body"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                    Địa chỉ Email (Định danh)
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                    <input
                      type="email"
                      disabled
                      value={account.email || ''}
                      className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2.5 pl-9 pr-3 text-xs text-[#5C665F] cursor-not-allowed font-body"
                    />
                  </div>
                  <span className="text-[10px] text-[#7A857E] mt-1 block">
                    * Email dùng để xác thực phiên và không thể thay đổi trực tiếp.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                    Số điện thoại liên lạc
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2.5 pl-9 pr-3 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20] transition font-body"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isUpdating}
                    icon={isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  >
                    {isUpdating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'PASSWORD' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#152A20] font-headline">
                  Thiết Lập Mật Khẩu Mới
                </h3>
                <p className="text-xs text-[#5C665F] font-body mt-1">
                  Đổi mật khẩu định kỳ giúp bảo vệ tài khoản thành viên và quyền truy cập nghiệp vụ nội bộ.
                </p>
              </div>

              {isPwdChangeRequired && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xs text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">Yêu cầu đổi mật khẩu lần đầu:</strong>
                    <span>
                      Tài khoản của bạn vừa được cấp mật khẩu tạm qua Email. Vui lòng đổi mật khẩu mới để đảm bảo tính an toàn.
                    </span>
                  </div>
                </div>
              )}

              {pwdSuccess && (
                <div className="p-3.5 rounded-xs bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{pwdSuccess}</span>
                </div>
              )}

              {pwdError && (
                <div className="p-3.5 rounded-xs bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-medium">{pwdError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                    Mật khẩu hiện tại *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại hoặc mật khẩu tạm..."
                      className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2.5 pl-9 pr-10 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20] transition font-body"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 text-[#7A857E] hover:text-[#111D16] cursor-pointer"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                    Mật khẩu mới (Tối thiểu 6 ký tự) *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2.5 pl-9 pr-10 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20] transition font-body"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 text-[#7A857E] hover:text-[#111D16] cursor-pointer"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                    Xác nhận mật khẩu mới *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới..."
                      className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2.5 pl-9 pr-3 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20] transition font-body"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <Button
                    type="submit"
                    variant="accent"
                    size="md"
                    disabled={isChangingPwd}
                    icon={isChangingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  >
                    {isChangingPwd ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
