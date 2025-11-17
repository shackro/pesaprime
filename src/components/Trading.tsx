import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { apiService, type Asset, type WalletData, type UserInvestment } from '../services/api';

interface TradingProps {
  walletData?: WalletData | null;
  userInvestments?: UserInvestment[];
  onInvestmentUpdate?: () => void;
}

// Currency exchange rates (from KES)
const CURRENCY_RATES = {
  "KES": 1.0,
  "USD": 0.0078,
  "EUR": 0.0072,
  "GBP": 0.0062,
};

// Updated base assets with simplified structure and adjusted income ranges
const baseAssetsData: Asset[] = [
  // ==================== CRYPTO ASSETS (12 pairs) ====================
  {
    id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', type: 'crypto',
    current_price: 92036.00, change_percentage: 2.34, moving_average: 91000.50, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:BTCUSDT',
    hourly_income: 160, min_investment: 700, duration: 24
  },
  {
    id: 'ethereum', name: 'Ethereum', symbol: 'ETH', type: 'crypto',
    current_price: 3016.97, change_percentage: 1.23, moving_average: 2980.20, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:ETHUSDT',
    hourly_income: 140, min_investment: 600, duration: 24
  },
  {
    id: 'bnb', name: 'Binance Coin', symbol: 'BNB', type: 'crypto',
    current_price: 321.78, change_percentage: 0.89, moving_average: 318.50, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:BNBUSDT',
    hourly_income: 120, min_investment: 550, duration: 24
  },
  {
    id: 'solana', name: 'Solana', symbol: 'SOL', type: 'crypto',
    current_price: 107.89, change_percentage: 3.45, moving_average: 104.20, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:SOLUSDT',
    hourly_income: 150, min_investment: 650, duration: 24
  },
  {
    id: 'xrp', name: 'Ripple', symbol: 'XRP', type: 'crypto',
    current_price: 0.6234, change_percentage: -0.56, moving_average: 0.63, trend: 'down',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:XRPUSDT',
    hourly_income: 80, min_investment: 450, duration: 24
  },
  {
    id: 'cardano', name: 'Cardano', symbol: 'ADA', type: 'crypto',
    current_price: 0.4821, change_percentage: 1.25, moving_average: 0.478, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:ADAUSDT',
    hourly_income: 70, min_investment: 400, duration: 24
  },
  {
    id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', type: 'crypto',
    current_price: 0.0876, change_percentage: 2.15, moving_average: 0.085, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:DOGEUSDT',
    hourly_income: 60, min_investment: 350, duration: 24
  },
  {
    id: 'polkadot', name: 'Polkadot', symbol: 'DOT', type: 'crypto',
    current_price: 7.234, change_percentage: -1.23, moving_average: 7.35, trend: 'down',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:DOTUSDT',
    hourly_income: 90, min_investment: 500, duration: 24
  },
  {
    id: 'litecoin', name: 'Litecoin', symbol: 'LTC', type: 'crypto',
    current_price: 72.89, change_percentage: 0.89, moving_average: 72.20, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:LTCUSDT',
    hourly_income: 100, min_investment: 550, duration: 24
  },
  {
    id: 'chainlink', name: 'Chainlink', symbol: 'LINK', type: 'crypto',
    current_price: 15.67, change_percentage: 1.67, moving_average: 15.40, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:LINKUSDT',
    hourly_income: 110, min_investment: 600, duration: 24
  },
  {
    id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', type: 'crypto',
    current_price: 42.15, change_percentage: 2.15, moving_average: 41.20, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:AVAXUSDT',
    hourly_income: 130, min_investment: 650, duration: 24
  },
  {
    id: 'polygon', name: 'Polygon', symbol: 'MATIC', type: 'crypto',
    current_price: 0.95, change_percentage: 1.45, moving_average: 0.93, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=BINANCE:MATICUSDT',
    hourly_income: 85, min_investment: 480, duration: 24
  },

  // ==================== FOREX ASSETS (10 pairs) ====================
  {
    id: 'eur-usd', name: 'EUR/USD', symbol: 'EURUSD', type: 'forex',
    current_price: 1.1591, change_percentage: 0.12, moving_average: 1.1580, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=FX:EURUSD',
    hourly_income: 150, min_investment: 700, duration: 24
  },
  {
    id: 'gbp-usd', name: 'GBP/USD', symbol: 'GBPUSD', type: 'forex',
    current_price: 1.2678, change_percentage: -0.23, moving_average: 1.2690, trend: 'down',
    chart_url: 'https://www.tradingview.com/chart/?symbol=FX:GBPUSD',
    hourly_income: 140, min_investment: 650, duration: 24
  },
  {
    id: 'usd-jpy', name: 'USD/JPY', symbol: 'USDJPY', type: 'forex',
    current_price: 148.25, change_percentage: 0.45, moving_average: 147.80, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=FX:USDJPY',
    hourly_income: 130, min_investment: 600, duration: 24
  },
  {
    id: 'usd-chf', name: 'USD/CHF', symbol: 'USDCHF', type: 'forex',
    current_price: 0.8689, change_percentage: -0.15, moving_average: 0.8695, trend: 'down',
    chart_url: 'https://www.tradingview.com/chart/?symbol=FX:USDCHF',
    hourly_income: 120, min_investment: 580, duration: 24
  },
  {
    id: 'aud-usd', name: 'AUD/USD', symbol: 'AUDUSD', type: 'forex',
    current_price: 0.6523, change_percentage: 0.67, moving_average: 0.6480, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=FX:AUDUSD',
    hourly_income: 125, min_investment: 590, duration: 24
  },
  {
    id: 'usd-cad', name: 'USD/CAD', symbol: 'USDCAD', type: 'forex',
    current_price: 1.3521, change_percentage: -0.34, moving_average: 1.3545, trend: 'down',
    chart_url: 'https://www.tradingview.com/chart/?symbol=FX:USDCAD',
    hourly_income: 115, min_investment: 570, duration: 24
  },
  {
    id: 'nzd-usd', name: 'NZD/USD', symbol: 'NZDUSD', type: 'forex',
    current_price: 0.6123, change_percentage: 0.89, moving_average: 0.6080, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=FX:NZDUSD',
    hourly_income: 110, min_investment: 550, duration: 24
  },
  {
    id: 'eur-gbp', name: 'EUR/GBP', symbol: 'EURGBP', type: 'forex',
    current_price: 0.8567, change_percentage: 0.23, moving_average: 0.8550, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=FX:EURGBP',
    hourly_income: 100, min_investment: 520, duration: 24
  },
  {
    id: 'eur-jpy', name: 'EUR/JPY', symbol: 'EURJPY', type: 'forex',
    current_price: 160.89, change_percentage: 0.56, moving_average: 160.20, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=FX:EURJPY',
    hourly_income: 160, min_investment: 750, duration: 24
  },
  {
    id: 'gbp-jpy', name: 'GBP/JPY', symbol: 'GBPJPY', type: 'forex',
    current_price: 188.34, change_percentage: -0.12, moving_average: 188.50, trend: 'down',
    chart_url: 'https://www.tradingview.com/chart/?symbol=FX:GBPJPY',
    hourly_income: 155, min_investment: 720, duration: 24
  },

  // ==================== FUTURES (2 pairs in forex section) ====================
  {
    id: 'gold', name: 'Gold Futures', symbol: 'XAUUSD', type: 'forex',
    current_price: 1987.45, change_percentage: 0.89, moving_average: 1975.60, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=TVC:GOLD',
    hourly_income: 160, min_investment: 800, duration: 24
  },
  {
    id: 'oil', name: 'Crude Oil WTI', symbol: 'USOIL', type: 'forex',
    current_price: 78.45, change_percentage: -0.67, moving_average: 78.90, trend: 'down',
    chart_url: 'https://www.tradingview.com/chart/?symbol=TVC:USOIL',
    hourly_income: 145, min_investment: 750, duration: 24
  },

  // ==================== STOCKS (8 pairs) ====================
  {
    id: 'apple', name: 'Apple Inc', symbol: 'AAPL', type: 'stock',
    current_price: 189.45, change_percentage: 1.23, moving_average: 187.20, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=NASDAQ:AAPL',
    hourly_income: 150, min_investment: 700, duration: 24
  },
  {
    id: 'microsoft', name: 'Microsoft Corp', symbol: 'MSFT', type: 'stock',
    current_price: 378.85, change_percentage: 0.89, moving_average: 375.60, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=NASDAQ:MSFT',
    hourly_income: 155, min_investment: 720, duration: 24
  },
  {
    id: 'google', name: 'Alphabet Inc', symbol: 'GOOGL', type: 'stock',
    current_price: 138.45, change_percentage: 1.45, moving_average: 136.20, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=NASDAQ:GOOGL',
    hourly_income: 140, min_investment: 680, duration: 24
  },
  {
    id: 'amazon', name: 'Amazon.com Inc', symbol: 'AMZN', type: 'stock',
    current_price: 154.75, change_percentage: 0.67, moving_average: 153.45, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=NASDAQ:AMZN',
    hourly_income: 145, min_investment: 690, duration: 24
  },
  {
    id: 'tesla', name: 'Tesla Inc', symbol: 'TSLA', type: 'stock',
    current_price: 245.60, change_percentage: -1.23, moving_average: 248.90, trend: 'down',
    chart_url: 'https://www.tradingview.com/chart/?symbol=NASDAQ:TSLA',
    hourly_income: 160, min_investment: 750, duration: 24
  },
  {
    id: 'meta', name: 'Meta Platforms', symbol: 'META', type: 'stock',
    current_price: 345.25, change_percentage: 2.34, moving_average: 337.80, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=NASDAQ:META',
    hourly_income: 155, min_investment: 730, duration: 24
  },
  {
    id: 'nvidia', name: 'NVIDIA Corp', symbol: 'NVDA', type: 'stock',
    current_price: 495.75, change_percentage: 3.45, moving_average: 478.90, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=NASDAQ:NVDA',
    hourly_income: 160, min_investment: 780, duration: 24
  },
  {
    id: 'netflix', name: 'Netflix Inc', symbol: 'NFLX', type: 'stock',
    current_price: 485.32, change_percentage: 1.12, moving_average: 480.15, trend: 'up',
    chart_url: 'https://www.tradingview.com/chart/?symbol=NASDAQ:NFLX',
    hourly_income: 135, min_investment: 650, duration: 24
  }
];

const Trading: React.FC<TradingProps> = ({ 
  walletData = null, 
  userInvestments = [], 
  onInvestmentUpdate 
}) => {
  const { pairId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency, convertAmount, currentCurrency } = useCurrency();
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'crypto' | 'forex' | 'stock'>('crypto');
  const [isLoading, setIsLoading] = useState(false);
  const [investmentError, setInvestmentError] = useState<string>('');
  const [investmentSuccess, setInvestmentSuccess] = useState<string>('');
  const [priceHistory, setPriceHistory] = useState<{[key: string]: number[]}>({});
  const [realTimePrices, setRealTimePrices] = useState<{[key: string]: number}>({});
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Real-time price updates from online sources
  useEffect(() => {
    const fetchRealTimePrices = async () => {
      try {
        // Simulate real-time price updates with small variations
        const updatedPrices: {[key: string]: number} = {};
        
        baseAssetsData.forEach(asset => {
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          updatedPrices[asset.id] = asset.current_price * (1 + variation);
        });
        
        setRealTimePrices(updatedPrices);
      } catch (error) {
        console.error('Error fetching real-time prices:', error);
      }
    };

    // Fetch initial prices
    fetchRealTimePrices();

    // Update prices every 30 seconds
    const priceInterval = setInterval(fetchRealTimePrices, 30000);

    return () => {
      clearInterval(priceInterval);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Initialize assets with real-time data and currency conversion
  useEffect(() => {
    const initializeAssets = async () => {
      setIsLoading(true);
      try {
        let marketAssets: Asset[];
        
        try {
          // Try to fetch from API first
          marketAssets = await apiService.getMarketAssets();
        } catch (error) {
          console.log('Using base assets data');
          // Use base assets with real-time price updates
          marketAssets = baseAssetsData.map(asset => ({
            ...asset,
            current_price: realTimePrices[asset.id] || asset.current_price,
          }));
        }
        
        // Convert base prices to current currency
        const convertedAssets = marketAssets.map(asset => {
          const minInvestment = convertAmount ? convertAmount(asset.min_investment) : asset.min_investment;
          const hourlyIncome = convertAmount ? convertAmount(asset.hourly_income) : asset.hourly_income;

          return {
            ...asset,
            hourly_income: Number(hourlyIncome),
            min_investment: minInvestment,
            current_price: realTimePrices[asset.id] || asset.current_price,
          };
        });

        setAssets(convertedAssets);
        
        // Initialize price history with realistic movement
        const initialHistory: {[key: string]: number[]} = {};
        convertedAssets.forEach(asset => {
          // Generate realistic price history with trend
          const history = [];
          let currentPrice = asset.current_price;
          const trend = asset.trend === 'up' ? 1 : -1;
          
          for (let i = 0; i < 50; i++) {
            const variation = (Math.random() * 0.01 + 0.005) * trend;
            currentPrice = currentPrice * (1 + variation);
            history.unshift(currentPrice);
          }
          
          initialHistory[asset.id] = history;
        });
        setPriceHistory(initialHistory);
        
        // Auto-select first asset
        if (convertedAssets.length > 0 && !selectedAsset) {
          const firstAsset = convertedAssets[0];
          setSelectedAsset(firstAsset);
          setInvestmentAmount(firstAsset.min_investment.toString());
        }
      } catch (error) {
        console.error('Error initializing assets:', error);
        // Fallback to base assets if everything fails
        const convertedAssets = baseAssetsData.map(asset => {
          const minInvestment = convertAmount ? convertAmount(asset.min_investment) : asset.min_investment;
          const hourlyIncome = convertAmount ? convertAmount(asset.hourly_income) : asset.hourly_income;

          return {
            ...asset,
            hourly_income: Number(hourlyIncome),
            min_investment: minInvestment,
            current_price: realTimePrices[asset.id] || asset.current_price,
          };
        });
        setAssets(convertedAssets);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAssets();
  }, [convertAmount, realTimePrices]);

  // Update assets when currency changes
  useEffect(() => {
    if (assets.length > 0) {
      const updatedAssets = assets.map(asset => {
        const minInvestment = convertAmount ? convertAmount(asset.min_investment) : asset.min_investment;
        const hourlyIncome = convertAmount ? convertAmount(asset.hourly_income) : asset.hourly_income;

        return {
          ...asset,
          hourly_income: Number(hourlyIncome),
          min_investment: minInvestment,
        };
      });

      setAssets(updatedAssets);
      
      // Update investment amount if an asset is selected
      if (selectedAsset) {
        const currentAsset = updatedAssets.find(a => a.id === selectedAsset.id);
        if (currentAsset) {
          setSelectedAsset(currentAsset);
          setInvestmentAmount(currentAsset.min_investment.toString());
        }
      }
    }
  }, [currentCurrency, convertAmount]);

  // Handle URL pair selection
  useEffect(() => {
    if (pairId && assets.length > 0) {
      const asset = assets.find(a => a.id === pairId);
      if (asset) {
        setSelectedAsset(asset);
        setInvestmentAmount(asset.min_investment.toString());
      }
    }
  }, [pairId, assets]);

  // Production investment handler
  const handleInvest = async () => {
    if (!selectedAsset) {
      setInvestmentError('Please select an asset first');
      return;
    }

    const amount = parseFloat(investmentAmount);

    // Reset messages
    setInvestmentError('');
    setInvestmentSuccess('');

    // Validation checks
    if (!investmentAmount || isNaN(amount) || amount <= 0) {
      setInvestmentError('Please enter a valid investment amount');
      return;
    }

    if (amount < selectedAsset.min_investment) {
      setInvestmentError(`Minimum investment for ${selectedAsset.name} is ${formatCurrency(selectedAsset.min_investment)}`);
      return;
    }

    if (!user?.phone_number) {
      setInvestmentError('User authentication required. Please log in again.');
      return;
    }

    if (walletData && amount > walletData.balance) {
      setInvestmentError(`Insufficient balance. You have ${formatCurrency(walletData.balance)} but trying to invest ${formatCurrency(amount)}`);
      return;
    }

    setIsInvesting(true);

    try {
      console.log('Starting production investment...', {
        asset_id: selectedAsset.id,
        amount: amount,
        phone_number: user.phone_number
      });

      // Convert amount back to KSH for backend processing
      const amountInKSH = currentCurrency.code === 'KES' ? amount : amount / CURRENCY_RATES[currentCurrency.code];
      
      const investmentData = {
        asset_id: selectedAsset.id,
        amount: amountInKSH, // Backend expects KSH
        phone_number: user.phone_number
      };

      const result = await apiService.buyInvestment(investmentData);
      
      console.log('Production investment response:', result);

      if (result && result.success) {
        setInvestmentSuccess(`✅ ${result.message || `Successfully invested ${formatCurrency(amount)} in ${selectedAsset.name}!`}`);
        setInvestmentAmount(selectedAsset.min_investment.toString());
        
        // Refresh parent data
        if (onInvestmentUpdate) {
          onInvestmentUpdate();
        }
      } else {
        throw new Error(result?.message || 'Investment failed');
      }

    } catch (error: any) {
      console.error('Production investment failed:', error);
      
      let errorMessage = 'Investment failed. Please try again.';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = '❌ Network error. Please check your connection and try again.';
      } else if (error.message?.includes('balance') || error.message?.includes('insufficient')) {
        errorMessage = '❌ Insufficient balance for this investment.';
      } else if (error.message?.includes('auth') || error.message?.includes('login')) {
        errorMessage = '❌ Authentication error. Please log in again.';
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      setInvestmentError(errorMessage);
    } finally {
      setIsInvesting(false);
    }
  };

  // Calculate total income with currency conversion
  const calculateTotalIncome = (asset: Asset, amount: number) => {
    const baseIncome = asset.hourly_income * asset.duration * (amount / asset.min_investment);
    return baseIncome;
  };

  // Calculate ROI percentage
  const calculateROI = (asset: Asset) => {
    return ((asset.hourly_income * asset.duration) / asset.min_investment * 100).toFixed(1);
  };

  // Get current assets based on active tab
  const getCurrentAssets = useCallback(() => {
    return assets.filter(asset => {
      if (activeTab === 'forex') {
        return asset.type === 'forex';
      } else if (activeTab === 'stock') {
        return asset.type === 'stock';
      } else {
        return asset.type === 'crypto';
      }
    });
  }, [assets, activeTab]);

  // Get TradingView URL
  const getTradingViewUrl = (asset: Asset) => {
    if (asset.chart_url && asset.chart_url !== '#') {
      return asset.chart_url;
    }
    
    switch (asset.type) {
      case 'forex':
        return `https://www.tradingview.com/chart/?symbol=FX:${asset.symbol}`;
      case 'crypto':
        return `https://www.tradingview.com/chart/?symbol=BINANCE:${asset.symbol}USDT`;
      case 'stock':
        return `https://www.tradingview.com/chart/?symbol=NASDAQ:${asset.symbol}`;
      default:
        return `https://www.tradingview.com/chart/?symbol=NYSE:${asset.symbol}`;
    }
  };

  // Enhanced chart animation with investment progress
  const startChartAnimation = useCallback(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas || !selectedAsset) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const drawChart = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      for (let i = 0; i <= width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i <= height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      const assetHistory = priceHistory[selectedAsset.id] || [selectedAsset.current_price];
      
      if (assetHistory.length > 1) {
        const maxPrice = Math.max(...assetHistory);
        const minPrice = Math.min(...assetHistory);
        const priceRange = maxPrice - minPrice || 1;

        // Draw price line with gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, selectedAsset.trend === 'up' ? '#10B981' : '#EF4444');
        gradient.addColorStop(1, selectedAsset.trend === 'up' ? '#059669' : '#DC2626');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();

        const points = assetHistory.map((price, index) => {
          const x = (index / (assetHistory.length - 1)) * width;
          const y = height - ((price - minPrice) / priceRange) * height * 0.8 - height * 0.1;
          return { x, y };
        });

        points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();

        // Draw investment progress line if amount is entered
        if (investmentAmount && parseFloat(investmentAmount) >= selectedAsset.min_investment) {
          const investmentMultiplier = parseFloat(investmentAmount) / selectedAsset.min_investment;
          const expectedGrowth = 1 + (investmentMultiplier * 0.1); // Simulate growth based on investment
          
          ctx.strokeStyle = '#8B5CF6';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.moveTo(0, height * 0.5);
          ctx.lineTo(width * 0.8, height * 0.5 * (1 / expectedGrowth));
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw target indicator
          ctx.fillStyle = '#8B5CF6';
          ctx.beginPath();
          ctx.arc(width * 0.8, height * 0.5 * (1 / expectedGrowth), 6, 0, 2 * Math.PI);
          ctx.fill();

          // Target label
          ctx.fillStyle = '#8B5CF6';
          ctx.font = '10px monospace';
          ctx.fillText('Target', width * 0.8 + 10, height * 0.5 * (1 / expectedGrowth));
        }

        // Draw current price indicator
        const currentPoint = points[points.length - 1];
        ctx.fillStyle = selectedAsset.trend === 'up' ? '#10B981' : '#EF4444';
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Price labels
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px monospace';
        ctx.fillText(
          `$${maxPrice.toLocaleString(undefined, { 
            minimumFractionDigits: selectedAsset.type === 'forex' ? 4 : 2,
            maximumFractionDigits: selectedAsset.type === 'forex' ? 4 : 2 
          })}`, 
          width - 100, 
          20
        );
        ctx.fillText(
          `$${minPrice.toLocaleString(undefined, { 
            minimumFractionDigits: selectedAsset.type === 'forex' ? 4 : 2,
            maximumFractionDigits: selectedAsset.type === 'forex' ? 4 : 2 
          })}`, 
          width - 100, 
          height - 10
        );
      }

      animationRef.current = requestAnimationFrame(drawChart);
    };

    drawChart();
  }, [selectedAsset, priceHistory, investmentAmount]);

  // Chart animation effect
  useEffect(() => {
    startChartAnimation();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startChartAnimation]);

  // Enhanced real-time price updates for the chart with realistic movement
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedAsset) {
        setPriceHistory(prev => {
          const currentHistory = prev[selectedAsset.id] || [selectedAsset.current_price];
          const trend = selectedAsset.trend === 'up' ? 1 : -1;
          const volatility = selectedAsset.type === 'crypto' ? 0.008 : 0.003;
          const changeFactor = (Math.random() * volatility + 0.002) * trend;
          const newPrice = currentHistory[currentHistory.length - 1] * (1 + changeFactor);
          
          return {
            ...prev,
            [selectedAsset.id]: [...currentHistory.slice(-49), newPrice]
          };
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedAsset]);

  // Auto-select first asset when tab changes
  useEffect(() => {
    const currentAssets = getCurrentAssets();
    if (currentAssets.length > 0 && (!selectedAsset || !currentAssets.find(a => a.id === selectedAsset?.id))) {
      const firstAsset = currentAssets[0];
      setSelectedAsset(firstAsset);
      setInvestmentAmount(firstAsset.min_investment.toString());
    }
  }, [activeTab, getCurrentAssets]);

  const AssetCard = ({ asset }: { asset: Asset }) => {
    const totalIncome = calculateTotalIncome(asset, asset.min_investment);
    const roi = calculateROI(asset);

    return (
      <div 
        className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 text-white hover:from-gray-700 hover:to-gray-800 transition duration-200 cursor-pointer border-2 ${
          selectedAsset?.id === asset.id ? 'border-green-500' : 'border-transparent'
        }`}
        onClick={() => {
          setSelectedAsset(asset);
          setInvestmentAmount(asset.min_investment.toString());
        }}
      >
        <div className="flex items-center mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
            asset.trend === 'up' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'
          }`}>
            <span className="font-bold text-white text-sm">{asset.symbol.substring(0, 3)}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{asset.name}</h3>
            <p className="text-gray-400 text-sm">{asset.symbol} • {asset.type.toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">
              ${asset.current_price.toLocaleString(undefined, { 
                minimumFractionDigits: asset.type === 'forex' ? 4 : 2,
                maximumFractionDigits: asset.type === 'forex' ? 4 : 2 
              })}
            </p>
            <span className={`text-sm ${asset.change_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {asset.change_percentage >= 0 ? '+' : ''}{asset.change_percentage.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Min Investment</span>
            <span className="text-white font-semibold">{formatCurrency(asset.min_investment)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Duration</span>
            <span className="text-white font-semibold">{asset.duration} Hours</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Hourly Income</span>
            <span className="text-green-400 font-semibold">
              {formatCurrency(asset.hourly_income)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Return</span>
            <span className="text-green-400 font-semibold">
              {formatCurrency(totalIncome)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">ROI</span>
            <span className="text-yellow-400 font-semibold">{roi}%</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAsset(asset);
              setInvestmentAmount(asset.min_investment.toString());
            }}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2 rounded-lg font-bold transition duration-200"
          >
            INVEST
          </button>
          <a
            href={getTradingViewUrl(asset)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition duration-200"
            title="Open Advanced Chart in TradingView"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </a>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading trading platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          Professional Trading Platform
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
          Trade with confidence using real-time market data and smart investments
        </p>
        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
          💰 Real-time prices updating every 30 seconds
        </div>
      </div>

      {/* Investment Messages */}
      {investmentError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{investmentError}</span>
          </div>
        </div>
      )}

      {investmentSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{investmentSuccess}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Left Column - Asset List */}
        <div className="xl:col-span-2 space-y-6">
          {/* Market Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex space-x-2 mb-6">
              {(['crypto', 'forex', 'stock'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition duration-200 ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tab === 'crypto' ? 'CRYPTO (12)' : tab === 'forex' ? 'FOREX & FUTURES (12)' : 'STOCKS (8)'}
                </button>
              ))}
            </div>

            {/* Asset Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getCurrentAssets().map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>

            {getCurrentAssets().length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No Assets Available
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  No trading assets found in this category.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Chart & Investment Panel */}
        <div className="xl:col-span-1 space-y-6">
          {/* Chart Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {selectedAsset ? `${selectedAsset.name} Chart` : 'Market Chart'}
              </h3>
              {selectedAsset && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedAsset.trend === 'up' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {selectedAsset.trend === 'up' ? '📈 BULLISH' : '📉 BEARISH'}
                </span>
              )}
            </div>

            {/* Chart Container */}
            <div className="bg-gray-900 rounded-xl p-4 h-64 relative">
              <canvas
                ref={chartCanvasRef}
                width={400}
                height={240}
                className="w-full h-full"
              />
              
              {!selectedAsset && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-4xl mb-2">📊</div>
                    <p className="text-gray-400">Select an asset to view chart</p>
                  </div>
                </div>
              )}
            </div>

            {/* Price Stats */}
            {selectedAsset && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Price</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    ${selectedAsset.current_price.toLocaleString(undefined, {
                      minimumFractionDigits: selectedAsset.type === 'forex' ? 4 : 2,
                      maximumFractionDigits: selectedAsset.type === 'forex' ? 4 : 2
                    })}
                  </p>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">24h Change</p>
                  <p className={`text-lg font-bold ${
                    selectedAsset.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedAsset.change_percentage >= 0 ? '+' : ''}{selectedAsset.change_percentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Investment Panel */}
          <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-2xl shadow-lg p-6 text-white sticky top-6">
            <h3 className="text-xl font-bold mb-4">Investment Panel</h3>
            
            {selectedAsset ? (
              <div className="space-y-4">
                {/* Asset Info */}
                <div className="bg-green-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-lg">{selectedAsset.name}</span>
                    <span className="text-sm bg-green-700 px-3 py-1 rounded-full">
                      {selectedAsset.symbol}
                    </span>
                  </div>
                  <div className="text-sm text-green-100 space-y-1">
                    <div className="flex justify-between">
                      <span>Asset Type:</span>
                      <span className="font-semibold">{selectedAsset.type.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Investment Period:</span>
                      <span className="font-semibold">{selectedAsset.duration} Hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum Investment:</span>
                      <span className="font-semibold">{formatCurrency(selectedAsset.min_investment)}</span>
                    </div>
                  </div>
                </div>

                {/* Investment Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-green-100">
                    Investment Amount ({currentCurrency.code})
                  </label>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    min={selectedAsset.min_investment}
                    step="1"
                    className="w-full p-4 rounded-xl bg-green-800 text-white border border-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 text-lg"
                    placeholder={`Min: ${formatCurrency(selectedAsset.min_investment)}`}
                  />
                  {walletData && (
                    <p className="text-sm text-green-200 mt-2">
                      Available Balance: <span className="font-semibold">{formatCurrency(walletData.balance)}</span>
                    </p>
                  )}
                </div>

                {/* Investment Summary */}
                {investmentAmount && parseFloat(investmentAmount) >= selectedAsset.min_investment && (
                  <div className="bg-green-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-lg text-center mb-2">Investment Summary</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-200">Amount:</span>
                        <span className="font-semibold">{formatCurrency(parseFloat(investmentAmount))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-200">Hourly Return:</span>
                        <span className="text-green-300 font-semibold">
                          {formatCurrency(selectedAsset.hourly_income * (parseFloat(investmentAmount) / selectedAsset.min_investment))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-200">Total Return:</span>
                        <span className="text-green-300 font-bold text-lg">
                          {formatCurrency(calculateTotalIncome(selectedAsset, parseFloat(investmentAmount)))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-green-600 pt-2">
                        <span className="text-green-200">ROI:</span>
                        <span className="text-yellow-300 font-bold">
                          {calculateROI(selectedAsset)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedAsset(null);
                      setInvestmentAmount('');
                    }}
                    className="flex-1 py-4 bg-green-700 hover:bg-green-600 text-white rounded-xl font-semibold transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvest}
                    disabled={isInvesting || !investmentAmount || parseFloat(investmentAmount) < selectedAsset.min_investment}
                    className="flex-1 py-4 bg-white text-green-600 hover:bg-gray-100 rounded-xl font-semibold transition duration-200 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed text-lg"
                  >
                    {isInvesting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      `INVEST ${formatCurrency(parseFloat(investmentAmount))}`
                    )}
                  </button>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((multiplier) => {
                    const amount = selectedAsset.min_investment * multiplier;
                    return (
                      <button
                        key={multiplier}
                        onClick={() => setInvestmentAmount(amount.toString())}
                        className="py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm transition duration-200"
                      >
                        {formatCurrency(amount)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-green-300 text-4xl mb-4">💼</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Ready to Invest?
                </h3>
                <p className="text-green-200 text-sm">
                  Select an asset from the list to start your investment journey
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;