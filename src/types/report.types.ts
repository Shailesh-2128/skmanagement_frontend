import { Transaction } from './transaction.types';

export interface DashboardStats {
  group_name: string;
  today: {
    total_win: number | string;
    total_sale: number | string;
    net_profit_loss: number | string;
  };
  this_month: {
    total_win: number | string;
    total_sale: number | string;
    net_profit_loss: number | string;
  };
  all_time: {
    total_win: number | string;
    total_sale: number | string;
    net_profit_loss: number | string;
  };
}

export interface CustomReport {
  start_date: string | null;
  end_date: string | null;
  total_win: number | string;
  total_sale: number | string;
  net_profit_loss: number | string;
  transactions: Transaction[];
}

export interface ReportFilterParams {
  start_date?: string;
  end_date?: string;
  group_id?: number;
}
