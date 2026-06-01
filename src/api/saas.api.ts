import api from './axios';
import { SaasTenant, ActivityLog } from '../types/auth.types';

export interface SaasTenantCreateInput {
  name: string;
  username: string;
  password?: string;
  active_days: number;
  email?: string;
  phone_number?: string;
  billing_type?: 'COMMISSION' | 'MONTHLY' | 'CUTTING_COMMISSION' | 'BOTH_COMMISSION';
  monthly_amount?: number;
  commission_rate?: number;
  cutting_commission_rate?: number;
}

export interface SaasEmailSettings {
  id?: number;
  smtp_host: string;
  smtp_port: number;
  smtp_user?: string;
  smtp_password?: string;
  use_tls: boolean;
  sender_email?: string;
}

export const saasApi = {
  list: async (date?: string): Promise<SaasTenant[]> => {
    const url = date ? `/saas-tenants/?date=${date}` : '/saas-tenants/';
    const response = await api.get<SaasTenant[]>(url);
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
  getEmailSettings: async (): Promise<SaasEmailSettings> => {
    const response = await api.get<SaasEmailSettings>('/saas/email-setting/');
    return response.data;
  },
  updateEmailSettings: async (data: Partial<SaasEmailSettings>): Promise<SaasEmailSettings> => {
    const response = await api.post<SaasEmailSettings>('/saas/email-setting/', data);
    return response.data;
  },
  getActivityLogs: async (): Promise<ActivityLog[]> => {
    const response = await api.get<ActivityLog[]>('/saas-activity-logs/');
    return response.data;
  },
};
export default saasApi;

