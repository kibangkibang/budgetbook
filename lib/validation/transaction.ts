import { z } from 'zod';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다');

const monthString = z
  .string()
  .regex(/^\d{4}-\d{2}$/, '월은 YYYY-MM 형식이어야 합니다');

export const transactionCreateSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().int('금액은 정수여야 합니다').positive('금액은 0보다 커야 합니다'),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  date: dateString,
  memo: z.string().max(200).optional(),
  paymentMethod: z.string().max(30).optional(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

export const transactionFilterSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().optional(),
  month: monthString.optional(),
  from: dateString.optional(),
  to: dateString.optional(),
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
