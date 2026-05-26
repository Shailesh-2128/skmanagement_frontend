import api from './axios';
import { Transaction, TransactionCreateInput } from '../types/transaction.types';

export const transactionsApi = {
  list: async (params?: {
    date?: string;
    start_date?: string;
    end_date?: string;
    type?: 'SALE' | 'WIN';
    page?: number;
  }): Promise<any> => {
    const response = await api.get('/transactions/', { params });
    return response.data;
  },
  retrieve: async (id: number): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/${id}/`);
    return response.data;
  },
  create: async (data: TransactionCreateInput): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<TransactionCreateInput>): Promise<Transaction> => {
    const response = await api.patch<Transaction>(`/transactions/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}/`);
  },
};
export default transactionsApi;
