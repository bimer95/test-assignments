import Link from 'next/link';
import { WithdrawForm } from '@/components/WithdrawForm';

export default function WithdrawPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-block text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          ← Назад
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Вывод средств</h1>
        <WithdrawForm />
      </div>
    </main>
  );
}
