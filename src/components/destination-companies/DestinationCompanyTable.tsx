'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { DestinationCompanyTableProps, DestinationCompany } from '@/types/destinationCompany';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';

export const DestinationCompanyTable: React.FC<DestinationCompanyTableProps> = memo(({
  companies,
  onEdit,
  onDelete,
  onReactivate,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="card">
        <GamerLoader className="py-12" message="กำลังโหลดข้อมูลบริษัทปลายทาง..." />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">ยังไม่มีบริษัทปลายทาง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อบริษัท</th>
              <th>เบอร์โทร</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <DestinationCompanyTableRow
                key={company.id}
                company={company}
                onEdit={onEdit}
                onDelete={onDelete}
                onReactivate={onReactivate}
              />
            ))}
          </tbody>
        </table>
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'root';

  const rowClassName = useMemo(
    () =>
      `relative transition-all duration-300 ${
        company.isActive
          ? 'bg-white dark:bg-gray-800 border-l-4 border-green-500 hover:border-green-600 hover:shadow-sm'
          : 'bg-gray-50 dark:bg-gray-900/50 border-l-4 border-gray-400 opacity-75'
      }`,
    [company.isActive],
  );

  const handleEdit = useCallback(() => onEdit(company), [company, onEdit]);
  const handleDelete = useCallback(() => onDelete(company), [company, onDelete]);
  const handleReactivate = useCallback(() => {
    if (onReactivate) onReactivate(company);
  }, [company, onReactivate]);

  return (
    <tr className={rowClassName}>
      <td className="font-medium">
        <div className="flex items-center gap-2.5">
          {company.isActive ? (
            <span className="relative flex-shrink-0 w-2 h-2 flex items-center justify-center overflow-visible">
              <span className="absolute w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
              <span className="relative w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-md shadow-green-500/50" />
            </span>
          ) : (
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
          )}
          <span className={company.isActive ? '' : 'line-through text-gray-500 dark:text-gray-500'}>
            {company.code}
          </span>
        </div>
      </td>
      <td>
        <span className={company.isActive ? 'font-medium' : 'line-through text-gray-500 dark:text-gray-500'}>
          {company.name}
        </span>
      </td>
      <td className={company.isActive ? '' : 'text-gray-400 dark:text-gray-600'}>
        {company.phone || '-'}
      </td>
      <td>
        <div className="flex items-center space-x-3">
          {company.isActive && (
            <button
              onClick={handleEdit}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              แก้ไข
            </button>
          )}
          {isAdmin && (
            <>
              {!company.isActive && onReactivate && (
                <button
                  onClick={handleReactivate}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                >
                  เปิดใช้งาน
                </button>
              )}
              {company.isActive && (
                <button
                  onClick={handleDelete}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  ลบ
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

DestinationCompanyTableRow.displayName = 'DestinationCompanyTableRow';
