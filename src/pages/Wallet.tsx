import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, type WalletData, type UserActivity, type UserInvestment } from '../services/api';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';

const Wallet = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [investmentStats, setInvestmentStats] = useState({
    totalProfit: 0,
    totalLoss: 0,
    netProfitLoss: 0,
    activeInvestments: 0
  });
  
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.phone_number) {
      fetchData();
    }
  }, [user]); // Add user as dependency

  const fetchData = async () => {
    if (!user?.phone_number) return;
    
    try {
      const [wallet, activitiesData, investments] = await Promise.all([
        apiService.getWalletBalance(user.phone_number), // FIXED: Added phone number
        apiService.getMyActivities(user.phone_number),  // FIXED: Added phone number
        apiService.getMyInvestments(user.phone_number)  // FIXED: Added phone number
      ]);
      
      setWalletData(wallet);
      setActivities(activitiesData);
      
      // Calculate investment statistics from real data
      const stats = calculateInvestmentStats(investments);
      setInvestmentStats(stats);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Set fallback data that matches your actual wallet state
      setWalletData({ balance: 0, equity: 0, currency: 'KES' });
      setActivities([]);
      setInvestmentStats({
        totalProfit: 0,
        totalLoss: 0,
        netProfitLoss: 0,
        activeInvestments: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateInvestmentStats = (investments: UserInvestment[]) => {
    let totalProfit = 0;
    let totalLoss = 0;
    let activeInvestments = 0;

    investments.forEach(investment => {
      if (investment.status === 'active') {
        activeInvestments++;
        if (investment.profit_loss > 0) {
          totalProfit += investment.profit_loss;
        } else {
          totalLoss += investment.profit_loss;
        }
      }
    });

    return {
      totalProfit,
      totalLoss,
      netProfitLoss: totalProfit + totalLoss,
      activeInvestments
    };
  };

  const getProfitLossPercentage = () => {
    if (!walletData?.balance || walletData.balance === 0) return 0;
    return (investmentStats.netProfitLoss / walletData.balance) * 100;
  };

  const getProgressWidth = () => {
    const percentage = getProfitLossPercentage();
    if (percentage >= 0) {
      return Math.min(percentage, 100);
    }
    return Math.max(percentage, -100) * -1;
  };

  // Filter transactions from activities
  const transactions = activities
    .filter(activity => activity.activity_type === 'deposit' || activity.activity_type === 'withdraw')
    .map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      amount: activity.amount,
      status: activity.status,
      date: new Date(activity.timestamp).toLocaleDateString()
    }));

  if (loading) {
    return (
      <div id="loading-overlay" className="fixed inset-0 bg-gray-700 z-50 flex justify-center content-center items-center dark:bg-gray-900">
        <div className="relative text-center items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="currentColor" className="fill-green-600 bi bi-coin" viewBox="0 0 16 16">
            <path d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-.615-.093-1.022-.43-1.114-.9zm2.177-2.166c-.59-.137-.91-.416-.91-.836 0-.47.345-.822.915-.925v1.76h-.005zm.692 1.193c.717.166 1.048.435 1.048.91 0 .542-.412.914-1.135.982V8.518z"/>
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11m0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12"/>
          </svg>
          <div className="absolute -top-3 -left-3 h-20 w-20 p-4 rounded-full border-8 border-dotted border-green-600 animate-spin-slow dark:border-green-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 flex-col items-center justify-content-center space-y-4">
      {/* Investment Display */}
      <div className="flex-col py-4">
        <div className="w-full py-6 bg-gradient-to-r from-teal-600 to-emerald-700 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-300 rounded-full translate-x-16 translate-y-16"></div>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center space-x-4 mb-2">
              {/* Profit indicator */}
              <div className="flex items-center bg-green-500 bg-opacity-20 px-3 py-1 rounded-full">
                <svg className="w-4 h-4 text-green-300 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-green-300 text-sm font-semibold">
                  +{formatCurrency(Math.max(0, investmentStats.totalProfit))}
                </span>
              </div>
              
              {/* Main number - User's phone number */}
              <div className="text-center">
                <p className="text-3xl font-bold text-white tracking-wider">
                  {user?.phone_number || 'Loading...'}
                </p>
                <p className="text-teal-200 text-sm mt-1">
                  {investmentStats.activeInvestments} Active Investment{investmentStats.activeInvestments !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Loss indicator */}
              <div className="flex items-center bg-red-500 bg-opacity-20 px-3 py-1 rounded-full">
                <svg className="w-4 h-4 text-red-300 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-red-300 text-sm font-semibold">
                  {formatCurrency(Math.min(0, investmentStats.totalLoss))}
                </span>
              </div>
            </div>
            
            {/* Net P/L Display */}
            <div className="mb-3">
              <span className={`text-lg font-bold ${
                investmentStats.netProfitLoss >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                Net P/L: {investmentStats.netProfitLoss >= 0 ? '+' : ''}{formatCurrency(investmentStats.netProfitLoss)}
                {getProfitLossPercentage() !== 0 && (
                  <span className="text-sm ml-2">
                    ({getProfitLossPercentage() >= 0 ? '+' : ''}{getProfitLossPercentage().toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-64 mx-auto bg-teal-800 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  investmentStats.netProfitLoss >= 0 
                    ? 'bg-gradient-to-r from-green-400 to-yellow-400' 
                    : 'bg-gradient-to-r from-red-400 to-orange-400'
                }`}
                style={{ width: `${getProgressWidth()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Balance and Equity - REAL DATA */}
      <div className="flex flex-cols-2 justify-around items-center w-full py-3 border border-indigo-400 rounded-xl"> 
        <div className="flex-col text-center p-4 w-2/5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-900">
          Wallet balance: <br />
          <span className="text-xl font-bold">{formatCurrency(walletData?.balance || 0)}</span>
        </div>
        <div className="flex-col text-center p-4 w-2/5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
          Equity:<br />
          <span className="text-xl font-bold">{formatCurrency(walletData?.equity || 0)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-around lg:justify-around items-center w-full py-3"> 
        <Link 
          to="/deposit" 
          className="flex flex-col items-center justify-center p-3 w-1/4 rounded-xl bg-gradient-to-br from-yellow-500 to-teal-600 hover:-translate-y-2 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
          </svg>
          <p className="mt-2 text-center">Deposit</p>
        </Link>

        <Link 
          to="/withdraw" 
          className="flex flex-col items-center justify-center p-3 w-1/4 rounded-xl bg-gradient-to-br from-yellow-500 to-teal-600 hover:-translate-y-2 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
          </svg>
          <p className="mt-2 text-center">Withdraw</p>
        </Link>

        <Link 
          to="/bonus" 
          className="flex flex-col items-center justify-center p-3 w-1/4 rounded-xl bg-gradient-to-br from-yellow-500 to-teal-600 hover:-translate-y-2 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v.634l.549-.317a.5.5 0 1 1 .5.866L9 6l.549.317a.5.5 0 1 1-.5.866L8.5 6.866V7.5a.5.5 0 0 1-1 0v-.634l-.549.317a.5.5 0 1 1-.5-.866L7 6l-.549-.317a.5.5 0 0 1 .5-.866l.549.317V4.5A.5.5 0 0 1 8 4M5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
            <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2"/>
            <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z"/>
          </svg>
          <p className="mt-2 text-center">Bonus</p>
        </Link>
      </div>

      {/* Records Section */}
      <div className="flex flex-col justify-around items-center w-full py-3 bg-emerald-700 rounded-xl px-3"> 
        <div className="flex flex-cols-2 justify-around items-center w-full mb-4 bg-teal-700 rounded-xl"> 
          <div className="flex-col text-center p-4 w-2/5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-900">
            Deposit Records: {transactions.filter(t => t.type === 'deposit').length}
          </div>
          <div className="flex-col text-center p-4 w-2/5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-900">
            Withdrawal Records: {transactions.filter(t => t.type === 'withdraw').length}
          </div>
        </div>
        
        {/* Transactions List */}
        <div className="w-full bg-white rounded-lg p-4">
          <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {transactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center p-3 border-b">
                <div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    transaction.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">{transaction.date}</span>
                </div>
                <div className="text-right">
                  <span className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                  <div className={`text-xs ${
                    transaction.status === 'completed' ? 'text-green-600' : 
                    transaction.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {transaction.status}
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>No transactions yet</p>
                <p className="text-sm">Your deposit and withdrawal history will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;