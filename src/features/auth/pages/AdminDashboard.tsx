import React from 'react';
import { useQuery } from '@tanstack/react-query';
import reportsApi from '../../../api/reports.api';
import groupsApi from '../../../api/groups.api';
import { formatCurrency } from '../../../utils/currency';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Users,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import { useState } from 'react';

import Loader from '../../../components/ui/Loader';

export const AdminDashboard: React.FC = () => {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartView, setChartView] = useState<'sales_wins' | 'profit_loss'>('sales_wins');

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: () => reportsApi.dashboard(),
  });

  // Fetch groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['adminDashboardGroups'],
    queryFn: () => groupsApi.list(),
  });

  // Fetch custom report for last 365 days to build trend charts
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setDate(today.getDate() - 365);
  
  const formatDateString = (d: Date) => d.toISOString().split('T')[0];

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['adminDashboardTrend'],
    queryFn: () =>
      reportsApi.custom({
        start_date: formatDateString(oneYearAgo),
        end_date: formatDateString(today),
      }),
  });

  // Process data for charts
  const chartData = React.useMemo(() => {
    if (!trendData || !trendData.transactions) return [];

    const getMondayStr = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d.setDate(diff));
      return mon.toISOString().split('T')[0];
    };

    const formatMonthLabel = (yearMonthStr: string) => {
      const [year, month] = yearMonthStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
    };

    const buckets: { [key: string]: { date: string; label: string; SALE: number; WIN: number; Commission: number; Net: number } } = {};

    trendData.transactions.forEach((tx: any) => {
      const dateStr = tx.transaction_date;
      let key = dateStr;
      let label = dateStr;

      if (granularity === 'weekly') {
        key = getMondayStr(dateStr);
        label = `Wk ${key.substring(5)}`;
      } else if (granularity === 'monthly') {
        key = dateStr.substring(0, 7);
        label = formatMonthLabel(key);
      }

      const amountVal = parseFloat(tx.amount) || 0;
      const commRate = parseFloat(tx.group_commission) || 0;

      if (!buckets[key]) {
        buckets[key] = {
          date: key,
          label,
          SALE: 0,
          WIN: 0,
          Commission: 0,
          Net: 0
        };
      }

      const b = buckets[key];
      if (tx.type === 'SALE') {
        b.SALE += amountVal;
        const commAmt = amountVal * (commRate / 100);
        b.Commission += commAmt;
        b.Net += (amountVal - commAmt);
      } else if (tx.type === 'WIN') {
        b.WIN += amountVal;
        b.Net -= amountVal;
      }
    });

    const list = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));

    // For daily, only show the last 30 days to prevent crowding the chart
    if (granularity === 'daily') {
      return list.slice(-30);
    }
    return list;
  }, [trendData, granularity]);

  const isLoading = statsLoading || groupsLoading || trendLoading;

  if (isLoading) {
    return <Loader />;
  }

  const allTime = stats?.all_time || { total_win: 0, total_sale: 0, total_commission: 0, net_profit_loss: 0 };
  const thisMonth = stats?.this_month || { total_win: 0, total_sale: 0, total_commission: 0, net_profit_loss: 0 };
  
  const netProfit = typeof allTime.net_profit_loss === 'string' ? parseFloat(allTime.net_profit_loss) : allTime.net_profit_loss;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Welcome back, Admin!</h2>
        <p className="text-blue-100 mt-1">Here is a summary of all active groups, sales logs, and financial records.</p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sale Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total SALE (All Time)</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(allTime.total_sale)}</h3>
            <p className="text-xs text-emerald-600 font-semibold flex items-center">
              This Month: {formatCurrency(thisMonth.total_sale)}
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>

        {/* Win Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total WIN (All Time)</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(allTime.total_win)}</h3>
            <p className="text-xs text-red-600 font-semibold flex items-center">
              This Month: {formatCurrency(thisMonth.total_win)}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl text-red-600">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>

        {/* Commission Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Commission</p>
            <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(allTime.total_commission || 0)}</h3>
            <p className="text-xs text-blue-600 font-semibold flex items-center">
              This Month: {formatCurrency(thisMonth.total_commission || 0)}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Net Profit / Loss</p>
            <h3 className={`text-2xl font-bold ${isProfit ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </h3>
            <p className={`text-xs font-semibold flex items-center ${isProfit ? 'text-blue-600' : 'text-red-600'}`}>
              {isProfit ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {isProfit ? 'Net positive returns' : 'Net negative returns'}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isProfit ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Visual Chart Trends */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800">
            Financial Trends ({granularity === 'daily' ? 'Last 30 Days' : granularity === 'weekly' ? 'Weekly Summary' : 'Monthly Summary'})
          </h3>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode: Sales/Wins vs Net P&L */}
            <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setChartView('sales_wins')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chartView === 'sales_wins'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sales vs Wins
              </button>
              <button
                type="button"
                onClick={() => setChartView('profit_loss')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chartView === 'profit_loss'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Profit & Loss
              </button>
            </div>

            {/* Granularity: Daily, Weekly, Monthly */}
            <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setGranularity('daily')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  granularity === 'daily'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setGranularity('weekly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  granularity === 'weekly'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setGranularity('monthly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  granularity === 'monthly'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'sales_wins' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSale" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="WIN" name="Total Win (₹)" stroke="#ef4444" fillOpacity={1} fill="url(#colorWin)" strokeWidth={2} />
                <Area type="monotone" dataKey="SALE" name="Total Sale (₹)" stroke="#10b981" fillOpacity={1} fill="url(#colorSale)" strokeWidth={2} />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Net" name="Net Profit / Loss (₹)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.Net >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Groups list summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups Summary (Left/Mid) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Active Groups</h3>
            <Link to="/admin/groups" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              Manage Groups <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Group Name</th>
                  <th className="px-4 py-3">Assigned Manager</th>
                  <th className="px-4 py-3 rounded-r-lg">Date Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups?.slice(0, 5).map((group) => (
                  <tr key={group.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{group.name}</td>
                    <td className="px-4 py-3">{group.manager ? group.manager.username : 'Unassigned'}</td>
                    <td className="px-4 py-3">{new Date(group.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {groups?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-slate-400">No active groups created yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions (Right Sidebar) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Quick Actions</h3>
          <Link
            to="/admin/groups"
            className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-blue-50/30 hover:border-blue-200 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800">Add New Group</p>
                <p className="text-xs text-slate-400">Configure parameters & limits</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            to="/admin/transactions"
            className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-emerald-50/30 hover:border-emerald-200 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Activity className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800">Transaction logs</p>
                <p className="text-xs text-slate-400">Audit sales and payouts</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
