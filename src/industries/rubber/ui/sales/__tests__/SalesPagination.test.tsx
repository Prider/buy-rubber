import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesPagination from '../SalesPagination';

describe('SalesPagination', () => {
  it('renders only a window of page buttons for 100,000 rows', () => {
    render(
      <SalesPagination
        pagination={{
          page: 5000,
          limit: 10,
          total: 100_000,
          totalPages: 10_000,
          hasMore: true,
        }}
        loading={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('แสดง 49991 - 50000 จาก 100000 รายการ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5000' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10000' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '3' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeLessThan(12);
  });

  it('calls onPageChange when navigating', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <SalesPagination
        pagination={{
          page: 2,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasMore: true,
        }}
        loading={false}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'ถัดไป' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: 'ก่อนหน้า' }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('hides itself when only one page', () => {
    const { container } = render(
      <SalesPagination
        pagination={{
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1,
          hasMore: false,
        }}
        loading={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
