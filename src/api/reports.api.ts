import api from './axios';
import { DashboardStats, CustomReport, ReportFilterParams } from '../types/report.types';

export const reportsApi = {
  dashboard: async (params?: { group_id?: number }): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/reports/dashboard/', { params });
    return response.data;
  },
  custom: async (params?: ReportFilterParams): Promise<CustomReport> => {
    const response = await api.get<CustomReport>('/reports/custom/', { params });
    return response.data;
  },
  downloadPdf: async (params?: ReportFilterParams): Promise<Blob> => {
    const response = await api.get('/reports/pdf/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
  collab: async (params: {
    group_ids: string;
    percentage?: number;
    spending?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<any> => {
    const response = await api.get('/reports/collab/', { params });
    return response.data;
  },
  downloadCollabPdf: async (params: {
    group_ids: string;
    percentage?: number;
    spending?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<Blob> => {
    const response = await api.get('/reports/collab-pdf/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
export default reportsApi;
