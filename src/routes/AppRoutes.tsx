import React from 'react';
import { AuthPage } from '../pages/auth/AuthPage';
import { OrderCart } from '../features/orders/OrderCart';
import { EquipmentEditor, EquipmentLogin } from '../features/equipment/EquipmentPages';
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
  CartManifestPage,
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
  FleetLedgerPage,
  SanitizationLogPage,
  InterBranchTransferPage,
  CustodyInspectionPage,
} from '../pages/admin';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
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
          <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffDashboardPage />} />
        <Route path="pos" element={<StaffPosPage />} />
        <Route path="orders" element={<StaffOrdersPage />} />
        <Route path="rentals" element={<StaffRentalsPage />} />
        <Route path="tours" element={<StaffToursPage />} />
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
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="orders" element={<MyOrdersPage operations />} />
          <Route index element={<AdminDashboardPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="catalog" element={<AdminCatalogPage />} />
          <Route path="catalog/new" element={<EquipmentEditor />} />
          <Route path="catalog/:id/edit" element={<EquipmentEditor />} />
          <Route path="branches" element={<AdminBranchesPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="fleet" element={<FleetLedgerPage />} />
          <Route path="sanitize" element={<SanitizationLogPage />} />
          <Route path="transfers" element={<InterBranchTransferPage />} />
          <Route path="custody-inspect" element={<CustodyInspectionPage />} />
        </Route>

        {/* Catch-all fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
