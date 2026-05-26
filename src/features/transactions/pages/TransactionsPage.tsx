import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import transactionsApi from '../../../api/transactions.api';
import groupsApi from '../../../api/groups.api';
import { formatCurrency } from '../../../utils/currency';
import { getTodayDateString } from '../../../utils/date';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import Loader from '../../../components/ui/Loader';
import { Plus, Filter, RefreshCw, Edit2, Trash2 } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { user, isSuperAdmin, isManager } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialGroupParam = searchParams.get('group') || '';

  // Filters State
  const [dateFilter, setDateFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'SALE' | 'WIN' | ''>('');
  const [groupIdFilter, setGroupIdFilter] = useState<string>(initialGroupParam);
  const [page, setPage] = useState(1);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  // Form Fields
  const [txType, setTxType] = useState<'SALE' | 'WIN'>('SALE');
  const [amount, setAmount] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [winAmount, setWinAmount] = useState('');
  const [logBoth, setLogBoth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState(getTodayDateString());
  const [txGroupId, setTxGroupId] = useState<string>('');
  const [formError, setFormError] = useState('');

  // Group search auto-complete states
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  // Fetch groups (for Admin & Manager filters)
  const { data: groups } = useQuery({
    queryKey: ['groupsSelect'],
    queryFn: () => groupsApi.list(),
    enabled: isSuperAdmin || isManager,
  });

  const filteredGroups = React.useMemo(() => {
    if (!groups) return [];
    if (!groupSearchQuery.trim()) return groups;
    return groups.filter((g: any) =>
      g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
    );
  }, [groups, groupSearchQuery]);

  // Build query params
  const queryParams = React.useMemo(() => {
    const params: any = { page };
    if (dateFilter) params.date = dateFilter;
    if (startDateFilter) params.start_date = startDateFilter;
    if (endDateFilter) params.end_date = endDateFilter;
    if (typeFilter) params.type = typeFilter;
    if (isSuperAdmin && groupIdFilter) params.group = groupIdFilter;
    return params;
  }, [dateFilter, startDateFilter, endDateFilter, typeFilter, groupIdFilter, page, isSuperAdmin]);

  // Fetch transactions list
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactionsList', queryParams],
    queryFn: () => transactionsApi.list(queryParams),
  });

  // Create Transaction Mutation
  const createTxMutation = useMutation({
    mutationFn: (data: any) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactionsList'] });
      handleCloseAdd();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to log transaction.');
    },
  });

  // Update Transaction Mutation
  const updateTxMutation = useMutation({
    mutationFn: (data: { id: number; body: any }) => transactionsApi.update(data.id, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactionsList'] });
      handleCloseEdit();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to update transaction.');
    },
  });

  // Delete Transaction Mutation
  const deleteTxMutation = useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactionsList'] });
      setIsDeleteOpen(false);
      setSelectedTx(null);
    },
  });

  // Handlers
  const handleOpenAdd = () => {
    setTxType('SALE');
    setAmount('');
    setSaleAmount('');
    setWinAmount('');
    setLogBoth(false);
    setNote('');
    setTxDate(getTodayDateString());
    const defaultGroup = groups && groups.length > 0 ? groups[0] : null;
    setTxGroupId(defaultGroup ? defaultGroup.id.toString() : '');
    setGroupSearchQuery(defaultGroup ? defaultGroup.name : '');
    setShowGroupDropdown(false);
    setFormError('');
    setIsSubmitting(false);
    setIsAddOpen(true);
  };
  const handleCloseAdd = () => setIsAddOpen(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (isSuperAdmin && logBoth) {
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
      if (!txGroupId) {
        setFormError('Please select a group.');
        return;
      }

      setIsSubmitting(true);
      try {
        const groupInt = parseInt(txGroupId);
        // Log SALE first
        if (parsedSale !== null) {
          await transactionsApi.create({
            type: 'SALE',
            amount: parsedSale,
            note: note ? `${note} (Logged as part of dual entry)` : 'Logged as part of dual entry',
            transaction_date: txDate,
            group: groupInt
          });
        }
        
        // Log WIN second
        if (parsedWin !== null) {
          await transactionsApi.create({
            type: 'WIN',
            amount: parsedWin,
            note: note ? `${note} (Logged as part of dual entry)` : 'Logged as part of dual entry',
            transaction_date: txDate,
            group: groupInt
          });
        }

        queryClient.invalidateQueries({ queryKey: ['transactionsList'] });
        handleCloseAdd();
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
      
      const payload: any = {
        type: txType,
        amount: parsedAmount,
        note,
        transaction_date: txDate,
      };
      
      if (isSuperAdmin) {
        if (!txGroupId) {
          setFormError('Please select a group.');
          return;
        }
        payload.group = parseInt(txGroupId);
      }

      setIsSubmitting(true);
      try {
        await transactionsApi.create(payload);
        queryClient.invalidateQueries({ queryKey: ['transactionsList'] });
        handleCloseAdd();
      } catch (err: any) {
        setFormError(err.response?.data?.detail || 'Failed to log transaction.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOpenEdit = (tx: any) => {
    setSelectedTx(tx);
    setTxType(tx.type);
    setAmount(tx.amount.toString());
    setNote(tx.note || '');
    setTxDate(tx.transaction_date);
    setTxGroupId(tx.group.toString());
    setGroupSearchQuery(tx.group_name || '');
    setShowGroupDropdown(false);
    setFormError('');
    setIsEditOpen(true);
  };
  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedTx(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedTx) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setFormError('Amount cannot be negative.');
      return;
    }
    const payload: any = {
      type: txType,
      amount: parsedAmount,
      note,
      transaction_date: txDate,
    };
    if (isSuperAdmin) {
      payload.group = parseInt(txGroupId);
    }
    updateTxMutation.mutate({ id: selectedTx.id, body: payload });
  };

  const resetFilters = () => {
    setDateFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setTypeFilter('');
    setGroupIdFilter('');
    setPage(1);
  };

  const transactions = txData?.results || [];
  const totalCount = txData?.count || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const groupedTransactions = React.useMemo(() => {
    const groupsMap: { [key: string]: {
      date: string;
      group_id: number;
      group_name: string;
      sale: number;
      win: number;
      commission: number;
      commission_rate: number;
      created_by_username: string;
      note: string;
      originalTxs: any[];
    } } = {};

    transactions.forEach((tx: any) => {
      const date = tx.transaction_date;
      const grpId = tx.group;
      const grpName = tx.group_name;
      const key = `${date}_${grpId}`;

      const amountVal = parseFloat(tx.amount) || 0;
      const commRate = parseFloat(tx.group_commission) || 0;

      if (!groupsMap[key]) {
        groupsMap[key] = {
          date,
          group_id: grpId,
          group_name: grpName,
          sale: 0,
          win: 0,
          commission: 0,
          commission_rate: commRate,
          created_by_username: tx.created_by_username,
          note: tx.note || '',
          originalTxs: []
        };
      }

      const row = groupsMap[key];
      row.originalTxs.push(tx);

      // Aggregate sale/win
      if (tx.type === 'SALE') {
        row.sale += amountVal;
        row.commission += amountVal * (commRate / 100);
        if (commRate > 0) {
          row.commission_rate = commRate;
        }
      } else if (tx.type === 'WIN') {
        row.win += amountVal;
      }

      // Notes concatenation
      if (tx.note) {
        if (!row.note) {
          row.note = tx.note;
        } else if (!row.note.includes(tx.note)) {
          row.note = `${row.note}; ${tx.note}`;
        }
      }
      
      // Logged by users list
      if (tx.created_by_username) {
        if (!row.created_by_username) {
          row.created_by_username = tx.created_by_username;
        } else if (!row.created_by_username.split(', ').includes(tx.created_by_username)) {
          row.created_by_username = `${row.created_by_username}, ${tx.created_by_username}`;
        }
      }
    });

    return Object.values(groupsMap);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Transaction Ledger</h2>
          <p className="text-slate-500 mt-1">Audit and record WIN & SALE transaction logs.</p>
        </div>
        <Button onClick={handleOpenAdd} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Transaction</span>
        </Button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center">
          <Filter className="h-4 w-4 mr-2 text-slate-400" /> Filter Logs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            label="Single Date"
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />
          <Input
            label="Start Date"
            type="date"
            value={startDateFilter}
            onChange={(e) => {
              setStartDateFilter(e.target.value);
              setPage(1);
            }}
          />
          <Input
            label="End Date"
            type="date"
            value={endDateFilter}
            onChange={(e) => {
              setEndDateFilter(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Transaction Type"
            options={[
              { value: '', label: 'All' },
              { value: 'SALE', label: 'SALE' },
              { value: 'WIN', label: 'WIN' },
            ]}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as 'SALE' | 'WIN' | '');
              setPage(1);
            }}
          />
          {(isSuperAdmin || isManager) && (
            <Select
              label="Filter Group"
              placeholder={isSuperAdmin ? "All Groups" : undefined}
              options={groups?.map((g) => ({ value: g.id, label: g.name })) || []}
              value={groupIdFilter}
              onChange={(e) => {
                setGroupIdFilter(e.target.value);
                setPage(1);
              }}
            />
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={resetFilters} className="flex items-center space-x-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </Button>
        </div>
      </div>

      {/* Table Listing */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {txLoading ? (
          <Loader />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Group</th>
                    <th className="px-6 py-4 text-emerald-600">SALE</th>
                    <th className="px-6 py-4 text-red-600">WIN</th>
                    <th className="px-6 py-4 text-blue-600">Commission</th>
                    <th className="px-6 py-4">Logged By</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedTransactions.map((row: any) => {
                    const key = `${row.date}_${row.group_id}`;
                    return (
                      <tr key={key} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">{row.date}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <div>{row.group_name}</div>
                          {row.note && (
                            <div className="text-[10px] text-slate-400 font-normal max-w-xs truncate" title={row.note}>
                              Note: {row.note}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          {row.originalTxs.some((t: any) => t.type === 'SALE') ? formatCurrency(row.sale) : '—'}
                        </td>
                        <td className="px-6 py-4 font-bold text-red-600">
                          {row.originalTxs.some((t: any) => t.type === 'WIN') ? formatCurrency(row.win) : '—'}
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-600">
                          {row.originalTxs.some((t: any) => t.type === 'SALE') ? (
                            <div>
                              <div>{formatCurrency(row.commission)}</div>
                              {row.commission_rate > 0 && (
                                <div className="text-[10px] text-slate-400 font-normal">({row.commission_rate}%)</div>
                              )}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4">{row.created_by_username}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col space-y-1 items-end">
                            {row.originalTxs.map((tx: any) => (
                              <div key={tx.id} className="flex items-center space-x-1.5 justify-end">
                                <span className="text-[10px] text-slate-400 font-medium lowercase">({tx.type})</span>
                                <button
                                  onClick={() => handleOpenEdit(tx)}
                                  className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded transition cursor-pointer"
                                  title={`Edit ${tx.type}`}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTx(tx);
                                    setIsDeleteOpen(true);
                                  }}
                                  className="p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded transition cursor-pointer"
                                  title={`Delete ${tx.type}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {groupedTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No transactions found matching the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Showing Page {page} of {totalPages} ({totalCount} total entries)
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} title="Create Transaction">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">{formError}</div>}
          
          {isSuperAdmin && (
            <div className="flex items-center space-x-2 py-2">
              <input
                id="logBoth"
                type="checkbox"
                checked={logBoth}
                onChange={(e) => setLogBoth(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="logBoth" className="text-sm font-semibold text-slate-700 select-none">
                Log both SALE and WIN at once
              </label>
            </div>
          )}

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

          {isSuperAdmin && (
            <div className="relative space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Associated Group</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type to search group..."
                  value={groupSearchQuery}
                  onChange={(e) => {
                    setGroupSearchQuery(e.target.value);
                    setShowGroupDropdown(true);
                  }}
                  onFocus={() => setShowGroupDropdown(true)}
                  onBlur={() => setTimeout(() => setShowGroupDropdown(false), 200)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                />
                {groupSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setGroupSearchQuery('');
                      setTxGroupId('');
                      setShowGroupDropdown(true);
                    }}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {showGroupDropdown && filteredGroups.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredGroups.map((g: any) => (
                    <div
                      key={g.id}
                      onClick={() => {
                        setTxGroupId(g.id.toString());
                        setGroupSearchQuery(g.name);
                        setShowGroupDropdown(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 ${
                        txGroupId === g.id.toString() ? 'bg-blue-50/50 font-semibold text-blue-600' : 'text-slate-700'
                      }`}
                    >
                      {g.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Input
            label="Note (Optional)"
            type="text"
            placeholder="Add note details..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={handleCloseAdd}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} title="Edit Transaction">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">{formError}</div>}
          
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            label="Transaction Date"
            type="date"
            required
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
          />

          {isSuperAdmin && (
            <div className="relative space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Associated Group</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type to search group..."
                  value={groupSearchQuery}
                  onChange={(e) => {
                    setGroupSearchQuery(e.target.value);
                    setShowGroupDropdown(true);
                  }}
                  onFocus={() => setShowGroupDropdown(true)}
                  onBlur={() => setTimeout(() => setShowGroupDropdown(false), 200)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                />
                {groupSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setGroupSearchQuery('');
                      setTxGroupId('');
                      setShowGroupDropdown(true);
                    }}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {showGroupDropdown && filteredGroups.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredGroups.map((g: any) => (
                    <div
                      key={g.id}
                      onClick={() => {
                        setTxGroupId(g.id.toString());
                        setGroupSearchQuery(g.name);
                        setShowGroupDropdown(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 ${
                        txGroupId === g.id.toString() ? 'bg-blue-50/50 font-semibold text-blue-600' : 'text-slate-700'
                      }`}
                    >
                      {g.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Input
            label="Note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateTxMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Transaction">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete this transaction entry? This cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleteTxMutation.isPending}
              onClick={() => selectedTx && deleteTxMutation.mutate(selectedTx.id)}
            >
              Delete Transaction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default TransactionsPage;
