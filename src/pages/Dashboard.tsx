import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'SAAS_OWNER')  return <Navigate to="/saas/dashboard" replace />;
  if (user?.role === 'SUPER_ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'CUTTING')     return <Navigate to="/cutting/dashboard" replace />;
  if (user?.role === 'ACCOUNTANT')  return <Navigate to="/accountant/dashboard" replace />;
  if (user?.role === 'MANAGER')     return <Navigate to="/manager/dashboard" replace />;

  // No user yet — just return null and let ProtectedRoute handle it
  return null;
};
export default Dashboard;
