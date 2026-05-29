import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import usersApi, { UserCreateInput } from '../../../api/users.api';
import groupsApi from '../../../api/groups.api';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import { Plus, Edit2, Trash2, Shield, UserCheck, Calculator, ChevronDown, Check } from 'lucide-react';

import Loader from '../../../components/ui/Loader';

// Multi-group select component for accountants
const MultiGroupSelect: React.FC<{
  groups: { id: number; name: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  label?: string;
}> = ({ groups, selectedIds, onChange, label = 'Assigned Groups' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedNames = groups.filter(g => selectedIds.includes(g.id)).map(g => g.name);

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:border-slate-300"
      >
        <span className={selectedNames.length === 0 ? 'text-slate-400' : 'text-slate-700 font-medium'}>
          {selectedNames.length === 0
            ? 'Select groups...'
            : selectedNames.length === 1
            ? selectedNames[0]
            : `${selectedNames.length} groups selected`}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {groups.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-400 italic">No groups available.</p>
          ) : (
            groups.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle(g.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  selectedIds.includes(g.id)
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedIds.includes(g.id) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className={selectedIds.includes(g.id) ? 'font-semibold text-blue-700' : ''}>{g.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form Fields State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'SUPER_ADMIN' | 'MANAGER' | 'CUTTING' | 'ACCOUNTANT'>('MANAGER');
  const [groupId, setGroupId] = useState<string>('');
  const [accountantGroupIds, setAccountantGroupIds] = useState<number[]>([]);
  const [formError, setFormError] = useState('');

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: () => usersApi.list(),
  });

  // Fetch all groups (for assigning manager to a group)
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groupsList'],
    queryFn: () => groupsApi.list(),
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: UserCreateInput) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['groupsList'] });
      handleCloseAdd();
    },
    onError: (err: any) => {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to create user.';
      setFormError(detail);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: { id: number; body: Partial<UserCreateInput> }) => usersApi.update(data.id, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['groupsList'] });
      handleCloseEdit();
    },
    onError: (err: any) => {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update user.';
      setFormError(detail);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['groupsList'] });
      setIsDeleteOpen(false);
      setSelectedUser(null);
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.detail || 'Failed to delete user.';
      setFormError(errMsg);
    },
  });

  // Open Handlers
  const handleOpenAdd = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('MANAGER');
    setGroupId('');
    setAccountantGroupIds([]);
    setFormError('');
    setIsAddOpen(true);
  };
  const handleCloseAdd = () => setIsAddOpen(false);

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword(''); // Leave password blank on edit unless updating
    setRole(user.role);
    setGroupId(user.group ? user.group.toString() : '');
    setAccountantGroupIds(user.accountant_groups || []);
    setFormError('');
    setIsEditOpen(true);
  };
  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedUser(null);
  };

  const handleOpenDelete = (user: any) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  // Submit Handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!username.trim() || !email.trim() || !password.trim()) {
      setFormError('Username, email, and password are required.');
      return;
    }

    if (role === 'MANAGER' && !groupId) {
      setFormError('Please select an assigned group for this Group Manager.');
      return;
    }

    const payload: UserCreateInput = {
      username: username.trim(),
      email: email.trim(),
      password,
      role,
      group: role === 'MANAGER' && groupId ? parseInt(groupId) : null,
      accountant_groups: role === 'ACCOUNTANT' ? accountantGroupIds : [],
    };

    createUserMutation.mutate(payload);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!username.trim() || !email.trim()) {
      setFormError('Username and email are required.');
      return;
    }

    if (role === 'MANAGER' && !groupId) {
      setFormError('Please select an assigned group for this Group Manager.');
      return;
    }

    const payload: Partial<UserCreateInput> = {
      username: username.trim(),
      email: email.trim(),
      role,
      group: role === 'MANAGER' && groupId ? parseInt(groupId) : null,
      accountant_groups: role === 'ACCOUNTANT' ? accountantGroupIds : [],
    };

    if (password.trim()) {
      payload.password = password;
    }

    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, body: payload });
    }
  };

  const isLoading = usersLoading || groupsLoading;

  if (isLoading) {
    return <Loader />;
  }

  const groupOptions = groups?.map((g) => ({ value: g.id, label: g.name })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-500 mt-1">Configure credentials, roles, and group permissions.</p>
        </div>
        <Button onClick={handleOpenAdd} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Assigned Group(s)</th>
                <th className="px-6 py-4">Date Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-800 flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                      {u.username.charAt(0)}
                    </div>
                    <span>{u.username}</span>
                  </td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-blue-50 text-blue-600'
                          : u.role === 'CUTTING'
                          ? 'bg-amber-50 text-amber-600'
                          : u.role === 'ACCOUNTANT'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {u.role === 'SUPER_ADMIN' ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          <span>Super Admin</span>
                        </>
                      ) : u.role === 'CUTTING' ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          <span>Cutting Operator</span>
                        </>
                      ) : u.role === 'ACCOUNTANT' ? (
                        <>
                          <Calculator className="h-3 w-3 mr-1" />
                          <span>Accountant</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          <span>Manager</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.role === 'SUPER_ADMIN' || u.role === 'CUTTING' ? (
                      <span className="text-slate-400 italic">Global Access</span>
                    ) : u.role === 'ACCOUNTANT' ? (
                      u.accountant_group_names && u.accountant_group_names.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.accountant_group_names.map((g: { id: number; name: string }) => (
                            <span key={g.id} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-semibold">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-amber-500 italic font-medium">No groups assigned</span>
                      )
                    ) : u.group_name ? (
                      <span className="font-semibold text-slate-700">{u.group_name}</span>
                    ) : (
                      <span className="text-amber-500 italic font-medium">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg cursor-pointer inline-flex transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(u)}
                      className="p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg cursor-pointer inline-flex transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No user accounts configured. Click 'Add User' to register one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} title="Create User Account">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-semibold overflow-auto max-h-32">
              {formError}
            </div>
          )}

          <Input
            label="Username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Select
            label="System Role"
            options={[
              { value: 'SUPER_ADMIN', label: 'Super Admin' },
              { value: 'MANAGER', label: 'Group Manager' },
              { value: 'CUTTING', label: 'Cutting Operator' },
              { value: 'ACCOUNTANT', label: 'Accountant' },
            ]}
            value={role}
            onChange={(e) => {
              const r = e.target.value as 'SUPER_ADMIN' | 'MANAGER' | 'CUTTING' | 'ACCOUNTANT';
              setRole(r);
              if (r === 'SUPER_ADMIN' || r === 'CUTTING') {
                setGroupId('');
                setAccountantGroupIds([]);
              }
              if (r === 'ACCOUNTANT') setGroupId('');
            }}
          />

          {role === 'MANAGER' && (
            <Select
              label="Assigned Group"
              required
              placeholder="Select associated group"
              options={groupOptions}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            />
          )}

          {role === 'ACCOUNTANT' && (
            <MultiGroupSelect
              groups={groups || []}
              selectedIds={accountantGroupIds}
              onChange={setAccountantGroupIds}
              label="Assigned Groups (can handle multiple)"
            />
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={handleCloseAdd}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createUserMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} title="Edit User Account">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-semibold overflow-auto max-h-32">
              {formError}
            </div>
          )}

          <Input
            label="Username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password (Optional)"
            type="password"
            placeholder="Leave blank to keep current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Select
            label="System Role"
            options={[
              { value: 'SUPER_ADMIN', label: 'Super Admin' },
              { value: 'MANAGER', label: 'Group Manager' },
              { value: 'CUTTING', label: 'Cutting Operator' },
              { value: 'ACCOUNTANT', label: 'Accountant' },
            ]}
            value={role}
            onChange={(e) => {
              const r = e.target.value as 'SUPER_ADMIN' | 'MANAGER' | 'CUTTING' | 'ACCOUNTANT';
              setRole(r);
              if (r === 'SUPER_ADMIN' || r === 'CUTTING') {
                setGroupId('');
                setAccountantGroupIds([]);
              }
              if (r === 'ACCOUNTANT') setGroupId('');
            }}
          />

          {role === 'MANAGER' && (
            <Select
              label="Assigned Group"
              required
              placeholder="Select associated group"
              options={groupOptions}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            />
          )}

          {role === 'ACCOUNTANT' && (
            <MultiGroupSelect
              groups={groups || []}
              selectedIds={accountantGroupIds}
              onChange={setAccountantGroupIds}
              label="Assigned Groups (can handle multiple)"
            />
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateUserMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete User Account">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete user account <b>{selectedUser?.username}</b>? This action cannot be undone.
          </p>
          {formError && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-semibold">
              {formError}
            </div>
          )}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleteUserMutation.isPending}
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default UsersPage;
