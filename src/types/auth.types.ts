export interface User {
  id: number;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'CUTTING' | 'SAAS_OWNER' | 'ACCOUNTANT';
  group: number | null;
  group_name: string | null;
  accountant_groups: number[];
  accountant_group_names: { id: number; name: string }[];
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
  email?: string;
  phone_number?: string;
  billing_type: 'COMMISSION' | 'MONTHLY' | 'CUTTING_COMMISSION' | 'BOTH_COMMISSION';
  monthly_amount: number;
  commission_rate: number;
  cutting_commission_rate: number;
  total_sales: number;
  calculated_revenue: number;
  calculated_sales_revenue: number;
  calculated_cutting_revenue: number;
  sales_today: number;
  sales_this_week: number;
  sales_this_month: number;
  revenue_today: number;
  revenue_this_week: number;
  revenue_this_month: number;
  total_cutting: number;
  cutting_today: number;
  cutting_this_week: number;
  cutting_this_month: number;
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

export interface ActivityLog {
  id: number;
  tenant: number;
  tenant_name: string;
  username: string;
  user_role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  details: string;
  timestamp: string;
}
