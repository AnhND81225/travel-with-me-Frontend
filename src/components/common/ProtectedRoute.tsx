import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mountain, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../ui';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { loading, account, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Loading state while checking /api/users/me
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3EFE6] flex flex-col items-center justify-center p-4 font-label">
        <div className="w-12 h-12 rounded-xs bg-[#152A20] text-[#D97845] flex items-center justify-center mb-4 animate-bounce">
          <Mountain className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold text-[#152A20] font-headline uppercase tracking-wider">
          Xác thực thông tin tài khoản...
        </div>
        <p className="text-xs text-[#5C665F] mt-1 font-body">
          Đang kết nối cổng xác thực an toàn TerraPeak Outpost.
        </p>
      </div>
    );
  }

  // 2. Unauthenticated: Bắt buộc NHẢY VÀO LOGIN ngay!
  if (!isAuthenticated || !account) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // 3. Unauthorized role (e.g., CUSTOMER trying to access /admin or /staff)
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(account.role)) {
    return (
      <div className="min-h-screen bg-[#F3EFE6] flex flex-col items-center justify-center p-6 text-center font-label">
        <div className="w-16 h-16 rounded-xs bg-red-100 text-red-700 flex items-center justify-center mb-4 border border-red-300">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-xs border border-red-200 mb-2">
          TRUY CẬP BỊ TỪ CHỐI • 403 FORBIDDEN
        </span>
        <h2 className="text-2xl font-bold text-[#152A20] font-headline mb-2">
          Không có quyền truy cập khu vực này
        </h2>
        <p className="text-xs text-[#5C665F] max-w-md font-body mb-6">
          Tài khoản hiện tại của bạn mang vai trò <strong className="text-[#152A20]">{account.role}</strong>. Phân hệ này chỉ dành riêng cho tài khoản có quyền{' '}
          <strong className="text-[#D97845]">{allowedRoles.join(' hoặc ')}</strong>.
        </p>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => window.location.assign('/shop')}
          >
            Quay lại Cửa Hàng
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              sessionStorage.removeItem("treektour.catalog.token");
              window.location.assign(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
            }}
          >
            Đăng Nhập Tài Khoản Khác
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
