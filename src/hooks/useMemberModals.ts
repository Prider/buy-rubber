import { useState, useCallback } from 'react';
import { Member } from '@/types/member';

/**
 * Custom hook for managing member-related modals
 * Separates modal state management from the main component
 */
export const useMemberModals = () => {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<Member | null>(null);
  const [serviceFeeModalOpen, setServiceFeeModalOpen] = useState(false);
  const [selectedMemberForServiceFees, setSelectedMemberForServiceFees] = useState<Member | null>(null);

  const openHistoryModal = useCallback((member: Member) => {
    setSelectedMemberForHistory(member);
    setHistoryModalOpen(true);
  }, []);

  const closeHistoryModal = useCallback(() => {
    setHistoryModalOpen(false);
    setSelectedMemberForHistory(null);
  }, []);

  const openServiceFeeModal = useCallback((member: Member) => {
    setSelectedMemberForServiceFees(member);
    setServiceFeeModalOpen(true);
  }, []);

  const closeServiceFeeModal = useCallback(() => {
    setServiceFeeModalOpen(false);
    setSelectedMemberForServiceFees(null);
  }, []);

  return {
    historyModal: {
      isOpen: historyModalOpen,
      member: selectedMemberForHistory,
      open: openHistoryModal,
      close: closeHistoryModal,
    },
    serviceFeeModal: {
      isOpen: serviceFeeModalOpen,
      member: selectedMemberForServiceFees,
      open: openServiceFeeModal,
      close: closeServiceFeeModal,
    },
  };
};

