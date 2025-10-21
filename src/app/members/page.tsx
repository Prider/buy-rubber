'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import axios from 'axios';
import { formatCurrency } from '@/lib/utils';

export default function MembersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    address: '',
    ownerPercent: 100,
    tapperPercent: 0,
    tapperName: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadMembers();
  }, [router]);

  const loadMembers = async () => {
    try {
      const response = await axios.get('/api/members?active=true');
      setMembers(response.data);
    } catch (error) {
      console.error('Load members error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMemberCode = () => {
    // Extract all existing codes that start with 'M' followed by numbers
    const existingCodes = members
      .map(m => m.code)
      .filter(code => /^M\d+$/.test(code)) // Match format M001, M002, etc.
      .map(code => parseInt(code.substring(1))) // Extract the number part
      .filter(num => !isNaN(num)); // Filter out invalid numbers

    // Find the highest number
    const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    
    // Generate next code with padding (M001, M002, etc.)
    const nextNumber = maxNumber + 1;
    return `M${String(nextNumber).padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate name when adding new member
    if (!editingMember) {
      const duplicateName = members.find(
        member => member.name.toLowerCase() === formData.name.toLowerCase()
      );
      
      if (duplicateName) {
        alert(`ชื่อ "${formData.name}" มีอยู่ในระบบแล้ว (รหัส: ${duplicateName.code})\nกรุณาใช้ชื่ออื่น`);
        return;
      }
    } else {
      // When editing, check if the new name conflicts with other members (not itself)
      const duplicateName = members.find(
        member => member.id !== editingMember.id && 
                  member.name.toLowerCase() === formData.name.toLowerCase()
      );
      
      if (duplicateName) {
        alert(`ชื่อ "${formData.name}" มีอยู่ในระบบแล้ว (รหัส: ${duplicateName.code})\nกรุณาใช้ชื่ออื่น`);
        return;
      }
    }
    
    try {
      if (editingMember) {
        await axios.put(`/api/members/${editingMember.id}`, formData);
      } else {
        await axios.post('/api/members', formData);
      }
      setShowForm(false);
      setEditingMember(null);
      loadMembers();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      phone: '',
      address: '',
      ownerPercent: 100,
      tapperPercent: 0,
      tapperName: '',
    });
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      code: member.code,
      phone: member.phone || '',
      address: member.address || '',
      ownerPercent: member.ownerPercent,
      tapperPercent: member.tapperPercent,
      tapperName: member.tapperName || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (member: any) => {
    if (!confirm(`คุณต้องการลบสมาชิก "${member.name}" (${member.code}) หรือไม่?\n\nการลบนี้ไม่สามารถกู้คืนได้`)) {
      return;
    }

    try {
      await axios.delete(`/api/members/${member.id}`);
      loadMembers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'ไม่สามารถลบสมาชิกได้');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">จัดการสมาชิก</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ข้อมูลเจ้าของสวนและคนตัดยาง
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingMember(null);
              // Auto-generate code for new member
              const newCode = generateMemberCode();
              setFormData(prev => ({ ...prev, code: newCode }));
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            + เพิ่มสมาชิก
          </button>
        </div>

        {/* Members Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : members.length > 0 ? (
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
                    <tr key={member.id}>
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
                            onClick={() => handleEdit(member)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">ยังไม่มีสมาชิก</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingMember ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">รหัสสมาชิก * {!editingMember && <span className="text-xs text-gray-500 dark:text-gray-400">(สร้างอัตโนมัติ)</span>}</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="input bg-gray-100 dark:bg-gray-700"
                    required
                    disabled={true}
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="label">เบอร์โทร</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="input"
                />
              </div>

              <div>
                <label className="label">ที่อยู่</label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="input"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">% เจ้าของสวน</label>
                  <input
                    type="number"
                    value={formData.ownerPercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ownerPercent: parseFloat(e.target.value),
                      })
                    }
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="label">% คนตัด</label>
                  <input
                    type="number"
                    value={formData.tapperPercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tapperPercent: parseFloat(e.target.value),
                      })
                    }
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="label">ชื่อคนตัด</label>
                <input
                  type="text"
                  value={formData.tapperName}
                  onChange={(e) =>
                    setFormData({ ...formData, tapperName: e.target.value })
                  }
                  className="input"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMember(null);
                  }}
                  className="btn btn-secondary"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMember ? 'บันทึก' : 'เพิ่มสมาชิก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

