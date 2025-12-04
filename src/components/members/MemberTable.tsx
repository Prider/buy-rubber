import React from 'react';
import { MemberTableProps } from '@/types/member';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  onEdit,
  onDelete,
  onReactivate,
  onViewHistory,
  onViewServiceFees,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="card">
        <GamerLoader className="py-12" message="กำลังโหลดข้อมูลสมาชิก..." />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">ยังไม่มีสมาชิก</p>
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
              <th>ชื่อ-นามสกุล</th>
              <th>เบอร์โทร</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
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
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface MemberTableRowProps {
  member: any;
  onEdit: (member: any) => void;
  onDelete: (member: any) => void;
  onReactivate?: (member: any) => void;
  onViewHistory: (member: any) => void;
  onViewServiceFees?: (member: any) => void;
}

const MemberTableRow: React.FC<MemberTableRowProps> = ({
  member,
  onEdit,
  onDelete,
  onReactivate,
  onViewHistory,
  onViewServiceFees,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <tr className={member.isActive === false ? 'opacity-60' : ''}>
      <td className="font-medium">
        {member.code}
      </td>
      <td>{member.name}</td>
      <td>{member.phone || '-'}</td>
      <td>
        {member.isActive ? (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105">
            <span className="relative w-2 h-2 mr-2">
              <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></span>
              <span className="relative w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </span>
            <span className="relative">
              ใช้งาน
              <span className="absolute inset-0 bg-green-400/20 rounded blur-sm animate-pulse"></span>
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/60 dark:to-slate-800/60 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 shadow-sm transition-all duration-300">
            <span className="relative w-2 h-2 mr-2">
              <span className="absolute inset-0 bg-gray-400 rounded-full opacity-50"></span>
              <span className="relative w-2 h-2 bg-gray-500 rounded-full"></span>
            </span>
            <span>ปิดการใช้งาน</span>
          </span>
        )}
      </td>
      <td>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onViewHistory(member)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center space-x-1"
            title="ดูประวัติการรับซื้อ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>ประวัติ</span>
          </button>
          {onViewServiceFees && (
            <button
              onClick={() => onViewServiceFees(member)}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center space-x-1"
              title="ดูค่าบริการ"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>ค่าบริการ</span>
            </button>
          )}
          {member.isActive && (
            <button
              onClick={() => onEdit(member)}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              แก้ไข
            </button>
          )}
          {isAdmin && (
            <>
              {!member.isActive && onReactivate && (
                <button
                  onClick={() => onReactivate(member)}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors flex items-center space-x-1"
                  title="เปิดการใช้งานสมาชิก"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>เปิดใช้งาน</span>
                </button>
              )}
              {member.isActive && (
                <button
                  onClick={() => onDelete(member)}
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
};
