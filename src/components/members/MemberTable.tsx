import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { MemberTableProps } from '@/types/member';

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  onEdit,
  onDelete,
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
              <th>% เจ้าของสวน</th>
              <th>% คนตัด</th>
              <th>คนตัด</th>
              <th>เบิกล่วงหน้า</th>
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
}

const MemberTableRow: React.FC<MemberTableRowProps> = ({
  member,
  onEdit,
  onDelete,
}) => {
  return (
    <tr>
      <td className="font-medium">{member.code}</td>
      <td>{member.name}</td>
      <td>{member.phone || '-'}</td>
      <td>{member.ownerPercent}%</td>
      <td>{member.tapperPercent}%</td>
      <td>{member.tapperName || '-'}</td>
      <td className="text-orange-600">
        {formatCurrency(member.advanceBalance)}
      </td>
      <td>
        <div className="flex items-center space-x-3">
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
