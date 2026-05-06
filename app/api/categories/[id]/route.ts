import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getRepositories } from '@/lib/db';
import { categoryUpdateSchema } from '@/lib/validation/category';
import { getSession } from '@/lib/auth/session';
import { handleZodError, jsonError, unknownError } from '@/lib/api/response';

export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ id: string }>;
}

async function requireOwnedCategory(id: string, userId: string) {
  const { categories } = getRepositories();
  const category = await categories.get(id);
  if (!category || category.userId !== userId) return null;
  return category;
}

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const { id } = await params;
    const category = await requireOwnedCategory(id, session.userId);
    if (!category) return jsonError('NOT_FOUND', '카테고리를 찾을 수 없습니다', 404);

    return NextResponse.json({ category });
  } catch (err) {
    return unknownError(err);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const { id } = await params;
    const existing = await requireOwnedCategory(id, session.userId);
    if (!existing) return jsonError('NOT_FOUND', '카테고리를 찾을 수 없습니다', 404);

    const body = await req.json();
    const data = categoryUpdateSchema.parse(body);

    const { categories } = getRepositories();
    const updated = await categories.update(id, data);
    return NextResponse.json({ category: updated });
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
    const existing = await requireOwnedCategory(id, session.userId);
    if (!existing) return jsonError('NOT_FOUND', '카테고리를 찾을 수 없습니다', 404);

    const { categories } = getRepositories();
    await categories.delete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return unknownError(err);
  }
}
