import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Menu, X, Scissors, ChevronDown, ChevronUp, HelpCircle, Settings } from 'lucide-react';
import SettingsPanel from '../components/SettingsPanel';

export const CuttingLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Close sidebar on page navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const [cuttingOpen, setCuttingOpen] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const activeView = searchParams.get('view') || 'panna';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPannaActive = location.pathname === '/cutting/dashboard' && activeView === 'panna';
  const isJodiActive = location.pathname === '/cutting/dashboard' && activeView === 'jodi';
  const isSpActive = location.pathname === '/cutting/dashboard' && activeView === 'sp';
  const isDpActive = location.pathname === '/cutting/dashboard' && activeView === 'dp';
  const isAddCuttingActive = location.pathname === '/cutting/dashboard' && activeView === 'add-cutting';

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
          
          {/* Collapsible Cutting Panel Dropdown */}
          <div>
            <button
              onClick={() => setCuttingOpen(!cuttingOpen)}
              className={`nav-item w-full flex items-center justify-between cursor-pointer ${
                isPannaActive || isJodiActive || isSpActive || isDpActive || isAddCuttingActive ? 'bg-slate-100/50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="nav-icon">
                  <Scissors className="h-4.5 w-4.5 text-blue-600" />
                </span>
                <span className="nav-label">Cutting Panel</span>
              </div>
              {cuttingOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {cuttingOpen && (
              <div className="pl-4 space-y-1 mt-1 border-l border-slate-100 ml-4.5">
                <Link
                  to="/cutting/dashboard?view=add-cutting"
                  className={`nav-item ${isAddCuttingActive ? 'active font-bold text-blue-600 bg-blue-50/50' : ''}`}
                >
                  <span className="nav-label font-medium text-xs text-blue-600 font-bold">+ Add Cutting</span>
                </Link>
                <Link
                  to="/cutting/dashboard?view=panna"
                  className={`nav-item ${isPannaActive ? 'active' : ''}`}
                >
                  <span className="nav-label font-medium text-xs">Panna Chart (220 Family)</span>
                </Link>
                <Link
                  to="/cutting/dashboard?view=jodi"
                  className={`nav-item ${isJodiActive ? 'active' : ''}`}
                >
                  <span className="nav-label font-medium text-xs">Jodi Chart (00-99)</span>
                </Link>
                <Link
                  to="/cutting/dashboard?view=sp"
                  className={`nav-item ${isSpActive ? 'active' : ''}`}
                >
                  <span className="nav-label font-medium text-xs">SP Chart (0-9)</span>
                </Link>
                <Link
                  to="/cutting/dashboard?view=dp"
                  className={`nav-item ${isDpActive ? 'active' : ''}`}
                >
                  <span className="nav-label font-medium text-xs">DP Chart (0-9)</span>
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/cutting/support"
            className={`nav-item mt-1 ${location.pathname === '/cutting/support' ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <HelpCircle className="h-4.5 w-4.5 text-blue-600" />
            </span>
            <span className="nav-label">Support</span>
          </Link>
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
            <span className="profile-role">Cutting Operator</span>
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
              {activeView === 'add-cutting' ? 'Add Cutting Entry' :
               activeView === 'panna' ? 'Cutting Panel' :
               activeView === 'jodi' ? 'Jodi Chart' :
               activeView === 'sp' ? 'SP Chart' :
               activeView === 'dp' ? 'DP Chart' :
               activeView === 'sutta' ? 'Sutta Chart' :
               activeView === 'mpsp' ? 'Motor SP Chart' :
               activeView === 'mpdp' ? 'Motor DP Chart' :
               activeView === 'sangam' ? 'Sangam Chart' :
               activeView === 'chakwad' ? 'Chakwad Chart' : 'Cutting Panel'}
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
              <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full inline-block">
                Cutting Role
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
export default CuttingLayout;
