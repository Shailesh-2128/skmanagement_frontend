import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import groupsApi from '../../../api/groups.api';
import reportsApi from '../../../api/reports.api';
import transactionsApi from '../../../api/transactions.api';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import { formatCurrency } from '../../../utils/currency';
import { downloadBlob } from '../../../utils/pdf';
import { getTodayDateString } from '../../../utils/date';
import {
  ArrowLeft,
  Calendar,
  FileDown,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Activity,
  Plus,
} from 'lucide-react';

import Loader from '../../../components/ui/Loader';

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupId = parseInt(id || '0');
  const queryClient = useQueryClient();

  // Custom PDF date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting7, setExporting7] = useState(false);
  const [exportingCustom, setExportingCustom] = useState(false);

  // Transaction Modal State
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txType, setTxType] = useState<'SALE' | 'WIN'>('SALE');
  const [amount, setAmount] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [winAmount, setWinAmount] = useState('');
  const [logBoth, setLogBoth] = useState(false);
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState(getTodayDateString());
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseAddTx = () => {
    setIsAddTxOpen(false);
    setAmount('');
    setSaleAmount('');
    setWinAmount('');
    setLogBoth(false);
    setNote('');
    setTxDate(getTodayDateString());
    setFormError('');
  };

  const handleAddTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (logBoth) {
      const isSaleEmpty = saleAmount.trim() === '';
      const isWinEmpty = winAmount.trim() === '';

      if (isSaleEmpty && isWinEmpty) {
        setFormError('Please enter at least one of SALE or WIN amounts.');
        return;
      }

      const parsedSale = isSaleEmpty ? null : parseFloat(saleAmount);
      const parsedWin = isWinEmpty ? null : parseFloat(winAmount);

      if (parsedSale !== null && (isNaN(parsedSale) || parsedSale < 0)) {
        setFormError('SALE Amount cannot be negative.');
        return;
      }
      if (parsedWin !== null && (isNaN(parsedWin) || parsedWin < 0)) {
        setFormError('WIN Amount cannot be negative.');
        return;
      }

      setIsSubmitting(true);
      try {
        if (parsedSale !== null) {
          await transactionsApi.create({
            type: 'SALE',
            amount: parsedSale,
            note: note ? `${note} (Logged as part of dual entry)` : 'Logged as part of dual entry',
            transaction_date: txDate,
            group: groupId
          });
        }
        
        if (parsedWin !== null) {
          await transactionsApi.create({
            type: 'WIN',
            amount: parsedWin,
            note: note ? `${note} (Logged as part of dual entry)` : 'Logged as part of dual entry',
            transaction_date: txDate,
            group: groupId
          });
        }

        queryClient.invalidateQueries({ queryKey: ['groupDetail', groupId] });
        queryClient.invalidateQueries({ queryKey: ['groupDashboardStats', groupId] });
        queryClient.invalidateQueries({ queryKey: ['groupCustomReport', groupId] });
        handleCloseAddTx();
      } catch (err: any) {
        setFormError(err.response?.data?.detail || 'Failed to log dual transactions.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        setFormError('Amount cannot be negative.');
        return;
      }
      
      setIsSubmitting(true);
      try {
        await transactionsApi.create({
          type: txType,
          amount: parsedAmount,
          note,
          transaction_date: txDate,
          group: groupId
        });
        queryClient.invalidateQueries({ queryKey: ['groupDetail', groupId] });
        queryClient.invalidateQueries({ queryKey: ['groupDashboardStats', groupId] });
        queryClient.invalidateQueries({ queryKey: ['groupCustomReport', groupId] });
        handleCloseAddTx();
      } catch (err: any) {
        setFormError(err.response?.data?.detail || 'Failed to log transaction.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Fetch Group Metadata
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['groupDetail', groupId],
    queryFn: () => groupsApi.retrieve(groupId),
    enabled: !!groupId,
  });

  // Fetch Group Summary Statistics (today, this month, all time)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['groupDashboardStats', groupId],
    queryFn: () => reportsApi.dashboard({ group_id: groupId }),
    enabled: !!groupId,
  });

  // Fetch Group Custom Report (contains all transaction logs)
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['groupCustomReport', groupId],
    queryFn: () => reportsApi.custom({ group_id: groupId }),
    enabled: !!groupId,
  });

  // Process data to aggregate by date
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

    // Return sorted descending by date
    return Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));
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
        group_id: groupId,
        start_date: sDate,
        end_date: eDate,
      });
      const gName = group?.name || 'group';
      const filename = `report_${gName.replace(/\s+/g, '_')}_last_7_days_${sDate}_to_${eDate}.pdf`;
      downloadBlob(blob, filename);
    } catch (err: any) {
      setExportError('Failed to generate 7-day report PDF.');
    } finally {
      setExporting7(false);
    }
  };

  // Handler: Export Custom Date PDF
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
        group_id: groupId,
        start_date: startDate,
        end_date: endDate,
      });
      const gName = group?.name || 'group';
      const filename = `report_${gName.replace(/\s+/g, '_')}_custom_${startDate}_to_${endDate}.pdf`;
      downloadBlob(blob, filename);
    } catch (err: any) {
      setExportError('Failed to generate custom range report PDF.');
    } finally {
      setExportingCustom(false);
    }
  };

  const isLoading = groupLoading || statsLoading || reportLoading;

  if (isLoading) {
    return <Loader />;
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-700">Group not found</h3>
        <Button onClick={() => navigate('/admin/groups')} className="mt-4">
          Back to Groups
        </Button>
      </div>
    );
  }

  const allTime = stats?.all_time || { total_win: 0, total_sale: 0, net_profit_loss: 0 };
  const thisMonth = stats?.this_month || { total_win: 0, total_sale: 0, net_profit_loss: 0 };
  const netProfit = typeof allTime.net_profit_loss === 'string' ? parseFloat(allTime.net_profit_loss) : allTime.net_profit_loss;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-8">
      {/* Top back navigation */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('/admin/groups')}
          className="flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Groups</span>
        </button>
      </div>

      {/* Creative Group Profile Card */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/20 rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Abstract background glow element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            {/* Initials badge */}
            <div className="p-5 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-2xl shadow-md flex items-center justify-center font-bold text-2xl h-16 w-16 select-none uppercase tracking-wide shrink-0">
              {group.name.substring(0, 2)}
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{group.name}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                  Active Group
                </span>
              </div>
              
              {group.description ? (
                <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                  {group.description}
                </p>
              ) : (
                <p className="text-slate-400 text-xs italic">
                  No group description provided. Add details to describe the operational purpose of this group.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1.5">
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400 font-semibold">Manager:</span>
                  {group.manager ? (
                    <span className="font-bold text-slate-700">
                      {group.manager.username}
                    </span>
                  ) : (
                    <span className="italic text-slate-400">Unassigned</span>
                  )}
                </div>
                
                <span className="text-slate-200 text-sm">•</span>
                
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400 font-semibold">Commission:</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-100">
                    {group.commission}%
                  </span>
                </div>
                
                <span className="text-slate-200 text-sm">•</span>
                
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400 font-semibold">MP Adjustment:</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded border border-purple-100">
                    {formatCurrency(group.mp)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              onClick={() => setIsAddTxOpen(true)}
              className="flex items-center space-x-2 shadow-sm font-bold bg-blue-600 hover:bg-blue-700 border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Log Transaction</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/admin/transactions?group=${groupId}`)}
              className="flex items-center space-x-2 shadow-sm font-semibold border-slate-200 bg-white hover:bg-slate-50 transition-all text-slate-700"
            >
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <span>View Ledger</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Aggregate stats */}
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
              {isProfit ? 'Sale value exceeds Wins' : 'Win value exceeds Sales'}
            </p>
            {group.mp > 0 && (
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Includes MP Adj: -{formatCurrency(group.mp)}
              </p>
            )}
          </div>
          <div className={`p-4 rounded-xl ${isProfit ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* PDF Export Controls Panel & Daily Summary details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Exporter Widget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-fit">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <FileDown className="mr-2 h-5 w-5 text-blue-600" /> Export PDF Reports
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

        {/* Daily Breakdown Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Activity className="mr-2 h-5 w-5 text-emerald-600" /> Daily Ledger Summary
          </h3>
          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <div className="overflow-x-auto max-h-96">
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
                    const commRate = group.commission || 0;
                    const commAmt = row.sale * (commRate / 100);
                    const dailyNet = row.sale - commAmt - row.win;
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
                        <td className={`px-6 py-3.5 font-bold ${dailyNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatCurrency(dailyNet)}
                        </td>
                      </tr>
                    );
                  })}
                  {dailyBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        No transactions logged for this group.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Transaction Modal */}
      <Modal isOpen={isAddTxOpen} onClose={handleCloseAddTx} title={`Create Transaction for ${group.name}`}>
        <form onSubmit={handleAddTxSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">{formError}</div>}
          
          <div className="flex items-center space-x-2 py-2">
            <input
              id="logBoth"
              type="checkbox"
              checked={logBoth}
              onChange={(e) => setLogBoth(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="logBoth" className="text-sm font-semibold text-slate-700 select-none cursor-pointer">
              Log both SALE and WIN at once
            </label>
          </div>

          {!logBoth ? (
            <>
              <Select
                label="Transaction Type"
                options={[
                  { value: 'SALE', label: 'SALE' },
                  { value: 'WIN', label: 'WIN' },
                ]}
                value={txType}
                onChange={(e) => setTxType(e.target.value as 'SALE' | 'WIN')}
              />

              <Input
                label="Amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SALE Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
              />
              <Input
                label="WIN Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={winAmount}
                onChange={(e) => setWinAmount(e.target.value)}
              />
            </div>
          )}

          <Input
            label="Transaction Date"
            type="date"
            required
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
          />

          <Input
            label="Note (Optional)"
            type="text"
            placeholder="Add note details..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={handleCloseAddTx}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Log
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default GroupDetailPage;
