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
          Authenticating account credentials...
        </div>
        <p className="text-xs text-[#5C665F] mt-1 font-body">
          Connecting to the TerraPeak Outpost secure authentication gateway.
        </p>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to login immediately
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
          ACCESS DENIED • 403 FORBIDDEN
        </span>
        <h2 className="text-2xl font-bold text-[#152A20] font-headline mb-2">
          You do not have permission to access this area
        </h2>
        <p className="text-xs text-[#5C665F] max-w-md font-body mb-6">
          Your current account has the <strong className="text-[#152A20]">{account.role}</strong> role. This portal is restricted to accounts with{' '}
          <strong className="text-[#D97845]">{allowedRoles.join(' or ')}</strong> permissions.
        </p>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => window.location.assign('/shop')}
          >
            Back to Store
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              sessionStorage.removeItem("treektour.catalog.token");
              window.location.assign(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
            }}
          >
            Sign In with Another Account
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
