export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  memo?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilter {
  type?: TransactionType;
  categoryId?: string;
  from?: string;
  to?: string;
  month?: string;
}
