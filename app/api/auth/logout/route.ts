import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { unknownError } from '@/lib/api/response';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return unknownError(err);
  }
}
