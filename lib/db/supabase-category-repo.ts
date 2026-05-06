import type { Category } from '@/types/category';
import type { CategoryRepository } from './types';
import { getSupabaseClient } from './supabase';

type CategoryRow = {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  is_default: boolean;
};

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
    isDefault: row.is_default,
  };
}

export class SupabaseCategoryRepository implements CategoryRepository {
  private get db() {
    return getSupabaseClient();
  }

  async list(userId: string): Promise<Category[]> {
    const { data, error } = await this.db
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data as CategoryRow[]).map(rowToCategory);
  }

  async get(id: string): Promise<Category | null> {
    const { data, error } = await this.db
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return rowToCategory(data as CategoryRow);
  }

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const { data: row, error } = await this.db
      .from('categories')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        user_id: data.userId,
        name: data.name,
        type: data.type,
        icon: data.icon ?? null,
        color: data.color ?? null,
        is_default: data.isDefault,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return rowToCategory(row as CategoryRow);
  }

  async update(id: string, data: Partial<Omit<Category, 'id' | 'userId'>>): Promise<Category> {
    const updates: Partial<Record<string, unknown>> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.type !== undefined) updates.type = data.type;
    if (data.icon !== undefined) updates.icon = data.icon ?? null;
    if (data.color !== undefined) updates.color = data.color ?? null;
    if (data.isDefault !== undefined) updates.is_default = data.isDefault;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (this.db.from('categories') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToCategory(row as CategoryRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('categories').delete().eq('id', id);
    if (error) throw error;
  }
}
