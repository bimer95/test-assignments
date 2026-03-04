'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { useWithdrawStore } from '@/store/withdrawStore';
import { createWithdrawal } from '@/lib/api';
import { IdempotencyConflictError } from '@/lib/api';

function generateIdempotencyKey(): string {
  return `wd_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function WithdrawForm() {
  const idempotencyKeyId = useId();
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [confirm, setConfirm] = useState(false);

  const {
    status,
    error,
    createdWithdrawal,
    isSubmitting,
    setStatus,
    setError,
    setCreatedWithdrawal,
    setSubmitting,
    reset,
  } = useWithdrawStore();

  const amountNum = useMemo(() => parseFloat(amount), [amount]);
  const amountValid = !isNaN(amountNum) && amountNum > 0;
  const destinationValid = destination.trim().length > 0;
  const formValid = amountValid && destinationValid && confirm;

  const loading = status === 'loading' || isSubmitting;
  const canSubmit = formValid && !loading;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      if (useWithdrawStore.getState().isSubmitting) return;

      setSubmitting(true);
      setStatus('loading');
      setError(null);

      const key = generateIdempotencyKey();

      try {
        const withdrawal = await createWithdrawal(
          amount.trim(),
          destination.trim(),
          key
        );
        setCreatedWithdrawal(withdrawal);
        setStatus('success');
      } catch (err) {
        if (err instanceof IdempotencyConflictError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message || 'Произошла ошибка. Попробуйте ещё раз.');
        } else {
          setError('Произошла ошибка. Попробуйте ещё раз.');
        }
        setStatus('error');
      } finally {
        setSubmitting(false);
      }
    },
    [
      amount,
      destination,
      canSubmit,
      setSubmitting,
      setStatus,
      setError,
      setCreatedWithdrawal,
    ]
  );

  const handleReset = useCallback(() => {
    reset();
    setAmount('');
    setDestination('');
    setConfirm(false);
  }, [reset]);

  if (status === 'success' && createdWithdrawal) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <h2 className="text-lg font-semibold text-green-800 mb-4">
          Заявка создана
        </h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-slate-600">ID</dt>
            <dd className="font-mono text-slate-900">{createdWithdrawal.id}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Сумма</dt>
            <dd className="font-mono text-slate-900">{createdWithdrawal.amount} USDT</dd>
          </div>
          <div>
            <dt className="text-slate-600">Направление</dt>
            <dd className="font-mono text-slate-900 break-all">{createdWithdrawal.destination}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Статус</dt>
            <dd>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                {createdWithdrawal.status}
              </span>
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm transition-colors"
        >
          Создать новую заявку
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
          Сумма (USDT)
        </label>
        <input
          id="amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          disabled={loading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          autoComplete="off"
        />
        {amount && !amountValid && (
          <p className="mt-1 text-sm text-red-600">Сумма должна быть больше 0</p>
        )}
      </div>

      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1">
          Направление (адрес)
        </label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="0x..."
          disabled={loading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          autoComplete="off"
        />
        {destination && !destinationValid && (
          <p className="mt-1 text-sm text-red-600">Укажите адрес</p>
        )}
      </div>

      <div className="flex items-start gap-3">
        <input
          id={idempotencyKeyId}
          type="checkbox"
          checked={confirm}
          onChange={(e) => setConfirm(e.target.checked)}
          disabled={loading}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
        />
        <label htmlFor={idempotencyKeyId} className="text-sm text-slate-700">
          Подтверждаю корректность данных и согласен с условиями вывода
        </label>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:bg-slate-300 transition-colors"
      >
        {loading ? 'Отправка...' : 'Вывести'}
      </button>
    </form>
  );
}
