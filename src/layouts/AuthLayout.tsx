import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isSuperAdmin } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={isSuperAdmin ? '/admin/dashboard' : '/manager/dashboard'} replace />;
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
