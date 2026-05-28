export interface User {
  id: number;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'CUTTING' | 'SAAS_OWNER';
  group: number | null;
  group_name: string | null;
  tenant: number | null;
  tenant_name: string | null;
  tenant_days_remaining?: number | null;
  theme?: 'light' | 'dark' | 'sepia' | 'slate-blue';
  font_family?: 'Inter' | 'Roboto' | 'Poppins' | 'Georgia' | 'Fira Code';
  font_size?: 'small' | 'normal' | 'large';
  font_weight?: 'regular' | 'medium' | 'bold';
  accent_color?: 'blue' | 'purple' | 'emerald' | 'rose' | 'orange';
  created_at: string;
}

export interface SaasTenant {
  id: number;
  name: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  days_remaining: number;
  users_count: number;
  groups_count: number;
  charts_count: number;
  transactions_count: number;
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
