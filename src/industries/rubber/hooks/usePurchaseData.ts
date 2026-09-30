import { useState, useCallback, useEffect, useRef } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { clientAuthHeaders } from '@/platform/sessionToken';
import { logger } from '@/shared/logger';

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

export const usePurchaseData = () => {
  const [loading, setLoading] = useState(true);
  // Don't load all purchases - they're not needed for the purchase form
  // Only load when explicitly requested
  const [purchases, setPurchases] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [dailyPrices, setDailyPrices] = useState<any[]>([]);
  const [memberGroups, setMemberGroups] = useState<Array<{ id: string; prices: Array<{ productTypeId: string; price: number }> }>>([]);
  
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
        headers: clientAuthHeaders(),
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
        headers: clientAuthHeaders(),
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
        headers: clientAuthHeaders(),
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
        headers: clientAuthHeaders(),
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

  const loadMemberGroups = useCallback(async () => {
    const cancelToken = axios.CancelToken.source();
    cancelTokensRef.current.push(cancelToken);

    try {
      const response = await axios.get('/api/member-groups', {
        cancelToken: cancelToken.token,
        headers: clientAuthHeaders(),
      });
      setMemberGroups(response.data);
    } catch (error) {
      if (axios.isCancel(error)) {
        logger.debug('Member groups load cancelled');
        return;
      }
      logger.error('Failed to load member groups', error);
    } finally {
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
        loadMemberGroups(),
      ]);
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      logger.error('Failed to load data', error);
    }
  }, [loadMembers, loadProductTypes, loadDailyPrices, loadMemberGroups]);

  return {
    loading,
    purchases,
    members,
    productTypes,
    dailyPrices,
    memberGroups,
    loadData,
    loadPurchases,
  };
};
