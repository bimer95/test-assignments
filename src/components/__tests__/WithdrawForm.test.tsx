import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WithdrawForm } from '../WithdrawForm';
import { useWithdrawStore } from '@/store/withdrawStore';

const mockWithdrawal = {
  id: 'wd_123',
  amount: '100',
  destination: '0xabc',
  status: 'pending' as const,
  created_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.restoreAllMocks();
  useWithdrawStore.getState().reset();
});

describe('WithdrawForm', () => {
  it('happy-path: submit creates withdrawal and shows success', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWithdrawal),
    });

    render(<WithdrawForm />);

    await user.type(screen.getByLabelText(/Сумма/i), '100');
    await user.type(screen.getByLabelText(/Направление/i), '0xabc');
    await user.click(screen.getByLabelText(/Подтверждаю/i));
    await user.click(screen.getByRole('button', { name: /Вывести/i }));

    await waitFor(() => {
      expect(screen.getByText(/Заявка создана/i)).toBeInTheDocument();
    });
    expect(screen.getByText(mockWithdrawal.id)).toBeInTheDocument();
    expect(screen.getByText(/100 USDT/)).toBeInTheDocument();
    expect(screen.getByText(/0xabc/)).toBeInTheDocument();
    expect(screen.getByText(/pending/)).toBeInTheDocument();
  });

  it('API error: shows error message and keeps form data', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    });

    render(<WithdrawForm />);

    await user.type(screen.getByLabelText(/Сумма/i), '50');
    await user.type(screen.getByLabelText(/Направление/i), '0xdef');
    await user.click(screen.getByLabelText(/Подтверждаю/i));
    await user.click(screen.getByRole('button', { name: /Вывести/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Сумма/i)).toHaveValue('50');
    expect(screen.getByLabelText(/Направление/i)).toHaveValue('0xdef');
  });

  it('409 conflict: shows understandable message', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          message: 'Эта заявка уже была создана ранее. Проверьте историю выводов.',
        }),
    });

    render(<WithdrawForm />);

    await user.type(screen.getByLabelText(/Сумма/i), '100');
    await user.type(screen.getByLabelText(/Направление/i), '0xabc');
    await user.click(screen.getByLabelText(/Подтверждаю/i));
    await user.click(screen.getByRole('button', { name: /Вывести/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /уже была создана ранее|историю выводов/i
      );
    });
  });

  it('double submit: second click does not trigger another request', async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockImplementation(() =>
      new Promise((resolve) => {
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: () => Promise.resolve(mockWithdrawal),
            }),
          100
        );
      })
    );
    global.fetch = fetchMock;

    render(<WithdrawForm />);

    await user.type(screen.getByLabelText(/Сумма/i), '100');
    await user.type(screen.getByLabelText(/Направление/i), '0xabc');
    await user.click(screen.getByLabelText(/Подтверждаю/i));

    const submitBtn = screen.getByRole('button', { name: /Вывести/i });
    await user.click(submitBtn);
    await user.click(submitBtn);
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Заявка создана/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
