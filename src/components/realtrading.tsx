// components/RealTrading.tsx - SIMPLIFIED WORKING VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { apiService, type Asset, type UserInvestment, type WalletData } from '../services/api';

interface TradingProps {
  onInvestmentUpdate?: () => void;
}

const RealTrading: React.FC<TradingProps> = ({ onInvestmentUpdate }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { user } = useAuth();
  const { formatCurrency, convertAmount, currentCurrency } = useCurrency();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assetsData, wallet] = await Promise.all([
        apiService.getAssets(),
        user ? apiService.getWalletBalance(user.phone_number) : Promise.resolve(null)
      ]);
      setAssets(assetsData);
      setWalletData(wallet);
      
      // Auto-select first asset
      if (assetsData.length > 0 && !selectedAsset) {
        setSelectedAsset(assetsData[0]);
        setInvestmentAmount(formatMinInvestment(assetsData[0].min_investment_kes));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const formatMinInvestment = (minKes: number): string => {
    const converted = convertAmount(minKes);
    return converted.toString();
  };

  const getConvertedMinInvestment = (asset: Asset): number => {
    return convertAmount(asset.min_investment_kes);
  };

  const getConvertedHourlyIncome = (asset: Asset): number => {
    return convertAmount(asset.hourly_income_kes);
  };

  const getConvertedTotalIncome = (asset: Asset): number => {
    return convertAmount(asset.total_income_kes);
  };

  const handleInvest = async () => {
    if (!selectedAsset || !user || !walletData) {
      setMessage({ type: 'error', text: 'Please select an asset and ensure you are logged in' });
      return;
    }

    const amount = parseFloat(investmentAmount);
    const minInvestment = getConvertedMinInvestment(selectedAsset);

    if (isNaN(amount) || amount < minInvestment) {
      setMessage({ type: 'error', text: `Minimum investment is ${formatCurrency(minInvestment)}` });
      return;
    }

    // Convert back to KES for API
    const amountKes = amount / currentCurrency.exchangeRate;

    if (amountKes > walletData.balance) {
      setMessage({ type: 'error', text: 'Insufficient balance' });
      return;
    }

    setIsInvesting(true);
    setMessage(null);

    try {
      const investmentData = {
        asset_id: selectedAsset.id,
        amount: amount,
        phone_number: user.phone_number,
        currency: currentCurrency.code
      };

      const result = await apiService.buyInvestment(investmentData);
      
      setMessage({ type: 'success', text: result.message });
      setInvestmentAmount(formatMinInvestment(selectedAsset.min_investment_kes));
      
      // Refresh data
      await loadData();
      if (onInvestmentUpdate) onInvestmentUpdate();
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Investment failed' });
    } finally {
      setIsInvesting(false);
    }
  };

  const AssetCard = ({ asset }: { asset: Asset }) => {
    const minInvestment = getConvertedMinInvestment(asset);
    const hourlyIncome = getConvertedHourlyIncome(asset);
    const totalIncome = getConvertedTotalIncome(asset);

    return (
      <div 
        className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 text-white cursor-pointer border-2 ${
          selectedAsset?.id === asset.id ? 'border-green-500' : 'border-transparent'
        }`}
        onClick={() => {
          setSelectedAsset(asset);
          setInvestmentAmount(minInvestment.toString());
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold text-lg">{asset.name}</h3>
            <p className="text-gray-400 text-sm">{asset.symbol}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs ${
            asset.trend === 'up' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {asset.change_percentage}%
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Price:</span>
            <span>${asset.current_price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Min Investment:</span>
            <span className="text-yellow-400">{formatCurrency(minInvestment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Hourly Income:</span>
            <span className="text-green-400">{formatCurrency(hourlyIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Income:</span>
            <span className="text-green-400 font-bold">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ROI:</span>
            <span className="text-blue-400">{asset.roi_percentage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Duration:</span>
            <span>{asset.duration} hours</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Message Display */}
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets Grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>

        {/* Investment Panel */}
        <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Investment Panel</h3>
          
          {selectedAsset ? (
            <div className="space-y-4">
              <div className="bg-green-800 rounded-lg p-4">
                <h4 className="font-bold text-lg">{selectedAsset.name}</h4>
                <p className="text-green-200">{selectedAsset.symbol}</p>
              </div>

              <div>
                <label className="block text-sm mb-2">Investment Amount</label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  min={getConvertedMinInvestment(selectedAsset)}
                  className="w-full p-3 rounded-lg bg-green-800 text-white border border-green-600"
                  placeholder={`Min: ${formatCurrency(getConvertedMinInvestment(selectedAsset))}`}
                />
                {walletData && (
                  <p className="text-sm text-green-200 mt-2">
                    Balance: {formatCurrency(walletData.balance)}
                  </p>
                )}
              </div>

              <button
                onClick={handleInvest}
                disabled={isInvesting}
                className="w-full py-3 bg-white text-green-600 rounded-lg font-bold hover:bg-gray-100 disabled:bg-gray-400"
              >
                {isInvesting ? 'Processing...' : `Invest ${formatCurrency(parseFloat(investmentAmount) || 0)}`}
              </button>
            </div>
          ) : (
            <p className="text-center text-green-200">Select an asset to invest</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTrading;