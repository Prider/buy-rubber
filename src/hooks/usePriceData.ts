import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { logger } from '@/lib/logger';

interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
}
export function usePriceData() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [productTypesRes, pricesRes] = await Promise.all([
        axios.get('/api/product-types'),
        axios.get('/api/prices/history?days=11'), // Get today + last 10 days
      ]);
      
      setProductTypes(productTypesRes.data || []);
      setPriceHistory(pricesRes.data || []);
      
      const todayDate = new Date().toISOString().split('T')[0];
      logger.debug('Price data loaded', { 
        todayDate, 
        totalPrices: pricesRes.data?.length, 
        productTypes: productTypesRes.data?.length 
      });

      return productTypesRes.data || [];
    } catch (error) {
      logger.error('Failed to load price data', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getPriceForDateAndType = (date: string, productTypeId: string) => {
    const record = priceHistory.find(
      h => {
        // Handle both ISO string and Date object
        let recordDate: string;
        if (typeof h.date === 'string') {
          recordDate = h.date.split('T')[0];
        } else {
          recordDate = new Date(h.date).toISOString().split('T')[0];
        }
        return recordDate === date && h.productTypeId === productTypeId;
      }
    );
    
    return record?.price || null;
  };

  return {
    loading,
    productTypes,
    priceHistory,
    loadData,
    getPriceForDateAndType,
  };
}

