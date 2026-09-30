'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { DestinationCompanyTableProps, DestinationCompany } from '@/industries/rubber/types/destinationCompany';
import { useAuth } from '@/platform/AuthContext';
import GamerLoader from '@/shared/ui/GamerLoader';

const desktopCols = 'lg:grid-cols-[6rem_minmax(0,1fr)_8.5rem_max-content]';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

export const DestinationCompanyTable: React.FC<DestinationCompanyTableProps> = memo(({
  companies,
  onEdit,
  onDelete,
  onReactivate,
  isLoading,
}) => {
  if (isLoading) {
    return <GamerLoader className="py-12" message="กำลังโหลดข้อมูลบริษัทปลายทาง..." />;
  }

  if (companies.length === 0) {
    return <p className="px-4 py-14 text-center text-sm text-gray-500 dark:text-gray-400">ยังไม่มีบริษัทปลายทาง</p>;
  }

  return (
    <div role="table" className="w-full text-sm">
      <div
        role="row"
        className={`hidden bg-gray-50 text-xs font-medium text-gray-500 dark:bg-gray-700/50 dark:text-gray-300 lg:grid ${desktopCols}`}
      >
        <div role="columnheader" className="px-4 py-3 text-left">รหัส</div>
        <div role="columnheader" className="px-4 py-3 text-left">ชื่อบริษัท</div>
        <div role="columnheader" className="px-4 py-3 text-left">เบอร์โทร</div>
        <div role="columnheader" className="px-4 py-3 text-right">จัดการ</div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 lg:block lg:p-0">
        {companies.map((company) => (
          <DestinationCompanyTableRow
            key={company.id}
            company={company}
            onEdit={onEdit}
            onDelete={onDelete}
            onReactivate={onReactivate}
          />
        ))}
      </div>
    </div>
  );
});

DestinationCompanyTable.displayName = 'DestinationCompanyTable';

interface RowProps {
  company: DestinationCompany;
  onEdit: (company: DestinationCompany) => void;
  onDelete: (company: DestinationCompany) => void;
  onReactivate?: (company: DestinationCompany) => void;
}

const DestinationCompanyTableRow: React.FC<RowProps> = memo(({
  company,
  onEdit,
  onDelete,
  onReactivate,
}) => {
  const { user, hasAnyRole } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'root';
  const canEdit = hasAnyRole(['admin', 'user']);

  const handleEdit = useCallback(() => onEdit(company), [company, onEdit]);
  const handleDelete = useCallback(() => onDelete(company), [company, onDelete]);
  const handleReactivate = useCallback(() => onReactivate?.(company), [company, onReactivate]);

  const phoneDisplay = useMemo(() => company.phone || '–', [company.phone]);
  const muted = company.isActive ? '' : 'text-gray-400 line-through decoration-gray-300 dark:text-gray-500 dark:decoration-gray-600';

  return (
    <div
      role="row"
      className={`grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/80 lg:items-center lg:gap-0 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t lg:bg-transparent lg:p-0 lg:hover:bg-gray-50 lg:dark:bg-transparent lg:dark:hover:bg-gray-700/30 ${desktopCols} ${
        company.isActive ? '' : 'bg-gray-50/80 dark:bg-gray-900/30'
      }`}
    >
      <span
        aria-hidden="true"
        className={`row-span-3 flex h-10 w-10 items-center justify-center self-start rounded-full text-sm font-semibold lg:hidden ${
          company.isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
        }`}
      >
        {initials(company.name)}
      </span>

      <div role="cell" className="min-w-0 lg:col-start-2 lg:row-start-1 lg:px-4 lg:py-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`min-w-0 break-words text-base font-semibold text-gray-900 dark:text-gray-100 lg:text-sm lg:font-medium ${muted}`}>
            {company.name}
          </span>
          {!company.isActive ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
              ปิดใช้งาน
            </span>
          ) : null}
        </div>
        {company.address ? (
          <p className={`mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400 lg:line-clamp-1 ${company.isActive ? '' : 'text-gray-400 dark:text-gray-500'}`}>
            {company.address}
          </p>
        ) : null}
      </div>

      <div role="cell" className={`font-mono text-xs text-gray-500 dark:text-gray-400 lg:col-start-1 lg:row-start-1 lg:px-4 lg:py-3 lg:text-sm ${muted}`}>
        {company.code}
      </div>

      <div role="cell" className={`text-sm lg:col-start-3 lg:row-start-1 lg:px-4 lg:py-3 ${company.isActive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
        {phoneDisplay}
      </div>

      <div role="cell" className="col-span-2 mt-2.5 lg:col-span-1 lg:col-start-4 lg:row-start-1 lg:mt-0 lg:px-3 lg:py-2">
        <div className="flex flex-wrap gap-1 lg:flex-nowrap lg:justify-end">
          {company.isActive && canEdit ? (
            <ActionButton onClick={handleEdit} tone="neutral">แก้ไข</ActionButton>
          ) : null}
          {isAdmin && !company.isActive && onReactivate ? (
            <ActionButton onClick={handleReactivate} tone="green">เปิดใช้งาน</ActionButton>
          ) : null}
          {isAdmin && company.isActive ? (
            <ActionButton onClick={handleDelete} tone="danger">ลบ</ActionButton>
          ) : null}
        </div>
      </div>
    </div>
  );
});

DestinationCompanyTableRow.displayName = 'DestinationCompanyTableRow';

function ActionButton({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: 'neutral' | 'green' | 'danger';
}) {
  const tones = {
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
