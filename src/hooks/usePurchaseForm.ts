import { useState, useCallback } from 'react';

interface Member {
  id: string;
  code: string;
  name: string;
  ownerPercent: number;
  tapperPercent: number;
}

interface ProductType {
  id: string;
  code: string;
  name: string;
}

interface PurchaseFormData {
  date: string;
  memberId: string;
  productTypeId: string;
  grossWeight: string;
  pricePerUnit: string;
  bonusPrice: string;
  notes: string;
}

interface UsePurchaseFormProps {
  members: Member[];
  productTypes: ProductType[];
  dailyPrices: any[];
}

export const usePurchaseForm = ({ members, productTypes, dailyPrices }: UsePurchaseFormProps) => {
  const [formData, setFormData] = useState<PurchaseFormData>({
    date: new Date().toISOString().split('T')[0],
    memberId: '',
    productTypeId: '',
    grossWeight: '',
    pricePerUnit: '',
    bonusPrice: '',
    notes: '',
  });

  const [error, setError] = useState('');
  
  // Member search state
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Filter members based on search term
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.code.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  // Handle member selection
  const handleMemberSelect = useCallback((member: Member) => {
    setSelectedMember(member);
    setMemberSearchTerm(`${member.code} - ${member.name}`);
    setFormData(prev => ({ ...prev, memberId: member.id }));
    setShowMemberDropdown(false);
  }, []);

  // Handle member search input change
  const handleMemberSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMemberSearchTerm(value);
    setShowMemberDropdown(true);
    
    // Clear selection if search term doesn't match selected member
    if (selectedMember && !value.includes(selectedMember.code)) {
      setSelectedMember(null);
      setFormData(prev => ({ ...prev, memberId: '' }));
    }
  }, [selectedMember]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If product type is selected, automatically set the price from daily prices
    if (name === 'productTypeId' && value) {
      const today = new Date().toISOString().split('T')[0];
      
      // Try to find exact date match first (compare date strings, handle timezone)
      let priceForProductType = dailyPrices.find(price => {
        if (!price.date) return false;
        const priceDate = new Date(price.date).toISOString().split('T')[0];
        return price.productTypeId === value && priceDate === today;
      });
      
      // If no exact match, try to find the most recent price for this product type
      if (!priceForProductType) {
        priceForProductType = dailyPrices
          .filter(price => price.productTypeId === value)
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          })[0];
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        pricePerUnit: priceForProductType ? priceForProductType.price.toString() : '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  }, [dailyPrices]);

  // Calculate total amount
  const calculateTotalAmount = useCallback(() => {
    const grossWeight = parseFloat(formData.grossWeight) || 0;
    const pricePerUnit = parseFloat(formData.pricePerUnit) || 0;
    const bonusPrice = parseFloat(formData.bonusPrice) || 0;
    const finalPrice = pricePerUnit + bonusPrice;
    const totalAmount = grossWeight * finalPrice;
    return totalAmount > 0 ? totalAmount.toFixed(2) : '';
  }, [formData.grossWeight, formData.pricePerUnit, formData.bonusPrice]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return !!(formData.memberId && formData.productTypeId && formData.grossWeight && formData.pricePerUnit);
  }, [formData.memberId, formData.productTypeId, formData.grossWeight, formData.pricePerUnit]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      memberId: '',
      productTypeId: '',
      grossWeight: '',
      pricePerUnit: '',
      bonusPrice: '',
      notes: '',
    });
    setError('');
    setMemberSearchTerm('');
    setSelectedMember(null);
    setShowMemberDropdown(false);
  }, []);

  // Clear member search
  const clearMemberSearch = useCallback(() => {
    setMemberSearchTerm('');
    setSelectedMember(null);
    setFormData(prev => ({ ...prev, memberId: '' }));
  }, []);

  return {
    formData,
    error,
    setError,
    memberSearchTerm,
    showMemberDropdown,
    selectedMember,
    filteredMembers,
    handleMemberSelect,
    handleMemberSearchChange,
    handleInputChange,
    calculateTotalAmount,
    isFormValid,
    resetForm,
    clearMemberSearch,
    setShowMemberDropdown,
  };
};
