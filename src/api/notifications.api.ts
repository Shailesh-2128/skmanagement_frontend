import api from './axios';

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  notification_type: 'DAILY_PDF' | 'OVERLIMIT';
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  listNotifications: async (): Promise<NotificationData[]> => {
    const response = await api.get<NotificationData[]>('/notifications/');
    return response.data;
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await api.get<{ unread_count: number }>('/notifications/unread-count/');
    return response.data;
  },

  markAllRead: async (): Promise<{ status: string }> => {
    const response = await api.post<{ status: string }>('/notifications/mark-all-read/');
    return response.data;
  },

  markRead: async (id: number): Promise<NotificationData> => {
    const response = await api.post<NotificationData>(`/notifications/${id}/mark-read/`);
    return response.data;
  }
};

export default notificationsApi;
