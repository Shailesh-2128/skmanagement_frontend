import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/ui/Loader';

interface RoleRouteProps {
  allowedRoles: Array<'SUPER_ADMIN' | 'MANAGER' | 'CUTTING' | 'SAAS_OWNER' | 'ACCOUNTANT'>;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loader while auth state is still initialising
  // (token exists but user object not yet hydrated from storage/Redux)
  const tokenExists = !!localStorage.getItem('storepulse_access_token');
  if (isLoading || (tokenExists && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  }

  // Not authenticated at all → go to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but wrong role → go to unauthorized
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
export default RoleRoute;
