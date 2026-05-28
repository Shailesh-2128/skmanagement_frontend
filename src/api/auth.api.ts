import api from './axios';
import { LoginCredentials, LoginResponse, User } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login/', credentials);
    return response.data;
  },
  refresh: async (refresh: string): Promise<{ access: string }> => {
    const response = await api.post<{ access: string }>('/auth/refresh/', { refresh });
    return response.data;
  },
  me: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me/');
    return response.data;
  },
  updateMe: async (data: Partial<User>): Promise<User> => {
    const response = await api.patch<User>('/auth/me/', data);
    return response.data;
  },
};
export default authApi;
