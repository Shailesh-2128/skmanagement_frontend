import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import saasApi from '../api/saas.api';
import supportApi, { SupportTicketData } from '../api/support.api';
import { SaasTenant, ActivityLog } from '../types/auth.types';
import { 
  Building2, Plus, LogOut, Trash2, Calendar, 
  Clock, ShieldAlert, Sparkles, User, KeyRound, X,
  Activity, Search, Filter, ArrowUpDown, ShieldCheck, 
  Database, Users, BarChart3, FileDown, HelpCircle, CheckCircle2,
  Eye, EyeOff, Mail, IndianRupee, Percent, Smartphone, Edit3, Menu,
  MessageSquare, Scissors, History, RefreshCw
} from 'lucide-react';


export const SaaSDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const [tenants, setTenants] = useState<SaasTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Sidebar & Layout navigation state
  const [activeMenu, setActiveMenu] = useState<'overview' | 'stores' | 'tickets' | 'email-config' | 'cutting-revenue' | 'activity-logs'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);


  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'expiry' | 'created'>('created');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Onboard Slide-over drawer state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createActiveDays, setCreateActiveDays] = useState(30);
  
  // Additional onboarding fields
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createBillingType, setCreateBillingType] = useState<'COMMISSION' | 'MONTHLY' | 'CUTTING_COMMISSION' | 'BOTH_COMMISSION'>('MONTHLY');
  const [createMonthlyAmount, setCreateMonthlyAmount] = useState(0);
  const [createCommissionRate, setCreateCommissionRate] = useState(0);
  const [createCuttingCommissionRate, setCreateCuttingCommissionRate] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit Subscription & Billing Modal state
  const [editingTenant, setEditingTenant] = useState<SaasTenant | null>(null);
  const [editBillingType, setEditBillingType] = useState<'COMMISSION' | 'MONTHLY' | 'CUTTING_COMMISSION' | 'BOTH_COMMISSION'>('MONTHLY');
  const [editMonthlyAmount, setEditMonthlyAmount] = useState(0);
  const [editCommissionRate, setEditCommissionRate] = useState(0);
  const [editCuttingCommissionRate, setEditCuttingCommissionRate] = useState(0);
  const [editExtendDays, setEditExtendDays] = useState<number | ''>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Activity Log tab states
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);



  // Support Tickets tab states
  const [supportTickets, setSupportTickets] = useState<SupportTicketData[]>([]);
  const [isSupportLoading, setIsSupportLoading] = useState(false);

  // Email Configuration states
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [useTls, setUseTls] = useState(true);
  const [senderEmail, setSenderEmail] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');


  const fetchTenants = async (date?: string) => {
    setIsLoading(true);
    try {
      const queryDate = date !== undefined ? date : selectedDate;
      const data = await saasApi.list(queryDate || undefined);
      if (Array.isArray(data)) {
        setTenants(data);
      } else {
        setTenants([]);
      }
    } catch (err: any) {
      setError('Failed to fetch store clients.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupportTickets = async () => {
    setIsSupportLoading(true);
    try {
      const data = await supportApi.listTickets();
      if (Array.isArray(data)) {
        setSupportTickets(data);
      } else {
        setSupportTickets([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch support tickets:', err);
    } finally {
      setIsSupportLoading(false);
    }
  };

  const handleResolveTicket = async (id: number) => {
    if (!window.confirm('Are you sure you want to mark this support ticket as RESOLVED?')) {
      return;
    }
    try {
      await supportApi.resolveTicket(id);
      fetchSupportTickets();
    } catch (err: any) {
      alert('Failed to resolve support ticket.');
    }
  };

  const fetchEmailSettings = async () => {
    setIsEmailLoading(true);
    try {
      const data = await saasApi.getEmailSettings();
      setSmtpHost(data.smtp_host);
      setSmtpPort(data.smtp_port);
      setSmtpUser(data.smtp_user || '');
      setSmtpPassword(data.smtp_password || '');
      setUseTls(data.use_tls);
      setSenderEmail(data.sender_email || '');
    } catch (err: any) {
      console.error('Failed to fetch SMTP email settings:', err);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailSaving(true);
    setEmailStatus('');
    try {
      await saasApi.updateEmailSettings({
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_password: smtpPassword,
        use_tls: useTls,
        sender_email: senderEmail,
      });
      setEmailStatus('SMTP Configuration saved successfully!');
      setTimeout(() => setEmailStatus(''), 4000);
    } catch (err: any) {
      setEmailStatus('Failed to save SMTP configuration.');
    } finally {
      setIsEmailSaving(false);
    }
  };

  const fetchActivityLogs = async () => {
    setIsLogsLoading(true);
    try {
      const data = await saasApi.getActivityLogs();
      if (Array.isArray(data)) {
        setActivityLogs(data);
      } else {
        setActivityLogs([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportTickets();
    fetchEmailSettings();
    fetchActivityLogs();
  }, []);

  useEffect(() => {
    fetchTenants(selectedDate);
  }, [selectedDate]);

  const handleLogout = () => {
    logout();
    navigate('/saas/login');
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await saasApi.create({
        name: createName,
        username: createUsername,
        password: createPassword,
        active_days: createActiveDays,
        email: createEmail,
        phone_number: createPhone,
        billing_type: createBillingType,
        monthly_amount: createMonthlyAmount,
        commission_rate: createCommissionRate,
        cutting_commission_rate: createCuttingCommissionRate,
      });
      setCreateName('');
      setCreateUsername('');
      setCreatePassword('');
      setCreateActiveDays(30);
      setCreateEmail('');
      setCreatePhone('');
      setCreateBillingType('MONTHLY');
      setCreateMonthlyAmount(0);
      setCreateCommissionRate(0);
      setCreateCuttingCommissionRate(0);
      setIsCreateOpen(false);
      fetchTenants();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to create tenant store.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleToggleActive = async (tenant: SaasTenant) => {
    try {
      await saasApi.update(tenant.id, { is_active: !tenant.is_active });
      fetchTenants();
    } catch (err: any) {
      alert('Failed to update tenant status.');
    }
  };

  const handleStartEdit = (tenant: SaasTenant) => {
    setEditingTenant(tenant);
    setEditBillingType(tenant.billing_type);
    setEditMonthlyAmount(tenant.monthly_amount);
    setEditCommissionRate(tenant.commission_rate);
    setEditCuttingCommissionRate(tenant.cutting_commission_rate || 0);
    setEditExtendDays('');
  };

  const handleUpdateSubscriptionAndBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsSavingEdit(true);
    try {
      const updateData: any = {
        billing_type: editBillingType,
        monthly_amount: editMonthlyAmount,
        commission_rate: editCommissionRate,
        cutting_commission_rate: editCuttingCommissionRate,
      };
      if (editExtendDays !== '') {
        updateData.active_days = editExtendDays;
      }
      await saasApi.update(editingTenant.id, updateData);
      setEditingTenant(null);
      fetchTenants();
    } catch (err: any) {
      alert('Failed to update tenant subscription & billing.');
    } finally {
      setIsSavingEdit(false);
    }
  };


  const handleDeleteTenant = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this tenant store? All associated data, users, groups, charts and transactions will be permanently purged.')) {
      return;
    }
    try {
      await saasApi.delete(id);
      fetchTenants();
    } catch (err: any) {
      alert('Failed to delete tenant store.');
    }
  };

  // Export report to CSV
  const handleExportCSV = () => {
    if (tenants.length === 0) return;
    const headers = 'ID,Store Name,Email,Phone,Billing Type,Monthly Fee,Commission Rate (%),Total Sales,Calculated Revenue,Status,Expires At,Users,Groups,Charts,Transactions\n';
    const rows = tenants.map(t => {
      const status = t.is_active && t.days_remaining > 0 ? 'Active' : 'Expired/Suspended';
      return `${t.id},"${t.name.replace(/"/g, '""')}","${t.email || ''}","${t.phone_number || ''}",${t.billing_type},${t.monthly_amount},${t.commission_rate},${t.total_sales},${t.calculated_revenue},${status},${new Date(t.expires_at).toLocaleDateString()},${t.users_count},${t.groups_count},${t.charts_count},${t.transactions_count}`;
    }).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `saas_stores_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Indian numbering system formatter (e.g. ₹67,12,050)
  const formatIndianRupee = (num: number) => {
    return '₹' + Math.round(num).toLocaleString('en-IN');
  };

  // Platform Metrics
  const totalStores = tenants.length;
  const activeStores = tenants.filter(t => t.is_active && t.days_remaining > 0).length;
  const totalUsers = tenants.reduce((acc, t) => acc + (t.users_count || 0), 0);
  const totalGroups = tenants.reduce((acc, t) => acc + (t.groups_count || 0), 0);
  const totalSales = tenants.reduce((acc, t) => acc + (t.total_sales || 0), 0);
  const totalRevenue = tenants.reduce((acc, t) => acc + (t.calculated_revenue || 0), 0);
  const totalSalesRevenue = tenants.reduce((acc, t) => acc + (t.calculated_sales_revenue || 0), 0);
  const totalCuttingRevenue = tenants.reduce((acc, t) => acc + (t.calculated_cutting_revenue || 0), 0);

  // Periodic Telemetry Metrics
  const salesToday = tenants.reduce((acc, t) => acc + (t.sales_today || 0), 0);
  const salesThisWeek = tenants.reduce((acc, t) => acc + (t.sales_this_week || 0), 0);
  const salesThisMonth = tenants.reduce((acc, t) => acc + (t.sales_this_month || 0), 0);

  const revenueToday = tenants.reduce((acc, t) => acc + (t.revenue_today || 0), 0);
  const revenueThisWeek = tenants.reduce((acc, t) => acc + (t.revenue_this_week || 0), 0);
  const revenueThisMonth = tenants.reduce((acc, t) => acc + (t.revenue_this_month || 0), 0);

  // Cutting Telemetry Metrics
  const totalCutting = tenants.reduce((acc, t) => acc + (t.total_cutting || 0), 0);
  const cuttingToday = tenants.reduce((acc, t) => acc + (t.cutting_today || 0), 0);
  const cuttingThisWeek = tenants.reduce((acc, t) => acc + (t.cutting_this_week || 0), 0);
  const cuttingThisMonth = tenants.reduce((acc, t) => acc + (t.cutting_this_month || 0), 0);


  // Filtered & Sorted list
  const filteredTenants = tenants
    .filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = 
        filterStatus === 'all' 
          || (filterStatus === 'active' && t.is_active && t.days_remaining > 0)
          || (filterStatus === 'expired' && t.days_remaining === 0)
          || (filterStatus === 'suspended' && !t.is_active);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'expiry') return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden w-screen flex font-sans text-slate-800">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="brand-text">
            <span className="brand-name">skManagement</span>
            <span className="brand-version">SaaS Hub</span>
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
          
          <button
            onClick={() => { setActiveMenu('overview'); setSidebarOpen(false); }}
            className={`nav-item w-full text-left cursor-pointer border-none bg-transparent ${activeMenu === 'overview' ? 'active' : ''}`}
          >
            <span className="nav-icon"><Activity className="h-4.5 w-4.5 text-purple-600" /></span>
            <span className="nav-label">Overview</span>
          </button>

          <button
            onClick={() => { setActiveMenu('stores'); setSidebarOpen(false); }}
            className={`nav-item w-full text-left cursor-pointer border-none bg-transparent ${activeMenu === 'stores' ? 'active' : ''}`}
          >
            <span className="nav-icon"><Building2 className="h-4.5 w-4.5 text-purple-650" /></span>
            <span className="nav-label">Client Stores</span>
            <span className="nav-badge outline">{tenants.length}</span>
          </button>

          <button
            onClick={() => { setActiveMenu('cutting-revenue'); setSidebarOpen(false); }}
            className={`nav-item w-full text-left cursor-pointer border-none bg-transparent ${activeMenu === 'cutting-revenue' ? 'active' : ''}`}
          >
            <span className="nav-icon"><Scissors className="h-4.5 w-4.5 text-purple-650" /></span>
            <span className="nav-label">Cutting Revenue</span>
          </button>

          <button
            onClick={() => { setActiveMenu('tickets'); setSidebarOpen(false); }}
            className={`nav-item w-full text-left cursor-pointer border-none bg-transparent ${activeMenu === 'tickets' ? 'active' : ''}`}
          >
            <span className="nav-icon"><MessageSquare className="h-4.5 w-4.5 text-purple-600" /></span>
            <span className="nav-label">Support Tickets</span>
            {supportTickets.filter(t => t.status === 'OPEN').length > 0 && (
              <span className="nav-badge hot">
                {supportTickets.filter(t => t.status === 'OPEN').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveMenu('email-config'); setSidebarOpen(false); }}
            className={`nav-item w-full text-left cursor-pointer border-none bg-transparent ${activeMenu === 'email-config' ? 'active' : ''}`}
          >
            <span className="nav-icon"><Mail className="h-4.5 w-4.5 text-purple-600" /></span>
            <span className="nav-label">Email Config</span>
          </button>

          <button
            onClick={() => { setActiveMenu('activity-logs'); setSidebarOpen(false); fetchActivityLogs(); }}
            className={`nav-item w-full text-left cursor-pointer border-none bg-transparent ${activeMenu === 'activity-logs' ? 'active' : ''}`}
          >
            <span className="nav-icon"><History className="h-4.5 w-4.5 text-purple-650" /></span>
            <span className="nav-label">Activity Logs</span>
          </button>
        </nav>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <span className="avatar-status online"></span>
          </div>
          <div className="profile-info">
            <span className="profile-name">{user?.username}</span>
            <span className="profile-role">SaaS Owner</span>
          </div>
          <button onClick={handleLogout} className="profile-logout border-none cursor-pointer" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm"
        />
      )}

      {/* Main Container */}
      <div className="lg:pl-[280px] pl-0 min-h-screen flex flex-col flex-1 min-w-0 transition-all duration-300 relative overflow-hidden">
        {/* Background gradients inside content */}
        <div className="absolute top-[-30%] right-[-20%] w-[60%] h-[60%] bg-indigo-50/50 rounded-full blur-[160px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-30%] left-[-20%] w-[60%] h-[60%] bg-purple-50/50 rounded-full blur-[160px] pointer-events-none z-0"></div>

        {/* Top Header */}
        <header className="h-16 bg-white/85 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shadow-sm shrink-0 z-10">
          <div className="flex items-center">
            {/* Hamburger Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-3 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg cursor-pointer transition border-none bg-transparent"
              title="Open Sidebar"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {activeMenu === 'overview' && <span>SaaS Hub Dashboard</span>}
              {activeMenu === 'stores' && <span>Manage Client Stores</span>}
              {activeMenu === 'cutting-revenue' && <span>Client Cutting Revenue</span>}
              {activeMenu === 'tickets' && <span>Client Support Tickets</span>}
              {activeMenu === 'email-config' && <span>SMTP Email Configuration</span>}
              {activeMenu === 'activity-logs' && <span>Client Activity Logs</span>}
              <span className="text-[10px] bg-purple-50 text-purple-655 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">SaaS Hub</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-850">{user?.username}</p>
              <p className="text-[9px] font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block uppercase tracking-wider">
                SaaS Owner
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-500/10">
              {user?.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto z-10">
                 {/* VIEW: OVERVIEW */}
          {activeMenu === 'overview' && (
            <div className="space-y-6 animate-fade-in text-slate-800">
              {/* Alert Bar for Urgent Maintenance Issues */}
              {tenants.filter(t => !t.is_active || t.days_remaining === 0).length > 0 && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3 text-amber-850 shadow-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <span className="font-extrabold block text-sm tracking-tight text-amber-900 mb-0.5">Attention Required</span>
                    There are <span className="font-black text-amber-950">{tenants.filter(t => !t.is_active || t.days_remaining === 0).length} client stores</span> that are currently expired or suspended. Use the <button onClick={() => setActiveMenu('stores')} className="font-extrabold underline text-amber-900 hover:text-amber-950 bg-transparent border-none cursor-pointer p-0">Client Stores panel</button> to renew their subscriptions or restore access.
                  </div>
                </div>
              )}
              {/* Date Filter Bar */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-purple-50 text-purple-650 rounded-xl border border-purple-100">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">Telemetry Target Date</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Calculate all daily, weekly, and monthly revenues for the selected target date.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">Select Date:</span>
                  <input
                    type="date"
                    className="bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-800 rounded-xl py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all cursor-pointer font-bold shadow-sm"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate('')}
                      className="bg-slate-100 hover:bg-slate-200/80 active:bg-slate-105 text-slate-700 font-extrabold py-2 px-3.5 rounded-xl text-xs cursor-pointer transition-all border border-slate-200 whitespace-nowrap active:scale-95 shadow-sm"
                    >
                      Reset to Today
                    </button>
                  )}
                </div>
              </div>

              {/* Core Telemetry Panel */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-4 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span>Platform Overview (All-Time)</span>
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="bg-slate-50/50 border border-slate-200/50 p-4.5 rounded-2xl">
                    <div className="text-slate-550 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Total Stores</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{totalStores}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{activeStores} active now</div>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-200/50 p-4.5 rounded-2xl">
                    <div className="text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Platform Users</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{totalUsers}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Managers & Operators</div>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-200/50 p-4.5 rounded-2xl">
                    <div className="text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      <span>Active Groups</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{totalGroups}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">CRM groupings</div>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-200/50 p-4.5 rounded-2xl">
                    <div className="text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Global Sales</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{formatIndianRupee(totalSales)}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Client sales volume</div>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-200/50 p-4.5 rounded-2xl">
                    <div className="text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Scissors className="w-3.5 h-3.5 text-slate-400" />
                      <span>Global Cutting</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{formatIndianRupee(totalCutting)}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Client cutting volume</div>
                  </div>

                  <div className="bg-purple-50/40 border border-purple-100/80 p-4.5 rounded-2xl">
                    <div className="text-purple-700 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-purple-650" />
                      <span>Est. Revenue</span>
                    </div>
                    <div className="text-2xl font-black text-purple-755">{formatIndianRupee(totalRevenue)}</div>
                    <div className="text-[9px] text-purple-600 font-semibold mt-1 space-y-0.5">
                      <div>Sales Comm: {formatIndianRupee(totalSalesRevenue)}</div>
                      <div>Cutting Comm: {formatIndianRupee(totalCuttingRevenue)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Periodic Telemetry (Daily, Weekly, Monthly) */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-4 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Periodic Performance (Daily, Weekly, Monthly)</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Daily */}
                  <div className="bg-slate-50/40 border border-slate-200/70 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        {selectedDate ? `Daily (${selectedDate})` : 'Daily (Today)'}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[9px] font-extrabold border border-purple-100">24h Window</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase block">Sales Volume</span>
                        <span className="text-xl font-black text-slate-900">{formatIndianRupee(salesToday)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase block">SaaS Revenue Share</span>
                        <span className="text-xl font-black text-emerald-700">{formatIndianRupee(revenueToday)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Weekly */}
                  <div className="bg-slate-50/40 border border-slate-200/70 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        {selectedDate ? `Weekly (Up to ${selectedDate})` : 'Weekly (Rolling 7d)'}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[9px] font-extrabold border border-indigo-100">7 Days</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase block">Sales Volume</span>
                        <span className="text-xl font-black text-slate-900">{formatIndianRupee(salesThisWeek)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase block">SaaS Revenue Share</span>
                        <span className="text-xl font-black text-emerald-700">{formatIndianRupee(revenueThisWeek)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly */}
                  <div className="bg-slate-50/40 border border-slate-200/70 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        {selectedDate ? `Monthly (Up to ${selectedDate})` : 'Monthly (Rolling 30d)'}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[9px] font-extrabold border border-purple-100">30 Days</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase block">Sales Volume</span>
                        <span className="text-xl font-black text-slate-900">{formatIndianRupee(salesThisMonth)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase block">SaaS Revenue Share</span>
                        <span className="text-xl font-black text-emerald-700">{formatIndianRupee(revenueThisMonth)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance & client metrics section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subscription Health breakdown */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Client Subscription Health</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Current client store subscription lifetimes breakdown.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="border border-slate-100 rounded-2xl p-4 text-center bg-emerald-50/20">
                      <span className="text-2xl font-black text-emerald-700 block">
                        {tenants.filter(t => t.is_active && t.days_remaining > 5).length}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mt-1">Healthy</span>
                    </div>
                    <div className="border border-slate-100 rounded-2xl p-4 text-center bg-amber-50/20">
                      <span className="text-2xl font-black text-amber-700 block">
                        {tenants.filter(t => t.is_active && t.days_remaining <= 5 && t.days_remaining > 0).length}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mt-1">Expiring Soon</span>
                    </div>
                    <div className="border border-slate-100 rounded-2xl p-4 text-center bg-rose-50/20">
                      <span className="text-2xl font-black text-rose-700 block">
                        {tenants.filter(t => !t.is_active || t.days_remaining === 0).length}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mt-1">Expired / Susp.</span>
                    </div>
                  </div>
                </div>

                {/* Revenue Forecast Forecaster */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Expected Monthly Revenue Projection</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Projection estimates based on current active monthly subscriptions and commissions.</p>
                  </div>

                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Estimated Monthly Revenue</span>
                      <span className="text-2xl font-black text-purple-700 block mt-1">
                        {formatIndianRupee(
                          tenants
                            .filter(t => t.is_active && t.days_remaining > 0)
                            .reduce((sum, t) => {
                              if (t.billing_type === 'MONTHLY') {
                                return sum + (t.monthly_amount || 0);
                              } else {
                                // For commissions, use their rolling 30-day commission share as projection
                                return sum + (t.revenue_this_month || 0);
                              }
                            }, 0)
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl text-[9px] font-black uppercase">
                        Active Contracts
                      </span>
                      <span className="text-[10px] text-slate-450 font-semibold block mt-1.5">
                        {tenants.filter(t => t.is_active && t.days_remaining > 0).length} stores contributing
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Revenue Contributors List */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Store Revenue Contributions</h3>
                  <p className="text-[10px] text-slate-400">Active client stores sorted by their total generated revenue share for tracking platform performance.</p>
                </div>

                <div className="overflow-hidden border border-slate-150 rounded-2xl bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[9px] font-bold uppercase tracking-wider border-b border-slate-150">
                        <th className="px-4 py-3">Store Name</th>
                        <th className="px-4 py-3">Billing Type</th>
                        <th className="px-4 py-3">Total Sales (en-IN)</th>
                        <th className="px-4 py-3 text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {tenants.slice(0, 5).map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-extrabold text-slate-850">{tenant.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                              tenant.billing_type === 'COMMISSION' 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-150' 
                                : tenant.billing_type === 'CUTTING_COMMISSION'
                                ? 'bg-purple-50 text-purple-700 border-purple-155'
                                : tenant.billing_type === 'BOTH_COMMISSION'
                                ? 'bg-pink-50 text-pink-700 border-pink-150'
                                : 'bg-amber-50 text-amber-700 border-amber-150'
                            }`}>
                              {tenant.billing_type === 'COMMISSION' ? 'Commission' : tenant.billing_type === 'CUTTING_COMMISSION' ? 'Cutting Comm.' : tenant.billing_type === 'BOTH_COMMISSION' ? 'Sales & Cutting' : 'Monthly Fee'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{formatIndianRupee(tenant.total_sales || 0)}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatIndianRupee(tenant.calculated_revenue || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: STORES LIST */}
          {activeMenu === 'stores' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Client Store Subscriptions</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Monitor store telemetry, contact coordinates, billing setups, and renew access.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleExportCSV}
                    disabled={tenants.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold rounded-xl text-xs cursor-pointer border border-slate-200 transition-all shadow-sm disabled:opacity-50"
                  >
                    <FileDown className="w-4 h-4 text-slate-500" />
                    <span>Export CSV Report</span>
                  </button>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-500/15 cursor-pointer transition-all hover:scale-[1.01] border-none"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    <span>Onboard Store</span>
                  </button>
                </div>
              </div>

              {/* Search & filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 text-slate-800 rounded-xl py-2 pl-9 pr-4 placeholder-slate-400 focus:outline-none text-xs transition-all"
                    placeholder="Search by store name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="relative flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter:</span>
                  <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <Filter className="w-3.5 h-3.5" />
                    </span>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 focus:border-purple-500 text-slate-700 rounded-xl py-2 pl-9 pr-4 focus:outline-none text-xs transition-all appearance-none cursor-pointer"
                    >
                      <option value="all">All Subscriptions</option>
                      <option value="active">Active Only</option>
                      <option value="expired">Expired Only</option>
                      <option value="suspended">Suspended Only</option>
                    </select>
                  </div>
                </div>

                <div className="relative flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Sort:</span>
                  <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 focus:border-purple-500 text-slate-700 rounded-xl py-2 pl-9 pr-4 focus:outline-none text-xs transition-all appearance-none cursor-pointer"
                    >
                      <option value="created">Recently Registered</option>
                      <option value="name">Store Name (A-Z)</option>
                      <option value="expiry">Expiration Date</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stores Table */}
              {isLoading && tenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-purple-600"></div>
                  <p className="text-xs font-semibold text-slate-500">Retrieving SaaS tenant records...</p>
                </div>
              ) : filteredTenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <Building2 className="w-14 h-14 text-slate-300 mb-4" />
                  <h3 className="text-base font-black text-slate-700">No matching stores</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Try refining your search queries or filter selections to locate the client store.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">Store Details</th>
                        <th className="px-6 py-4">Contact Info</th>
                        <th className="px-6 py-4">Billing Model</th>
                        <th className="px-6 py-4">Usage & Calculated Revenue</th>
                        <th className="px-6 py-4">Status & Expiry</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTenants.map((tenant) => {
                        const isTimeActive = tenant.days_remaining > 0;
                        const isFullyActive = tenant.is_active && isTimeActive;
                        return (
                          <tr key={tenant.id} className="hover:bg-slate-50/30 transition-colors">
                            {/* Store details */}
                            <td className="px-6 py-4.5">
                              <div className="flex items-center space-x-3.5">
                                <div className={`p-2.5 rounded-xl border ${
                                  isFullyActive 
                                    ? 'bg-purple-50 text-purple-650 border-purple-100' 
                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                }`}>
                                  <Building2 className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 block text-sm tracking-tight">{tenant.name}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">ID: {tenant.id} • Registered: {new Date(tenant.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </td>

                            {/* Contact info */}
                            <td className="px-6 py-4.5">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{tenant.email || <span className="text-slate-400 italic">None</span>}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-550 font-semibold">
                                  <Smartphone className="w-3 h-3 text-slate-400" />
                                  <span>{tenant.phone_number || <span className="text-slate-400 italic">None</span>}</span>
                                </div>
                              </div>
                            </td>

                            {/* Billing configuration */}
                            <td className="px-6 py-4.5">
                              <div className="space-y-0.5 relative group">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                                  tenant.billing_type === 'COMMISSION' 
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                    : tenant.billing_type === 'CUTTING_COMMISSION'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                    : tenant.billing_type === 'BOTH_COMMISSION'
                                    ? 'bg-pink-50 text-pink-700 border border-pink-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {tenant.billing_type === 'COMMISSION' ? 'Commission' : tenant.billing_type === 'CUTTING_COMMISSION' ? 'Cutting Comm.' : tenant.billing_type === 'BOTH_COMMISSION' ? 'Sales & Cutting' : 'Monthly Fee'}
                                </span>
                                <span className="block text-[11px] font-extrabold text-slate-700 mt-1 leading-relaxed">
                                  {tenant.billing_type === 'COMMISSION' && <span>Sales: {tenant.commission_rate}%</span>}
                                  {tenant.billing_type === 'CUTTING_COMMISSION' && <span>Cutting: {tenant.cutting_commission_rate || tenant.commission_rate}%</span>}
                                  {tenant.billing_type === 'BOTH_COMMISSION' && (
                                    <span className="block">
                                      Sales: {tenant.commission_rate}% <br />
                                      Cutting: {tenant.cutting_commission_rate}%
                                    </span>
                                  )}
                                  {tenant.billing_type === 'MONTHLY' && <span>{formatIndianRupee(tenant.monthly_amount)}</span>}
                                </span>
                                <button
                                  onClick={() => handleStartEdit(tenant)}
                                  className="absolute right-0 top-0.5 p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md cursor-pointer transition opacity-0 group-hover:opacity-100 border border-slate-200 shadow-sm"
                                  title="Edit billing configuration"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </td>

                            {/* Calculated sales and revenue */}
                            <td className="px-6 py-4.5">
                              <div className="space-y-1">
                                <div className="flex items-center flex-wrap gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-200/50 rounded-md text-[9px] font-semibold text-slate-550">
                                    <Users className="w-2.5 h-2.5 text-slate-400" />
                                    <span>{tenant.users_count || 0} Users</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-200/50 rounded-md text-[9px] font-semibold text-slate-550">
                                    <BarChart3 className="w-2.5 h-2.5 text-slate-400" />
                                    <span>{tenant.transactions_count || 0} Tx</span>
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-600 mt-1">
                                  Total Sales: <span className="font-extrabold text-slate-900">{formatIndianRupee(tenant.total_sales || 0)}</span>
                                </div>
                                <div className="text-[11px] font-bold text-emerald-655 mt-1 space-y-0.5 leading-relaxed">
                                  {tenant.billing_type === 'BOTH_COMMISSION' ? (
                                    <>
                                      <span className="block text-[10px] text-slate-500 font-semibold">
                                        Sales Comm: {formatIndianRupee(tenant.calculated_sales_revenue || 0)}
                                      </span>
                                      <span className="block text-[10px] text-slate-500 font-semibold">
                                        Cutting Comm: {formatIndianRupee(tenant.calculated_cutting_revenue || 0)}
                                      </span>
                                      <span className="block font-black text-emerald-700">
                                        Total: {formatIndianRupee(tenant.calculated_revenue || 0)}
                                      </span>
                                    </>
                                  ) : (
                                    <span>Revenue: <span className="font-extrabold text-emerald-700">{formatIndianRupee(tenant.calculated_revenue || 0)}</span></span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Status & Expiry */}
                            <td className="px-6 py-4.5">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleToggleActive(tenant)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      tenant.is_active ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`}
                                    title={tenant.is_active ? "Suspend access" : "Activate access"}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        tenant.is_active ? 'translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                  <span className={`text-[11px] font-extrabold ${tenant.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {tenant.is_active ? 'Active' : 'Suspended'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-655 font-bold mt-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-450" />
                                  <span>{new Date(tenant.expires_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-semibold">
                                  <Clock className={`w-3 h-3 ${tenant.days_remaining <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                                  <span className={tenant.days_remaining === 0 ? 'text-rose-600 font-extrabold' : tenant.days_remaining <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-500'}>
                                    {tenant.days_remaining === 0 ? 'Expired' : `${tenant.days_remaining} d left`}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4.5 text-right space-x-2">
                              <button
                                onClick={() => handleStartEdit(tenant)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] cursor-pointer border border-slate-200 transition-all shadow-sm"
                              >
                                <Edit3 className="w-3 h-3 text-slate-500" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteTenant(tenant.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl cursor-pointer transition-all shadow-sm inline-flex items-center"
                                title="Delete store permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: SUPPORT TICKETS */}
          {activeMenu === 'tickets' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Client Reported Technical Issues</h3>
                <p className="text-xs text-slate-500 mt-0.5">Review and mark technical issues submitted by tenant operators as resolved.</p>
              </div>

              {isSupportLoading && supportTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-purple-600"></div>
                  <p className="text-xs font-semibold text-slate-500">Retrieving support tickets...</p>
                </div>
              ) : supportTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <HelpCircle className="w-14 h-14 text-slate-300 mb-4" />
                  <h3 className="text-base font-black text-slate-700">No support tickets</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">No client stores have submitted any issues. Excellent!</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">Store / User Details</th>
                        <th className="px-6 py-4">Issue Summary</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Date Reported</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {supportTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4.5">
                            <div>
                              <span className="font-extrabold text-slate-900 block text-sm tracking-tight">{ticket.tenant_name || 'System'}</span>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">by {ticket.username}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4.5 max-w-md">
                            <div className="space-y-1">
                              <span className="font-extrabold text-slate-900 block">{ticket.title}</span>
                              <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                            </div>
                          </td>

                          <td className="px-6 py-4.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                              ticket.status === 'RESOLVED' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                            }`}>
                              {ticket.status}
                            </span>
                          </td>

                          <td className="px-6 py-4.5 text-xs font-semibold text-slate-600">
                            {new Date(ticket.created_at).toLocaleString()}
                          </td>

                          <td className="px-6 py-4.5 text-right">
                            {ticket.status === 'OPEN' ? (
                              <button
                                onClick={() => handleResolveTicket(ticket.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-bold rounded-xl text-xs cursor-pointer border border-purple-200 transition-all shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Resolve</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs italic">No actions</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: EMAIL CONFIG */}
          {activeMenu === 'email-config' && (
            <div className="max-w-2xl bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-8 space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Mail className="w-5.5 h-5.5 text-purple-650" />
                  <span>SaaS System SMTP configuration</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure the SMTP credentials used by the system to dispatch reports, ticket receipts, and client welcome mails.</p>
              </div>

              {emailStatus && (
                <div className={`p-4 rounded-xl text-xs font-bold border ${
                  emailStatus.includes('success') 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-red-50 text-red-750 border-red-100'
                }`}>
                  {emailStatus}
                </div>
              )}

              {isEmailLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="text-xs font-medium text-slate-550">Retrieving credentials...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveEmailSettings} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">SMTP Server Host</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2.5 px-3.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                        placeholder="e.g. smtp.gmail.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">SMTP Port</label>
                      <input
                        type="number"
                        required
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2.5 px-3.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                        placeholder="e.g. 587"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Username / Account Email</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2.5 px-3.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                        placeholder="e.g. hello@mycompany.com"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password / App Password</label>
                      <input
                        type="password"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2.5 px-3.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                        placeholder="••••••••••••••"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sender Address (From)</label>
                    <input
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2.5 px-3.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                      placeholder="e.g. system-alerts@mycompany.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-3.5 pt-2">
                    <input
                      type="checkbox"
                      id="useTls"
                      className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                      checked={useTls}
                      onChange={(e) => setUseTls(e.target.checked)}
                    />
                    <label htmlFor="useTls" className="text-xs font-bold text-slate-700 cursor-pointer">Use Secure TLS Connection (Recommended)</label>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={isEmailSaving}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-550/15 cursor-pointer transition-all border-none"
                    >
                      {isEmailSaving ? 'Saving Config...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* VIEW: CUTTING REVENUE */}
          {activeMenu === 'cutting-revenue' && (
            <div className="space-y-6 animate-fade-in text-slate-800">
              {/* Telemetry section */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-4 flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-purple-600" />
                  <span>Platform Cutting Telemetry</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Platform Cutting</span>
                    <span className="text-xl font-black text-slate-900 block mt-1">{formatIndianRupee(totalCutting)}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">All-time volume recorded</span>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Today's Cutting</span>
                    <span className="text-xl font-black text-slate-900 block mt-1">{formatIndianRupee(cuttingToday)}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Added in last 24h</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Weekly Cutting (7d)</span>
                    <span className="text-xl font-black text-slate-900 block mt-1">{formatIndianRupee(cuttingThisWeek)}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Rolling 7 days</span>
                  </div>

                  <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Monthly Cutting (30d)</span>
                    <span className="text-xl font-black text-purple-800 block mt-1">{formatIndianRupee(cuttingThisMonth)}</span>
                    <span className="text-[10px] text-purple-550 mt-1 block">Rolling 30 days</span>
                  </div>
                </div>
              </div>

              {/* Client list for Cutting Revenue */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Client Cutting Details & derived Commissions</h3>
                  <p className="text-[10px] text-slate-455 mt-0.5">Below is a breakdown of cutting volume, configurations, and commission shares for each active client store.</p>
                </div>

                <div className="overflow-hidden border border-slate-150 rounded-2xl bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-150">
                        <th className="px-5 py-3.5">Store Client</th>
                        <th className="px-5 py-3.5">Billing Setup</th>
                        <th className="px-5 py-3.5">Cutting Volume (All-Time)</th>
                        <th className="px-5 py-3.5">Today's Cutting</th>
                        <th className="px-5 py-3.5">Estimated Commission Rate</th>
                        <th className="px-5 py-3.5 text-right">Commission Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {tenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-5 py-4">
                            <div>
                              <span className="font-extrabold text-slate-900 text-sm block leading-tight">{tenant.name}</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">ID: {tenant.id}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${
                              tenant.billing_type === 'CUTTING_COMMISSION' || tenant.billing_type === 'BOTH_COMMISSION'
                                ? 'bg-purple-50 text-purple-700 border-purple-155 animate-pulse' 
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                              {tenant.billing_type === 'CUTTING_COMMISSION' || tenant.billing_type === 'BOTH_COMMISSION' ? 'Active Cutting Billing' : 'Other Billing'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-900 font-bold">{formatIndianRupee(tenant.total_cutting || 0)}</td>
                          <td className="px-5 py-4 text-slate-600">{formatIndianRupee(tenant.cutting_today || 0)}</td>
                          <td className="px-5 py-4 text-slate-655 font-bold">
                            {tenant.billing_type === 'CUTTING_COMMISSION' && `${tenant.cutting_commission_rate || tenant.commission_rate}%`}
                            {tenant.billing_type === 'BOTH_COMMISSION' && `${tenant.cutting_commission_rate}%`}
                            {tenant.billing_type !== 'CUTTING_COMMISSION' && tenant.billing_type !== 'BOTH_COMMISSION' && 'N/A'}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-emerald-700">
                            {tenant.billing_type === 'CUTTING_COMMISSION' && formatIndianRupee(tenant.calculated_revenue || 0)}
                            {tenant.billing_type === 'BOTH_COMMISSION' && formatIndianRupee(tenant.calculated_cutting_revenue || 0)}
                            {tenant.billing_type !== 'CUTTING_COMMISSION' && tenant.billing_type !== 'BOTH_COMMISSION' && '₹0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ACTIVITY LOGS */}
          {activeMenu === 'activity-logs' && (
            <div className="space-y-6 animate-fade-in text-slate-800">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <History className="h-6.5 w-6.5 text-purple-650" />
                    <span>Client Activity Logs</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time audit log of transaction creations, updates, and deletions performed by client store operators.</p>
                </div>
                <div>
                  <button
                    onClick={fetchActivityLogs}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer border border-slate-200 transition-all shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-500 ${isLogsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh Logs</span>
                  </button>
                </div>
              </div>

              {isLogsLoading && activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-purple-600"></div>
                  <p className="text-xs font-semibold text-slate-500">Retrieving system activity logs...</p>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <History className="w-14 h-14 text-slate-300 mb-4" />
                  <h3 className="text-base font-black text-slate-700">No activity logs recorded</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Activities will automatically populate when operators create, modify, or delete sale records in their stores.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">Client Store</th>
                        <th className="px-6 py-4">Operator</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Details</th>
                        <th className="px-6 py-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-extrabold text-slate-900 block text-sm tracking-tight">{log.tenant_name}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Tenant ID: {log.tenant}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-850 font-bold block">{log.username || 'System'}</span>
                            <span className="text-[9px] text-purple-650 bg-purple-50 px-1.5 py-0.5 rounded font-black tracking-wider uppercase inline-block mt-0.5">{log.user_role}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black border uppercase ${
                              log.action === 'CREATE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : log.action === 'UPDATE'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-sm">
                            <p className="text-slate-800 font-semibold break-words leading-relaxed">{log.details}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-semibold">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* EDIT SUBSCRIPTION & BILLING MODAL */}
      {editingTenant && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Glowing top line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-purple-655" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Edit Store & Billing</h3>
                  <p className="text-[9px] text-slate-450 mt-0.5">Configure access and revenue parameters for {editingTenant.name}.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubscriptionAndBilling} className="p-6 space-y-4">
              
              {/* Billing Type Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Billing Model</label>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditBillingType('MONTHLY')}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      editBillingType === 'MONTHLY'
                        ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                    }`}
                  >
                    <IndianRupee className="w-4 h-4 text-purple-550" />
                    <span>Monthly Charges</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditBillingType('COMMISSION')}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      editBillingType === 'COMMISSION'
                        ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                    }`}
                  >
                    <Percent className="w-4 h-4 text-purple-550" />
                    <span>Commission on Sales</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditBillingType('CUTTING_COMMISSION')}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      editBillingType === 'CUTTING_COMMISSION'
                        ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                    }`}
                  >
                    <Scissors className="w-4 h-4 text-purple-550" />
                    <span>Commission on Cutting</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditBillingType('BOTH_COMMISSION')}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      editBillingType === 'BOTH_COMMISSION'
                        ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                    }`}
                  >
                    <Percent className="w-4 h-4 text-purple-550" />
                    <span>Commission on Sales & Cutting</span>
                  </button>
                </div>
              </div>

              {/* Billing details amount input */}
              {editBillingType === 'MONTHLY' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Monthly Charge Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <IndianRupee className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2 pl-10 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                      value={editMonthlyAmount}
                      onChange={(e) => setEditMonthlyAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ) : editBillingType === 'COMMISSION' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sales Commission Rate (%)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Percent className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2 pl-10 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                      value={editCommissionRate}
                      onChange={(e) => setEditCommissionRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ) : editBillingType === 'CUTTING_COMMISSION' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cutting Commission Rate (%)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Percent className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2 pl-10 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                      value={editCuttingCommissionRate}
                      onChange={(e) => setEditCuttingCommissionRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sales Comm. (%)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Percent className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2 pl-10 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                        value={editCommissionRate}
                        onChange={(e) => setEditCommissionRate(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cutting Comm. (%)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Percent className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2 pl-10 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                        value={editCuttingCommissionRate}
                        onChange={(e) => setEditCuttingCommissionRate(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Extend active Days */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Extend Subscription Access (Optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-2 pl-10 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-xs transition-all"
                    placeholder="e.g. 30, 90 (leave blank to keep current)"
                    value={editExtendDays}
                    onChange={(e) => setEditExtendDays(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all border border-slate-250"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-purple-600/15 cursor-pointer transition-all flex items-center justify-center space-x-2 border-none"
                >
                  {isSavingEdit ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREMIUM SLIDE-OVER ONBOARDING DRAWER */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay background */}
          <div 
            onClick={() => setIsCreateOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl relative flex flex-col border-l border-slate-200 transition-transform duration-300 ease-in-out">
              {/* Glowing accent border */}
              <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-purple-500 via-pink-500 to-indigo-500"></div>
              
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 text-purple-650 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Onboard Tenant Store</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Provision fresh client space & first Super Admin.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer transition-all border-none bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTenant} className="p-6 flex-1 overflow-y-auto space-y-5">
                {error && (
                  <div className="flex items-start space-x-2.5 p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="bg-purple-50/30 border border-purple-100/50 p-4 rounded-2xl space-y-1.5">
                  <div className="text-[10px] font-black text-purple-755 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Secure Provisioning</span>
                  </div>
                  <p className="text-[11px] text-purple-900/80 leading-normal">Creating a store will automatically generate its database workspace schema and register the first super user with administrative permissions.</p>
                </div>

                {/* Store Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Store / Client Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                      placeholder="e.g. Royal Matka Store"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Client Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Client Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                      placeholder="client@store.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Client Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Client Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                      placeholder="e.g. +1234567890"
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Billing Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Billing Model</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCreateBillingType('MONTHLY')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        createBillingType === 'MONTHLY'
                          ? 'bg-purple-50 text-purple-750 border-purple-300 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                      }`}
                    >
                      <IndianRupee className="w-4 h-4 text-purple-550" />
                      <span>Monthly Charges</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateBillingType('COMMISSION')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        createBillingType === 'COMMISSION'
                          ? 'bg-purple-50 text-purple-750 border-purple-300 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                      }`}
                    >
                      <Percent className="w-4 h-4 text-purple-550" />
                      <span>Commission on Sales</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateBillingType('CUTTING_COMMISSION')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        createBillingType === 'CUTTING_COMMISSION'
                          ? 'bg-purple-50 text-purple-750 border-purple-300 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                      }`}
                    >
                      <Scissors className="w-4 h-4 text-purple-550" />
                      <span>Commission on Cutting</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateBillingType('BOTH_COMMISSION')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        createBillingType === 'BOTH_COMMISSION'
                          ? 'bg-purple-50 text-purple-750 border-purple-300 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                      }`}
                    >
                      <Percent className="w-4 h-4 text-purple-550" />
                      <span>Commission on Sales & Cutting</span>
                    </button>
                  </div>
                </div>

                 {/* Billing details */}
                {createBillingType === 'MONTHLY' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Monthly Charge Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <IndianRupee className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                        value={createMonthlyAmount}
                        onChange={(e) => setCreateMonthlyAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}

                {createBillingType === 'COMMISSION' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sales Commission Rate (%)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Percent className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                        value={createCommissionRate}
                        onChange={(e) => setCreateCommissionRate(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}

                {createBillingType === 'CUTTING_COMMISSION' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cutting Commission Rate (%)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Percent className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                        value={createCuttingCommissionRate}
                        onChange={(e) => setCreateCuttingCommissionRate(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}

                {createBillingType === 'BOTH_COMMISSION' && (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sales Comm. (%)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                          <Percent className="w-4 h-4" />
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                          value={createCommissionRate}
                          onChange={(e) => setCreateCommissionRate(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cutting Comm. (%)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                          <Percent className="w-4 h-4" />
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                          value={createCuttingCommissionRate}
                          onChange={(e) => setCreateCuttingCommissionRate(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3"></div>

                {/* Admin Username */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Super Admin Username</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                      placeholder="e.g. royaladmin"
                      value={createUsername}
                      onChange={(e) => setCreateUsername(e.target.value)}
                    />
                  </div>
                </div>

                {/* Admin Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Super Admin Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-10 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                      placeholder="••••••••"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer border-none bg-transparent"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Active Days */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Subscription Days</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Clock className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
                      value={createActiveDays}
                      onChange={(e) => setCreateActiveDays(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </form>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 bg-white hover:bg-slate-100 active:bg-white text-slate-700 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateTenant}
                  disabled={isSubmitting || !createName || !createUsername || !createPassword}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg shadow-purple-500/15 cursor-pointer transition-all flex items-center justify-center space-x-2 disabled:opacity-50 border-none"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-200" />
                      <span>Onboard Client</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaaSDashboard;
