import { NextRequest, NextResponse } from 'next/server';
import type { Withdrawal } from '@/types/withdrawal';
import { mockWithdrawals } from '@/lib/mockWithdrawals';

export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get('Idempotency-Key');
  if (!idempotencyKey) {
    return NextResponse.json(
      { message: 'Idempotency-Key required' },
      { status: 400 }
    );
  }

  const existing = mockWithdrawals.get(idempotencyKey);
  if (existing) {
    return NextResponse.json(
      {
        message: 'Эта заявка уже была создана ранее. Проверьте историю выводов.',
        code: 'IDEMPOTENCY_CONFLICT',
        withdrawal: existing,
      },
      { status: 409 }
    );
  }

  const body = await request.json();
  const amount = String(body?.amount ?? '');
  const destination = String(body?.destination ?? '');

  if (!amount || !destination) {
    return NextResponse.json(
      { message: 'amount and destination required' },
      { status: 400 }
    );
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return NextResponse.json(
      { message: 'amount must be greater than 0' },
      { status: 400 }
    );
  }

  const id = `wd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const withdrawal: Withdrawal = {
    id,
    amount,
    destination,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  mockWithdrawals.set(idempotencyKey, withdrawal);
  mockWithdrawals.set(id, withdrawal);

  return NextResponse.json(withdrawal, { status: 201 });
}
