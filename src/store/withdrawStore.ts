import { create } from 'zustand';
import type { Withdrawal } from '@/types/withdrawal';

export type WithdrawStatus = 'idle' | 'loading' | 'success' | 'error';

interface WithdrawState {
  status: WithdrawStatus;
  error: string | null;
  createdWithdrawal: Withdrawal | null;
  isSubmitting: boolean;
  setStatus: (status: WithdrawStatus) => void;
  setError: (error: string | null) => void;
  setCreatedWithdrawal: (w: Withdrawal | null) => void;
  setSubmitting: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as WithdrawStatus,
  error: null as string | null,
  createdWithdrawal: null as Withdrawal | null,
  isSubmitting: false,
};

export const useWithdrawStore = create<WithdrawState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setCreatedWithdrawal: (createdWithdrawal) => set({ createdWithdrawal }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  reset: () => set(initialState),
}));
