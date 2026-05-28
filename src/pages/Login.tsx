import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import authApi from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { KeyRound, User, ShieldAlert, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'CUTTING') {
        navigate('/cutting/dashboard');
      } else if (user.role === 'SAAS_OWNER') {
        navigate('/saas/dashboard');
      } else {
        navigate('/manager/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await authApi.login({ username, password });
      dispatch(setCredentials(data));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-2xl border border-slate-200/80 p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
      {/* Decorative top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-sm rounded-full"></div>
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/10 mb-2">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
          skManagement
        </h2>
        <p className="text-slate-500 text-sm">Sign in to skStorePulse</p>
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
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Username</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              required
              className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <KeyRound className="h-4 w-4" />
            </span>
            <input
              type="password"
              required
              className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-500 text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
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
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/50 cursor-pointer transition-all duration-200 text-sm mt-6 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-indigo-200" />
              <span>Access Dashboard</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
