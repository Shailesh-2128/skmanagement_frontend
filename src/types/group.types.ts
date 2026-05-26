export interface Group {
  id: number;
  name: string;
  description: string | null;
  commission: number;
  mp: number;
  created_at: string;
  manager: {
    id: number;
    username: string;
    email: string;
  } | null;
}

export interface GroupCreateInput {
  name: string;
  description?: string;
  commission?: number;
  mp?: number;
}
