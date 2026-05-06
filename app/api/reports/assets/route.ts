import { NextResponse } from 'next/server';
import { getRepositories } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { jsonError, unknownError } from '@/lib/api/response';
import type { AssetsReport } from '@/types/report';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const { users, transactions } = getRepositories();
    const [user, txs] = await Promise.all([
      users.get(session.userId),
      transactions.list(session.userId),
    ]);
    if (!user) return jsonError('NOT_FOUND', '사용자를 찾을 수 없습니다', 404);

    let totalIncome = 0;
    let totalExpense = 0;
    for (const tx of txs) {
      if (tx.type === 'income') totalIncome += tx.amount;
      else totalExpense += tx.amount;
    }

    const initialBalance = user.initialBalance ?? 0;
    const report: AssetsReport = {
      initialBalance,
      totalIncome,
      totalExpense,
      currentAsset: initialBalance + totalIncome - totalExpense,
      transactionCount: txs.length,
    };

    return NextResponse.json({ report });
  } catch (err) {
    return unknownError(err);
  }
}
