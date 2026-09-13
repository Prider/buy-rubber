import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { BackupHeader } from '../BackupHeader';

describe('BackupHeader', () => {
  it('renders backup action for all users', () => {
    render(
      <BackupHeader
        onCreateBackup={vi.fn()}
        loading={false}
      />,
    );

    expect(screen.getByRole('heading', { name: 'สำรองข้อมูล' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'สำรองข้อมูลตอนนี้' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'รีเซ็ตข้อมูลเริ่มต้น' })).not.toBeInTheDocument();
  });

  it('shows the reset action only when allowed', () => {
    render(
      <BackupHeader
        onCreateBackup={vi.fn()}
        onResetToInitial={vi.fn()}
        canResetToInitial
        loading={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'สำรองข้อมูลตอนนี้' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'รีเซ็ตข้อมูลเริ่มต้น' })).toBeEnabled();
  });

  it('calls onResetToInitial when the reset button is clicked', () => {
    const onResetToInitial = vi.fn();
    render(
      <BackupHeader
        onCreateBackup={vi.fn()}
        onResetToInitial={onResetToInitial}
        canResetToInitial
        loading={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'รีเซ็ตข้อมูลเริ่มต้น' }));
    expect(onResetToInitial).toHaveBeenCalledTimes(1);
  });

  it('disables visible actions while loading', () => {
    render(
      <BackupHeader
        onCreateBackup={vi.fn()}
        onResetToInitial={vi.fn()}
        canResetToInitial
        loading={true}
      />,
    );

    expect(screen.getByRole('button', { name: 'รีเซ็ตข้อมูลเริ่มต้น' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'กำลังดำเนินการ...' })).toBeDisabled();
  });
});
