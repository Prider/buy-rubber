import { useState, useCallback } from 'react';
import axios from 'axios';
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
  const [purchases, setPurchases] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [dailyPrices, setDailyPrices] = useState<any[]>([]);

  const loadPurchases = useCallback(async () => {
    try {
      const response = await axios.get('/api/purchases');
      setPurchases(response.data);
    } catch (error) {
      logger.error('Failed to load purchases', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const response = await axios.get('/api/members?active=true&limit=1000');
      // Handle paginated response - extract members array
      const membersData = response.data.members || response.data;
      setMembers(membersData);
    } catch (error) {
      logger.error('Failed to load members', error);
    }
  }, []);

  const loadProductTypes = useCallback(async () => {
    try {
      const response = await axios.get('/api/product-types');
      setProductTypes(response.data);
    } catch (error) {
      logger.error('Failed to load product types', error);
    }
  }, []);

  const loadDailyPrices = useCallback(async () => {
    try {
      const response = await axios.get('/api/prices/daily');
      logger.debug('Daily prices API response', { count: response.data.length, sample: response.data[0] });
      setDailyPrices(response.data);
    } catch (error) {
      logger.error('Failed to load daily prices', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        loadPurchases(),
        loadMembers(),
        loadProductTypes(),
        loadDailyPrices(),
      ]);
    } catch (error) {
      logger.error('Failed to load data', error);
    }
  }, [loadPurchases, loadMembers, loadProductTypes, loadDailyPrices]);

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
