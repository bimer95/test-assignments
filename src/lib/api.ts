import type { Withdrawal } from '@/types/withdrawal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class IdempotencyConflictError extends ApiError {
  constructor(message: string = 'Эта заявка уже была создана ранее') {
    super(message, 409, 'IDEMPOTENCY_CONFLICT');
    this.name = 'IdempotencyConflictError';
  }
}

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 409) return false;
  if (error instanceof TypeError && error.message.includes('fetch')) return true;
  if (error instanceof Error && error.message.includes('network')) return true;
  return false;
}

export async function createWithdrawal(
  amount: string,
  destination: string,
  idempotencyKey: string
): Promise<Withdrawal> {
  let lastError: unknown;

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/v1/withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ amount, destination }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        throw new IdempotencyConflictError(
          data.message || 'Эта заявка уже была создана ранее. Проверьте историю выводов.'
        );
      }

      if (!res.ok) {
        throw new ApiError(
          data.message || `Ошибка ${res.status}`,
          res.status,
          data.code
        );
      }

      return data as Withdrawal;
    } catch (err) {
      lastError = err;
      if (err instanceof IdempotencyConflictError || err instanceof ApiError) {
        throw err;
      }
      if (isRetryableError(err) && attempt < RETRY_ATTEMPTS - 1) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}

export async function getWithdrawal(id: string): Promise<Withdrawal> {
  const res = await fetch(`${API_BASE}/v1/withdrawals/${id}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      data.message || `Ошибка ${res.status}`,
      res.status,
      data.code
    );
  }

  return data as Withdrawal;
}
