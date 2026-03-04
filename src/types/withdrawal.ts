export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Withdrawal {
  id: string;
  amount: string;
  destination: string;
  status: WithdrawalStatus;
  created_at: string;
}

export interface CreateWithdrawalRequest {
  amount: string;
  destination: string;
  idempotency_key: string;
}
