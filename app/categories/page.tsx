'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import type { Category, CategoryType } from '@/types/category';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/lib/hooks/useCategories';

const DEFAULT_NEW_COLOR = '#3b82f6';

export default function CategoriesPage() {
  const [tab, setTab] = useState<CategoryType>('expense');
  const { data: categories = [], isLoading, error } = useCategories();

  const filtered = useMemo(
    () => categories.filter((c) => c.type === tab),
    [categories, tab],
  );

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-57px)] bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">카테고리 관리</h1>
            <p className="text-sm text-gray-500">수입/지출 카테고리를 추가·수정·삭제합니다.</p>
          </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <TabButton active={tab === 'expense'} onClick={() => setTab('expense')}>
            지출
          </TabButton>
          <TabButton active={tab === 'income'} onClick={() => setTab('income')}>
            수입
          </TabButton>
        </div>

        <CategoryForm type={tab} />

        {isLoading && <p className="text-sm text-gray-500">불러오는 중...</p>}
        {error && (
          <p className="text-sm text-red-600">
            오류: {error instanceof Error ? error.message : '알 수 없는 오류'}
          </p>
        )}

        <ul className="space-y-2">
          {filtered.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
          {!isLoading && filtered.length === 0 && (
            <li className="text-sm text-gray-500">카테고리가 없습니다. 위에서 추가해주세요.</li>
          )}
        </ul>
        </div>
      </main>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
        active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function CategoryForm({ type }: { type: CategoryType }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_NEW_COLOR);
  const createMutation = useCreateCategory();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), type, color },
      {
        onSuccess: () => {
          setName('');
          setColor(DEFAULT_NEW_COLOR);
        },
      },
    );
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-600">이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder={type === 'expense' ? '예: 식비' : '예: 월급'}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">색상</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="mt-1 h-10 w-14 rounded-md border border-gray-300"
        />
      </div>
      <button
        type="submit"
        disabled={createMutation.isPending}
        className="h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        추가
      </button>
    </form>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color ?? DEFAULT_NEW_COLOR);
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const onSave = () => {
    if (!name.trim()) return;
    updateMutation.mutate(
      { id: category.id, input: { name: name.trim(), color } },
      { onSuccess: () => setEditing(false) },
    );
  };

  const onDelete = () => {
    if (!confirm(`'${category.name}' 카테고리를 삭제할까요?`)) return;
    deleteMutation.mutate(category.id);
  };

  if (editing) {
    return (
      <li className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-10 rounded border border-gray-300"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button
          onClick={onSave}
          disabled={updateMutation.isPending}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          저장
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setName(category.name);
            setColor(category.color ?? DEFAULT_NEW_COLOR);
          }}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-200"
        >
          취소
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <span
        className="h-4 w-4 rounded-full border border-gray-200"
        style={{ backgroundColor: category.color ?? '#e5e7eb' }}
      />
      <span className="flex-1 text-sm font-medium text-gray-900">{category.name}</span>
      {category.isDefault && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">기본</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="rounded-md px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
      >
        수정
      </button>
      <button
        onClick={onDelete}
        disabled={deleteMutation.isPending}
        className="rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
      >
        삭제
      </button>
    </li>
  );
}
