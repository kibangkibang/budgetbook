import type { Category } from '@/types/category';
import type { CategoryRepository } from './types';

export const DEFAULT_CATEGORIES: ReadonlyArray<Omit<Category, 'id' | 'userId'>> = [
  { name: '식비', type: 'expense', color: '#ef4444', isDefault: true },
  { name: '교통', type: 'expense', color: '#f97316', isDefault: true },
  { name: '쇼핑', type: 'expense', color: '#ec4899', isDefault: true },
  { name: '주거', type: 'expense', color: '#8b5cf6', isDefault: true },
  { name: '여가', type: 'expense', color: '#3b82f6', isDefault: true },
  { name: '의료', type: 'expense', color: '#10b981', isDefault: true },
  { name: '기타 지출', type: 'expense', color: '#6b7280', isDefault: true },
  { name: '월급', type: 'income', color: '#22c55e', isDefault: true },
  { name: '부수입', type: 'income', color: '#14b8a6', isDefault: true },
  { name: '기타 수입', type: 'income', color: '#6b7280', isDefault: true },
];

export async function seedDefaultCategories(
  userId: string,
  categories: CategoryRepository,
): Promise<void> {
  for (const c of DEFAULT_CATEGORIES) {
    await categories.create({ ...c, userId });
  }
}
