import { useState, useCallback } from 'react';
import axios from 'axios';
import { DestinationCompany, DestinationCompanyFormData } from '@/types/destinationCompany';
import {
  generateDestinationCompanyCode,
  validateDestinationCompanyData,
} from '@/lib/destinationCompanyUtils';

const emptyForm = (): DestinationCompanyFormData => ({
  name: '',
  code: '',
  phone: '',
  address: '',
});

export const useDestinationCompanyForm = (companies: DestinationCompany[]) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<DestinationCompany | null>(null);
  const [formData, setFormData] = useState<DestinationCompanyFormData>(emptyForm);

  const openFormForNew = useCallback(async () => {
    let newCode = '';
    try {
      const response = await axios.get('/api/destination-companies/next-code');
      if (response.data?.code) {
        newCode = response.data.code;
      } else {
        throw new Error('No code returned from API');
      }
    } catch {
      newCode = generateDestinationCompanyCode();
    }

    setFormData({ ...emptyForm(), code: newCode });
    setEditingCompany(null);
    setIsOpen(true);
  }, []);

  const openFormForEdit = useCallback((company: DestinationCompany) => {
    setFormData({
      name: company.name,
      code: company.code,
      phone: company.phone || '',
      address: company.address || '',
    });
    setEditingCompany(company);
    setIsOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsOpen(false);
    setEditingCompany(null);
    setFormData(emptyForm());
  }, []);

  const updateFormData = useCallback((data: Partial<DestinationCompanyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const validateForm = useCallback(() => {
    return validateDestinationCompanyData(formData, companies, editingCompany);
  }, [formData, companies, editingCompany]);

  return {
    isOpen,
    editingCompany,
    formData,
    openFormForNew,
    openFormForEdit,
    closeForm,
    updateFormData,
    validateForm,
  };
};
