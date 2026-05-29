import { User } from '../types/auth.types';

export const hasRole = (user: User | null, roles: Array<'SUPER_ADMIN' | 'MANAGER' | 'CUTTING' | 'SAAS_OWNER' | 'ACCOUNTANT'>): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

export const canManageGroup = (user: User | null, groupId: number): boolean => {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return user.role === 'MANAGER' && user.group === groupId;
};
