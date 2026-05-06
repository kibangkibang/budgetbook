'use client';

import { useMemo, useState } from 'react';
import type { Category } from '@/types/category';
import type { Transaction, TransactionType } from '@/types/transaction';
import { todayYmd } from '@/lib/utils/format';
import type { TransactionCreateInput } from '@/lib/validation/transaction';

interface Props {
  categories: Category[];
  initial?: Partial<Transaction>;
  submitLabel?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (data: TransactionCreateInput) => void;
  onCancel?: () => void;
}

export function TransactionForm({
  categories,
  initial,
  submitLabel = '저장',
  submitting = false,
  errorMessage,
  onSubmit,
  onCancel,
}: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState<string>(
    initial?.amount ? String(initial.amount) : '',
  );
  const [date, setDate] = useState<string>(initial?.date ?? todayYmd());
  const [memo, setMemo] = useState<string>(initial?.memo ?? '');
  const [paymentMethod, setPaymentMethod] = useState<string>(initial?.paymentMethod ?? '');

  const typeCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const [categoryId, setCategoryId] = useState<string>(() => {
    if (initial?.categoryId && categories.some((c) => c.id === initial.categoryId)) {
      return initial.categoryId;
    }
    return typeCategories[0]?.id ?? '';
  });

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const first = categories.find((c) => c.type === newType);
    setCategoryId(first?.id ?? '');
  };

  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
      setLocalError('금액은 0보다 큰 정수여야 합니다');
      return;
    }
    if (!categoryId) {
      setLocalError('카테고리를 선택해주세요');
      return;
    }
    onSubmit({
      type,
      amount: parsed,
      categoryId,
      date,
      memo: memo.trim() || undefined,
      paymentMethod: paymentMethod.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="inline-flex rounded-md border border-gray-200 p-1">
        <TypeButton active={type === 'expense'} onClick={() => handleTypeChange('expense')}>
          지출
        </TypeButton>
        <TypeButton active={type === 'income'} onClick={() => handleTypeChange('income')}>
          수입
        </TypeButton>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="금액">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="0"
          />
        </Field>
        <Field label="날짜">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="카테고리">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {typeCategories.length === 0 && <option value="">카테고리 없음</option>}
            {typeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="결제수단 (선택)">
          <input
            type="text"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="예: 현금, 카드"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="메모 (선택)">
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="간단한 설명"
        />
      </Field>

      {(localError || errorMessage) && (
        <p className="text-sm text-red-600">{localError ?? errorMessage}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? '저장 중...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function TypeButton({
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
      className={`rounded px-4 py-1 text-sm font-medium ${
        active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
