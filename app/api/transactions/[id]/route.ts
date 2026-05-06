import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getRepositories } from '@/lib/db';
import { transactionUpdateSchema } from '@/lib/validation/transaction';
import { getSession } from '@/lib/auth/session';
import { handleZodError, jsonError, unknownError } from '@/lib/api/response';

export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ id: string }>;
}

async function requireOwnedTransaction(id: string, userId: string) {
  const { transactions } = getRepositories();
  const tx = await transactions.get(id);
  if (!tx || tx.userId !== userId) return null;
  return tx;
}

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const { id } = await params;
    const tx = await requireOwnedTransaction(id, session.userId);
    if (!tx) return jsonError('NOT_FOUND', '거래를 찾을 수 없습니다', 404);

    return NextResponse.json({ transaction: tx });
  } catch (err) {
    return unknownError(err);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const { id } = await params;
    const existing = await requireOwnedTransaction(id, session.userId);
    if (!existing) return jsonError('NOT_FOUND', '거래를 찾을 수 없습니다', 404);

    const body = await req.json();
    const data = transactionUpdateSchema.parse(body);

    const { categories, transactions } = getRepositories();
    if (data.categoryId) {
      const category = await categories.get(data.categoryId);
      if (!category || category.userId !== session.userId) {
        return jsonError('INVALID_CATEGORY', '카테고리를 찾을 수 없습니다', 400);
      }
      const targetType = data.type ?? existing.type;
      if (category.type !== targetType) {
        return jsonError('CATEGORY_TYPE_MISMATCH', '카테고리 타입이 일치하지 않습니다', 400);
      }
    }

    const updated = await transactions.update(id, data);
    return NextResponse.json({ transaction: updated });
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return unknownError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const { id } = await params;
    const existing = await requireOwnedTransaction(id, session.userId);
    if (!existing) return jsonError('NOT_FOUND', '거래를 찾을 수 없습니다', 404);

    const { transactions } = getRepositories();
    await transactions.delete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return unknownError(err);
  }
}
