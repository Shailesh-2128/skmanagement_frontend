import api from './axios';

export interface SupportTicketData {
  id: number;
  tenant: number | null;
  tenant_name: string;
  user: number;
  username: string;
  title: string;
  description: string;
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
  updated_at: string;
}

export const supportApi = {
  listTickets: async (): Promise<SupportTicketData[]> => {
    const response = await api.get<SupportTicketData[]>('/support-tickets/');
    return response.data;
  },

  createTicket: async (data: { title: string; description: string }): Promise<SupportTicketData> => {
    const response = await api.post<SupportTicketData>('/support-tickets/', data);
    return response.data;
  },

  resolveTicket: async (id: number): Promise<SupportTicketData> => {
    const response = await api.patch<SupportTicketData>(`/support-tickets/${id}/`, {
      status: 'RESOLVED'
    });
    return response.data;
  }
};

export default supportApi;
