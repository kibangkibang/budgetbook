import { cookies } from 'next/headers';
import { getIronSession, type SessionOptions } from 'iron-session';
import type { NextRequest, NextResponse } from 'next/server';

export interface SessionData {
  userId?: string;
  email?: string;
  name?: string;
}

function getSessionPassword(): string {
  const pwd = process.env.SESSION_PASSWORD;
  if (!pwd || pwd.length < 32) {
    throw new Error(
      'SESSION_PASSWORD env var is required and must be at least 32 characters',
    );
  }
  return pwd;
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
    cookieName: 'budgetbook_session',
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function getSessionFromRequest(req: NextRequest, res: NextResponse) {
  return getIronSession<SessionData>(req, res, getSessionOptions());
}

export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session.userId) {
    throw new AuthError('Unauthorized');
  }
  return session.userId;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
