import type { User } from '@/types/user';
import type { Category } from '@/types/category';
import type { Transaction, TransactionFilter } from '@/types/transaction';

export interface UserRepository {
  list(): Promise<User[]>;
  get(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface CategoryRepository {
  list(userId: string): Promise<Category[]>;
  get(id: string): Promise<Category | null>;
  create(data: Omit<Category, 'id'>): Promise<Category>;
  update(id: string, data: Partial<Omit<Category, 'id' | 'userId'>>): Promise<Category>;
  delete(id: string): Promise<void>;
}

export interface TransactionRepository {
  list(userId: string, filter?: TransactionFilter): Promise<Transaction[]>;
  get(id: string): Promise<Transaction | null>;
  create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Transaction>;
  update(
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Transaction>;
  delete(id: string): Promise<void>;
}

export interface Repositories {
  users: UserRepository;
  categories: CategoryRepository;
  transactions: TransactionRepository;
}
