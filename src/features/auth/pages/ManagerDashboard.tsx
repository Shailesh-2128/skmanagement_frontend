import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import reportsApi from '../../../api/reports.api';
import { formatCurrency } from '../../../utils/currency';
import { useAuth } from '../../../hooks/useAuth';
import { downloadBlob } from '../../../utils/pdf';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  FileDown,
  Activity,
} from 'lucide-react';

import Loader from '../../../components/ui/Loader';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();

  // Tab Toggle State
  const [viewType, setViewType] = useState<'weekly' | 'daily'>('weekly');

  // Custom PDF date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting7, setExporting7] = useState(false);
  const [exportingCustom, setExportingCustom] = useState(false);

  // Fetch group dashboard summary stats (today, this month, all time)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['managerDashboardStats'],
    queryFn: () => reportsApi.dashboard(),
  });

  // Fetch group custom report (contains all raw transaction logs for date grouping)
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['managerFullReport'],
    queryFn: () => reportsApi.custom(),
  });

  // Aggregate logs by date
  const dailyBreakdown = useMemo(() => {
    if (!report?.transactions) return [];

    const dateMap: { [date: string]: { date: string; sale: number; win: number } } = {};

    report.transactions.forEach((tx) => {
      const dateStr = tx.transaction_date;
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;

      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { date: dateStr, sale: 0, win: 0 };
      }

      if (tx.type === 'SALE') {
        dateMap[dateStr].sale += amount;
      } else if (tx.type === 'WIN') {
        dateMap[dateStr].win += amount;
      }
    });

    return Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [report]);

  // Aggregate logs by week (Monday to Sunday range)
  const weeklyBreakdown = useMemo(() => {
    if (!report?.transactions) return [];

    const weekMap: { [monday: string]: { monday: string; sunday: string; sale: number; win: number } } = {};

    report.transactions.forEach((tx) => {
      const date = new Date(tx.transaction_date);
      const day = date.getDay();
      // Adjust standard day number (0 Sunday, 1 Monday...) to get the Monday of that week
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const monStr = monday.toISOString().split('T')[0];
      const sunStr = sunday.toISOString().split('T')[0];

      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;

      if (!weekMap[monStr]) {
        weekMap[monStr] = { monday: monStr, sunday: sunStr, sale: 0, win: 0 };
      }

      if (tx.type === 'SALE') {
        weekMap[monStr].sale += amount;
      } else if (tx.type === 'WIN') {
        weekMap[monStr].win += amount;
      }
    });

    return Object.values(weekMap).sort((a, b) => b.monday.localeCompare(a.monday));
  }, [report]);

  // Handler: Export Last 7 Days PDF
  const handleExportLast7Days = async () => {
    setExportError('');
    setExporting7(true);

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const sDate = formatDate(sevenDaysAgo);
    const eDate = formatDate(today);

    try {
      const blob = await reportsApi.downloadPdf({
        start_date: sDate,
        end_date: eDate,
      });
      const gName = user?.group_name || 'group';
      const filename = `report_${gName.replace(/\s+/g, '_')}_last_7_days_${sDate}_to_${eDate}.pdf`;
      downloadBlob(blob, filename);
    } catch (err: any) {
      setExportError('Failed to generate 7-day report PDF.');
    } finally {
      setExporting7(false);
    }
  };

  // Handler: Export Custom Range PDF
  const handleExportCustom = async () => {
    setExportError('');
    if (!startDate || !endDate) {
      setExportError('Please pick both start and end dates.');
      return;
    }
    if (startDate > endDate) {
      setExportError('Start date cannot be after end date.');
      return;
    }

    setExportingCustom(true);
    try {
      const blob = await reportsApi.downloadPdf({
        start_date: startDate,
        end_date: endDate,
      });
      const gName = user?.group_name || 'group';
      const filename = `report_${gName.replace(/\s+/g, '_')}_custom_${startDate}_to_${endDate}.pdf`;
      downloadBlob(blob, filename);
    } catch (err: any) {
      setExportError('Failed to generate custom range report PDF.');
    } finally {
      setExportingCustom(false);
    }
  };

  const isLoading = statsLoading || reportLoading;

  if (isLoading) {
    return <Loader />;
  }

  const allTime = stats?.all_time || { total_win: 0, total_sale: 0, total_commission: 0, net_profit_loss: 0 };
  const thisMonth = stats?.this_month || { total_win: 0, total_sale: 0, total_commission: 0, net_profit_loss: 0 };
  const netProfit = typeof allTime.net_profit_loss === 'string' ? parseFloat(allTime.net_profit_loss) : allTime.net_profit_loss;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-8">
      {/* Welcome Tagline */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Welcome back, {user?.username}!</h2>
        <p className="text-emerald-100 mt-1 mb-2">
          Managing group logs for: <b>{user?.group_name || 'No Group'}</b>.
        </p>
        {report && (report.commission > 0 || report.mp > 0) && (
          <div className="flex items-center gap-2 mt-3">
            {report.commission > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-50 border border-emerald-500/30">
                Commission: {report.commission}%
              </span>
            )}
            {report.mp > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-50 border border-emerald-500/30">
                MP Adjustment: {formatCurrency(report.mp)}
              </span>
            )}
          </div>
        )}
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
            <h3 className={`text-2xl font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </h3>
            <p className={`text-xs font-semibold flex items-center ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
              {isProfit ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {isProfit ? 'Sale value exceeds Wins' : 'Win value exceeds Sales'}
            </p>
            {report && report.mp > 0 && (
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Includes MP Adj: -{formatCurrency(report.mp)}
              </p>
            )}
          </div>
          <div className={`p-4 rounded-xl ${isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main layout: Export Options (Left) + Table Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Exporter Widget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-fit">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <FileDown className="mr-2 h-5 w-5 text-emerald-600" /> Export Reports
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Export generated financial summary sheets and raw transaction logs for this group as PDF documents.
            </p>

            {exportError && (
              <div className="p-2 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-100">
                {exportError}
              </div>
            )}

            {/* Quick Export: Last 7 Days */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center">
                <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-400" /> Last 7 Days Report
              </h4>
              <p className="text-slate-400 text-[10px]">
                Downloads logs recorded from 7 days ago to today.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full flex items-center justify-center space-x-1.5 mt-1"
                onClick={handleExportLast7Days}
                isLoading={exporting7}
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Download Report</span>
              </Button>
            </div>

            {/* Custom Range Export */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-700">Custom Date Range</h4>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white"
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full flex items-center justify-center space-x-1.5"
                onClick={handleExportCustom}
                isLoading={exportingCustom}
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Export Custom PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Aggregated Daily / Weekly summary Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Activity className="mr-2 h-5 w-5 text-emerald-600" /> Group Ledger Summary
            </h3>
            {/* View switcher tabs */}
            <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50 self-start">
              <button
                onClick={() => setViewType('weekly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewType === 'weekly'
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Weekly Summary
              </button>
              <button
                onClick={() => setViewType('daily')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewType === 'daily'
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Daily Summary
              </button>
            </div>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <div className="overflow-auto max-h-[500px]">
              {viewType === 'weekly' ? (
                /* Weekly breakdown table */
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold sticky top-0 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Week Duration</th>
                      <th className="px-6 py-3.5 text-emerald-600">Total SALE (Revenue)</th>
                      <th className="px-6 py-3.5 text-red-600">Total WIN (Payout)</th>
                      <th className="px-6 py-3.5 text-blue-600">Commission</th>
                      <th className="px-6 py-3.5">Net Profit / Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {weeklyBreakdown.map((row) => {
                      const commRate = report?.commission || 0;
                      const commAmt = row.sale * (commRate / 100);
                      const netVal = row.sale - commAmt - row.win;
                      return (
                        <tr key={row.monday} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-semibold text-slate-700">
                            {row.monday} <span className="text-slate-400 font-normal">to</span> {row.sunday}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-emerald-600">{formatCurrency(row.sale)}</td>
                          <td className="px-6 py-3.5 font-bold text-red-600">{formatCurrency(row.win)}</td>
                          <td className="px-6 py-3.5 font-bold text-blue-600">
                            <div>{formatCurrency(commAmt)}</div>
                            {commRate > 0 && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                ({commRate}%)
                              </div>
                            )}
                          </td>
                          <td className={`px-6 py-3.5 font-bold ${netVal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(netVal)}
                          </td>
                        </tr>
                      );
                    })}
                    {weeklyBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">
                          No transaction records logged for this group yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                /* Daily breakdown table */
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold sticky top-0 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-emerald-600">Total SALE (Revenue)</th>
                      <th className="px-6 py-3.5 text-red-600">Total WIN (Payout)</th>
                      <th className="px-6 py-3.5 text-blue-600">Commission</th>
                      <th className="px-6 py-3.5">Net Profit / Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyBreakdown.map((row) => {
                      const commRate = report?.commission || 0;
                      const commAmt = row.sale * (commRate / 100);
                      const netVal = row.sale - commAmt - row.win;
                      return (
                        <tr key={row.date} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-semibold text-slate-700">{row.date}</td>
                          <td className="px-6 py-3.5 font-bold text-emerald-600">{formatCurrency(row.sale)}</td>
                          <td className="px-6 py-3.5 font-bold text-red-600">{formatCurrency(row.win)}</td>
                          <td className="px-6 py-3.5 font-bold text-blue-600">
                            <div>{formatCurrency(commAmt)}</div>
                            {commRate > 0 && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                ({commRate}%)
                              </div>
                            )}
                          </td>
                          <td className={`px-6 py-3.5 font-bold ${netVal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(netVal)}
                          </td>
                        </tr>
                      );
                    })}
                    {dailyBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">
                          No transaction records logged for this group yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ManagerDashboard;
