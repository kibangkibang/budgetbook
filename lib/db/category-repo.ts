import { v4 as uuidv4 } from 'uuid';
import type { Category } from '@/types/category';
import { JsonStore } from './json-store';
import type { CategoryRepository } from './types';

export class JsonCategoryRepository implements CategoryRepository {
  private readonly store: JsonStore<Category>;

  constructor(dataDir?: string) {
    this.store = new JsonStore<Category>('categories.json', dataDir);
  }

  async list(userId: string): Promise<Category[]> {
    const all = await this.store.list();
    return all.filter((c) => c.userId === userId);
  }

  async get(id: string): Promise<Category | null> {
    return this.store.get(id);
  }

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const category: Category = { ...data, id: uuidv4() };
    return this.store.mutate((records) => {
      records[category.id] = category;
      return category;
    });
  }

  async update(
    id: string,
    data: Partial<Omit<Category, 'id' | 'userId'>>,
  ): Promise<Category> {
    return this.store.mutate((records) => {
      const existing = records[id];
      if (!existing) throw new Error(`Category ${id} not found`);
      const updated: Category = { ...existing, ...data };
      records[id] = updated;
      return updated;
    });
  }

  async delete(id: string): Promise<void> {
    await this.store.mutate((records) => {
      delete records[id];
    });
  }
}
