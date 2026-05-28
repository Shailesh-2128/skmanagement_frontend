import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'SAAS_OWNER') {
    return <Navigate to="/saas/dashboard" replace />;
  }
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === 'CUTTING') {
    return <Navigate to="/cutting/dashboard" replace />;
  }

  return <Navigate to="/manager/dashboard" replace />;
};
export default Dashboard;
