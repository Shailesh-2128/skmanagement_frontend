import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldOff } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'SAAS_OWNER':   return '/saas/dashboard';
      case 'SUPER_ADMIN':  return '/admin/dashboard';
      case 'CUTTING':      return '/cutting/dashboard';
      case 'ACCOUNTANT':   return '/accountant/dashboard';
      case 'MANAGER':      return '/manager/dashboard';
      default:             return '/';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-5">
      <div className="h-20 w-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
        <ShieldOff className="h-10 w-10" />
      </div>
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800">Access Denied</h1>
        <p className="text-slate-500 text-sm">You do not have permission to view this page.</p>
      </div>
      <button
        onClick={() => navigate(getDashboardPath(), { replace: true })}
        className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
      >
        Go to My Dashboard
      </button>
    </div>
  );
};
export default Unauthorized;
