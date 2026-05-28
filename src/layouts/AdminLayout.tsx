import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Users, History, BarChart3, LogOut, UserPlus, Menu, X, Handshake, Scissors, ChevronDown, ChevronUp, HelpCircle, Settings } from 'lucide-react';
import SettingsPanel from '../components/SettingsPanel';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cuttingOpen, setCuttingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const activeView = searchParams.get('view') || 'panna';

  // Automatically open dropdown if under cutting path
  useEffect(() => {
    if (location.pathname === '/admin/cutting') {
      setCuttingOpen(true);
    }
  }, [location.pathname]);

  // Close sidebar on page navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/groups', name: 'Groups', icon: Users },
    { path: '/admin/transactions', name: 'Transactions', icon: History },
    { path: '/admin/reports', name: 'Reports', icon: BarChart3 },
    { path: '/admin/collab', name: 'Collab', icon: Handshake },
    { path: '/admin/cutting', name: 'Cutting', icon: Scissors },
    { path: '/admin/users', name: 'Users', icon: UserPlus },
    { path: '/admin/support', name: 'Support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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
            if (item.path === '/admin/cutting') {
              const isPannaActive = location.pathname === '/admin/cutting' && activeView === 'panna';
              const isJodiActive = location.pathname === '/admin/cutting' && activeView === 'jodi';
              const isSpActive = location.pathname === '/admin/cutting' && activeView === 'sp';
              const isDpActive = location.pathname === '/admin/cutting' && activeView === 'dp';
              const isAddCuttingActive = location.pathname === '/admin/cutting' && activeView === 'add-cutting';
              
              return (
                <div key={item.path} className="space-y-0.5">
                  <button
                    onClick={() => setCuttingOpen(!cuttingOpen)}
                    className={`nav-item w-full flex items-center justify-between cursor-pointer ${
                      isPannaActive || isJodiActive || isSpActive || isDpActive || isAddCuttingActive ? 'bg-slate-100/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="nav-icon">
                        <Icon className="h-4.5 w-4.5 text-blue-600" />
                      </span>
                      <span className="nav-label">Cutting Panel</span>
                    </div>
                    {cuttingOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </button>
                  {cuttingOpen && (
                    <div className="pl-4 space-y-1 mt-1 border-l border-slate-100 ml-4.5">
                      <Link
                        to="/admin/cutting?view=add-cutting"
                        className={`nav-item ${isAddCuttingActive ? 'active font-bold text-blue-600 bg-blue-50/50' : ''}`}
                      >
                        <span className="nav-label font-medium text-xs text-blue-600 font-bold">+ Add Cutting</span>
                      </Link>
                      <Link
                        to="/admin/cutting?view=panna"
                        className={`nav-item ${isPannaActive ? 'active' : ''}`}
                      >
                        <span className="nav-label font-medium text-xs">Panna Chart (220 Family)</span>
                      </Link>
                      <Link
                        to="/admin/cutting?view=jodi"
                        className={`nav-item ${isJodiActive ? 'active' : ''}`}
                      >
                        <span className="nav-label font-medium text-xs">Jodi Chart (00-99)</span>
                      </Link>
                      <Link
                        to="/admin/cutting?view=sp"
                        className={`nav-item ${isSpActive ? 'active' : ''}`}
                      >
                        <span className="nav-label font-medium text-xs">SP Chart (0-9)</span>
                      </Link>
                      <Link
                        to="/admin/cutting?view=dp"
                        className={`nav-item ${isDpActive ? 'active' : ''}`}
                      >
                        <span className="nav-label font-medium text-xs">DP Chart (0-9)</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            }

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
            <span className="profile-role">Super Admin</span>
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
              {location.pathname === '/admin/cutting'
                ? activeView === 'add-cutting' ? 'Add Cutting Entry' :
                  activeView === 'panna' ? 'Cutting Panel (Panna)' :
                  activeView === 'jodi' ? 'Jodi Chart' :
                  activeView === 'sp' ? 'SP Chart' :
                  activeView === 'dp' ? 'DP Chart' :
                  activeView === 'sutta' ? 'Sutta Chart' :
                  activeView === 'mpsp' ? 'Motor SP Chart' :
                  activeView === 'mpdp' ? 'Motor DP Chart' :
                  activeView === 'sangam' ? 'Sangam Chart' :
                  activeView === 'chakwad' ? 'Chakwad Chart' : 'Cutting Panel'
                : navItems.find((item) => item.path === location.pathname)?.name || 'Admin Panel'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition duration-200 cursor-pointer"
              title="App Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{user?.username}</p>
              <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                Super Admin
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {user?.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default AdminLayout;
