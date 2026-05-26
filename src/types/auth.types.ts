export interface User {
  id: number;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER';
  group: number | null;
  group_name: string | null;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}
