import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TransactionActionButtons } from '../TransactionActionButtons';
import type { PurchaseTransaction } from '../types';

const transaction = {
  purchaseNo: 'PUR-001',
  date: '2026-11-14',
  createdAt: '2026-11-14T00:00:00.000Z',
  purchases: [],
  serviceFees: [],
  totalAmount: 100,
  member: { id: 'member-1', code: 'M001', name: 'สวนทดสอบ' },
} as PurchaseTransaction;

describe('TransactionActionButtons', () => {
  it('shows edit only when an edit handler is provided', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <TransactionActionButtons
        transaction={transaction}
        canDelete={false}
        onPrint={vi.fn()}
        onDownloadPDF={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'แก้ไข' }));
    expect(onEdit).toHaveBeenCalledWith(transaction);

    rerender(
      <TransactionActionButtons
        transaction={transaction}
        canDelete={false}
        onPrint={vi.fn()}
        onDownloadPDF={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'แก้ไข' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ลบ' })).not.toBeInTheDocument();
  });

  it('shows delete for roles that can delete a purchase', () => {
    render(
      <TransactionActionButtons
        transaction={transaction}
        canDelete
        onPrint={vi.fn()}
        onDownloadPDF={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'ลบ' })).toBeInTheDocument();
  });
});
