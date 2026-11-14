import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ResetInitialDataCard } from '../ResetInitialDataCard';

describe('ResetInitialDataCard', () => {
  it('explains the reset and enables the action', () => {
    render(<ResetInitialDataCard onReset={vi.fn()} loading={false} />);

    expect(screen.getByRole('heading', { name: 'คืนค่าข้อมูลเริ่มต้น' })).toBeInTheDocument();
    expect(screen.getByText(/ระบบจะสำรองข้อมูลปัจจุบันไว้ก่อนรีเซ็ต/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'รีเซ็ตข้อมูลเริ่มต้น' })).toBeEnabled();
  });

  it('calls onReset when the reset button is clicked', () => {
    const onReset = vi.fn();
    render(<ResetInitialDataCard onReset={onReset} loading={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'รีเซ็ตข้อมูลเริ่มต้น' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('disables the reset action while loading', () => {
    render(<ResetInitialDataCard onReset={vi.fn()} loading />);

    expect(screen.getByRole('button', { name: 'รีเซ็ตข้อมูลเริ่มต้น' })).toBeDisabled();
  });
});
