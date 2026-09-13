import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { UsersTable } from '../UsersTable';
import { User } from '@/types/user';

function makeUser(overrides: Partial<User> = {}): Omit<User, 'password'> {
  return {
    id: 'user-1',
    username: 'admin',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

describe('UsersTable', () => {
  it('hides edit and delete actions for a user with Root role', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <UsersTable
        users={[makeUser({ id: 'root-1', username: 'root', role: 'root' })]}
        currentUserId="admin-1"
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('Root')).toBeInTheDocument();
    expect(screen.getByText('ไม่สามารถแก้ไขได้')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'แก้ไข' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ลบ' })).not.toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('lets a non-root user be edited and deleted', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const adminUser = makeUser({ id: 'admin-2', username: 'mayrin', role: 'admin' });

    render(
      <UsersTable
        users={[adminUser]}
        currentUserId="admin-1"
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'แก้ไข' }));
    expect(onEdit).toHaveBeenCalledWith(adminUser);

    fireEvent.click(screen.getByRole('button', { name: 'ลบ' }));
    expect(onDelete).toHaveBeenCalledWith('admin-2');
  });

  it('hides delete for the currently signed-in account', () => {
    render(
      <UsersTable
        users={[makeUser({ id: 'admin-1', username: 'admin', role: 'admin' })]}
        currentUserId="admin-1"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'แก้ไข' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ลบ' })).not.toBeInTheDocument();
  });
});
