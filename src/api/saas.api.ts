import api from './axios';
import { SaasTenant } from '../types/auth.types';

export interface SaasTenantCreateInput {
  name: string;
  username: string;
  password?: string;
  active_days: number;
  email?: string;
}

export const saasApi = {
  list: async (): Promise<SaasTenant[]> => {
    const response = await api.get<SaasTenant[]>('/saas-tenants/');
    return response.data;
  },
  create: async (data: SaasTenantCreateInput): Promise<SaasTenant> => {
    const response = await api.post<SaasTenant>('/saas-tenants/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<SaasTenant> & { active_days?: number }): Promise<SaasTenant> => {
    const response = await api.patch<SaasTenant>(`/saas-tenants/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/saas-tenants/${id}/`);
  },
};
export default saasApi;
