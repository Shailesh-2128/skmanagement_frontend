import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/ui/Loader';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader />
        </div>
      );
    }

    if (user.role === 'SAAS_OWNER') {
      return <Navigate to="/saas/dashboard" replace />;
    }
    if (user.role === 'SUPER_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'CUTTING') {
      return <Navigate to="/cutting/dashboard" replace />;
    }
    return <Navigate to="/manager/dashboard" replace />;
  }

  return (
    <div className="grid-wrapper">
      <div className="grid-background"></div>
      <div className="relative z-10 max-w-md w-full mx-4">
        <Outlet />
      </div>
    </div>
  );
};
export default AuthLayout;
