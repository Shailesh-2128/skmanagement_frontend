import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import authApi from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { KeyRound, User, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

export const SaaSLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user && user.role === 'SAAS_OWNER') {
      navigate('/saas/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await authApi.login({ username, password });
      
      if (data.user.role !== 'SAAS_OWNER') {
        setError('Unauthorized access. This panel is only for the SaaS Owner.');
        return;
      }
      
      dispatch(setCredentials(data));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Soft visual background lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl border border-slate-200/80 p-8 rounded-3xl shadow-2xl shadow-purple-500/5 space-y-6 relative overflow-hidden">
        {/* Colorful top bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"></div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-500/20 mb-2">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            SaaS Portal
          </h2>
          <p className="text-slate-500 text-sm">skStorePulse Enterprise Management</p>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl">
            <ShieldAlert className="h-4.5 w-4.5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Username field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Admin Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-purple-500 text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all text-sm"
                placeholder="saasadmin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Security Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-purple-500 text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-purple-600/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/50 cursor-pointer transition-all duration-200 text-sm mt-6 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-purple-200" />
                <span>Enter Admin Console</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SaaSLogin;
