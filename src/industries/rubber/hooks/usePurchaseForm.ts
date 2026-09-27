import { useState, useCallback, useEffect, useMemo } from 'react';
import { logger } from '@/shared/logger';
import { GroupPriceSheet, resolvePurchaseUnitPrice } from '@/industries/rubber/domain/purchaseUnitPrice';

interface Member {
  id: string;
  code: string;
  name: string;
  ownerPercent: number;
  tapperPercent: number;
  groupId?: string | null;
  group?: { id: string; name: string } | null;
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
  memberGroups?: GroupPriceSheet[];
}

export const usePurchaseForm = ({ members, productTypes, dailyPrices, memberGroups = [] }: UsePurchaseFormProps) => {
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Memoize today's date to prevent unnecessary recalculations
  const todayDate = useMemo(() => getTodayDate(), []);

  // Track the last date explicitly chosen by the user.
  // This prevents resetForm (after Add to cart) from snapping back to today.
  const [userSelectedDate, setUserSelectedDate] = useState<string>(todayDate);
  
  const [formData, setFormData] = useState<PurchaseFormData>({
    date: userSelectedDate,
    memberId: '',
    productTypeId: '',
    grossWeight: '',
    containerWeight: '',
    netWeight: '',
    pricePerUnit: '',
    bonusPrice: '',
    notes: '',
  });

  // Ensure date is always set to today if empty
  useEffect(() => {
    if (!formData.date) {
      setFormData(prev => ({ ...prev, date: todayDate }));
    }
  }, [formData.date, todayDate]);

  const [error, setError] = useState('');
  
  // Member search state
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Product type search state
  const [productTypeSearchTerm, setProductTypeSearchTerm] = useState('');
  const [showProductTypeDropdown, setShowProductTypeDropdown] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);

  // Recent purchases for selected product type
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

  // Filter members based on search term
  const filteredMembers = (members || []).filter(member => 
    member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.code.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  // Filter product types based on search term
  const filteredProductTypes = (productTypes || []).filter(type =>
    type.name.toLowerCase().includes(productTypeSearchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(productTypeSearchTerm.toLowerCase())
  );

  // Fetch recent purchases for a product type and member
  const fetchRecentPurchases = useCallback(async (productTypeId: string, memberId?: string) => {
    if (!memberId) {
      setRecentPurchases([]);
      return;
    }

    try {
      const response = await fetch(`/api/purchases?productTypeId=${productTypeId}&memberId=${memberId}&limit=3`);
      if (response.ok) {
        const purchases = await response.json();
        setRecentPurchases(purchases.slice(0, 3)); // Max 3 purchases
      } else {
        setRecentPurchases([]);
      }
    } catch (error) {
      logger.error('Failed to fetch recent purchases', error);
      setRecentPurchases([]);
    }
  }, []);

  // Handle member selection
  const unitPriceFor = useCallback((productTypeId: string, member?: Member | null) => {
    return resolvePurchaseUnitPrice({
      dailyPrices,
      memberGroups,
      groupId: member?.group?.id || member?.groupId,
      productTypeId,
      todayDate,
    });
  }, [dailyPrices, memberGroups, todayDate]);

  const memberLabel = (member: Member) =>
    member.group?.name ? `${member.code} - ${member.name} (${member.group.name})` : `${member.code} - ${member.name}`;

  const handleMemberSelect = useCallback((member: Member) => {
    setSelectedMember(member);
    setMemberSearchTerm(memberLabel(member));
    setFormData(prev => ({
      ...prev,
      memberId: member.id,
      pricePerUnit: prev.productTypeId ? unitPriceFor(prev.productTypeId, member) : prev.pricePerUnit,
    }));
    setShowMemberDropdown(false);

    // If a product type is already selected, refetch recent purchases for this member + product type
    if (formData.productTypeId && member.id) {
      fetchRecentPurchases(formData.productTypeId, member.id);
    } else {
      setRecentPurchases([]);
    }
  }, [formData.productTypeId, fetchRecentPurchases, unitPriceFor]);

  // Handle member search input change
  const handleMemberSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMemberSearchTerm(value);
    setShowMemberDropdown(true);
    
    // Clear selection if search term doesn't match selected member
    if (selectedMember && !value.includes(selectedMember.code)) {
      setSelectedMember(null);
      setFormData(prev => ({ ...prev, memberId: '' }));
      setRecentPurchases([]);
    }
  }, [selectedMember]);

  // Handle product type selection
  const handleProductTypeSelect = useCallback((productType: ProductType) => {
    setSelectedProductType(productType);
    setProductTypeSearchTerm(`${productType.code} - ${productType.name}`);
    setShowProductTypeDropdown(false);
    
    fetchRecentPurchases(productType.id, formData.memberId);

    const member = members.find((item) => item.id === formData.memberId) ?? null;
    setFormData(prev => ({
      ...prev,
      productTypeId: productType.id,
      pricePerUnit: unitPriceFor(productType.id, member),
    }));
  }, [fetchRecentPurchases, formData.memberId, members, unitPriceFor]);

  // Handle product type search input change
  const handleProductTypeSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProductTypeSearchTerm(value);
    setShowProductTypeDropdown(true);
    
    // Clear selection if search term doesn't match selected product type
    if (selectedProductType && !value.includes(selectedProductType.code)) {
      setSelectedProductType(null);
      setFormData(prev => ({ ...prev, productTypeId: '', pricePerUnit: '' }));
      setRecentPurchases([]);
    }
  }, [selectedProductType]);

  // Clear product type search
  const clearProductTypeSearch = useCallback(() => {
    setProductTypeSearchTerm('');
    setSelectedProductType(null);
    setFormData(prev => ({ ...prev, productTypeId: '', pricePerUnit: '' }));
    setRecentPurchases([]);
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'date' && value !== todayDate) {
      setUserSelectedDate(value);
    }
    
    if (name === 'productTypeId' && value) {
      fetchRecentPurchases(value, formData.memberId);
      const member = members.find((item) => item.id === formData.memberId) ?? null;
      setFormData(prev => ({
        ...prev,
        [name]: value,
        pricePerUnit: unitPriceFor(value, member),
      }));
    } 
    // Calculate net weight when gross weight or container weight changes
    else if (name === 'grossWeight' || name === 'containerWeight') {
      // Block negative values for containerWeight
      if (name === 'containerWeight') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue < 0) {
          return; // Don't update if negative
        }
      }
      
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        const grossWeight = parseFloat(newData.grossWeight) || 0;
        const containerWeight = parseFloat(newData.containerWeight) || 0;
        
        // Validate that container weight is less than gross weight (allow 0)
        if (grossWeight > 0 && containerWeight >= 0 && containerWeight >= grossWeight) {
          setError('น้ำหนักภาชนะต้องน้อยกว่าน้ำหนักรวมภาชนะ');
        } else {
          // Clear error if validation passes (only if it was a weight validation error)
          setError(prevError => {
            if (prevError === 'น้ำหนักภาชนะต้องน้อยกว่าน้ำหนักรวมภาชนะ') {
              return '';
            }
            return prevError;
          });
        }
        
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
  }, [fetchRecentPurchases, formData.memberId, members, todayDate, unitPriceFor]);

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
    const grossWeight = parseFloat(formData.grossWeight) || 0;
    // Default containerWeight to 0 if empty
    const containerWeight = formData.containerWeight === '' ? 0 : (parseFloat(formData.containerWeight) || 0);
    // Allow containerWeight to be 0, but it must be less than grossWeight when both are set
    const isWeightValid = grossWeight > 0 && containerWeight >= 0 && containerWeight < grossWeight;
    
    return !!(
      formData.memberId && 
      formData.productTypeId && 
      formData.grossWeight && 
      formData.netWeight && 
      formData.pricePerUnit &&
      isWeightValid &&
      !error
    );
  }, [
    formData.memberId, 
    formData.productTypeId, 
    formData.grossWeight, 
    formData.containerWeight, 
    formData.netWeight, 
    formData.pricePerUnit,
    error
  ]);

  // Reset form (keeping member selection for quick multiple entries)
  const resetForm = useCallback(() => {
    setFormData(prev => ({
      date: userSelectedDate || prev.date,
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
    setProductTypeSearchTerm('');
    setSelectedProductType(null);
    setShowProductTypeDropdown(false);
  }, [userSelectedDate]);

  // Reset ALL fields including member (for Reset button)
  const resetAllFields = useCallback(() => {
    setFormData({
      date: todayDate,
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
    setProductTypeSearchTerm('');
    setSelectedProductType(null);
    setShowProductTypeDropdown(false);
  }, [todayDate]);

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
    productTypeSearchTerm,
    showProductTypeDropdown,
    selectedProductType,
    filteredProductTypes,
    handleProductTypeSelect,
    handleProductTypeSearchChange,
    clearProductTypeSearch,
    setShowProductTypeDropdown,
  };
};
