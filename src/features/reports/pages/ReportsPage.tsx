import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import reportsApi from '../../../api/reports.api';
import groupsApi from '../../../api/groups.api';
import { formatCurrency } from '../../../utils/currency';
import { downloadBlob } from '../../../utils/pdf';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { FileDown, Calendar, BarChart3, TrendingUp, TrendingDown, IndianRupee, Activity, PieChart as LucidePieChart, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from 'recharts';

import Loader from '../../../components/ui/Loader';

export const ReportsPage: React.FC = () => {
  const { isSuperAdmin, isManager } = useAuth();

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupId, setGroupId] = useState<string>('');
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Fetch groups (for Admin filters)
  const { data: groups } = useQuery({
    queryKey: ['groupsSelectReports'],
    queryFn: () => groupsApi.list(),
    enabled: isSuperAdmin || isManager,
  });

  // Query params
  const reportParams = React.useMemo(() => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (isSuperAdmin && groupId) params.group_id = parseInt(groupId);
    return params;
  }, [startDate, endDate, groupId, isSuperAdmin]);

  // Fetch custom report
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['customReport', reportParams],
    queryFn: () => reportsApi.custom(reportParams),
  });

  // PDF Export Mutation
  const exportPdfMutation = useMutation({
    mutationFn: () => reportsApi.downloadPdf(reportParams),
    onSuccess: (blob) => {
      const selectedGroupName = isSuperAdmin && groupId 
        ? groups?.find((g) => g.id.toString() === groupId)?.name || 'Group'
        : 'Overall';
      const filename = `report_${selectedGroupName.replace(/\s+/g, '_')}_${startDate || 'all'}_to_${endDate || 'now'}.pdf`;
      downloadBlob(blob, filename);
    },
  });

  // Client-side CSV export
  const handleExportCsv = () => {
    if (!report || !report.transactions) return;

    const headers = ['ID', 'Date', 'Type', 'Amount (INR)', 'Group Name', 'Commission Rate (%)', 'Calculated Commission (INR)'];
    const rows = report.transactions.map((tx: any) => {
      const amount = parseFloat(tx.amount) || 0;
      const commRate = parseFloat(tx.group_commission) || 0;
      const commAmt = tx.type === 'SALE' ? amount * (commRate / 100) : 0;
      return [
        tx.id,
        tx.transaction_date,
        tx.type,
        amount.toFixed(2),
        tx.group_name || '',
        commRate.toFixed(2),
        commAmt.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const selectedGroupName = isSuperAdmin && groupId 
      ? groups?.find((g) => g.id.toString() === groupId)?.name || 'Group'
      : 'Overall';
    const filename = `report_${selectedGroupName.replace(/\s+/g, '_')}_${startDate || 'all'}_to_${endDate || 'now'}.csv`;
    
    downloadBlob(blob, filename);
  };

  // Prepare chart data for comparison
  const comparisonChartData = React.useMemo(() => {
    if (!report) return [];
    const sales = typeof report.total_sale === 'string' ? parseFloat(report.total_sale) : report.total_sale;
    const wins = typeof report.total_win === 'string' ? parseFloat(report.total_win) : report.total_win;
    const comm = typeof report.total_commission === 'string' ? parseFloat(report.total_commission) : report.total_commission;
    
    return [
      {
        name: 'Wins (Payout)',
        Amount: wins,
        color: '#ef4444'
      },
      {
        name: 'Sales (Gross)',
        Amount: sales,
        color: '#10b981'
      },
      {
        name: 'Commission',
        Amount: comm,
        color: '#3b82f6'
      }
    ];
  }, [report]);

  // Prepare chart data for distribution pie chart
  const pieChartData = React.useMemo(() => {
    if (!report) return [];
    const sales = (typeof report.total_sale === 'string' ? parseFloat(report.total_sale) : report.total_sale) || 0;
    const wins = (typeof report.total_win === 'string' ? parseFloat(report.total_win) : report.total_win) || 0;
    const comm = (typeof report.total_commission === 'string' ? parseFloat(report.total_commission) : report.total_commission) || 0;
    
    return [
      { name: 'Wins (Payout)', value: wins, color: '#ef4444' },
      { name: 'Sales (Gross)', value: sales, color: '#10b981' },
      { name: 'Commission', value: comm, color: '#3b82f6' },
    ].filter(item => item.value > 0);
  }, [report]);

  // Process data to aggregate by granularity for trends
  const aggregatedChartData = React.useMemo(() => {
    if (!report || !report.transactions) return [];

    const getMondayStr = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d.setDate(diff));
      return mon.toISOString().split('T')[0];
    };

    const formatMonthLabel = (yearMonthStr: string) => {
      if (!yearMonthStr) return '';
      const parts = yearMonthStr.split('-');
      if (parts.length < 2) return yearMonthStr;
      const [year, month] = parts;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(month, 10) - 1;
      return `${monthNames[mIdx] || month} ${year}`;
    };

    const buckets: { [key: string]: { date: string; label: string; Sales: number; Wins: number; Commission: number; Net: number } } = {};

    report.transactions.forEach((tx: any) => {
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
          Sales: 0,
          Wins: 0,
          Commission: 0,
          Net: 0
        };
      }

      const b = buckets[key];
      if (tx.type === 'SALE') {
        b.Sales += amountVal;
        const commAmt = amountVal * (commRate / 100);
        b.Commission += commAmt;
        b.Net += (amountVal - commAmt);
      } else if (tx.type === 'WIN') {
        b.Wins += amountVal;
        b.Net -= amountVal;
      }
    });

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  }, [report, granularity]);

  // Compute cumulative balance
  const cumulativeChartData = React.useMemo(() => {
    let runningTotal = 0;
    return aggregatedChartData.map((d) => {
      runningTotal += d.Net;
      return {
        ...d,
        Cumulative: runningTotal,
      };
    });
  }, [aggregatedChartData]);

  // Group performance comparison
  const groupPerformanceData = React.useMemo(() => {
    if (!report || !report.transactions) return [];

    const groupMap: { [group: string]: { name: string; Sales: number; Wins: number; Commission: number; Net: number } } = {};

    report.transactions.forEach((tx: any) => {
      const groupName = tx.group_name || 'Unknown';
      const amountVal = parseFloat(tx.amount) || 0;
      const commRate = parseFloat(tx.group_commission) || 0;

      if (!groupMap[groupName]) {
        groupMap[groupName] = {
          name: groupName,
          Sales: 0,
          Wins: 0,
          Commission: 0,
          Net: 0
        };
      }

      const g = groupMap[groupName];
      if (tx.type === 'SALE') {
        g.Sales += amountVal;
        const commAmt = amountVal * (commRate / 100);
        g.Commission += commAmt;
        g.Net += (amountVal - commAmt);
      } else if (tx.type === 'WIN') {
        g.Wins += amountVal;
        g.Net -= amountVal;
      }
    });

    return Object.values(groupMap).sort((a, b) => b.Net - a.Net);
  }, [report]);

  // Group report transactions by date & group name for the table ledger
  const groupedReportTransactions = React.useMemo(() => {
    if (!report || !report.transactions) return [];

    const groupsMap: { [key: string]: {
      date: string;
      group_name: string;
      sale: number;
      win: number;
      commission: number;
      commission_rate: number;
      net: number;
    } } = {};

    report.transactions.forEach((tx: any) => {
      const date = tx.transaction_date;
      const grpName = tx.group_name || 'Unknown';
      const key = `${date}_${grpName}`;

      const amountVal = parseFloat(tx.amount) || 0;
      const commRate = parseFloat(tx.group_commission) || 0;

      if (!groupsMap[key]) {
        groupsMap[key] = {
          date,
          group_name: grpName,
          sale: 0,
          win: 0,
          commission: 0,
          commission_rate: commRate,
          net: 0
        };
      }

      const row = groupsMap[key];
      if (tx.type === 'SALE') {
        row.sale += amountVal;
        const commAmt = amountVal * (commRate / 100);
        row.commission += commAmt;
        row.net += (amountVal - commAmt);
        if (commRate > 0) {
          row.commission_rate = commRate;
        }
      } else if (tx.type === 'WIN') {
        row.win += amountVal;
        row.net -= amountVal;
      }
    });

    return Object.values(groupsMap).sort((a, b) => b.date.localeCompare(a.date) || a.group_name.localeCompare(b.group_name));
  }, [report]);

  const netProfit = report ? (typeof report.net_profit_loss === 'string' ? parseFloat(report.net_profit_loss) : report.net_profit_loss) : 0;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financial Reports</h2>
          <p className="text-slate-500 mt-1">Audit and export financial balance reports.</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <Button
            onClick={handleExportCsv}
            variant="secondary"
            className="flex items-center space-x-2 border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm bg-white"
          >
            <FileDown className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          <Button
            onClick={() => exportPdfMutation.mutate()}
            isLoading={exportPdfMutation.isPending}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <FileDown className="h-4 w-4" />
            <span>Export PDF Report</span>
          </Button>
        </div>
      </div>

      {/* Date Range & Group Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-slate-400" /> Date Range Filter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(isSuperAdmin || isManager) && (
            <Select
              label="Group"
              placeholder={isSuperAdmin ? "All Groups" : undefined}
              options={groups?.map((g) => ({ value: g.id, label: g.name })) || []}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            />
          )}
        </div>
      </div>

      {reportLoading ? (
        <Loader />
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* SALE Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total SALE (Gross)</p>
                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(report?.total_sale || 0)}</h3>
                <p className="text-xs text-slate-400 font-semibold">Gross sales volume</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>

            {/* WIN Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total WIN (Payout)</p>
                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(report?.total_win || 0)}</h3>
                <p className="text-xs text-slate-400 font-semibold">Total payout wins</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl text-red-600">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>

            {/* Commission Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Commission</p>
                <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(report?.total_commission || 0)}</h3>
                <p className="text-xs text-slate-400 font-semibold">Calculated manager commissions</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>

            {/* Net Profit Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Net Profit / Loss</p>
                <h3 className={`text-2xl font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </h3>
                <p className={`text-xs font-semibold flex items-center ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isProfit ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {isProfit ? 'Positive balance returns' : 'Negative balance returns'}
                </p>
              </div>
              <div className={`p-4 rounded-xl ${isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>

            {/* Profit Margin Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Profit Margin</p>
                <h3 className={`text-2xl font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                  {((parseFloat(String(report?.total_sale || 0)) > 0 ? (netProfit / parseFloat(String(report?.total_sale || 0))) * 100 : 0)).toFixed(2)}%
                </h3>
                <p className="text-xs text-slate-400 font-semibold">Net profit relative to sales</p>
              </div>
              <div className={`p-4 rounded-xl ${isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <Activity className="h-6 w-6" />
              </div>
            </div>

            {/* Win-to-Sale Ratio Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Win-to-Sale Ratio</p>
                <h3 className="text-2xl font-bold text-slate-800">
                  {((parseFloat(String(report?.total_sale || 0)) > 0 ? (parseFloat(String(report?.total_win || 0)) / parseFloat(String(report?.total_sale || 0))) * 100 : 0)).toFixed(2)}%
                </h3>
                <p className="text-xs text-slate-400 font-semibold">Payout frequency percentage</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-slate-600">
                <LucidePieChart className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Granularity & Visualizations Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Visual Insights</h3>
              <p className="text-slate-500 text-xs mt-0.5">Toggle date granularity to filter trend lines dynamically.</p>
            </div>
            <div className="flex border border-slate-200 rounded-xl p-0.5 bg-white shadow-sm self-start sm:self-center">
              {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setGranularity(mode)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer capitalize ${
                    granularity === mode
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-55'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Graph Visualizations */}
          <div className="space-y-6">
            {/* Row 1: Comparison Breakdown & Fund Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comparison Breakdown Bar Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" /> Comparison Breakdown
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="Amount" radius={[4, 4, 0, 0]}>
                          {comparisonChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Distribution Pie Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center">
                    <LucidePieChart className="h-5 w-5 mr-2 text-indigo-600" /> Fund Distribution
                  </h3>
                  <div className="h-64 w-full flex items-center justify-center">
                    {pieChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-slate-400">No financial data available for this range.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Revenue vs Payout Trends & Net Profit/Loss Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Payout Trends */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-emerald-600" /> Revenue vs Payout Trends ({granularity})
                </h3>
                <div className="h-64 w-full">
                  {aggregatedChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={aggregatedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorWins" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend verticalAlign="top" height={36} />
                        <Area type="monotone" dataKey="Sales" name="SALE (Revenue)" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Wins" name="WIN (Payout)" stroke="#ef4444" fillOpacity={1} fill="url(#colorWins)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-slate-400">No trend data available for this range.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Net Profit & Loss Trends Bar Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" /> Net Profit & Loss Trends ({granularity})
                </h3>
                <div className="h-64 w-full">
                  {aggregatedChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aggregatedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="Net" name="Net Profit / Loss (₹)" radius={[4, 4, 0, 0]}>
                          {aggregatedChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.Net >= 0 ? '#10b981' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-slate-400">No trend data available for this range.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Cumulative Performance Trajectory Area Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-indigo-600" /> Cumulative Net Profit/Loss Trajectory ({granularity})
              </h3>
              <div className="h-72 w-full">
                {cumulativeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="Cumulative" name="Cumulative Balance (₹)" stroke="#6366f1" fillOpacity={1} fill="url(#colorCumulative)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-slate-400">No trajectory data available for this range.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Row 4 (Conditional): Group Performance Comparison Bar Chart */}
            {isSuperAdmin && !groupId && groupPerformanceData.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" /> Group-wise Net Profit/Loss Comparison
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupPerformanceData} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="Net" name="Net Profit / Loss (₹)" radius={[0, 4, 4, 0]}>
                        {groupPerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.Net >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Grouped Transaction Ledger Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Period Log Entries</h3>
              <p className="text-xs text-slate-500 font-medium">Grouped by date and group</p>
            </div>
            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <div className="overflow-auto max-h-[450px]">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold sticky top-0 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Group</th>
                      <th className="px-6 py-3.5 text-emerald-600">SALE (Gross)</th>
                      <th className="px-6 py-3.5 text-red-600">WIN (Payout)</th>
                      <th className="px-6 py-3.5 text-blue-600">Commission</th>
                      <th className="px-6 py-3.5">Net Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupedReportTransactions.map((tx: any) => {
                      const rowKey = `${tx.date}_${tx.group_name}`;
                      return (
                        <tr key={rowKey} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-semibold text-slate-700">{tx.date}</td>
                          <td className="px-6 py-3.5 font-semibold">{tx.group_name}</td>
                          <td className="px-6 py-3.5 font-bold text-emerald-600">
                            {tx.sale > 0 ? formatCurrency(tx.sale) : '—'}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-red-600">
                            {tx.win > 0 ? formatCurrency(tx.win) : '—'}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-blue-600">
                            {tx.commission > 0 ? (
                              <div>
                                <div>{formatCurrency(tx.commission)}</div>
                                {tx.commission_rate > 0 && (
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    ({tx.commission_rate}%)
                                  </div>
                                )}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className={`px-6 py-3.5 font-bold ${tx.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(tx.net)}
                          </td>
                        </tr>
                      );
                    })}
                    {groupedReportTransactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          No transactions logged for this selected duration.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default ReportsPage;

