import api from './axios';
import { User } from '../types/auth.types';

export interface UserCreateInput {
  username: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'MANAGER';
  group?: number | null;
}

export const usersApi = {
  list: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/');
    return response.data;
  },
  create: async (data: UserCreateInput): Promise<User> => {
    const response = await api.post<User>('/users/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<UserCreateInput>): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}/`);
  },
};
export default usersApi;
