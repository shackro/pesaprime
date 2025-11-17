// hooks/useAppData.ts - Custom hook for managing app data
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, type WalletData, type Asset, type UserInvestment } from '../services/api';

export const useAppData = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [marketAssets, setMarketAssets] = useState<Asset[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, refreshUser } = useAuth();

  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [wallet, assets, investments] = await Promise.all([
        apiService.getWalletBalance(),
        apiService.getAssets(),
        apiService.getMyInvestments()
      ]);
      
      setWalletData(wallet);
      setMarketAssets(assets);
      setUserInvestments(investments);
      await refreshUser();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  return {
    walletData,
    marketAssets,
    userInvestments,
    loading,
    refreshAllData,
    setWalletData,
    setMarketAssets,
    setUserInvestments
  };
};