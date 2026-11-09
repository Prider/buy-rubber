import { useState, useCallback } from 'react';
import { Member } from '@/types/member';

/**
 * Custom hook for managing member-related modals
 * Separates modal state management from the main component
 */
export const useMemberModals = () => {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<Member | null>(null);

  const openHistoryModal = useCallback((member: Member) => {
    setSelectedMemberForHistory(member);
    setHistoryModalOpen(true);
  }, []);

  const closeHistoryModal = useCallback(() => {
    setHistoryModalOpen(false);
    setSelectedMemberForHistory(null);
  }, []);

  return {
    historyModal: {
      isOpen: historyModalOpen,
      member: selectedMemberForHistory,
      open: openHistoryModal,
      close: closeHistoryModal,
    },
  };
};

