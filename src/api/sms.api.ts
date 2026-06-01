import api from './axios';

export interface SMSSettingsData {
  alert_phone: string;
  is_enabled: boolean;
  daily_report_enabled?: boolean;
  daily_report_time?: string;
  in_app_notifications_enabled?: boolean;
  daily_report_group?: number | null;
  updated_at?: string;
}




export interface SMSTestResponse {
  success: boolean;
  raw_response?: string;
  error?: string;
  [key: string]: any;
}

export const smsApi = {
  getSettings: async (): Promise<SMSSettingsData> => {
    const response = await api.get<SMSSettingsData>('/sms/setting/');
    return response.data;
  },

  updateSettings: async (data: Partial<SMSSettingsData>): Promise<SMSSettingsData> => {
    const response = await api.post<SMSSettingsData>('/sms/setting/', data);
    return response.data;
  },

  sendTestSMS: async (phone: string, message: string): Promise<SMSTestResponse> => {
    const response = await api.post<SMSTestResponse>('/sms/send-test/', { phone, message });
    return response.data;
  }
};

export default smsApi;
