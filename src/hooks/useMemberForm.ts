import { useState, useCallback } from 'react';
import axios from 'axios';
import { Member, MemberFormData } from '@/types/member';
import { generateMemberCode, validateMemberData } from '@/lib/memberUtils';

export const useMemberForm = (members: Member[]) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    code: '',
    phone: '',
    address: '',
    ownerPercent: 100,
    tapperPercent: 0,
    tapperName: '',
  });

  const openFormForNew = useCallback(async () => {
    let newCode = '';
    
    try {
      const response = await axios.get('/api/members/next-code');
      if (response.data?.code) {
        newCode = response.data.code;
      } else {
        throw new Error('No code returned from API');
      }
    } catch (error) {
      console.error('Failed to fetch next member code from server.', error);
      // Fallback to client-side random generation only if API completely fails
      newCode = generateMemberCode();
    }
    
    setFormData({
      name: '',
      code: newCode,
      phone: '',
      address: '',
      ownerPercent: 100,
      tapperPercent: 0,
      tapperName: '',
    });
    setEditingMember(null);
    setIsOpen(true);
  }, []);

  const openFormForEdit = useCallback((member: Member) => {
    setFormData({
      name: member.name,
      code: member.code,
      phone: member.phone || '',
      address: member.address || '',
      ownerPercent: member.ownerPercent,
      tapperPercent: member.tapperPercent,
      tapperName: member.tapperName || '',
    });
    setEditingMember(member);
    setIsOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsOpen(false);
    setEditingMember(null);
    setFormData({
      name: '',
      code: '',
      phone: '',
      address: '',
      ownerPercent: 100,
      tapperPercent: 0,
      tapperName: '',
    });
  }, []);

  const updateFormData = useCallback((data: Partial<MemberFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const validateForm = useCallback(() => {
    return validateMemberData(formData, members, editingMember);
  }, [formData, members, editingMember]);

  return {
    isOpen,
    editingMember,
    formData,
    openFormForNew,
    openFormForEdit,
    closeForm,
    updateFormData,
    validateForm,
  };
};
