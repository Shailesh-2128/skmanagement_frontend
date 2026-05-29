export interface AccountantCalculationEntry {
  sale: number;
  win: number;
}

export interface AccountantCalculation {
  id: number;
  tenant: number | null;
  group: number;
  group_name: string;
  calculation_date: string;
  entries: AccountantCalculationEntry[];
  total_sale: string;
  total_win: string;
  commission_rate: string;
  commission_amount: string;
  mp_amount: string | null;
  spending: string | null;
  custom_field_name: string | null;
  custom_field_value: string | null;
  net_profit_loss: string;
  created_by: number | null;
  created_by_username: string;
  created_at: string;
}

export interface AccountantCalculationCreateInput {
  group: number;
  calculation_date: string;
  entries: AccountantCalculationEntry[];
  total_sale: number;
  total_win: number;
  commission_rate: number;
  commission_amount: number;
  mp_amount: number | null;
  spending: number | null;
  custom_field_name: string | null;
  custom_field_value: number | null;
  net_profit_loss: number;
}
