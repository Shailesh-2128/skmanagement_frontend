import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import groupsApi from '../../../api/groups.api';
import reportsApi from '../../../api/reports.api';
import transactionsApi from '../../../api/transactions.api';
import accountantApi from '../../../api/accountant.api';
import api from '../../../api/axios';
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
  Eye,
  Trash2,
  RefreshCw,
  FileText,
  Calculator,
  Edit3,
} from 'lucide-react';

import Loader from '../../../components/ui/Loader';
import { useAuth } from '../../../hooks/useAuth';

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAccountant = user?.role === 'ACCOUNTANT';
  // Accountants can only see groups in their accountant_groups M2M list
  const accountantAllowedIds: number[] = user?.accountant_groups || [];
  const isAccountantUnauthorized = isAccountant && !accountantAllowedIds.includes(groupId);

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

  // Accountant Calculations States & Filters
  const [calcStartDate, setCalcStartDate] = useState('');
  const [calcEndDate, setCalcEndDate] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [calcSuccessMsg, setCalcSuccessMsg] = useState<string | null>(null);
  const [calcErrorMsg, setCalcErrorMsg] = useState<string | null>(null);

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

  // Fetch Group Summary Statistics — skip for accountants (they don't see stats)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['groupDashboardStats', groupId],
    queryFn: () => reportsApi.dashboard({ group_id: groupId }),
    enabled: !!groupId && !isAccountant,
  });

  // Fetch Group Custom Report — skip for accountants
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['groupCustomReport', groupId],
    queryFn: () => reportsApi.custom({ group_id: groupId }),
    enabled: !!groupId && !isAccountant,
  });

  // Fetch Accountant Calculations for this group
  const { data: accountantCalcs, isLoading: accountantCalcsLoading, refetch: refetchAccountantCalcs } = useQuery({
    queryKey: ['accountantCalculations', groupId, calcStartDate, calcEndDate],
    queryFn: () => accountantApi.list({
      group_id: groupId,
      start_date: calcStartDate || undefined,
      end_date: calcEndDate || undefined,
    }),
    enabled: !!groupId,
  });

  const deleteCalculationMutation = useMutation({
    mutationFn: (id: number) => accountantApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountantCalculations', groupId] });
      setCalcSuccessMsg('Calculation log deleted successfully.');
    },
    onError: () => {
      setCalcErrorMsg('Failed to delete calculation.');
    }
  });

  const handleDownloadPDF = async (id: number, groupName: string, date: string) => {
    setDownloadingId(id);
    try {
      const response = await api.get(`/accountant-calculations/${id}/pdf/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Calculation_${groupName.replace(/\s+/g, '_')}_${date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setCalcSuccessMsg('Calculation PDF receipt has been successfully downloaded.');
    } catch (err) {
      setCalcErrorMsg('Failed to download PDF receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenDetailModal = (item: any) => {
    setSelectedHistoryItem(item);
    setIsDetailModalOpen(true);
  };

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

  const isLoading = groupLoading || (!isAccountant && (statsLoading || reportLoading));

  if (isLoading) {
    return <Loader />;
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-700">Group not found</h3>
        <Button onClick={() => navigate(isAccountant ? '/accountant/dashboard' : '/admin/groups')} className="mt-4">
          {isAccountant ? 'Back to Dashboard' : 'Back to Groups'}
        </Button>
      </div>
    );
  }

  // Block accountant from seeing unauthorized groups
  if (isAccountantUnauthorized) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="h-16 w-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
        </div>
        <h3 className="text-lg font-bold text-slate-700">Access Denied</h3>
        <p className="text-slate-500 text-sm">You are not authorised to view this group's details.</p>
        <Button onClick={() => navigate('/accountant/dashboard')} className="mt-2">
          Back to Dashboard
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
          onClick={() => navigate(isAccountant ? '/accountant/dashboard' : '/admin/groups')}
          className="flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isAccountant ? 'Back to Dashboard' : 'Back to Groups'}</span>
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
                  <span className="text-slate-400 font-semibold">Missing Payment:</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded border border-purple-100">
                    {formatCurrency(group.mp)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!isAccountant && (
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
          )}
        </div>
      </div>

      {/* Aggregate stats */}
      {!isAccountant && (
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
              <h3 className="text-2xl font-bold font-mono" style={{ color: isProfit ? '#16A34A' : '#DC2626' }}>
                {formatCurrency(netProfit)}
              </h3>
              <p className="text-xs font-semibold flex items-center" style={{ color: isProfit ? '#16A34A' : '#DC2626' }}>
                {isProfit ? <TrendingUp className="h-3 w-3 mr-1" style={{ color: '#16A34A' }} /> : <TrendingDown className="h-3 w-3 mr-1" style={{ color: '#DC2626' }} />}
                {isProfit ? 'Sale value exceeds Wins' : 'Win value exceeds Sales'}
              </p>
              {group.mp > 0 && (
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Includes Missing Payment: -{formatCurrency(group.mp)}
                </p>
              )}
            </div>
            <div 
              className="p-4 rounded-xl" 
              style={{ 
                backgroundColor: isProfit ? '#ECFDF5' : '#FEF2F2',
                color: isProfit ? '#16A34A' : '#DC2626'
              }}
            >
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Controls Panel & Daily Summary details */}
      {!isAccountant && (
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
                          <td className="px-6 py-3.5 font-bold font-mono" style={{ color: dailyNet >= 0 ? '#16A34A' : '#DC2626' }}>
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
      )}

      {/* Accountant Calculations History Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span>Accountant Calculations History</span>
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Review and audit saved calculator logs of Sale and Win entries for this group.
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={calcStartDate}
                onChange={(e) => setCalcStartDate(e.target.value)}
                className="bg-white text-xs h-9 py-1 px-2.5 max-w-[140px]"
                label=""
                placeholder="Start Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <Input
                type="date"
                value={calcEndDate}
                onChange={(e) => setCalcEndDate(e.target.value)}
                className="bg-white text-xs h-9 py-1 px-2.5 max-w-[140px]"
                label=""
                placeholder="End Date"
              />
            </div>
            {(calcStartDate || calcEndDate) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCalcStartDate('');
                  setCalcEndDate('');
                }}
                className="h-9 px-3 text-xs"
              >
                Clear
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchAccountantCalcs()}
              className="flex items-center gap-1.5 h-9 px-3 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Table / List */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Calculation Date</th>
                <th className="px-6 py-4">Total Sale</th>
                <th className="px-6 py-4">Total Win</th>
                <th className="px-6 py-4">Net Profit/Loss</th>
                <th className="px-6 py-4">Logged By</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accountantCalcsLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                    Loading calculations...
                  </td>
                </tr>
              ) : (
                accountantCalcs?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-1.5 text-slate-600 font-medium">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{item.calculation_date}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold font-mono">{parseFloat(item.total_sale).toFixed(2)}</td>
                    <td className="px-6 py-4 font-semibold font-mono" style={{ color: '#16A34A' }}>{parseFloat(item.total_win).toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono">
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-bold" 
                        style={{
                          backgroundColor: parseFloat(item.net_profit_loss) >= 0 ? '#ECFDF5' : '#FEF2F2',
                          color: parseFloat(item.net_profit_loss) >= 0 ? '#16A34A' : '#DC2626'
                        }}
                      >
                        {parseFloat(item.net_profit_loss).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{item.created_by_username || 'System'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetailModal(item)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg cursor-pointer inline-flex transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          navigate(isAccountant ? `/accountant/dashboard?edit=${item.id}` : `/admin/accountant?edit=${item.id}`);
                        }}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer inline-flex transition-colors"
                        title="Edit Calculation"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(item.id, item.group_name, item.calculation_date)}
                        disabled={downloadingId === item.id}
                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg cursor-pointer inline-flex transition-colors disabled:opacity-40"
                        title="Export PDF Receipt"
                      >
                        {downloadingId === item.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this calculation log?')) {
                            deleteCalculationMutation.mutate(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg cursor-pointer inline-flex transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!accountantCalcsLoading && (!accountantCalcs || accountantCalcs.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                    No calculations logged for this group.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

      {/* Accountant Calculation Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Calculation Details: ${selectedHistoryItem?.group_name || ''}`}
      >
        {selectedHistoryItem && (
          <div className="space-y-6 text-sm text-slate-600">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
              <div>
                <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Calculation Date</span>
                <span className="text-slate-800">{selectedHistoryItem.calculation_date}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Logged By</span>
                <span className="text-slate-800">{selectedHistoryItem.created_by_username || 'System'}</span>
              </div>
            </div>

            {/* Individual Entries List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Detailed Sales & Wins Inputs</span>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="px-4 py-2">Index</th>
                      <th className="px-4 py-2">Sale</th>
                      <th className="px-4 py-2">Win</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedHistoryItem.entries?.map((entry: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-4 py-2 font-medium">{parseFloat(entry.sale).toFixed(2)}</td>
                        <td className={`px-4 py-2 font-medium ${parseFloat(entry.win) > 0 ? 'text-emerald-600 font-bold' : ''}`}>{parseFloat(entry.win).toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!selectedHistoryItem.entries || selectedHistoryItem.entries.length === 0) && (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-slate-400 italic">No entries stored.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs">
              <span className="text-2xs text-slate-500 font-bold block uppercase border-b border-slate-800 pb-1 mb-2">Final Summary Receipt</span>
              <div className="flex justify-between">
                <span>Total Gross Sale:</span>
                <span>{parseFloat(selectedHistoryItem.total_sale).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Commission ({selectedHistoryItem.commission_rate}%):</span>
                <span className="text-rose-400">-{parseFloat(selectedHistoryItem.commission_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Win Outflow:</span>
                <span className="text-rose-400">-{parseFloat(selectedHistoryItem.total_win).toFixed(2)}</span>
              </div>
              
              {parseFloat(selectedHistoryItem.mp_amount || '0') > 0 && (
                <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-1 text-2xs text-indigo-300 italic">
                  <span>Missing Payment:</span>
                  <span>
                    -{parseFloat(selectedHistoryItem.mp_amount || '0').toFixed(2)} ({parseFloat(selectedHistoryItem.net_profit_loss) >= 0 ? 'Subtracted' : 'Added to Loss'})
                  </span>
                </div>
              )}

              {parseFloat(selectedHistoryItem.spending || '0') > 0 && (
                <div className="flex justify-between">
                  <span>Spending:</span>
                  <span className="text-rose-400">-{parseFloat(selectedHistoryItem.spending || '0').toFixed(2)}</span>
                </div>
              )}

              {selectedHistoryItem.custom_field_name && parseFloat(selectedHistoryItem.custom_field_value || '0') !== 0 && (
                <div className="flex justify-between">
                  <span>{selectedHistoryItem.custom_field_name}:</span>
                  <span className={parseFloat(selectedHistoryItem.custom_field_value || '0') >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                    {parseFloat(selectedHistoryItem.custom_field_value || '0') >= 0 ? '+' : ''}
                    {parseFloat(selectedHistoryItem.custom_field_value || '0').toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-800 pt-2 mt-2 font-bold text-sm">
                <span>Final Net Share:</span>
                <span style={{ color: parseFloat(selectedHistoryItem.net_profit_loss) >= 0 ? '#34D399' : '#F87171' }}>
                  {parseFloat(selectedHistoryItem.net_profit_loss).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleDownloadPDF(selectedHistoryItem.id, selectedHistoryItem.group_name, selectedHistoryItem.calculation_date)}
                className="flex items-center gap-1 text-xs"
              >
                <FileText className="h-4 w-4" /> Download PDF
              </Button>
              <Button type="button" onClick={() => setIsDetailModalOpen(false)}>
                Close Window
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success/Alert Modal Notification */}
      <Modal isOpen={!!calcSuccessMsg} onClose={() => setCalcSuccessMsg(null)} title="Action Success">
        <div className="space-y-4">
          <p className="text-slate-600 font-semibold text-sm bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-700">
            {calcSuccessMsg}
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setCalcSuccessMsg(null)}>OK</Button>
          </div>
        </div>
      </Modal>

      {/* Error Modal Notification */}
      <Modal isOpen={!!calcErrorMsg} onClose={() => setCalcErrorMsg(null)} title="System Notification / Error">
        <div className="space-y-4">
          <p className="text-slate-600 font-semibold text-sm bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-700">
            {calcErrorMsg}
          </p>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setCalcErrorMsg(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default GroupDetailPage;
