import type { User } from '@/types/user';
import type { UserRepository } from './types';
import { getSupabaseClient } from './supabase';

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  initial_balance: number;
  created_at: string;
};

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    initialBalance: row.initial_balance,
    createdAt: row.created_at,
  };
}

export class SupabaseUserRepository implements UserRepository {
  private get db() {
    return getSupabaseClient();
  }

  async list(): Promise<User[]> {
    const { data, error } = await this.db.from('users').select('*');
    if (error) throw error;
    return (data as UserRow[]).map(rowToUser);
  }

  async get(id: string): Promise<User | null> {
    const { data, error } = await this.db.from('users').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return rowToUser(data as UserRow);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.db
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return rowToUser(data as UserRow);
  }

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data: row, error } = await this.db
      .from('users')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        email: data.email.trim().toLowerCase(),
        password_hash: data.passwordHash,
        name: data.name,
        initial_balance: data.initialBalance ?? 0,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return rowToUser(row as UserRow);
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    const updates: Partial<Record<string, unknown>> = {};
    if (data.email !== undefined) updates.email = data.email.trim().toLowerCase();
    if (data.passwordHash !== undefined) updates.password_hash = data.passwordHash;
    if (data.name !== undefined) updates.name = data.name;
    if (data.initialBalance !== undefined) updates.initial_balance = data.initialBalance;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (this.db.from('users') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToUser(row as UserRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('users').delete().eq('id', id);
    if (error) throw error;
  }
}
