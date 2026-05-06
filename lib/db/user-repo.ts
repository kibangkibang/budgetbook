import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/types/user';
import { JsonStore } from './json-store';
import type { UserRepository } from './types';

export class JsonUserRepository implements UserRepository {
  private readonly store: JsonStore<User>;

  constructor(dataDir?: string) {
    this.store = new JsonStore<User>('users.json', dataDir);
  }

  async list(): Promise<User[]> {
    return this.store.list();
  }

  async get(id: string): Promise<User | null> {
    return this.store.get(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const all = await this.store.list();
    return all.find((u) => u.email.toLowerCase() === normalized) ?? null;
  }

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      initialBalance: 0,
      ...data,
      email: data.email.trim().toLowerCase(),
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    return this.store.mutate((records) => {
      const duplicate = Object.values(records).some(
        (u) => u.email.toLowerCase() === user.email,
      );
      if (duplicate) {
        throw new Error(`User with email ${user.email} already exists`);
      }
      records[user.id] = user;
      return user;
    });
  }

  async update(
    id: string,
    data: Partial<Omit<User, 'id' | 'createdAt'>>,
  ): Promise<User> {
    return this.store.mutate((records) => {
      const existing = records[id];
      if (!existing) throw new Error(`User ${id} not found`);
      const updated: User = {
        ...existing,
        ...data,
        email: data.email ? data.email.trim().toLowerCase() : existing.email,
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
