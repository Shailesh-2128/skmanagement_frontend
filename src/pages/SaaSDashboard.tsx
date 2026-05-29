import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import saasApi from '../api/saas.api';
import supportApi, { SupportTicketData } from '../api/support.api';
import { SaasTenant } from '../types/auth.types';
import { 
  Building2, Plus, LogOut, Trash2, Calendar, 
  Clock, ShieldAlert, Sparkles, User, KeyRound, X, CalendarDays,
  Activity, Search, Filter, ArrowUpDown, ShieldCheck, 
  Database, Users, BarChart3, FileDown, HelpCircle, CheckCircle2,
  Eye, EyeOff
} from 'lucide-react';

export const SaaSDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const [tenants, setTenants] = useState<SaasTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'expiry' | 'created'>('created');
  
  // Onboard Slide-over drawer state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createActiveDays, setCreateActiveDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Renew Modal state
  const [editingTenant, setEditingTenant] = useState<SaasTenant | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [isExtending, setIsExtending] = useState(false);

  // Support Tickets tab states
  const [activeTab, setActiveTab] = useState<'tenants' | 'support'>('tenants');
  const [supportTickets, setSupportTickets] = useState<SupportTicketData[]>([]);
  const [isSupportLoading, setIsSupportLoading] = useState(false);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const data = await saasApi.list();
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

  useEffect(() => {
    fetchTenants();
    fetchSupportTickets();
  }, []);

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
      });
      setCreateName('');
      setCreateUsername('');
      setCreatePassword('');
      setCreateActiveDays(30);
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

  const handleExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsExtending(true);
    try {
      await saasApi.update(editingTenant.id, { active_days: extendDays });
      setEditingTenant(null);
      setExtendDays(30);
      fetchTenants();
    } catch (err: any) {
      alert('Failed to extend subscription.');
    } finally {
      setIsExtending(false);
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
    const headers = 'ID,Store Name,Status,Expires At,Users,Groups,Charts,Transactions\n';
    const rows = tenants.map(t => {
      const status = t.is_active && t.days_remaining > 0 ? 'Active' : 'Expired/Suspended';
      return `${t.id},"${t.name.replace(/"/g, '""')}",${status},${new Date(t.expires_at).toLocaleDateString()},${t.users_count},${t.groups_count},${t.charts_count},${t.transactions_count}`;
    }).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `saas_stores_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Platform Metrics
  const totalStores = tenants.length;
  const activeStores = tenants.filter(t => t.is_active && t.days_remaining > 0).length;
  const totalUsers = tenants.reduce((acc, t) => acc + (t.users_count || 0), 0);
  const totalGroups = tenants.reduce((acc, t) => acc + (t.groups_count || 0), 0);
  const totalTransactions = tenants.reduce((acc, t) => acc + (t.transactions_count || 0), 0);

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
    <div className="bg-slate-50 text-slate-800 min-h-screen w-screen p-6 md:p-8 flex flex-col font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-30%] right-[-20%] w-[60%] h-[60%] bg-indigo-50 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-[-30%] left-[-20%] w-[60%] h-[60%] bg-purple-50 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col relative">
        {/* Header Section */}
        <header className="relative flex flex-col md:flex-row md:items-center md:justify-between bg-white/80 backdrop-blur-lg border border-slate-200/60 px-8 py-5 rounded-3xl mb-8 shadow-sm">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="p-3 bg-gradient-to-tr from-purple-650 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/10">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                skManagement <span className="text-[10px] bg-purple-50 text-purple-605 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">SaaS Hub</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Control panel for managing client stores and subscription cycles.</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between md:justify-end gap-4">
            <div className="hidden sm:block text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Authorized Session</span>
              <span className="text-xs font-bold text-slate-700">{user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold rounded-xl text-xs cursor-pointer border border-slate-200 transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Global SaaS Telemetry Panel */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 mb-8 shadow-sm">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-4 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span>Platform-wide Telemetry</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {/* KPI 1 */}
            <div className="bg-slate-50/50 border border-slate-200/50 p-4.5 rounded-2xl">
              <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Total Stores</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{totalStores}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{activeStores} active now</div>
            </div>
            {/* KPI 2 */}
            <div className="bg-slate-50/50 border border-slate-200/50 p-4.5 rounded-2xl">
              <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Platform Users</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{totalUsers}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Managers & Operators</div>
            </div>
            {/* KPI 3 */}
            <div className="bg-slate-50/50 border border-slate-200/50 p-4.5 rounded-2xl">
              <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Active Groups</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{totalGroups}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Custom CRM groupings</div>
            </div>
            {/* KPI 4 */}
            <div className="bg-slate-50/50 border border-slate-200/50 p-4.5 rounded-2xl col-span-2 lg:col-span-2">
              <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                <span>Global Transactions</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{totalTransactions.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total sales & wins recorded platform-wide</div>
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col">
          {/* Tab Switcher */}
          <div className="flex gap-2 border-b border-slate-150 pb-3 mb-6 no-print">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === 'tenants'
                  ? 'bg-purple-650 text-white shadow-sm font-extrabold'
                  : 'text-slate-650 hover:bg-slate-100/50'
              }`}
            >
              Client Stores ({tenants.length})
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center ${
                activeTab === 'support'
                  ? 'bg-purple-650 text-white shadow-sm font-extrabold'
                  : 'text-slate-650 hover:bg-slate-100/50'
              }`}
            >
              <span>Support Tickets</span>
              {supportTickets.filter(t => t.status === 'OPEN').length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] bg-rose-500 text-white font-black animate-pulse">
                  {supportTickets.filter(t => t.status === 'OPEN').length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'tenants' && (
            <div className="flex-grow flex flex-col">
              {/* Top Panel Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Client Subscriptions</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Monitor activity telemetry, suspend access, and renew subscriptions.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleExportCSV}
                    disabled={tenants.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold rounded-xl text-xs cursor-pointer border border-slate-200 transition-all shadow-sm disabled:opacity-50"
                  >
                    <FileDown className="w-4 h-4 text-slate-500" />
                    <span>Export Report</span>
                  </button>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-500/15 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    <span>Onboard Store</span>
                  </button>
                </div>
              </div>

              {/* Search, Filter, and Sort Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl">
                {/* Search */}
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
                {/* Filter */}
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
                {/* Sort */}
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

              {/* Client Table List */}
              {isLoading && tenants.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-purple-600"></div>
                  <p className="text-xs font-semibold text-slate-500">Retrieving secure SaaS tenant records...</p>
                </div>
              ) : filteredTenants.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <Building2 className="w-14 h-14 text-slate-300 mb-4" />
                  <h3 className="text-base font-black text-slate-700">No matching stores</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Try refining your search queries or filter selections to find the client store.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">Store / Client details</th>
                        <th className="px-6 py-4">Operational Status</th>
                        <th className="px-6 py-4">Expiration Date</th>
                        <th className="px-6 py-4">Usage & Activity Metrics</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTenants.map((tenant) => {
                        const isTimeActive = tenant.days_remaining > 0;
                        const isFullyActive = tenant.is_active && isTimeActive;
                        return (
                          <tr key={tenant.id} className="hover:bg-slate-50/30 transition-colors">
                            {/* Store Info */}
                            <td className="px-6 py-4.5">
                              <div className="flex items-center space-x-3.5">
                                <div className={`p-2.5 rounded-xl border ${
                                  isFullyActive 
                                    ? 'bg-purple-55/70 text-purple-650 border-purple-100' 
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

                            {/* Toggle Switch */}
                            <td className="px-6 py-4.5">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleToggleActive(tenant)}
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    tenant.is_active ? 'bg-emerald-500' : 'bg-slate-200'
                                  }`}
                                  title={tenant.is_active ? "Click to suspend account" : "Click to activate account"}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      tenant.is_active ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                                <span className={`text-xs font-bold ${
                                  tenant.is_active ? 'text-emerald-600' : 'text-slate-400'
                                }`}>
                                  {tenant.is_active ? 'Active' : 'Suspended'}
                                </span>
                              </div>
                            </td>

                            {/* Expiration Date & Countdown */}
                            <td className="px-6 py-4.5">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{new Date(tenant.expires_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-semibold">
                                  <Clock className={`w-3 h-3 ${tenant.days_remaining <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                                  <span className={tenant.days_remaining === 0 ? 'text-rose-600 font-extrabold' : tenant.days_remaining <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-500'}>
                                    {tenant.days_remaining === 0 ? 'Expired' : `${tenant.days_remaining} day${tenant.days_remaining !== 1 ? 's' : ''} left`}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Usage Statistics */}
                            <td className="px-6 py-4.5">
                              <div className="flex items-center flex-wrap gap-2 max-w-xs">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/50 rounded-lg text-[10px] font-bold text-slate-600">
                                  <Users className="w-3 h-3 text-slate-400" />
                                  <span>{tenant.users_count || 0} Users</span>
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/50 rounded-lg text-[10px] font-bold text-slate-600">
                                  <Database className="w-3 h-3 text-slate-400" />
                                  <span>{tenant.groups_count || 0} Groups</span>
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/50 rounded-lg text-[10px] font-bold text-slate-600" title="Charts configured">
                                  <Activity className="w-3 h-3 text-slate-400" />
                                  <span>{tenant.charts_count || 0} Charts</span>
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50/50 border border-purple-100 rounded-lg text-[10px] font-bold text-purple-650" title="Recorded operations">
                                  <BarChart3 className="w-3 h-3 text-purple-400" />
                                  <span>{tenant.transactions_count || 0} Tx</span>
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4.5 text-right space-x-2">
                              <button
                                onClick={() => setEditingTenant(tenant)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold rounded-xl text-xs cursor-pointer border border-slate-200 transition-all shadow-sm"
                              >
                                <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                                <span>Renew</span>
                              </button>
                              <button
                                onClick={() => handleDeleteTenant(tenant.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl cursor-pointer transition-all shadow-sm"
                                title="Delete store and database entry"
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

          {activeTab === 'support' && (
            <div className="flex-grow flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Client Reported Issues</h3>
                <p className="text-xs text-slate-500 mt-0.5">Review and resolve technical issues submitted by client stores and operators.</p>
              </div>

              {isSupportLoading && supportTickets.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-purple-600"></div>
                  <p className="text-xs font-semibold text-slate-500">Retrieving support tickets...</p>
                </div>
              ) : supportTickets.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <HelpCircle className="w-14 h-14 text-slate-300 mb-4" />
                  <h3 className="text-base font-black text-slate-700">No support tickets</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">No client stores have submitted any issues. Excellent!</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
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
                          {/* Store / User Details */}
                          <td className="px-6 py-4.5">
                            <div className="flex items-center space-x-3.5">
                              <div>
                                <span className="font-extrabold text-slate-900 block text-sm tracking-tight">{ticket.tenant_name || 'System / Indep.'}</span>
                                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">by {ticket.username} (ID: {ticket.user})</span>
                              </div>
                            </div>
                          </td>

                          {/* Issue Details */}
                          <td className="px-6 py-4.5 max-w-md">
                            <div className="space-y-1">
                              <span className="font-extrabold text-slate-900 block">{ticket.title}</span>
                              <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                              ticket.status === 'RESOLVED' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                            }`}>
                              {ticket.status}
                            </span>
                          </td>

                          {/* Date Reported */}
                          <td className="px-6 py-4.5 text-xs font-semibold text-slate-600">
                            {new Date(ticket.created_at).toLocaleString()}
                          </td>

                          {/* Actions */}
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
        </div>
      </div>

      {/* RENEW SUBSCRIPTION MODAL */}
      {editingTenant && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Glowing top line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5.5 h-5.5 text-emerald-500" />
                <span>Extend Subscription</span>
              </h3>
              <button
                onClick={() => setEditingTenant(null)}
                className="text-slate-400 hover:text-slate-750 cursor-pointer"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            <form onSubmit={handleExtendSubscription} className="p-6 space-y-4">
              <div className="text-xs text-slate-500 font-semibold leading-relaxed">
                Configure a new subscription active duration for: <strong className="text-slate-900">{editingTenant.name}</strong>.
              </div>

              {/* Active Days */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Set Active Days (from now)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Clock className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900 rounded-xl py-2.5 pl-11 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 text-sm transition-all"
                    value={extendDays}
                    onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Renewal Shortcuts Presets */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExtendDays(30)}
                    className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      extendDays === 30 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-350 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                    }`}
                  >
                    +30 Days (1M)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendDays(90)}
                    className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      extendDays === 90 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-350 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                    }`}
                  >
                    +90 Days (3M)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendDays(365)}
                    className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      extendDays === 365 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-350 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                    }`}
                  >
                    +365 Days (1Y)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExtending}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-emerald-500 active:from-emerald-700 active:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md shadow-emerald-600/15 cursor-pointer transition-all flex items-center justify-center space-x-2"
                >
                  {isExtending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <span>Extend Store Access</span>
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
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Onboard Tenant Store</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Provision fresh client space & first Super Admin.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer transition-all"
                >
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>

              <form onSubmit={handleCreateTenant} className="p-6 flex-1 overflow-y-auto space-y-5">
                {error && (
                  <div className="flex items-start space-x-2.5 p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-555 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="bg-purple-50/30 border border-purple-100/50 p-4 rounded-2xl space-y-1.5">
                  <div className="text-[10px] font-black text-purple-700 uppercase tracking-wider flex items-center gap-1">
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
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
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
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-sm transition-all shadow-sm"
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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg shadow-purple-500/15 cursor-pointer transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
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
