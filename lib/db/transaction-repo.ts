import { v4 as uuidv4 } from 'uuid';
import type { Transaction, TransactionFilter } from '@/types/transaction';
import { JsonStore } from './json-store';
import type { TransactionRepository } from './types';

export class JsonTransactionRepository implements TransactionRepository {
  private readonly store: JsonStore<Transaction>;

  constructor(dataDir?: string) {
    this.store = new JsonStore<Transaction>('transactions.json', dataDir);
  }

  async list(userId: string, filter: TransactionFilter = {}): Promise<Transaction[]> {
    const all = await this.store.list();
    const { type, categoryId, from, to, month } = filter;

    const matchesMonth = (date: string) => {
      if (!month) return true;
      return date.startsWith(month);
    };

    return all
      .filter((t) => t.userId === userId)
      .filter((t) => (type ? t.type === type : true))
      .filter((t) => (categoryId ? t.categoryId === categoryId : true))
      .filter((t) => (from ? t.date >= from : true))
      .filter((t) => (to ? t.date <= to : true))
      .filter((t) => matchesMonth(t.date))
      .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
  }

  async get(id: string): Promise<Transaction | null> {
    return this.store.get(id);
  }

  async create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Transaction> {
    const now = new Date().toISOString();
    const tx: Transaction = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
    return this.store.mutate((records) => {
      records[tx.id] = tx;
      return tx;
    });
  }

  async update(
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Transaction> {
    return this.store.mutate((records) => {
      const existing = records[id];
      if (!existing) throw new Error(`Transaction ${id} not found`);
      const updated: Transaction = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
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
