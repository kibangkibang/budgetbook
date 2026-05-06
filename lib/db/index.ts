import { SupabaseUserRepository } from './supabase-user-repo';
import { SupabaseCategoryRepository } from './supabase-category-repo';
import { SupabaseTransactionRepository } from './supabase-transaction-repo';
import { JsonUserRepository } from './user-repo';
import { JsonCategoryRepository } from './category-repo';
import { JsonTransactionRepository } from './transaction-repo';
import type { Repositories } from './types';

export * from './types';
export { JsonStore, getDataDir } from './json-store';
export { JsonUserRepository } from './user-repo';
export { JsonCategoryRepository } from './category-repo';
export { JsonTransactionRepository } from './transaction-repo';

let repositories: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!repositories) {
    repositories = {
      users: new SupabaseUserRepository(),
      categories: new SupabaseCategoryRepository(),
      transactions: new SupabaseTransactionRepository(),
    };
  }
  return repositories;
}

export function createRepositories(dataDir: string): Repositories {
  return {
    users: new JsonUserRepository(dataDir),
    categories: new JsonCategoryRepository(dataDir),
    transactions: new JsonTransactionRepository(dataDir),
  };
}
