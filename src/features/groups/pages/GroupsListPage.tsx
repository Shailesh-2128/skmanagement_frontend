import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import groupsApi from '../../../api/groups.api';
import api from '../../../api/axios';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import { Plus, Edit2, Trash2, ShieldAlert, ChevronRight, Calendar, UserCheck, Scissors } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';


import Loader from '../../../components/ui/Loader';

export const GroupsListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected Group details for edits
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState<string>('');
  const [commission, setCommission] = useState('0.00');
  const [mp, setMp] = useState('0.00');

  const [searchQuery, setSearchQuery] = useState('');
  const [plFilter, setPlFilter] = useState<'all' | 'profit_weekly' | 'loss_weekly' | 'profit_last_date' | 'loss_last_date'>('all');

  // Fetch groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groupsList'],
    queryFn: () => groupsApi.list(),
  });

  // Fetch users (to find managers)
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data;
    },
  });

  // Filter unassigned managers, plus the currently assigned manager for editing
  const availableManagers = React.useMemo(() => {
    if (!users) return [];
    // Get all users with role 'MANAGER'
    const managers = users.filter((u: any) => u.role === 'MANAGER');
    return managers.map((m: any) => ({
      value: m.id,
      label: `${m.username} (${m.email})` + (m.group ? ` [Currently in group ID ${m.group}]` : ''),
      userId: m.id,
      groupId: m.group,
    }));
  }, [users]);

  // Filter groups list by search query and profit/loss filters
  const filteredGroupsList = React.useMemo(() => {
    if (!groups) return [];
    
    return groups.filter((group: any) => {
      // 1. Search Query filter (matches name, description or manager username)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        group.name.toLowerCase().includes(query) || 
        (group.description && group.description.toLowerCase().includes(query)) ||
        (group.manager && group.manager.username.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;

      // 2. Profit and Loss filter
      const weeklyPl = parseFloat(group.weekly_profit_loss) || 0;
      const lastDatePl = parseFloat(group.last_date_profit_loss) || 0;

      if (plFilter === 'profit_weekly') return weeklyPl > 0;
      if (plFilter === 'loss_weekly') return weeklyPl < 0;
      if (plFilter === 'profit_last_date') return lastDatePl > 0;
      if (plFilter === 'loss_last_date') return lastDatePl < 0;

      return true;
    });
  }, [groups, searchQuery, plFilter]);

  // Create Group Mutation
  const createGroupMutation = useMutation({
    mutationFn: (data: { name: string; description: string; commission: number; mp: number }) => groupsApi.create(data),
    onSuccess: async (newGroup) => {
      // If a manager was selected, update the user to belong to this group
      if (managerId) {
        await api.patch(`/users/${managerId}/`, { group: newGroup.id });
      }
      queryClient.invalidateQueries({ queryKey: ['groupsList'] });
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      handleCloseAdd();
    },
  });

  // Edit Group Mutation
  const updateGroupMutation = useMutation({
    mutationFn: (data: { id: number; name: string; description: string; commission: number; mp: number }) =>
      groupsApi.update(data.id, {
        name: data.name,
        description: data.description,
        commission: data.commission,
        mp: data.mp,
      }),
    onSuccess: async (updatedGroup) => {
      // Find old manager for this group and set their group to null
      const oldManager = users?.find((u: any) => u.group === updatedGroup.id && u.role === 'MANAGER');
      if (oldManager && oldManager.id.toString() !== managerId) {
        await api.patch(`/users/${oldManager.id}/`, { group: null });
      }
      
      // If a new manager was selected, set their group to this group
      if (managerId) {
        await api.patch(`/users/${managerId}/`, { group: updatedGroup.id });
      }

      queryClient.invalidateQueries({ queryKey: ['groupsList'] });
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      handleCloseEdit();
    },
  });

  // Delete Group Mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => groupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupsList'] });
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      setIsDeleteOpen(false);
      setSelectedGroup(null);
    },
  });

  // Add handlers
  const handleOpenAdd = () => {
    setName('');
    setDescription('');
    setManagerId('');
    setCommission('0.00');
    setMp('0.00');
    setIsAddOpen(true);
  };
  const handleCloseAdd = () => setIsAddOpen(false);
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createGroupMutation.mutate({
      name,
      description,
      commission: parseFloat(commission) || 0,
      mp: parseFloat(mp) || 0,
    });
  };

  // Edit handlers
  const handleOpenEdit = (group: any) => {
    setSelectedGroup(group);
    setName(group.name);
    setDescription(group.description || '');
    setCommission(group.commission ? group.commission.toString() : '0.00');
    setMp(group.mp ? group.mp.toString() : '0.00');
    
    // Find current manager ID
    const curManager = group.manager;
    setManagerId(curManager ? curManager.id.toString() : '');
    setIsEditOpen(true);
  };
  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedGroup(null);
  };
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !name.trim()) return;
    updateGroupMutation.mutate({
      id: selectedGroup.id,
      name,
      description,
      commission: parseFloat(commission) || 0,
      mp: parseFloat(mp) || 0,
    });
  };

  // Delete handlers
  const handleOpenDelete = (group: any) => {
    setSelectedGroup(group);
    setIsDeleteOpen(true);
  };

  const isLoading = groupsLoading || usersLoading;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Group Management</h2>
          <p className="text-slate-500 mt-1">Configure groups and assign managers.</p>
        </div>
        <Button onClick={handleOpenAdd} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Group</span>
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:flex-1">
          <Input
            placeholder="Search groups by name, manager or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-64">
          <Select
            options={[
              { value: 'all', label: 'All P&L States' },
              { value: 'profit_weekly', label: 'Profit (Current Week)' },
              { value: 'loss_weekly', label: 'Loss (Current Week)' },
              { value: 'profit_last_date', label: 'Profit (Last Date)' },
              { value: 'loss_last_date', label: 'Loss (Last Date)' },
            ]}
            value={plFilter}
            onChange={(e: any) => setPlFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroupsList.map((group: any) => (
          <div
            key={group.id}
            className="group relative bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            {/* Clickable Card Header & Info */}
            <div
              onClick={() => navigate(`/admin/groups/${group.id}`)}
              className="cursor-pointer space-y-4 flex-1"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200">
                  {group.name}
                </h3>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
              </div>
              <p className="text-slate-500 text-sm line-clamp-3">
                {group.description || 'No description provided for this group.'}
              </p>

              {/* Badges / Metadata */}
              <div className="pt-2 flex flex-col gap-2">
                <div className="flex items-center text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-xs">
                  <UserCheck className="h-3.5 w-3.5 mr-1.5 text-slate-400 shrink-0" />
                  {group.manager ? (
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                      Manager: {group.manager.username}
                    </span>
                  ) : (
                    <span className="italic text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                      Unassigned Manager
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs gap-2 pt-0.5 border-b border-slate-100 pb-2">
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Comm: {group.commission}%
                  </span>
                  <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    MP: {formatCurrency(group.mp)}
                  </span>
                </div>

                {/* Last Date and Weekly P&L details */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center text-xs text-slate-600">
                    <span className="font-semibold text-slate-500 mr-1">Last Date:</span>
                    {group.last_transaction_date ? (
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        {group.last_transaction_date}{' '}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          group.last_date_profit_loss >= 0 
                            ? 'bg-emerald-50 text-emerald-600 font-bold' 
                            : 'bg-red-50 text-red-600 font-bold'
                        }`}>
                          {group.last_date_profit_loss >= 0 ? '+' : ''}{formatCurrency(group.last_date_profit_loss)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No transactions</span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-slate-600">
                    <span className="font-semibold text-slate-500 mr-1">Weekly P&L:</span>
                    <span className={`font-bold ${
                      group.weekly_profit_loss >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {group.weekly_profit_loss >= 0 ? '+' : ''}{formatCurrency(group.weekly_profit_loss)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/cutting?groupId=${group.id}`);
                }}
                className="p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-200 cursor-pointer inline-flex"
                title="Group Cutting Chart"
              >
                <Scissors className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(group);
                }}
                className="p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-all duration-200 cursor-pointer inline-flex"
                title="Edit Group"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDelete(group);
                }}
                className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 cursor-pointer inline-flex"
                title="Delete Group"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredGroupsList.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
            No groups match the search and filter criteria.
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} title="Create Group">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Group Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            label="Assign Manager (Optional)"
            placeholder="Select a manager user"
            options={availableManagers}
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Commission (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
            <Input
              label="MP Adjustment (₹)"
              type="number"
              step="0.01"
              value={mp}
              onChange={(e) => setMp(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={handleCloseAdd}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createGroupMutation.isPending}>
              Create Group
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} title="Edit Group">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Group Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            label="Reassign Manager (Optional)"
            placeholder="Select a manager user"
            options={availableManagers}
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Commission (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
            <Input
              label="MP Adjustment (₹)"
              type="number"
              step="0.01"
              value={mp}
              onChange={(e) => setMp(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateGroupMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Group">
        <div className="space-y-4">
          <div className="flex items-start space-x-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Are you absolutely sure?</p>
              <p className="mt-1">
                Deleting this group will delete all transaction entries associated with it. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleteGroupMutation.isPending}
              onClick={() => selectedGroup && deleteGroupMutation.mutate(selectedGroup.id)}
            >
              Delete Group
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
export default GroupsListPage;
