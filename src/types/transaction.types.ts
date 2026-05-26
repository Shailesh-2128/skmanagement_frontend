export interface Transaction {
  id: number;
  group: number;
  group_name: string;
  type: 'SALE' | 'WIN';
  amount: number | string;
  note: string | null;
  transaction_date: string;
  created_by: number;
  created_by_username: string;
  created_at: string;
}

export interface TransactionCreateInput {
  type: 'SALE' | 'WIN';
  amount: number;
  note?: string;
  transaction_date: string;
  group?: number;
}
