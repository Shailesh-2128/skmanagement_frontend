import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Users, History, BarChart3, LogOut, UserPlus, Menu, X, Handshake, Scissors, ChevronDown, ChevronUp, HelpCircle, Settings, Calculator, Bell, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationsApi, { NotificationData } from '../api/notifications.api';
import SettingsPanel from '../components/SettingsPanel';


export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cuttingOpen, setCuttingOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch notifications with 30s auto-polling interval
  const { data: notifications } = useQuery<NotificationData[]>({
    queryKey: ['notifications'],
    queryFn: notificationsApi.listNotifications,
    refetchInterval: 30000
  });

  // Fetch unread count with 30s auto-polling interval
  const { data: countData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000
  });

  const unreadCount = countData?.unread_count ?? 0;

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    }
  });

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    }
  });

  const searchParams = new URLSearchParams(location.search);
  const activeView = searchParams.get('view') || 'panna';


  // Automatically open dropdown if under cutting path
  useEffect(() => {
    if (location.pathname === '/admin/cutting') {
      setCuttingOpen(true);
    }
  }, [location.pathname]);

  // Automatically open settings dropdown if under settings paths
  useEffect(() => {
    if (
      location.pathname === '/admin/sms-settings' ||
      location.pathname === '/admin/sms-notifications' ||
      location.pathname === '/admin/sms-test'
    ) {
      setSettingsDropdownOpen(true);
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
    { path: '/admin/accountant', name: 'Accountant Calc', icon: Calculator },
    { path: '/admin/users', name: 'Users', icon: UserPlus },
    { path: '/admin/settings', name: 'System Settings', icon: Settings },
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
              const isAddCuttingActive = location.pathname === '/admin/cutting' && activeView === 'add-cutting';
              const isAnalysisActive = location.pathname === '/admin/cutting' && activeView === 'analysis';
              
              return (
                <div key={item.path} className="space-y-0.5">
                  <button
                    onClick={() => setCuttingOpen(!cuttingOpen)}
                    className={`nav-item w-full flex items-center justify-between cursor-pointer ${
                      isPannaActive || isJodiActive || isAddCuttingActive || isAnalysisActive ? 'bg-slate-100/50' : ''
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
                        to="/admin/cutting?view=analysis"
                        className={`nav-item ${isAnalysisActive ? 'active' : ''}`}
                      >
                        <span className="nav-label font-medium text-xs">Panna P&L Analysis</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            }

            if (item.path === '/admin/settings') {
              const isSMSGatewayActive = location.pathname === '/admin/sms-settings';
              const isNotificationsActive = location.pathname === '/admin/sms-notifications';
              const isSMSTestActive = location.pathname === '/admin/sms-test';
              const isAnyActive = isSMSGatewayActive || isNotificationsActive || isSMSTestActive;

              return (
                <div key={item.path} className="space-y-0.5">
                  <button
                    onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                    className={`nav-item w-full flex items-center justify-between cursor-pointer ${
                      isAnyActive ? 'bg-slate-100/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="nav-icon">
                        <Icon className="h-4.5 w-4.5 text-blue-600" />
                      </span>
                      <span className="nav-label">System Settings</span>
                    </div>
                    {settingsDropdownOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </button>
                  {settingsDropdownOpen && (
                    <div className="pl-4 space-y-1 mt-1 border-l border-slate-100 ml-4.5">
                      <Link
                        to="/admin/sms-settings"
                        className={`nav-item ${isSMSGatewayActive ? 'active' : ''}`}
                      >
                        <span className="nav-label font-medium text-xs">SMS Gateway</span>
                      </Link>
                      <Link
                        to="/admin/sms-notifications"
                        className={`nav-item ${isNotificationsActive ? 'active' : ''}`}
                      >
                        <span className="nav-label font-medium text-xs">Notification Settings</span>
                      </Link>
                      <Link
                        to="/admin/sms-test"
                        className={`nav-item ${isSMSTestActive ? 'active' : ''}`}
                      >
                        <span className="nav-label font-medium text-xs">SMS Test Panel</span>
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
                  activeView === 'chakwad' ? 'Chakwad Chart' :
                  activeView === 'analysis' ? 'Panna P&L Analysis' : 'Cutting Panel'
                : location.pathname === '/admin/sms-settings' ? 'SMS Gateway Configuration'
                : location.pathname === '/admin/sms-notifications' ? 'Notification Settings'
                : location.pathname === '/admin/sms-test' ? 'SMS Test Console'
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

            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition duration-200 cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 overflow-hidden transition-all animate-fade-in">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer border-none bg-none"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                      {notifications?.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-xs text-slate-500">No notifications yet</p>
                          <p className="text-[10px] mt-0.5 text-slate-400">We'll alert you on sales report and limit exceed events.</p>
                        </div>
                      ) : (
                        notifications?.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) markReadMutation.mutate(n.id);
                            }}
                            className={`p-4 hover:bg-slate-50/50 transition cursor-pointer flex items-start gap-3 ${
                              !n.is_read ? 'bg-blue-50/20' : ''
                            }`}
                          >
                            <div className="mt-0.5">
                              {n.notification_type === 'OVERLIMIT' ? (
                                <span className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                                  ⚠️
                                </span>
                              ) : (
                                <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                  📄
                                </span>
                              )}
                            </div>
                            <div className="flex-1 space-y-0.5 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-800 truncate">
                                  {n.title}
                                </span>
                                {!n.is_read && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-600 leading-normal break-words">
                                {n.message}
                              </p>
                              {n.notification_type === 'DAILY_PDF' && (
                                <div className="pt-1.5">
                                  <a
                                    href={n.message.match(/https?:\/\/[^\s]+/)?.[0] || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition"
                                  >
                                    Download Report
                                  </a>
                                </div>
                              )}
                              <span className="text-[8px] text-slate-400 font-medium block pt-1 flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

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
