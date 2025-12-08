import { useState, useCallback, useEffect, useRef } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { logger } from '@/lib/logger';

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

export const usePurchaseData = () => {
  const [loading, setLoading] = useState(true);
  // Don't load all purchases - they're not needed for the purchase form
  // Only load when explicitly requested
  const [purchases, setPurchases] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [dailyPrices, setDailyPrices] = useState<any[]>([]);
  
  // Use refs to store cancel tokens for cleanup
  const cancelTokensRef = useRef<CancelTokenSource[]>([]);

  // Cleanup function to cancel pending requests
  const cleanup = useCallback(() => {
    cancelTokensRef.current.forEach(source => {
      source.cancel('Component unmounted');
    });
    cancelTokensRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const loadPurchases = useCallback(async () => {
    const cancelToken = axios.CancelToken.source();
    cancelTokensRef.current.push(cancelToken);
    
    try {
      const response = await axios.get('/api/purchases', {
        cancelToken: cancelToken.token,
      });
      setPurchases(response.data);
    } catch (error) {
      if (axios.isCancel(error)) {
        logger.debug('Purchase load cancelled');
        return;
      }
      logger.error('Failed to load purchases', error);
    } finally {
      setLoading(false);
      // Remove this token from the array
      cancelTokensRef.current = cancelTokensRef.current.filter(t => t !== cancelToken);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    const cancelToken = axios.CancelToken.source();
    cancelTokensRef.current.push(cancelToken);
    
    try {
      const response = await axios.get('/api/members?active=true&limit=1000', {
        cancelToken: cancelToken.token,
      });
      // Handle paginated response - extract members array
      const membersData = response.data.members || response.data;
      setMembers(membersData);
    } catch (error) {
      if (axios.isCancel(error)) {
        logger.debug('Members load cancelled');
        return;
      }
      logger.error('Failed to load members', error);
    } finally {
      // Remove this token from the array
      cancelTokensRef.current = cancelTokensRef.current.filter(t => t !== cancelToken);
    }
  }, []);

  const loadProductTypes = useCallback(async () => {
    const cancelToken = axios.CancelToken.source();
    cancelTokensRef.current.push(cancelToken);
    
    try {
      const response = await axios.get('/api/product-types', {
        cancelToken: cancelToken.token,
      });
      setProductTypes(response.data);
    } catch (error) {
      if (axios.isCancel(error)) {
        logger.debug('Product types load cancelled');
        return;
      }
      logger.error('Failed to load product types', error);
    } finally {
      // Remove this token from the array
      cancelTokensRef.current = cancelTokensRef.current.filter(t => t !== cancelToken);
    }
  }, []);

  const loadDailyPrices = useCallback(async () => {
    const cancelToken = axios.CancelToken.source();
    cancelTokensRef.current.push(cancelToken);
    
    try {
      const response = await axios.get('/api/prices/daily', {
        cancelToken: cancelToken.token,
      });
      logger.debug('Daily prices API response', { count: response.data.length, sample: response.data[0] });
      setDailyPrices(response.data);
    } catch (error) {
      if (axios.isCancel(error)) {
        logger.debug('Daily prices load cancelled');
        return;
      }
      logger.error('Failed to load daily prices', error);
    } finally {
      // Remove this token from the array
      cancelTokensRef.current = cancelTokensRef.current.filter(t => t !== cancelToken);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      // Only load essential data, not all purchases
      await Promise.all([
        loadMembers(),
        loadProductTypes(),
        loadDailyPrices(),
      ]);
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      logger.error('Failed to load data', error);
    }
  }, [loadMembers, loadProductTypes, loadDailyPrices]);

  return {
    loading,
    purchases,
    members,
    productTypes,
    dailyPrices,
    loadData,
    loadPurchases,
  };
};
