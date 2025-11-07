import React from 'react';
import { MemberTableProps } from '@/types/member';

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  onEdit,
  onDelete,
  onViewHistory,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
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
                onViewHistory={onViewHistory}
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
  onViewHistory: (member: any) => void;
}

const MemberTableRow: React.FC<MemberTableRowProps> = ({
  member,
  onEdit,
  onDelete,
  onViewHistory,
}) => {
  return (
    <tr>
      <td className="font-medium">{member.code}</td>
      <td>{member.name}</td>
      <td>{member.phone || '-'}</td>
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
          <button
            onClick={() => onEdit(member)}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            แก้ไข
          </button>
          <button
            onClick={() => onDelete(member)}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            ลบ
          </button>
        </div>
      </td>
    </tr>
  );
};
