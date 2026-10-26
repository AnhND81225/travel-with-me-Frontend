import React from 'react';
import { PaymentResultPage } from '../features/payment/PaymentPages';
import { ScheduleGuard } from '../features/schedules/ui';
import { AuthPage } from '../pages/auth/AuthPage';
import { OrderCart } from '../features/orders/OrderCart';
import { EquipmentEditor } from '../features/equipment/EquipmentPages';
import { MyOrdersPage } from '../pages/user/MyOrdersPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserLayout, AdminLayout, StaffLayout } from '../components/layouts';

// User / Customer Pages
import {
  HomePage,
  ShopCatalogPage,
  CatalogPage,
  ProductDetailPage,
  ExpeditionsPage,
  ExpeditionDetailPage,
  CustodyHubPage,
  ConditionAuditPage,
  OutpostsPage,
  OutpostDetailPage,
  ClimberPassportPage,
  BookingConfirmationPage,
  RentalExtensionPage,
  WaiverAgreementPage,
  SafetyProtocolsPage,
  StationReturnPassPage,
  GearBundleBuilderPage,
} from '../pages/user';

// Staff Operations Pages
import {
  StaffDashboardPage,
  StaffPosPage,
  StaffRentalsPage,
  StaffOrdersPage,
  StaffToursPage,
  StaffInventoryPage,
  StaffSupportPage,
} from '../pages/staff';

// Admin / Headquarters Pages
import {
  AdminDashboardPage,
  AdminInventoryPage,
  AdminCatalogPage,
  AdminBranchesPage,
  AdminReportsPage,
  AdminStaffPage,
  AdminUsersPage,
  FleetLedgerPage,
  SanitizationLogPage,
  InterBranchTransferPage,
  CustodyInspectionPage,
  AdminOrdersPage,
  EventsGuidesAdminPage,
} from '../pages/admin';

const MyToursPage = React.lazy(() => import('../features/schedules/CustomerPages').then(m => ({ default: m.MyToursPage })));
const TicketDetailPage = React.lazy(() => import('../features/schedules/CustomerPages').then(m => ({ default: m.TicketDetailPage })));
const SchedulesPage = React.lazy(() => import('../features/schedules/OperationsPages').then(m => ({ default: m.SchedulesPage })));
const ScheduleDetailPage = React.lazy(() => import('../features/schedules/OperationsPages').then(m => ({ default: m.ScheduleDetailPage })));
const GuideLayout = React.lazy(() => import('../features/schedules/OperationsPages').then(m => ({ default: m.GuideLayout })));
const GuideSchedulesPage = React.lazy(() => import('../features/schedules/OperationsPages').then(m => ({ default: m.GuideSchedulesPage })));
const PaymentReviewsPage = React.lazy(() => import('../features/schedules/OperationsPages').then(m => ({ default: m.PaymentReviewsPage })));

export const AppRoutes: React.FC = () => {
  return (
    <React.Suspense fallback={<p className="p-8" role="status">Loading page…</p>}><Routes>
      <Route path="/login" element={<AuthPage defaultMode="login" />} />
      <Route path="/register" element={<AuthPage defaultMode="register" />} />
      <Route path="/oauth2/callback" element={<AuthPage defaultMode="login" />} />
      {/* Customer Storefront Routes */}
      <Route path="/" element={<UserLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopCatalogPage defaultMode="buy" />} />
        <Route path="rent" element={<ShopCatalogPage defaultMode="rent" />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="gear/:id" element={<ProductDetailPage />} />

        {/* Expeditions / Tours */}
        <Route path="expeditions" element={<ExpeditionsPage />} />
        <Route path="expeditions/:id" element={<ExpeditionDetailPage />} />
        <Route path="tours" element={<ExpeditionsPage />} />
        <Route path="tours/:id" element={<ExpeditionDetailPage />} />

        {/* Custody, Audit & Returns */}
        <Route path="custody" element={<CustodyHubPage />} />
        <Route path="custody/:id/audit" element={<ConditionAuditPage />} />
        <Route path="custody/extend" element={<RentalExtensionPage />} />
        <Route path="return-pass" element={<StationReturnPassPage />} />

        {/* Outposts Network */}
        <Route path="outposts" element={<OutpostsPage />} />
        <Route path="outposts/:id" element={<OutpostDetailPage />} />

        {/* User Account, Cart & Policies */}
        <Route
          path="passport"
          element={
            <ProtectedRoute>
              <ClimberPassportPage />
            </ProtectedRoute>
          }
        />
        <Route path="orders" element={<MyOrdersPage />} />
        <Route path="payment/result" element={<PaymentResultPage />} />
        <Route path="payment/pending" element={<PaymentResultPage />} />
        <Route path="payment/success" element={<PaymentResultPage />} />
        <Route path="my-tours" element={<ScheduleGuard roles={['CUSTOMER', 'ADMIN', 'STAFF']}><MyToursPage /></ScheduleGuard>} />
        <Route path="my-tours/:participantId" element={<ScheduleGuard roles={['CUSTOMER', 'ADMIN', 'STAFF']}><TicketDetailPage /></ScheduleGuard>} />
        <Route path="payment" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
        <Route path="payment/:result" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
        <Route path="cart" element={<OrderCart />} />
        <Route path="manifest" element={<OrderCart />} />
        <Route path="confirmation" element={<BookingConfirmationPage />} />
        <Route path="waiver" element={<WaiverAgreementPage />} />
        <Route path="safety" element={<SafetyProtocolsPage />} />
        <Route path="bundles" element={<GearBundleBuilderPage />} />
      </Route>

      {/* Staff Operations Console Routes */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['STAFF', 'ADMIN', 'GUIDE']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffDashboardPage />} />
        <Route path="pos" element={<StaffPosPage />} />
        <Route path="orders" element={<StaffOrdersPage />} />
        <Route path="rentals" element={<StaffRentalsPage />} />
        <Route path="tours" element={<Navigate to="/staff/schedules" replace />} />
        <Route path="schedules" element={<ScheduleGuard roles={['ADMIN', 'STAFF']}><SchedulesPage /></ScheduleGuard>} />
        <Route path="schedules/:id" element={<ScheduleGuard roles={['ADMIN', 'STAFF']}><ScheduleDetailPage /></ScheduleGuard>} />
        <Route path="schedule-payment-reviews" element={<ScheduleGuard roles={['ADMIN', 'STAFF']}><PaymentReviewsPage /></ScheduleGuard>} />
        <Route path="inventory" element={<StaffInventoryPage />} />
        <Route path="support" element={<StaffSupportPage />} />
      </Route>

      {/* Admin Executive HQ Console Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route index element={<AdminDashboardPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="catalog" element={<AdminCatalogPage />} />
        <Route path="catalog/new" element={<EquipmentEditor />} />
        <Route path="catalog/:id/edit" element={<EquipmentEditor />} />
        <Route path="branches" element={<AdminBranchesPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="staff" element={<AdminStaffPage />} />
        <Route path="events-guides" element={<EventsGuidesAdminPage />} />
        <Route path="schedules" element={<ScheduleGuard roles={['ADMIN']}><SchedulesPage /></ScheduleGuard>} />
        <Route path="schedules/:id" element={<ScheduleGuard roles={['ADMIN']}><ScheduleDetailPage /></ScheduleGuard>} />
        <Route path="schedule-payment-reviews" element={<ScheduleGuard roles={['ADMIN']}><PaymentReviewsPage /></ScheduleGuard>} />
        <Route path="fleet" element={<FleetLedgerPage />} />
        <Route path="sanitize" element={<SanitizationLogPage />} />
        <Route path="transfers" element={<InterBranchTransferPage />} />
        <Route path="custody-inspect" element={<CustodyInspectionPage />} />
      </Route>

      <Route path="/guide" element={<ScheduleGuard roles={['GUIDE']}><GuideLayout /></ScheduleGuard>}>
        <Route index element={<Navigate to="/guide/schedules" replace />} />
        <Route path="schedules" element={<GuideSchedulesPage />} />
        <Route path="schedules/:id" element={<ScheduleDetailPage />} />
      </Route>
      {/* Catch-all fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></React.Suspense>
  );
};
