'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Member, MemberTableProps } from '@/types/member';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';

const desktopCols = 'lg:grid-cols-[5.5rem_minmax(0,1fr)_7.5rem_max-content]';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

export const MemberTable: React.FC<MemberTableProps> = memo(({
  members,
  onEdit,
  onDelete,
  onReactivate,
  onViewHistory,
  onViewServiceFees,
  isLoading,
}) => {
  if (isLoading) {
    return <GamerLoader className="py-12" message="กำลังโหลดข้อมูลสมาชิก..." />;
  }

  if (members.length === 0) {
    return <p className="px-4 py-14 text-center text-sm text-gray-500 dark:text-gray-400">ยังไม่มีสมาชิก</p>;
  }

  return (
    <div role="table" className="w-full text-sm">
      <div
        role="row"
        className={`hidden bg-gray-50 text-xs font-medium text-gray-500 dark:bg-gray-700/50 dark:text-gray-300 lg:grid ${desktopCols}`}
      >
        <div role="columnheader" className="px-4 py-3 text-left">รหัส</div>
        <div role="columnheader" className="px-4 py-3 text-left">ชื่อ-นามสกุล</div>
        <div role="columnheader" className="px-4 py-3 text-left">เบอร์โทร</div>
        <div role="columnheader" className="px-4 py-3 text-right">จัดการ</div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 lg:block lg:p-0">
        {members.map((member) => (
          <MemberTableRow
            key={member.id}
            member={member}
            onEdit={onEdit}
            onDelete={onDelete}
            onReactivate={onReactivate}
            onViewHistory={onViewHistory}
            onViewServiceFees={onViewServiceFees}
          />
        ))}
      </div>
    </div>
  );
});

MemberTable.displayName = 'MemberTable';

interface MemberTableRowProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onReactivate?: (member: Member) => void;
  onViewHistory: (member: Member) => void;
  onViewServiceFees?: (member: Member) => void;
}

const MemberTableRow: React.FC<MemberTableRowProps> = memo(({
  member,
  onEdit,
  onDelete,
  onReactivate,
  onViewHistory,
  onViewServiceFees,
}) => {
  const { user, hasAnyRole } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'root';
  const canEdit = hasAnyRole(['admin', 'user']);

  const handleEdit = useCallback(() => onEdit(member), [member, onEdit]);
  const handleDelete = useCallback(() => onDelete(member), [member, onDelete]);
  const handleReactivate = useCallback(() => onReactivate?.(member), [member, onReactivate]);
  const handleViewHistory = useCallback(() => onViewHistory(member), [member, onViewHistory]);
  const handleViewServiceFees = useCallback(() => onViewServiceFees?.(member), [member, onViewServiceFees]);

  const phoneDisplay = useMemo(() => member.phone || '–', [member.phone]);
  const muted = member.isActive ? '' : 'text-gray-400 line-through decoration-gray-300 dark:text-gray-500 dark:decoration-gray-600';

  return (
    <div
      role="row"
      className={`grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/80 lg:items-center lg:gap-0 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t lg:bg-transparent lg:p-0 lg:hover:bg-gray-50 lg:dark:bg-transparent lg:dark:hover:bg-gray-700/30 ${desktopCols} ${
        member.isActive ? '' : 'bg-gray-50/80 dark:bg-gray-900/30'
      }`}
    >
      <span
        aria-hidden="true"
        className={`row-span-3 flex h-10 w-10 items-center justify-center self-start rounded-full text-sm font-semibold lg:hidden ${
          member.isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
        }`}
      >
        {initials(member.name)}
      </span>

      <div role="cell" className="min-w-0 lg:col-start-2 lg:row-start-1 lg:px-4 lg:py-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`min-w-0 break-words text-base font-semibold text-gray-900 dark:text-gray-100 lg:text-sm lg:font-medium ${muted}`}>
            {member.name}
          </span>
          {!member.isActive ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
              ปิดใช้งาน
            </span>
          ) : null}
        </div>
      </div>

      <div role="cell" className={`font-mono text-xs text-gray-500 dark:text-gray-400 lg:col-start-1 lg:row-start-1 lg:px-4 lg:py-3 lg:text-sm ${muted}`}>
        {member.code}
      </div>

      <div role="cell" className={`text-sm lg:col-start-3 lg:row-start-1 lg:px-4 lg:py-3 ${member.isActive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
        {phoneDisplay}
      </div>

      <div role="cell" className="col-span-2 mt-2.5 lg:col-span-1 lg:col-start-4 lg:row-start-1 lg:mt-0 lg:px-3 lg:py-2">
        <div className="flex flex-wrap gap-1 lg:flex-nowrap lg:justify-end">
          <ActionButton onClick={handleViewHistory} tone="primary">ประวัติ</ActionButton>
          {onViewServiceFees ? (
            <ActionButton onClick={handleViewServiceFees} tone="violet">ค่าบริการ</ActionButton>
          ) : null}
          {member.isActive && canEdit ? (
            <ActionButton onClick={handleEdit} tone="neutral">แก้ไข</ActionButton>
          ) : null}
          {isAdmin && !member.isActive && onReactivate ? (
            <ActionButton onClick={handleReactivate} tone="green">เปิดใช้งาน</ActionButton>
          ) : null}
          {isAdmin && member.isActive ? (
            <ActionButton onClick={handleDelete} tone="danger">ลบ</ActionButton>
          ) : null}
        </div>
      </div>
    </div>
  );
});

MemberTableRow.displayName = 'MemberTableRow';

function ActionButton({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: 'primary' | 'violet' | 'neutral' | 'green' | 'danger';
}) {
  const tones = {
    primary: 'text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30',
    violet: 'text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-900/30',
    neutral: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
    green: 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30',
    danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:min-h-8 lg:px-2 lg:text-xs ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
