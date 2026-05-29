import api from './axios';
import { AccountantCalculation, AccountantCalculationCreateInput } from '../types/accountant.types';

export const accountantApi = {
  list: async (params?: { group_id?: number; start_date?: string; end_date?: string }): Promise<AccountantCalculation[]> => {
    const response = await api.get<AccountantCalculation[]>('/accountant-calculations/', { params });
    return response.data;
  },
  retrieve: async (id: number): Promise<AccountantCalculation> => {
    const response = await api.get<AccountantCalculation>(`/accountant-calculations/${id}/`);
    return response.data;
  },
  create: async (data: AccountantCalculationCreateInput): Promise<AccountantCalculation> => {
    const response = await api.post<AccountantCalculation>('/accountant-calculations/', data);
    return response.data;
  },
  update: async (id: number, data: AccountantCalculationCreateInput): Promise<AccountantCalculation> => {
    const response = await api.put<AccountantCalculation>(`/accountant-calculations/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/accountant-calculations/${id}/`);
  },
};
export default accountantApi;
