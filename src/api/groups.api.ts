import api from './axios';
import { Group, GroupCreateInput } from '../types/group.types';

export const groupsApi = {
  list: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/groups/');
    return response.data;
  },
  retrieve: async (id: number): Promise<Group> => {
    const response = await api.get<Group>(`/groups/${id}/`);
    return response.data;
  },
  create: async (data: GroupCreateInput): Promise<Group> => {
    const response = await api.post<Group>('/groups/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<GroupCreateInput>): Promise<Group> => {
    const response = await api.patch<Group>(`/groups/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/groups/${id}/`);
  },
};
export default groupsApi;
