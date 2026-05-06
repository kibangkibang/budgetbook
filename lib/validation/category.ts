import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z.string().min(1, '카테고리 이름을 입력해주세요').max(30),
  type: z.enum(['income', 'expense']),
  icon: z.string().max(20).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, '색상은 #RRGGBB 형식이어야 합니다')
    .optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial().omit({ type: true });

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
