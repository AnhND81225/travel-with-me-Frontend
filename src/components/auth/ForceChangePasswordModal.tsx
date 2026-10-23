import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { catalogApi } from '../../features/equipment/catalogApi';
import { clearAccountPasswordChangeRequirement } from '../../utils/firstLoginUtils';

interface ForceChangePasswordModalProps {
  isOpen: boolean;
  userEmail: string;
  initialCurrentPassword?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  isOpen,
  userEmail,
  initialCurrentPassword = '',
  onSuccess,
  onCancel,
}) => {
  const [currentPassword, setCurrentPassword] = useState(initialCurrentPassword);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Keep currentPassword updated if initialCurrentPassword is provided
  React.useEffect(() => {
    if (initialCurrentPassword) {
      setCurrentPassword(initialCurrentPassword);
    }
  }, [initialCurrentPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu tạm hiện tại.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu tạm được cấp.');
      return;
    }

    setLoading(true);
    try {
      await catalogApi('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      // Clear the first-login requirement
      clearAccountPasswordChangeRequirement(userEmail);
      setSuccess('Đổi mật khẩu thành công! Đang chuyển hướng vào hệ thống...');

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel ? onCancel : () => {}}
      title="Bảo Mật: Yêu Cầu Đổi Mật Khẩu Khởi Tạo"
      badge="BẮT BUỘC ĐỔI LẦN ĐẦU"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-label">
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xs text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold mb-0.5">Tài khoản nội bộ được cấp mật khẩu tạm:</strong>
            <span>
              Tài khoản của bạn ({userEmail}) vừa được Quản trị viên cấp với mật khẩu tạm qua Email.
              Để đảm bảo an toàn thông tin vận hành trạm và tour, bạn <strong>bắt buộc phải thiết lập mật khẩu riêng</strong> trước khi tiếp tục.
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Current Password Field */}
        <div>
          <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
            Mật khẩu tạm hiện tại *
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              disabled={loading}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập chuỗi mật khẩu được gửi qua email..."
              className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-10 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 text-[#7A857E] hover:text-[#111D16] cursor-pointer"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {initialCurrentPassword && (
            <span className="text-[10px] text-emerald-700 mt-1 block">
              ✓ Đã tự động điền mật khẩu bạn vừa đăng nhập
            </span>
          )}
        </div>

        {/* New Password Field */}
        <div>
          <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
            Mật khẩu mới (Tối thiểu 6 ký tự) *
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
            <input
              type={showNew ? 'text' : 'password'}
              required
              disabled={loading}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-10 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
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

        {/* Confirm New Password Field */}
        <div>
          <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
            Xác nhận mật khẩu mới *
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
            <input
              type="password"
              required
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#D8D2C5] flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="secondary" size="md" disabled={loading} onClick={onCancel}>
              Đăng xuất
            </Button>
          )}
          <Button
            type="submit"
            variant="accent"
            size="md"
            disabled={loading}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {loading ? 'Đang cập nhật...' : 'Xác Nhận & Tiếp Tục Vào Hệ Thống'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
