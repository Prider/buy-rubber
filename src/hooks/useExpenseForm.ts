import { useState, useCallback } from 'react';

interface ExpenseFormData {
  category: string;
  amount: string;
}

export const useExpenseForm = () => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: '',
    amount: '',
  });

  const [error, setError] = useState('');

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  }, []);

  const setCategory = useCallback((category: string) => {
    setFormData(prev => ({ ...prev, category }));
    setError('');
  }, []);

  const loadForm = useCallback((data: ExpenseFormData) => {
    setFormData({
      category: data.category,
      amount: data.amount,
    });
    setError('');
  }, []);

  // Validate form
  const isFormValid = useCallback(() => {
    return !!(
      formData.category &&
      formData.amount &&
      parseFloat(formData.amount) > 0
    );
  }, [formData]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      category: '',
      amount: '',
    });
    setError('');
  }, []);

  return {
    formData,
    error,
    setError,
    handleInputChange,
    setCategory,
    loadForm,
    isFormValid,
    resetForm,
  };
};

