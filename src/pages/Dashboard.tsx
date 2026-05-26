import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/manager/dashboard" replace />;
};
export default Dashboard;
