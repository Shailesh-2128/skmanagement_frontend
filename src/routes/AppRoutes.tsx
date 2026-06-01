import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import ManagerLayout from '../layouts/ManagerLayout';
import CuttingLayout from '../layouts/CuttingLayout';
import AuthLayout from '../layouts/AuthLayout';
import AccountantLayout from '../layouts/AccountantLayout';

// Pages
import AccountantCalculatorPage from '../features/accountant/pages/AccountantCalculatorPage';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';
import SaaSLogin from '../pages/SaaSLogin';
import SaaSDashboard from '../pages/SaaSDashboard';

// Feature Pages
import AdminDashboard from '../features/auth/pages/AdminDashboard';
import ManagerDashboard from '../features/auth/pages/ManagerDashboard';
import GroupsListPage from '../features/groups/pages/GroupsListPage';
import GroupDetailPage from '../features/groups/pages/GroupDetailPage';
import TransactionsPage from '../features/transactions/pages/TransactionsPage';
import ReportsPage from '../features/reports/pages/ReportsPage';
import UsersPage from '../features/users/pages/UsersPage';
import CollabPage from '../features/collab/pages/CollabPage';
import CuttingPage from '../features/cutting/pages/CuttingPage';
import SupportPage from '../features/support/pages/SupportPage';
import SMSSettingsPage from '../features/sms/pages/SMSSettingsPage';
import SMSTestPage from '../features/sms/pages/SMSTestPage';
import SMSNotificationsPage from '../features/sms/pages/SMSNotificationsPage';


export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public / Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route path="/saas/login" element={<SaaSLogin />} />

      {/* Common redirect path */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />

        {/* SAAS OWNER ROUTE GROUP */}
        <Route element={<RoleRoute allowedRoles={['SAAS_OWNER']} />}>
          <Route path="/saas/dashboard" element={<SaaSDashboard />} />
        </Route>

        {/* SUPER ADMIN ROUTE GROUP */}
        <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/groups" element={<GroupsListPage />} />
            <Route path="/admin/groups/:id" element={<GroupDetailPage />} />
            <Route path="/admin/transactions" element={<TransactionsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/collab" element={<CollabPage />} />
            <Route path="/admin/cutting" element={<CuttingPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/support" element={<SupportPage />} />
            <Route path="/admin/accountant" element={<AccountantCalculatorPage />} />
            <Route path="/admin/sms-settings" element={<SMSSettingsPage />} />
            <Route path="/admin/sms-test" element={<SMSTestPage />} />
            <Route path="/admin/sms-notifications" element={<SMSNotificationsPage />} />

          </Route>
        </Route>

        {/* ACCOUNTANT ROUTE GROUP */}
        <Route element={<RoleRoute allowedRoles={['ACCOUNTANT']} />}>
          <Route element={<AccountantLayout />}>
            <Route path="/accountant/dashboard" element={<AccountantCalculatorPage />} />
            <Route path="/accountant/groups/:id" element={<GroupDetailPage />} />
          </Route>
        </Route>

        {/* MANAGER ROUTE GROUP */}
        <Route element={<RoleRoute allowedRoles={['MANAGER']} />}>
          <Route element={<ManagerLayout />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/transactions" element={<TransactionsPage />} />
            <Route path="/manager/reports" element={<ReportsPage />} />
            <Route path="/manager/cutting" element={<CuttingPage />} />
            <Route path="/manager/support" element={<SupportPage />} />
          </Route>
        </Route>

        {/* CUTTING ROUTE GROUP */}
        <Route element={<RoleRoute allowedRoles={['CUTTING']} />}>
          <Route element={<CuttingLayout />}>
            <Route path="/cutting/dashboard" element={<CuttingPage />} />
            <Route path="/cutting/support" element={<SupportPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
export default AppRoutes;
