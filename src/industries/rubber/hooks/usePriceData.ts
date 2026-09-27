import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { clientAuthHeaders } from '@/platform/sessionToken';
import { logger } from '@/shared/logger';

interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}
export function usePriceData() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    const headers = clientAuthHeaders();
    const [productTypesResult, pricesResult] = await Promise.allSettled([
      axios.get('/api/product-types', { params: { includeInactive: '1' }, headers }),
      axios.get('/api/prices/history?days=11', { headers }),
    ]);

    let loadedProductTypes: ProductType[] = [];
    if (productTypesResult.status === 'fulfilled') {
      const data = productTypesResult.value.data;
      loadedProductTypes = Array.isArray(data) ? data : [];
      setProductTypes(loadedProductTypes);
    } else {
      logger.error('Failed to load product types', productTypesResult.reason);
      setProductTypes([]);
    }

    if (pricesResult.status === 'fulfilled') {
      const data = pricesResult.value.data;
      setPriceHistory(Array.isArray(data) ? data : []);
    } else {
      logger.error('Failed to load price history', pricesResult.reason);
      setPriceHistory([]);
    }

    logger.debug('Price data loaded', {
      productTypes: loadedProductTypes.length,
      totalPrices: pricesResult.status === 'fulfilled' && Array.isArray(pricesResult.value.data)
        ? pricesResult.value.data.length
        : 0,
    });

    setLoading(false);
    return loadedProductTypes;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router, loadData]);

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

