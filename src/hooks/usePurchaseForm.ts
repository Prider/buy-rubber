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
  grossWeight: string; // น้ำหนักรวมภาชนะ (total weight with container)
  containerWeight: string; // น้ำหนักภาชนะ (container weight)
  netWeight: string; // น้ำหนักสุทธิ (net weight - calculated)
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
    containerWeight: '',
    netWeight: '',
    pricePerUnit: '',
    bonusPrice: '',
    notes: '',
  });

  const [error, setError] = useState('');
  
  // Member search state
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Recent purchases for selected product type
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

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

  // Fetch recent purchases for a product type
  const fetchRecentPurchases = useCallback(async (productTypeId: string) => {
    try {
      const response = await fetch(`/api/purchases?productTypeId=${productTypeId}&limit=3`);
      if (response.ok) {
        const purchases = await response.json();
        setRecentPurchases(purchases.slice(0, 3)); // Max 3 purchases
      }
    } catch (error) {
      console.error('Error fetching recent purchases:', error);
      setRecentPurchases([]);
    }
  }, []);

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
      
      // Fetch recent purchases for this product type
      fetchRecentPurchases(value);
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        pricePerUnit: priceForProductType ? priceForProductType.price.toString() : '',
      }));
    } 
    // Calculate net weight when gross weight or container weight changes
    else if (name === 'grossWeight' || name === 'containerWeight') {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        const grossWeight = parseFloat(newData.grossWeight) || 0;
        const containerWeight = parseFloat(newData.containerWeight) || 0;
        const netWeight = grossWeight - containerWeight;
        
        return {
          ...newData,
          netWeight: netWeight > 0 ? netWeight.toFixed(2) : '',
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  }, [dailyPrices]);

  // Calculate total amount
  const calculateTotalAmount = useCallback(() => {
    const netWeight = parseFloat(formData.netWeight) || 0;
    const pricePerUnit = parseFloat(formData.pricePerUnit) || 0;
    const bonusPrice = parseFloat(formData.bonusPrice) || 0;
    const finalPrice = pricePerUnit + bonusPrice;
    const totalAmount = netWeight * finalPrice;
    return totalAmount > 0 ? totalAmount.toFixed(2) : '';
  }, [formData.netWeight, formData.pricePerUnit, formData.bonusPrice]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return !!(
      formData.memberId && 
      formData.productTypeId && 
      formData.grossWeight && 
      formData.containerWeight && 
      formData.netWeight && 
      formData.pricePerUnit
    );
  }, [
    formData.memberId, 
    formData.productTypeId, 
    formData.grossWeight, 
    formData.containerWeight, 
    formData.netWeight, 
    formData.pricePerUnit
  ]);

  // Reset form (keeping member selection for quick multiple entries)
  const resetForm = useCallback(() => {
    setFormData(prev => ({
      date: new Date().toISOString().split('T')[0],
      memberId: prev.memberId, // Keep member selection
      productTypeId: '',
      grossWeight: '',
      containerWeight: '',
      netWeight: '',
      pricePerUnit: '',
      bonusPrice: '',
      notes: '',
    }));
    setError('');
    setRecentPurchases([]); // Clear recent purchases
    // Keep member search term and selected member
    setShowMemberDropdown(false);
  }, []);

  // Reset ALL fields including member (for Reset button)
  const resetAllFields = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      memberId: '',
      productTypeId: '',
      grossWeight: '',
      containerWeight: '',
      netWeight: '',
      pricePerUnit: '',
      bonusPrice: '',
      notes: '',
    });
    setError('');
    setMemberSearchTerm('');
    setSelectedMember(null);
    setRecentPurchases([]); // Clear recent purchases
    setShowMemberDropdown(false);
  }, []);

  // Clear member search
  const clearMemberSearch = useCallback(() => {
    setMemberSearchTerm('');
    setSelectedMember(null);
    setFormData(prev => ({ ...prev, memberId: '' }));
  }, []);

  // Apply suggested price from recent purchase
  const applySuggestedPrice = useCallback((price: number) => {
    setFormData(prev => ({
      ...prev,
      pricePerUnit: price.toString(),
    }));
  }, []);

  return {
    formData,
    error,
    setError,
    memberSearchTerm,
    showMemberDropdown,
    selectedMember,
    filteredMembers,
    recentPurchases,
    handleMemberSelect,
    handleMemberSearchChange,
    handleInputChange,
    calculateTotalAmount,
    isFormValid,
    resetForm,
    resetAllFields,
    clearMemberSearch,
    applySuggestedPrice,
    setShowMemberDropdown,
  };
};
