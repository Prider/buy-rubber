import { useState, useCallback } from 'react';
import axios from 'axios';

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
      console.error('Load purchases error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const response = await axios.get('/api/members?active=true');
      setMembers(response.data);
    } catch (error) {
      console.error('Load members error:', error);
    }
  }, []);

  const loadProductTypes = useCallback(async () => {
    try {
      const response = await axios.get('/api/product-types');
      setProductTypes(response.data);
    } catch (error) {
      console.error('Load product types error:', error);
    }
  }, []);

  const loadDailyPrices = useCallback(async () => {
    try {
      const response = await axios.get('/api/prices/daily');
      console.log('Daily prices API response:', response.data);
      console.log('Number of daily prices found:', response.data.length);
      if (response.data.length > 0) {
        console.log('Sample daily price:', response.data[0]);
      }
      setDailyPrices(response.data);
    } catch (error) {
      console.error('Load daily prices error:', error);
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
      console.error('Load data error:', error);
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
