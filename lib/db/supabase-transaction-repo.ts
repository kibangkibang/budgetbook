import type { Transaction, TransactionFilter } from '@/types/transaction';
import type { TransactionRepository } from './types';
import { getSupabaseClient } from './supabase';

type TransactionRow = {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category_id: string;
  date: string;
  memo: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
};

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    categoryId: row.category_id,
    date: row.date,
    memo: row.memo ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseTransactionRepository implements TransactionRepository {
  private get db() {
    return getSupabaseClient();
  }

  async list(userId: string, filter: TransactionFilter = {}): Promise<Transaction[]> {
    let query = this.db.from('transactions').select('*').eq('user_id', userId);

    if (filter.type) query = query.eq('type', filter.type);
    if (filter.categoryId) query = query.eq('category_id', filter.categoryId);
    if (filter.from) query = query.gte('date', filter.from);
    if (filter.to) query = query.lte('date', filter.to);
    if (filter.month) query = query.like('date', `${filter.month}%`);

    query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data as TransactionRow[]).map(rowToTransaction);
  }

  async get(id: string): Promise<Transaction | null> {
    const { data, error } = await this.db
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return rowToTransaction(data as TransactionRow);
  }

  async create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const { data: row, error } = await this.db
      .from('transactions')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        user_id: data.userId,
        type: data.type,
        amount: data.amount,
        category_id: data.categoryId,
        date: data.date,
        memo: data.memo ?? null,
        payment_method: data.paymentMethod ?? null,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return rowToTransaction(row as TransactionRow);
  }

  async update(
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Transaction> {
    const updates: Partial<Record<string, unknown>> = {};
    if (data.type !== undefined) updates.type = data.type;
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.categoryId !== undefined) updates.category_id = data.categoryId;
    if (data.date !== undefined) updates.date = data.date;
    if (data.memo !== undefined) updates.memo = data.memo ?? null;
    if (data.paymentMethod !== undefined) updates.payment_method = data.paymentMethod ?? null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (this.db.from('transactions') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToTransaction(row as TransactionRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('transactions').delete().eq('id', id);
    if (error) throw error;
  }
}
