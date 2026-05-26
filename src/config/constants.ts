export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MANAGER: 'MANAGER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const TRANSACTION_TYPES = {
  SALE: 'SALE',
  WIN: 'WIN',
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'storepulse_access_token',
  REFRESH_TOKEN: 'storepulse_refresh_token',
  USER: 'storepulse_user',
} as const;
