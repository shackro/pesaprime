import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NumberCarousel from '../components/NumberCarousel';
import { 
  apiService, 
  type WalletData, 
  type Asset, 
  type UserInvestment, 
  type UserActivity 
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import Trading from '../components/Trading';

const Home = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [investments, setInvestments] = useState<UserInvestment[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [wallet, assetsData, investmentsData, activitiesData] = await Promise.all([
        apiService.getWalletBalance(),
        apiService.getAssets(),
        apiService.getMyInvestments(),
        apiService.getMyActivities()
      ]);
      
      setWalletData(wallet);
      setAssets(assetsData);
      setInvestments(investmentsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Set proper fallback data that matches the interface
      setWalletData({ 
        id: 0,
        user_id: 0,
        balance: 0, 
        equity: 0, 
        currency: 'KES',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setAssets([]);
      setInvestments([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalInvested = investments.reduce((sum, inv) => sum + inv.invested_amount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

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
    <div className="mx-2 mb-16 lg:mb-4 flex-col items-center justify-content-center overflow-x-hidden">
      
      {/* Welcome Message */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        {/* <p className="text-gray-600 dark:text-gray-300">
          Phone: {user?.phone_number}
        </p> */}
      </div>

      {/* Wallet Balance and Equity - DYNAMIC */}
      <div className="justify-around items-center py-3 border border-indigo-400 rounded-xl mb-2">
        <div className="flex justify-around items-center py-3 rounded-xl">
          <div className="flex-col text-center p-4 w-2/5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-900">
            Cash Balance: <br />
            <span className="text-xl font-bold">{formatCurrency(walletData?.balance || 0)}</span>
          </div>
          <div className="flex-col text-center p-4 w-2/5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
            Total Equity:<br />
            <span className="text-xl font-bold">{formatCurrency(walletData?.equity || 0)}</span>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="flex justify-around items-center rounded-xl mb-4">
          <div className="flex-col text-center p-4 w-2/5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            Total Invested: <br />
            <span className="text-lg font-semibold">{formatCurrency(totalInvested)}</span>
          </div>
          <div className={`flex-col text-center p-3 w-2/5 rounded-xl bg-gradient-to-br ${
            totalProfitLoss >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'
          }`}>
            Total P&L: <br />
            <span className="text-lg font-semibold">
              {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalProfitLoss))}
            </span>
            <div className="text-sm">
              ({totalProfitLoss >= 0 ? '+' : ''}{totalProfitLossPercentage.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-around items-center py-3 mb-6 space-x-3"> 
        <Link 
          to="/deposit" 
          className="flex flex-col items-center justify-center p-3 w-1/4 rounded-xl bg-gradient-to-br from-yellow-500 to-teal-600 hover:-translate-y-1 transition transform duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
          </svg>
          <p className="mt-2 text-center text-sm">Deposit</p>
        </Link>

        <Link 
          to="/withdraw" 
          className="flex flex-col items-center justify-center p-3 w-1/4 rounded-xl bg-gradient-to-br from-yellow-500 to-teal-600 hover:-translate-y-1 transition transform duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
          </svg>
          <p className="mt-2 text-center text-sm">Withdraw</p>
        </Link>

        <Link 
          to="/bonus" 
          className="flex flex-col items-center justify-center p-3 w-1/4 rounded-xl bg-gradient-to-br from-yellow-500 to-teal-600 hover:-translate-y-1 transition transform duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5m.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935M8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
          </svg>
          <p className="mt-2 text-center text-sm">Bonus</p>
        </Link>
      </div>

      {/* Numbers Carousel */}
      <div className="mt-6">
        <NumberCarousel />
      </div>

      

      {/* My Investments */}
      <div className="mt-6 bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl p-4 text-white mb-6">
        <h3 className="text-xl font-bold mb-4 text-center">My Investments</h3>
        <div className="space-y-3">
          {investments.map((investment) => (
            <div key={investment.id} className="bg-blue-800 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{investment.asset_name}</h4>
                  <p className="text-sm text-blue-200">
                    {investment.units.toFixed(4)} units @ {investment.entry_price.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(investment.current_value)}</p>
                  <p className={`text-sm ${investment.profit_loss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {investment.profit_loss >= 0 ? '+' : ''}{formatCurrency(Math.abs(investment.profit_loss))} 
                    ({investment.profit_loss_percentage.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </div>
          ))}
          {investments.length === 0 && (
            <div className="text-center py-4 text-blue-300">
              <p>No active investments</p>
              <p className="text-sm">Start investing to build your portfolio</p>
            </div>
          )}
        </div>
      </div>


      {/* Market Assets */}
      <div className="w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 text-white">
        <h3 className="text-xl font-bold mb-4 text-center">Live Market Assets</h3>
        <Trading/>
      </div>



      {/* Recent Activity */}
      <div className="mt-6 mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 text-white">
        <h3 className="text-xl font-bold mb-4 text-center">Recent Activity</h3>
        <div className="space-y-2">
          {activities.slice(0,5).map((activity) => (
            <div key={activity.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
              <div className="flex-1">
                <span className="font-medium capitalize">{activity.activity_type}</span>
                <p className="text-sm text-gray-300">{activity.description}</p>
              </div>
              <div className="flex-1 text-right">
                <span className={activity.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                  {activity.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(activity.amount))}
                </span>
                <p className="text-xs text-gray-400">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-4 text-gray-400">
              <p>No recent activity</p>
              <p className="text-sm">Your activities will appear here</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center mt-20 block lg:hidden">
        <h2 className="text-lg font-semibold text-white mb-4 underline dark:text-gray-200">Useful Links</h2>
        <ul className="space-y-2">
          <li><Link to='/about' className="text-gray-300 hover:text-yellow-400 transition dark:text-gray-400 dark:hover:text-yellow-300">About Us</Link></li>
          <li><Link to='/contact' className="text-gray-300 hover:text-yellow-400 transition dark:text-gray-400 dark:hover:text-yellow-300">Contact</Link></li>
          <li><Link to='/faqs' className="text-gray-300 hover:text-yellow-400 transition dark:text-gray-400 dark:hover:text-yellow-300">FaQs</Link></li>
          <li><Link to='/terms' className="text-gray-300 hover:text-yellow-400 transition dark:text-gray-400 dark:hover:text-yellow-300">Terms&Conditions</Link></li>
          <li><Link to='/privacy' className="text-gray-300 hover:text-yellow-400 transition dark:text-gray-400 dark:hover:text-yellow-300">Privacy Policy</Link></li>
        </ul>
      </div>

    </div>
  );
};

export default Home;
