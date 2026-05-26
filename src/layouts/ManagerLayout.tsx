import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, History, BarChart3, LogOut, Menu, X } from 'lucide-react';

export const ManagerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on page navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/manager/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/manager/reports', name: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">skManagement</span>
          </div>

          {/* Close button for mobile/tablet */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg cursor-pointer transition"
            title="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section">Main Menu</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="nav-label">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <span className="avatar-status online"></span>
          </div>
          <div className="profile-info">
            <span className="profile-name">{user?.username}</span>
            <span className="profile-role">Manager</span>
          </div>
          <button onClick={handleLogout} className="profile-logout" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-sm"
        />
      )}

      {/* Main Container */}
      <div className="lg:pl-[280px] pl-0 min-h-screen flex flex-col min-w-0 transition-all duration-300">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0">
          <div className="flex items-center">
            {/* Hamburger Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-3 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg cursor-pointer transition"
              title="Open Sidebar"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              {navItems.find((item) => item.path === location.pathname)?.name || 'Manager Panel'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{user?.username}</p>
              <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                Manager: {user?.group_name || 'No Group'}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              {user?.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default ManagerLayout;
