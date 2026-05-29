import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import groupsApi from '../../../api/groups.api';
import accountantApi from '../../../api/accountant.api';
import api from '../../../api/axios';
import { useAuth } from '../../../hooks/useAuth';
import { AccountantCalculationEntry, AccountantCalculationCreateInput } from '../../../types/accountant.types';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import Loader from '../../../components/ui/Loader';
import { Plus, Trash2, Calculator, Save, Clipboard, RefreshCw, Eye, Calendar, Sparkles, Info, FileText, Edit3, ExternalLink } from 'lucide-react';

export const AccountantCalculatorPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // State Variables
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [calculationDate, setCalculationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [commissionRate, setCommissionRate] = useState<string>('0');
  const [mpAmount, setMpAmount] = useState<string>('0');
  const [spending, setSpending] = useState<string>('0');
  const [customFieldName, setCustomFieldName] = useState<string>('');
  const [customFieldValue, setCustomFieldValue] = useState<string>('0');
  const [customFieldType, setCustomFieldType] = useState<'add' | 'subtract'>('add');
  
  // Custom Modals for Alerts & Successes
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Rows of entries
  const [entries, setEntries] = useState<AccountantCalculationEntry[]>([
    { sale: 0, win: 0 }
  ]);
  const [quickPasteText, setQuickPasteText] = useState<string>('');

  // Calculation Result state
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // History Detail Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [editingCalcId, setEditingCalcId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const editIdParam = searchParams.get('edit');

  // Load Groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groupsList'],
    queryFn: () => groupsApi.list(),
  });

  // Load calculation history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['accountantCalculations'],
    queryFn: () => accountantApi.list(),
  });

  // Filter groups so that if Accountant is bound to groups, they only see those
  const filteredGroups = groups?.filter(g => {
    if (user?.role === 'ACCOUNTANT') {
      const assignedIds = user.accountant_groups || [];
      return assignedIds.includes(g.id);
    }
    return true;
  });

  // Auto-select first group if Accountant has exactly one assigned group
  useEffect(() => {
    if (user?.role === 'ACCOUNTANT' && user?.accountant_groups?.length === 1) {
      setSelectedGroupId(user.accountant_groups[0].toString());
    }
  }, [user, groups]);

  useEffect(() => {
    if (selectedGroupId && groups && !editIdParam) {
      const g = groups.find(group => group.id.toString() === selectedGroupId.toString());
      if (g) {
        setCommissionRate(g.commission.toString());
      }
    }
  }, [selectedGroupId, groups, editIdParam]);

  // Load calculation for editing if edit query param is set
  useEffect(() => {
    const loadCalcToEdit = async () => {
      if (editIdParam) {
        const id = parseInt(editIdParam, 10);
        if (!isNaN(id)) {
          try {
            const calc = await accountantApi.retrieve(id);
            setEditingCalcId(calc.id);
            setSelectedGroupId(calc.group.toString());
            setCalculationDate(calc.calculation_date);
            setCommissionRate(calc.commission_rate.toString());
            setMpAmount(calc.mp_amount ? calc.mp_amount.toString() : '0');
            setSpending(calc.spending ? calc.spending.toString() : '0');
            setCustomFieldName(calc.custom_field_name || '');
            const loadedCustomVal = calc.custom_field_value ? parseFloat(calc.custom_field_value) : 0;
            if (loadedCustomVal < 0) {
              setCustomFieldType('subtract');
              setCustomFieldValue(Math.abs(loadedCustomVal).toString());
            } else {
              setCustomFieldType('add');
              setCustomFieldValue(loadedCustomVal.toString());
            }
            
            // Map entries properly (convert fields to numbers)
            const mappedEntries = calc.entries.map((e: any) => ({
              sale: parseFloat(e.sale) || 0,
              win: parseFloat(e.win) || 0
            }));
            setEntries(mappedEntries);
            
            // Run the calculation logic to show receipt immediately
            const totalSale = mappedEntries.reduce((sum: number, item: any) => sum + item.sale, 0);
            const totalWin = mappedEntries.reduce((sum: number, item: any) => sum + item.win, 0);
            const commRate = parseFloat(calc.commission_rate) || 0;
            const commAmount = totalSale * (commRate / 100);
            const baseProfitLoss = totalSale - commAmount - totalWin;
            const mpVal = calc.mp_amount ? parseFloat(calc.mp_amount) : 0;
            
            let mpApplied = 0;
            if (mpVal > 0) {
              mpApplied = -mpVal;
            }
            
            const spendVal = calc.spending ? parseFloat(calc.spending) : 0;
            const customVal = calc.custom_field_value ? parseFloat(calc.custom_field_value) : 0;
            const finalNet = baseProfitLoss + mpApplied - spendVal + customVal;
            
            setCalculationResult({
              totalSale,
              totalWin,
              commissionRate: commRate,
              commissionAmount: commAmount,
              baseProfitLoss,
              mpVal,
              mpApplied,
              mpExplanation: mpVal > 0 ? (baseProfitLoss >= 0 ? `Profit: Subtracting MP` : `Loss: Adding MP`) : '',
              spending: spendVal,
              customFieldName: calc.custom_field_name || 'Custom Adjustment',
              customFieldValue: customVal,
              finalNet
            });
          } catch (err) {
            setErrorMsg('Failed to load the calculation for editing.');
          }
        }
      }
    };
    
    if (groups) {
      loadCalcToEdit();
    }
  }, [editIdParam, groups]);

  // Smooth scroll to top when edit mode activates
  useEffect(() => {
    if (editIdParam) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editIdParam]);

  // Mutations
  const saveCalculationMutation = useMutation({
    mutationFn: (data: AccountantCalculationCreateInput) => accountantApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountantCalculations'] });
      setSuccessMsg('Calculation saved successfully!');
      setCalculationResult(null);
      setEntries([{ sale: 0, win: 0 }]);
      setQuickPasteText('');
      setSpending('0');
      setCustomFieldName('');
      setCustomFieldValue('0');
      setCustomFieldType('add');
    },
    onError: (err: any) => {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save calculation.';
      setErrorMsg(detail);
    }
  });

  const updateCalculationMutation = useMutation({
    mutationFn: (data: { id: number; payload: AccountantCalculationCreateInput }) =>
      accountantApi.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountantCalculations'] });
      setSuccessMsg('Calculation updated successfully!');
      handleClearEdit();
    },
    onError: (err: any) => {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update calculation.';
      setErrorMsg(detail);
    }
  });

  const handleClearEdit = () => {
    setEditingCalcId(null);
    setCalculationResult(null);
    setEntries([{ sale: 0, win: 0 }]);
    setQuickPasteText('');
    setSpending('0');
    setCustomFieldName('');
    setCustomFieldValue('0');
    setCustomFieldType('add');
    setSearchParams({});
  };

  const deleteCalculationMutation = useMutation({
    mutationFn: (id: number) => accountantApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountantCalculations'] });
      setSuccessMsg('Calculation log deleted successfully.');
    },
    onError: () => {
      setErrorMsg('Failed to delete calculation.');
    }
  });

  // Rows controls
  const handleAddRow = () => {
    setEntries([...entries, { sale: 0, win: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (entries.length === 1) {
      setEntries([{ sale: 0, win: 0 }]);
      return;
    }
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: 'sale' | 'win', value: string) => {
    const numericVal = parseFloat(value) || 0;
    const updated = [...entries];
    updated[index][field] = numericVal;
    setEntries(updated);
  };

  // Quick Paste Parser (1200-200)
  const handleQuickPaste = () => {
    if (!quickPasteText.trim()) return;
    
    const lines = quickPasteText.split('\n');
    const newEntries: AccountantCalculationEntry[] = [];
    
    lines.forEach(line => {
      const parts = line.split('-');
      if (parts.length >= 2) {
        const sale = parseFloat(parts[0]) || 0;
        const win = parseFloat(parts[1]) || 0;
        newEntries.push({ sale, win });
      } else if (parts.length === 1 && parts[0].trim() !== '') {
        const sale = parseFloat(parts[0]) || 0;
        newEntries.push({ sale, win: 0 });
      }
    });

    if (newEntries.length > 0) {
      if (entries.length === 1 && entries[0].sale === 0 && entries[0].win === 0) {
        setEntries(newEntries);
      } else {
        setEntries([...entries, ...newEntries]);
      }
      setQuickPasteText('');
    } else {
      setErrorMsg('Could not parse any entries. Please use the format "Sale-Win" (e.g. 1200-200) on each line.');
    }
  };

  // Calculations Logic
  const handleCalculate = () => {
    if (!selectedGroupId) {
      setErrorMsg('Please select a group first.');
      return;
    }

    const totalSale = entries.reduce((sum, item) => sum + item.sale, 0);
    const totalWin = entries.reduce((sum, item) => sum + item.win, 0);

    const commRate = parseFloat(commissionRate) || 0;
    const commAmount = totalSale * (commRate / 100);

    const baseProfitLoss = totalSale - commAmount - totalWin;

    const mpVal = parseFloat(mpAmount) || 0;
    let mpApplied = 0;
    let mpExplanation = '';

    if (mpVal > 0) {
      mpApplied = -mpVal;
      if (baseProfitLoss >= 0) {
        mpExplanation = `Profit of ${baseProfitLoss.toFixed(2)}: Subtracting Missing Payment (${mpVal})`;
      } else {
        mpExplanation = `Loss of ${Math.abs(baseProfitLoss).toFixed(2)}: Adding Missing Payment (${mpVal}) to loss`;
      }
    }

    const spendVal = parseFloat(spending) || 0;
    const customVal = parseFloat(customFieldValue) || 0;
    const customValAdjusted = customFieldType === 'subtract' ? -customVal : customVal;

    // Final Net Profit/Loss
    const finalNet = baseProfitLoss + mpApplied - spendVal + customValAdjusted;

    setCalculationResult({
      totalSale,
      totalWin,
      commissionRate: commRate,
      commissionAmount: commAmount,
      baseProfitLoss,
      mpVal,
      mpApplied,
      mpExplanation,
      spending: spendVal,
      customFieldName: customFieldName || 'Custom Adjustment',
      customFieldValue: customValAdjusted,
      finalNet
    });
  };

  const handleSave = () => {
    if (!calculationResult || !selectedGroupId) return;

    const payload: AccountantCalculationCreateInput = {
      group: parseInt(selectedGroupId),
      calculation_date: calculationDate,
      entries: entries,
      total_sale: calculationResult.totalSale,
      total_win: calculationResult.totalWin,
      commission_rate: calculationResult.commissionRate,
      commission_amount: calculationResult.commissionAmount,
      mp_amount: calculationResult.mpVal || null,
      spending: calculationResult.spending || null,
      custom_field_name: customFieldName.trim() || null,
      custom_field_value: calculationResult.customFieldValue || null,
      net_profit_loss: calculationResult.finalNet
    };

    if (editingCalcId !== null) {
      updateCalculationMutation.mutate({ id: editingCalcId, payload });
    } else {
      saveCalculationMutation.mutate(payload);
    }
  };

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
      setSuccessMsg('Calculation PDF receipt has been successfully downloaded.');
    } catch (err) {
      setErrorMsg('Failed to download PDF receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenDetailModal = (item: any) => {
    setSelectedHistoryItem(item);
    setIsDetailModalOpen(true);
  };

  const isLoading = groupsLoading || historyLoading;

  if (isLoading) {
    return <Loader />;
  }

  const selectedGroupObj = groups?.find(g => g.id.toString() === selectedGroupId);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-blue-600 animate-pulse" />
            <span>Accountant Calculator</span>
          </h2>
          <p className="text-slate-500 mt-1">Calculate and log sales, wins, commissions, manpoints, and expenses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Setup & Input Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <span>Calculation Parameters</span>
            </h3>

            {/* Selection row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user?.role === 'ACCOUNTANT' ? (
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group</label>
                  {(user?.accountant_groups?.length ?? 0) > 1 ? (
                    <Select
                      label=""
                      placeholder="Select your group"
                      options={filteredGroups?.map((g) => ({ value: g.id, label: g.name })) || []}
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                    />
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700">
                      {selectedGroupObj?.name || 'Assigned Group'}
                    </div>
                  )}
                  {selectedGroupId && (
                    <Link
                      to={`/accountant/groups/${selectedGroupId}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open Group Details
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col space-y-1.5">
                  <Select
                    label="Select Group"
                    required
                    placeholder="Choose Group"
                    options={filteredGroups?.map((g) => ({ value: g.id, label: g.name })) || []}
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                  />
                  {selectedGroupId && (
                    <Link
                      to={`/admin/groups/${selectedGroupId}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open Group Details
                    </Link>
                  )}
                </div>
              )}
              <Input
                label="Calculation Date"
                type="date"
                required
                value={calculationDate}
                onChange={(e) => setCalculationDate(e.target.value)}
              />
            </div>

            {/* Commission & MP overrides */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span>Commission (%)</span>
                  <span className="text-slate-400 cursor-help" title="Default commission set on Group settings. Override here if needed.">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span>Missing Payment</span>
                  <span className="text-slate-400 cursor-help" title="Deducted missing payment amount. Subtracted from profit, added to absolute loss.">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  value={mpAmount}
                  onChange={(e) => setMpAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span>Spending</span>
                  <span className="text-slate-400 cursor-help" title="Flat spending deductions subtracted from final net profit.">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  value={spending}
                  onChange={(e) => setSpending(e.target.value)}
                />
              </div>
            </div>

            {/* Custom Field Addon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span>Custom Field Label</span>
                  <span className="text-slate-400 cursor-help" title="Custom name label for special adjustments.">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra Bonus, Tea Expense"
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span>Custom Action</span>
                  <span className="text-slate-400 cursor-help" title="Select whether to add or subtract this custom amount.">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </label>
                <select
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  value={customFieldType}
                  onChange={(e) => setCustomFieldType(e.target.value as 'add' | 'subtract')}
                >
                  <option value="add">Add (+)</option>
                  <option value="subtract">Subtract (-)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span>Custom Amount</span>
                  <span className="text-slate-400 cursor-help" title="Adjustment amount to apply. Always enter a positive value; the Custom Action determines if it adds or subtracts.">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  value={customFieldValue}
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                />
              </div>
            </div>

            {/* Entries Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Sale & Win Entries</span>
                <Button type="button" variant="secondary" onClick={handleAddRow} size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Add Entry Row
                </Button>
              </div>

              {/* Dynamic rows */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {entries.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-400 w-6">{idx + 1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          placeholder="Sale Amount"
                          className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          value={entry.sale || ''}
                          onChange={(e) => handleRowChange(idx, 'sale', e.target.value)}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Win Amount"
                          className={`w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${entry.win > 0 ? 'text-emerald-600 font-bold border-emerald-200 focus:ring-emerald-500' : ''}`}
                          value={entry.win || ''}
                          onChange={(e) => handleRowChange(idx, 'win', e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Paste Area */}
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold flex items-center gap-1"><Clipboard className="h-3.5 w-3.5" /> Fast Paste Helper</span>
                  <span className="flex items-center gap-1">
                    <span>Format: <code>Sale-Win</code> per line (e.g. <code>1200-200</code>)</span>
                    <span className="cursor-help text-slate-400" title="Paste raw logs directly. E.g. writing 1200-200 on a line translates to 1200 Sale and 200 Win.">
                      <Info className="h-3 w-3" />
                    </span>
                  </span>
                </div>
                <textarea
                  className="w-full h-20 text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="Paste entries here...&#10;1200-200&#10;1500-300"
                  value={quickPasteText}
                  onChange={(e) => setQuickPasteText(e.target.value)}
                />
                <Button type="button" variant="secondary" size="sm" className="w-full" onClick={handleQuickPaste}>
                  Parse & Add to Entries list
                </Button>
              </div>

              {/* Calculate Button */}
              <Button type="button" className="w-full py-3 flex items-center justify-center gap-2" onClick={handleCalculate}>
                <Calculator className="h-5 w-5" /> Calculate Profit & Loss
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side: Receipt & Calculation Results */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl text-slate-700 shadow-sm p-6 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
            {/* Background design glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-3.5 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4.5 w-4.5 text-indigo-600" />
                  <span>Calculation Receipt</span>
                </span>
                <span className="text-2xs bg-slate-50 px-2 py-0.5 rounded text-slate-500 font-mono uppercase border border-slate-100">Live Auditing</span>
              </h3>

              {calculationResult ? (
                <div className="space-y-5 text-sm">
                  
                  {/* Premium Total Display */}
                  <div className="text-center bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-2xs text-slate-500 uppercase font-bold tracking-widest">Final Net Balance</span>
                    <div className="text-3xl font-extrabold mt-1.5 font-mono" style={{ color: calculationResult.finalNet >= 0 ? '#16A34A' : '#DC2626' }}>
                      {calculationResult.finalNet.toFixed(2)}
                    </div>
                    <span className="inline-block px-3 py-0.5 rounded-full text-2xs font-extrabold uppercase mt-2.5 tracking-wider" style={{
                      backgroundColor: calculationResult.finalNet >= 0 ? '#ECFDF5' : '#FEF2F2',
                      color: calculationResult.finalNet >= 0 ? '#16A34A' : '#DC2626',
                      border: `1px solid ${calculationResult.finalNet >= 0 ? '#A7F3D0' : '#FECACA'}`
                    }}>
                      {calculationResult.finalNet >= 0 ? 'Net Profit SU' : 'Net Loss ADD'}
                    </span>
                  </div>

                  {/* Mathematical Details List */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Total Gross Sale:</span>
                      <span className="font-semibold text-slate-800 font-mono">{calculationResult.totalSale.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Commission Rate:</span>
                      <span className="font-semibold text-slate-800 font-mono">{calculationResult.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Commission Amount:</span>
                      <span className="font-semibold text-rose-500 font-mono">-{calculationResult.commissionAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Total Win Outflow:</span>
                      <span className="font-semibold text-rose-500 font-mono">-{calculationResult.totalWin.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 bg-slate-50 px-2 py-1 rounded">
                      <span className="text-indigo-600 font-bold uppercase tracking-wider text-2xs">Base Profit / Loss:</span>
                      <span className="font-bold font-mono" style={{ color: calculationResult.baseProfitLoss >= 0 ? '#16A34A' : '#DC2626' }}>
                        {calculationResult.baseProfitLoss.toFixed(2)}
                      </span>
                    </div>
                    
                    {calculationResult.mpVal > 0 && (
                      <div className="flex flex-col border-b border-slate-100 pb-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Missing Payment:</span>
                          <span className="font-semibold font-mono" style={{ color: calculationResult.mpApplied >= 0 ? '#16A34A' : '#DC2626' }}>
                            {calculationResult.mpApplied >= 0 ? `+${calculationResult.mpVal.toFixed(2)}` : `-${calculationResult.mpVal.toFixed(2)}`}
                          </span>
                        </div>
                        <span className="text-3xs text-slate-400 italic mt-0.5">{calculationResult.mpExplanation}</span>
                      </div>
                    )}

                    {calculationResult.spending > 0 && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500">Spending Deducted:</span>
                        <span className="font-semibold text-rose-500 font-mono">-{calculationResult.spending.toFixed(2)}</span>
                      </div>
                    )}

                    {calculationResult.customFieldValue !== 0 && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-slate-550 truncate max-w-[150px]">{calculationResult.customFieldName}:</span>
                        <span className="font-semibold font-mono" style={{ color: calculationResult.customFieldValue >= 0 ? '#16A34A' : '#DC2626' }}>
                          {calculationResult.customFieldValue >= 0 ? `+${calculationResult.customFieldValue.toFixed(2)}` : `${calculationResult.customFieldValue.toFixed(2)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {calculationResult ? (
              <div className="pt-6 border-t border-slate-100 flex items-center gap-3 mt-4">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs"
                  onClick={handleSave}
                  isLoading={saveCalculationMutation.isPending || updateCalculationMutation.isPending}
                >
                  <Save className="h-4 w-4" /> {editingCalcId !== null ? 'Update Saved Receipt' : 'Save Receipt'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="text-slate-500 hover:text-slate-700 border-slate-200 hover:bg-slate-50 text-xs py-2.5"
                  onClick={handleClearEdit}
                >
                  {editingCalcId !== null ? 'Cancel Edit' : 'Clear'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-4">
                <div className="h-16 w-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <Calculator className="h-7 w-7 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">No Calculation Active</p>
                  <p className="text-xs text-slate-500 max-w-[220px] mx-auto mt-1.5 leading-relaxed">
                    Set up your parameters, enter sale/win items on the left, and click <b>Calculate</b> to output a visual breakdown receipt.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Calculation History */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Calculation Logs & History</h3>
            <p className="text-slate-500 text-xs mt-1">Review saved accountant calculations for auditing.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['accountantCalculations'] })}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Group</th>
                <th className="px-6 py-4">Calculation Date</th>
                <th className="px-6 py-4">Total Sale</th>
                <th className="px-6 py-4">Total Win</th>
                <th className="px-6 py-4">Net Profit/Loss</th>
                <th className="px-6 py-4">Logged By</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{item.group_name}</td>
                  <td className="px-6 py-4 flex items-center gap-1.5 text-slate-600 font-medium">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{item.calculation_date}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold font-mono">{parseFloat(item.total_sale).toFixed(2)}</td>
                  <td className="px-6 py-4 font-semibold font-mono">{parseFloat(item.total_win).toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                      backgroundColor: parseFloat(item.net_profit_loss) >= 0 ? '#ECFDF5' : '#FEF2F2',
                      color: parseFloat(item.net_profit_loss) >= 0 ? '#16A34A' : '#DC2626'
                    }}>
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
                        setSearchParams({ edit: item.id.toString() });
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
                        if (confirm('Are you sure you want to delete this log?')) {
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
              ))}
              {(!history || history.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                    No calculations logged yet. Run a calculation above and click 'Save Receipt'.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Detail Modal */}
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
                <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Logged Time</span>
                <span className="text-slate-800">{new Date(selectedHistoryItem.created_at).toLocaleString()}</span>
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
                    {selectedHistoryItem.entries?.map((entry: AccountantCalculationEntry, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-4 py-2 font-medium">{entry.sale.toFixed(2)}</td>
                        <td className={`px-4 py-2 font-medium ${entry.win > 0 ? 'text-emerald-600 font-bold' : ''}`}>{entry.win.toFixed(2)}</td>
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
      <Modal isOpen={!!successMsg} onClose={() => setSuccessMsg(null)} title="Action Success">
        <div className="space-y-4">
          <p className="text-slate-600 font-semibold text-sm bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-700">
            {successMsg}
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setSuccessMsg(null)}>OK</Button>
          </div>
        </div>
      </Modal>

      {/* Error Modal Notification */}
      <Modal isOpen={!!errorMsg} onClose={() => setErrorMsg(null)} title="System Notification / Error">
        <div className="space-y-4">
          <p className="text-slate-600 font-semibold text-sm bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-700">
            {errorMsg}
          </p>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setErrorMsg(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default AccountantCalculatorPage;
