import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import groupsApi from '../../../api/groups.api';
import reportsApi from '../../../api/reports.api';
import { formatCurrency } from '../../../utils/currency';
import { downloadBlob } from '../../../utils/pdf';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Loader from '../../../components/ui/Loader';
import {
  Calendar,
  FileDown,
  Handshake,
  Calculator,
  CheckSquare,
  Square,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';

export const CollabPage: React.FC = () => {
  // Query state parameters
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [partnershipPct, setPartnershipPct] = useState<string>('50');
  const [spendingAmt, setSpendingAmt] = useState<string>('0');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [pdfExporting, setPdfExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string>('');

  // Fetch all groups available
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groupsListForCollab'],
    queryFn: () => groupsApi.list(),
  });

  // Calculate parameters for API query
  const groupIdsParam = useMemo(() => {
    return selectedGroupIds.join(',');
  }, [selectedGroupIds]);

  const queryParams = useMemo(() => {
    return {
      group_ids: groupIdsParam,
      percentage: parseFloat(partnershipPct) || 0,
      spending: parseFloat(spendingAmt) || 0,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
  }, [groupIdsParam, partnershipPct, spendingAmt, startDate, endDate]);

  // Fetch Collab calculated statistics
  const { data: collabData, isLoading: collabLoading, error: collabError } = useQuery({
    queryKey: ['collabCalculations', queryParams],
    queryFn: () => reportsApi.collab(queryParams),
    enabled: selectedGroupIds.length > 0 && !isNaN(queryParams.percentage),
  });

  // Handlers for selection
  const handleToggleGroup = (id: number) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!groups) return;
    if (selectedGroupIds.length === groups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(groups.map((g: any) => g.id));
    }
  };

  const handleReset = () => {
    setSelectedGroupIds([]);
    setPartnershipPct('50');
    setSpendingAmt('0');
    setStartDate('');
    setEndDate('');
    setExportError('');
  };

  // Handler for PDF Report export
  const handleDownloadPDF = async () => {
    setExportError('');
    if (selectedGroupIds.length === 0) {
      setExportError('Please select at least one group to generate a report.');
      return;
    }

    setPdfExporting(true);
    try {
      const blob = await reportsApi.downloadCollabPdf(queryParams);
      const filename = `collab_partnership_report_${startDate || 'all'}_to_${endDate || 'now'}.pdf`;
      downloadBlob(blob, filename);
    } catch (err: any) {
      setExportError('Failed to generate collaboration PDF report.');
    } finally {
      setPdfExporting(false);
    }
  };

  const hasSelection = selectedGroupIds.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Handshake className="h-7 w-7 mr-2.5 text-blue-600 animate-pulse" />
            <span>Collaboration & Partnership Center</span>
          </h2>
          <p className="text-slate-500 mt-1">
            Aggregate group performance, calculate shared partnership metrics, and deduct operational spendings.
          </p>
        </div>
        {hasSelection && (
          <Button
            variant="secondary"
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Settings</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Configurations & Selection */}
        <div className="space-y-6">
          {/* Card: Select Groups */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wider">
                Select Groups ({selectedGroupIds.length})
              </h3>
              {groups && groups.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer select-none"
                >
                  {selectedGroupIds.length === groups.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {groupsLoading ? (
              <div className="py-8"><Loader /></div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {groups?.map((group: any) => {
                  const isChecked = selectedGroupIds.includes(group.id);
                  return (
                    <div
                      key={group.id}
                      onClick={() => handleToggleGroup(group.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/20 font-semibold text-blue-800'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="text-sm truncate mr-2">{group.name}</span>
                      <button type="button" className="text-blue-600">
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 fill-blue-50" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-300" />
                        )}
                      </button>
                    </div>
                  );
                })}
                {groups?.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">No groups registered.</p>
                )}
              </div>
            )}
          </div>

          {/* Card: Calculation Parameters */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
              <Calculator className="h-4 w-4 mr-1.5 text-blue-500" /> Partnership Parameters
            </h3>
            
            <div className="space-y-4">
              <Input
                label="Partnership Share (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={partnershipPct}
                onChange={(e) => setPartnershipPct(e.target.value)}
                placeholder="e.g. 50"
              />
              
              <Input
                label="Spending Deduction (Flat amount)"
                type="number"
                min="0"
                step="0.01"
                required
                value={spendingAmt}
                onChange={(e) => setSpendingAmt(e.target.value)}
                placeholder="e.g. 1000"
              />
            </div>
          </div>

          {/* Card: Date Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-1.5 text-blue-500" /> Date Period Filtering
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="From Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="To Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right column: Results & Export */}
        <div className="lg:col-span-2 space-y-6">
          {!hasSelection ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-4">
              <Handshake className="h-16 w-16 text-slate-300" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-700">No Groups Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Select one or multiple groups from the left panel, and configure partnership share percentages to calculate net earnings.
                </p>
              </div>
            </div>
          ) : collabLoading ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-24 shadow-sm flex flex-col items-center justify-center">
              <Loader />
              <p className="text-xs text-slate-400 mt-4 font-semibold">Running partnership aggregations...</p>
            </div>
          ) : collabError ? (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-3xl p-8 text-center space-y-2">
              <p className="font-bold">Failed to load collaboration data.</p>
              <p className="text-xs">Please verify query parameters or reload the page.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Premium Calculation Hero Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(() => {
                  const isProfit = collabData.net_profit_loss >= 0;
                  return (
                    <div className={`rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-all duration-300 ${
                      isProfit
                        ? 'bg-emerald-50/40 border-emerald-100 text-emerald-900'
                        : 'bg-rose-50/40 border-rose-100 text-rose-900'
                    }`}>
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Total Groups P&L</span>
                        <h4 className="text-xl font-black mt-1">
                          {formatCurrency(collabData.net_profit_loss)}
                        </h4>
                      </div>
                      <div className={`p-3 rounded-xl ${isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const isProfit = collabData.partnership_share >= 0;
                  return (
                    <div className={`rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-all duration-300 ${
                      isProfit
                        ? 'bg-indigo-50/40 border-indigo-100 text-indigo-900'
                        : 'bg-rose-50/40 border-rose-100 text-rose-900'
                    }`}>
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                          Partnership Share ({collabData.percentage}%)
                        </span>
                        <h4 className="text-xl font-black mt-1">
                          {formatCurrency(collabData.partnership_share)}
                        </h4>
                      </div>
                      <div className={`p-3 rounded-xl ${isProfit ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 shadow-sm flex items-center justify-between text-amber-900">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-70">Spending Deduction</span>
                    <h4 className="text-xl font-black mt-1">
                      -{formatCurrency(collabData.spending)}
                    </h4>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Giant Net Partnership Profit/Loss Hero Card */}
              {(() => {
                const finalNet = collabData.final_net_share;
                const isFinalProfit = finalNet >= 0;
                return (
                  <div className={`rounded-3xl p-8 border relative overflow-hidden shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 ${
                    isFinalProfit
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50/20 border-emerald-100 text-emerald-950'
                      : 'bg-gradient-to-r from-rose-50 to-red-50/20 border-red-100 text-rose-950'
                  }`}>
                    {/* Background visual elements */}
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
                      isFinalProfit ? 'bg-emerald-200/40' : 'bg-rose-200/40'
                    }`} />
                    
                    <div className="space-y-2 relative z-10">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isFinalProfit
                          ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700'
                          : 'bg-rose-100/50 border-rose-200 text-rose-700'
                      }`}>
                        {isFinalProfit ? 'Partnership Profit Share' : 'Partnership Loss Share'}
                      </span>
                      <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
                        {isFinalProfit ? (
                          <TrendingUp className="h-8 w-8 text-emerald-600 shrink-0" />
                        ) : (
                          <TrendingDown className="h-8 w-8 text-rose-600 shrink-0" />
                        )}
                        <span>{formatCurrency(finalNet)}</span>
                      </h2>
                      <p className={`text-xs ${isFinalProfit ? 'text-emerald-700/80' : 'text-rose-700/80'}`}>
                        {isFinalProfit
                          ? 'Final net share reflects earnings after percentage splits and spending cuts.'
                          : 'Final net share reflects accumulated loss after percentage splits and spending additions.'}
                      </p>
                    </div>

                    <div className="shrink-0 relative z-10 w-full md:w-auto">
                      <Button
                        onClick={handleDownloadPDF}
                        isLoading={pdfExporting}
                        className={`w-full md:w-auto flex items-center justify-center space-x-2 font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all border-none ${
                          isFinalProfit ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                      >
                        <FileDown className="h-4.5 w-4.5" />
                        <span>Download PDF Report</span>
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {exportError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100">
                  {exportError}
                </div>
              )}

              {/* Group Breakdown Ledger Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center">
                    <Activity className="h-4 w-4 mr-1.5 text-blue-500" /> Selected Group Breakdown
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Live Performance
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Group</th>
                        <th className="px-6 py-3.5 text-emerald-600">SALE</th>
                        <th className="px-6 py-3.5 text-red-600">WIN</th>
                        <th className="px-6 py-3.5 text-blue-600">Commission</th>
                        <th className="px-6 py-3.5">MP</th>
                        <th className="px-6 py-3.5">Net Profit/Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {collabData.groups.map((row: any) => {
                        const netVal = parseFloat(row.net_profit_loss) || 0;
                        return (
                          <tr key={row.group_id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3.5 font-bold text-slate-800">{row.group_name}</td>
                            <td className="px-6 py-3.5 font-semibold text-emerald-600">
                              {formatCurrency(row.total_sale)}
                            </td>
                            <td className="px-6 py-3.5 font-semibold text-red-600">
                              {formatCurrency(row.total_win)}
                            </td>
                            <td className="px-6 py-3.5 font-semibold text-blue-600">
                              <div>{formatCurrency(row.commission)}</div>
                              <div className="text-[9px] text-slate-400 font-normal">({row.commission_rate}%)</div>
                            </td>
                            <td className="px-6 py-3.5 font-semibold text-slate-500">
                              {formatCurrency(row.mp)}
                            </td>
                            <td className="px-6 py-3.5 font-bold">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                netVal >= 0
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {netVal >= 0 ? '+' : ''}{formatCurrency(netVal)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollabPage;
