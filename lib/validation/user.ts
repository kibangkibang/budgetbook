import { z } from 'zod';

export const userUpdateSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50).optional(),
  initialBalance: z
    .number()
    .int('초기 잔액은 정수여야 합니다')
    .min(-1_000_000_000_000, '초기 잔액이 너무 작습니다')
    .max(1_000_000_000_000, '초기 잔액이 너무 큽니다')
    .optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
