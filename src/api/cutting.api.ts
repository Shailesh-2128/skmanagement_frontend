import api from './axios';

export interface CuttingChartData {
  id: number;
  name: string;
  group: number | null;
  chart_date: string;
  chart_type: string;
  session_name: string;
  created_by: number;
  created_by_username: string;
  limit: number;
  green_limit: number;
  yellow_limit: number;
  amounts: Record<string, number>;
  created_at: string;
  logs: CuttingLogData[];
}

export interface CuttingLogData {
  id: number;
  chart: number;
  chart_name?: string;
  chart_type?: string;
  user: number;
  user_username: string;
  number: string;
  amount: number;
  type: 'ADD' | 'SUBTRACT' | 'SET';
  timestamp: string;
  is_family: boolean;
  affected_numbers: string[];
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const cuttingApi = {
  listCharts: async (): Promise<CuttingChartData[]> => {
    const response = await api.get<PaginatedResponse<CuttingChartData>>('/cutting/charts/');
    // Handle both paginated { results: [...] } and plain array responses
    const data = response.data as any;
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  getOrCreateChart: async (groupId: number | string, date: string, chartType: string = 'panna', sessionName: string = 'Open', name?: string): Promise<CuttingChartData> => {
    const response = await api.post<CuttingChartData>('/cutting/charts/get-or-create/', {
      group_id: groupId,
      date: date,
      chart_type: chartType,
      session_name: sessionName,
      name: name
    });
    return response.data;
  },

  getAllTypes: async (groupId: number | string, date: string, sessionName: string = 'Open', name?: string): Promise<CuttingChartData[]> => {
    const response = await api.get<CuttingChartData[]>('/cutting/charts/all-types/', {
      params: {
        group_id: groupId,
        date: date,
        session_name: sessionName,
        name: name
      }
    });
    return response.data;
  },

  listNames: async (groupId: number | string, date: string): Promise<string[]> => {
    const response = await api.get<string[]>('/cutting/charts/list-names/', {
      params: {
        group_id: groupId,
        date: date
      }
    });
    return response.data;
  },

  createChart: async (data: { name: string }): Promise<CuttingChartData> => {
    const response = await api.post<CuttingChartData>('/cutting/charts/', data);
    return response.data;
  },

  updateChart: async (id: number, data: { name?: string; limit?: number; green_limit?: number; yellow_limit?: number }): Promise<CuttingChartData> => {
    const response = await api.patch<CuttingChartData>(`/cutting/charts/${id}/`, data);
    return response.data;
  },

  bulkUpdateLimit: async (
    groupId: number | string, 
    date: string, 
    sessionName: string, 
    limit: number,
    greenLimit?: number,
    yellowLimit?: number
  ): Promise<{ detail: string; limit: number }> => {
    const response = await api.post<{ detail: string; limit: number }>('/cutting/charts/bulk-limit/', {
      group_id: groupId,
      date: date,
      session_name: sessionName,
      limit: limit,
      green_limit: greenLimit,
      yellow_limit: yellowLimit
    });
    return response.data;
  },

  deleteChart: async (id: number): Promise<void> => {
    await api.delete(`/cutting/charts/${id}/`);
  },

  logEntry: async (
    id: number, 
    data: { 
      number: string; 
      amount: number; 
      type: 'ADD' | 'SUBTRACT' | 'SET'; 
      is_family: boolean; 
      affected_numbers: string[] 
    }
  ): Promise<{ chart: CuttingChartData; log: CuttingLogData }> => {
    const response = await api.post<{ chart: CuttingChartData; log: CuttingLogData }>(`/cutting/charts/${id}/log/`, data);
    return response.data;
  },

  resetChart: async (id: number): Promise<CuttingChartData> => {
    const response = await api.post<CuttingChartData>(`/cutting/charts/${id}/reset/`);
    return response.data;
  },

  deleteLog: async (logId: number): Promise<void> => {
    await api.delete(`/cutting/logs/${logId}/`);
  },

  listLogs: async (chartId?: number): Promise<CuttingLogData[]> => {
    const params = chartId ? { chart_id: chartId } : {};
    const response = await api.get<any>('/cutting/logs/', { params });
    return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
  }
};

export default cuttingApi;
