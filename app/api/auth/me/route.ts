import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { jsonError, unknownError } from '@/lib/api/response';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) {
      return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);
    }
    return NextResponse.json({
      user: { id: session.userId, email: session.email, name: session.name },
    });
  } catch (err) {
    return unknownError(err);
  }
}
