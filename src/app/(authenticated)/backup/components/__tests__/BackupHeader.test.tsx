import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { BackupHeader } from '../BackupHeader';

describe('BackupHeader', () => {
  it('renders the backup action and not the reset action', () => {
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

  it('disables the backup action while loading', () => {
    render(
      <BackupHeader
        onCreateBackup={vi.fn()}
        loading={true}
      />,
    );

    expect(screen.getByRole('button', { name: 'กำลังดำเนินการ...' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'รีเซ็ตข้อมูลเริ่มต้น' })).not.toBeInTheDocument();
  });
});
