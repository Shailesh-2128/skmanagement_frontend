import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import ManagerLayout from '../layouts/ManagerLayout';
import AuthLayout from '../layouts/AuthLayout';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

// Feature Pages
import AdminDashboard from '../features/auth/pages/AdminDashboard';
import ManagerDashboard from '../features/auth/pages/ManagerDashboard';
import GroupsListPage from '../features/groups/pages/GroupsListPage';
import GroupDetailPage from '../features/groups/pages/GroupDetailPage';
import TransactionsPage from '../features/transactions/pages/TransactionsPage';
import ReportsPage from '../features/reports/pages/ReportsPage';
import UsersPage from '../features/users/pages/UsersPage';
import CollabPage from '../features/collab/pages/CollabPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public / Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Common redirect path */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />

        {/* SUPER ADMIN ROUTE GROUP */}
        <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/groups" element={<GroupsListPage />} />
            <Route path="/admin/groups/:id" element={<GroupDetailPage />} />
            <Route path="/admin/transactions" element={<TransactionsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/collab" element={<CollabPage />} />
          </Route>
        </Route>

        {/* MANAGER ROUTE GROUP */}
        <Route element={<RoleRoute allowedRoles={['MANAGER']} />}>
          <Route element={<ManagerLayout />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/transactions" element={<TransactionsPage />} />
            <Route path="/manager/reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
export default AppRoutes;
