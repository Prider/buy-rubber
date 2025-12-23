'use client';

import { useState, useEffect } from 'react';
import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/hooks/useAlert';
import { logger } from '@/lib/logger';
import {
  AUTO_DISMISS_MS,
  INITIAL_CREATE_FORM,
  INITIAL_EDIT_FORM,
  MAX_USERS,
  USER_LIMIT_MESSAGE,
} from './user-management/constants';
import { MessageBanner } from './user-management/MessageBanner';
import { UsersTable } from './user-management/UsersTable';
import { CreateUserModal } from './user-management/CreateUserModal';
import { EditUserModal } from './user-management/EditUserModal';
import GamerLoader from '@/components/GamerLoader';

interface UserManagementProps {
  className?: string;
}

export default function UserManagement({ className = '' }: UserManagementProps) {
  const { user: currentUser } = useAuth();
  const { showConfirm } = useAlert();
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Omit<User, 'password'> | null>(null);
  
  // Create form state
  const [createForm, setCreateForm] = useState<CreateUserRequest>(INITIAL_CREATE_FORM);
  
  // Edit form state
  const [editForm, setEditForm] = useState<UpdateUserRequest>(INITIAL_EDIT_FORM);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        if (data.users.length >= MAX_USERS) {
          setError(USER_LIMIT_MESSAGE);
        }
      } else {
        setError(data.message || 'ไม่สามารถโหลดรายชื่อผู้ใช้งานได้');
      }
    } catch (error) {
      setError('ไม่สามารถโหลดรายชื่อผู้ใช้งานได้');
      logger.error('ไม่สามารถโหลดรายชื่อผู้ใช้งานได้', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = setTimeout(() => setError(''), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!success) {
      return;
    }
    const timer = setTimeout(() => setSuccess(''), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [success]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (users.length >= MAX_USERS) {
      setError(USER_LIMIT_MESSAGE);
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();
      if (data.success) {
        setUsers([...users, data.user]);
        setCreateForm(INITIAL_CREATE_FORM);
        setShowCreateForm(false);
        setSuccess('สร้างผู้ใช้งานสำเร็จ');
      } else {
        setError(data.message || 'ไม่สามารถสร้างผู้ใช้งานได้');
      }
    } catch (error) {
      setError('ไม่สามารถสร้างผู้ใช้งานได้');
      logger.error('ไม่สามารถสร้างผู้ใช้งานได้', error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (data.success) {
        setUsers(users.map((u) => (u.id === editingUser.id ? data.user : u)));
        setEditingUser(null);
        setEditForm(INITIAL_EDIT_FORM);
        setSuccess('อัปเดตผู้ใช้งานสำเร็จ');
      } else {
        setError(data.message || 'ไม่สามารถอัปเดตผู้ใช้งานได้');
      }
    } catch (error) {
      setError('ไม่สามารถอัปเดตผู้ใช้งานได้');
      logger.error('ไม่สามารถอัปเดตผู้ใช้งานได้', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = await showConfirm(
      'ยืนยันการลบผู้ใช้งาน',
      'คุณต้องการลบผู้ใช้งานคนนี้หรือไม่?',
      {
        confirmText: 'ลบ',
        cancelText: 'ยกเลิก',
        variant: 'danger',
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(users.filter((u) => u.id !== userId));
        setSuccess('ลบผู้ใช้งานสำเร็จ');
      } else {
        setError(data.message || 'ไม่สามารถลบผู้ใช้งานได้');
      }
    } catch (error) {
      setError('ไม่สามารถลบผู้ใช้งานได้');
      logger.error('ไม่สามารถลบผู้ใช้งานได้', error);
    }
  };

  const startEdit = (user: Omit<User, 'password'>) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    });
  };

  const isAtUserLimit = users.length >= MAX_USERS;

  const handleCreateFieldChange = <K extends keyof CreateUserRequest>(field: K, value: CreateUserRequest[K]) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditFieldChange = <K extends keyof UpdateUserRequest>(field: K, value: UpdateUserRequest[K]) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenCreateModal = () => {
    if (isAtUserLimit) {
      setError(USER_LIMIT_MESSAGE);
      return;
    }
    setCreateForm(INITIAL_CREATE_FORM);
    setShowCreateForm(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateForm(false);
    setCreateForm(INITIAL_CREATE_FORM);
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setEditForm(INITIAL_EDIT_FORM);
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="py-6">
          <GamerLoader message="กำลังโหลดข้อมูลผู้ใช้งาน..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">จัดการผู้ใช้งาน</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">จัดการบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="group relative flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          disabled={isAtUserLimit}
          title={isAtUserLimit ? `จำกัดผู้ใช้งานสูงสุด ${MAX_USERS} คน` : undefined}
        >
          เพิ่มผู้ใช้งาน
        </button>
      </div>

      <MessageBanner variant="error" message={error} />
      <MessageBanner variant="success" message={success} />

      <div className="card">
        <UsersTable
          users={users}
          currentUserId={currentUser?.id}
          onEdit={startEdit}
          onDelete={handleDeleteUser}
        />
      </div>

      <CreateUserModal
        visible={showCreateForm}
        form={createForm}
        onChange={handleCreateFieldChange}
        onSubmit={handleCreateUser}
        onClose={handleCloseCreateModal}
      />

      <EditUserModal
        visible={Boolean(editingUser)}
        form={editForm}
        onChange={handleEditFieldChange}
        onSubmit={handleUpdateUser}
        onClose={handleCloseEditModal}
      />
    </div>
  );
}
