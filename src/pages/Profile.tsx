import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService, type UserInvestment, type UserActivity } from '../services/api';
import { useCurrency } from '../contexts/CurrencyContext';

const Profile = () => {
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const { user, logout } = useAuth();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.phone_number) {
      fetchUserData();
    }
  }, [user]); // Add user as dependency

  const fetchUserData = async () => {
    if (!user?.phone_number) return;
    
    try {
      const [investments, activities, wallet] = await Promise.all([ // ADD WALLET
        apiService.getMyInvestments(user.phone_number),
        apiService.getMyActivities(user.phone_number),
        apiService.getWalletBalance(user.phone_number) // ADD WALLET FETCH
      ]);
      
      setUserInvestments(investments);
      setRecentActivities(activities.slice(1, 5)); // Last 5 activities
      setWalletData(wallet); // SET WALLET DATA
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout anyway
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[0-9])/.test(passwordData.newPassword)) {
      setPasswordError('Password must include at least one number');
      return;
    }

    setChangingPassword(true);
    try {
      // Note: You'll need to implement changePassword in your apiService
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error: unknown) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.invested_amount, 0);
  const totalCurrentValue = userInvestments.reduce((sum, inv) => sum + inv.current_value, 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;

  if (loading) {
    return (
      <div id="loading-overlay" className="fixed inset-0 bg-gray-700 z-50 flex justify-center content-center items-center dark:bg-gray-900">
        <div className="relative text-center items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="fill-green-600 bi bi-coin" viewBox="0 0 16 16">
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
    <div className="mx-3 flex-col items-center justify-content-center space-y-4 overflow-x-hidden min-h-screen mb-15 lg:mb-2">
      {/* Profile Header */}
      <div className="flex flex-col lg:flex-row items-center w-full py-3 bg-gradient-to-br from-lime-500 to-emerald-900 rounded-xl justify-between"> 
        {/* User Info */}
        <div className="flex items-center space-x-4 text-center p-4 lg:w-2/3 rounded-xl justify-left">
          <div className="flex flex-col text-center p-6 rounded-xl bg-gradient-to-br from-teal-500 to-amber-900 text-2xl lg:text-3xl font-bold">      
            {user ? getInitials(user.name) : 'US'}
          </div>
          <div className="flex flex-col text-start p-2 rounded-xl bg-gradient-to-br from-teal-500 to-amber-900 ">      
            <p className="text-lg lg:text-3xl font-semibold">{user?.name || 'User Name'}</p>
            <p className="text-md lg:text-medium text-white">{user?.email || 'user@email.com'}</p>
            <p className="text-xs lg:text-lg text-white mt-1">{user?.phone_number || '+254 XXX XXX XXX'}</p>
            <p className="text-xs lg:text-md text-gray-70 mt-1">
              Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col lg:flex-row space-x-2 space-y-2 lg:space-y-0 rounded-xl lg:w-1/3 justify-end p-4">
          <button
            onClick={() => navigate('/deposit')}
            className="flex items-center justify-center text-center p-3 font-medium text-white bg-green-700 hover:bg-green-600 active:bg-green-500 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="mr-2" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
            </svg>
            <span>Deposit</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center text-center p-3 font-medium text-white bg-red-700 hover:bg-red-600 active:bg-red-500 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a1 1 0 01-1 1H6a2 2 0 01-2-2V7a2 2 0 012-2h6a1 1 0 011 1v1m0 4V4a1 1 0 00-1-1H6a2 2 0 00-2 2v12a2 2 0 002 2h6a1 1 0 001-1v-1"
              />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row justify-between w-full py-3 bg-gray-800 rounded-xl min-h-96 text-white"> 
        {/* Left Column - Assets & Activities */}
        <div className="flex flex-col w-full lg:w-3/4 p-4 space-y-6">
          {/* Investment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">Total Invested</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">Current Value</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(totalCurrentValue)}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">Total P&L</p>
              <p className={`text-xl font-bold ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalProfitLoss))}
              </p>
            </div>
          </div>

          {/* Active Investments */}
          <div className="bg-gray-700 rounded-xl p-4">
            <h3 className="text-xl font-bold mb-4 text-center">Active Investments</h3>
            {userInvestments.length > 0 ? (
              <div className="space-y-3">
                {userInvestments.slice(0, 3).map((investment) => (
                  <div key={investment.id} className="bg-gray-600 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{investment.asset_name}</h4>
                        <p className="text-sm text-gray-300">
                          {investment.units.toFixed(4)} units • {formatCurrency(investment.invested_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(investment.current_value)}</p>
                        <p className={`text-sm ${investment.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {investment.profit_loss >= 0 ? '+' : ''}{investment.profit_loss_percentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {userInvestments.length > 3 && (
                  <button 
                    onClick={() => navigate('/assets')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-200"
                  >
                    View All Investments ({userInvestments.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="mx-auto mb-4 text-gray-500" viewBox="0 0 16 16">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 0-1h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5z"/>
                </svg>
                <p className="text-lg mb-2">No Active Investments</p>
                <p className="text-gray-400 mb-4">You haven't purchased any assets yet.</p>
                <button 
                  onClick={() => navigate('/assets')}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg font-semibold transition duration-200"
                >
                  View Assets
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-700 rounded-xl p-4">
            <h3 className="text-xl font-bold mb-4 text-center">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center p-3 bg-gray-600 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium capitalize">{activity.activity_type}</p>
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
              {recentActivities.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Change Password */}
        <div className="flex flex-col w-full lg:w-1/4 p-4 lg:border-l-2 lg:border-l-orange-300 items-center">
          <p className="text-center text-xl font-bold mb-4">Change Password</p>
          <p className="text-center text-sm text-gray-300 mb-6">
            Use a strong password and keep it private. Passwords must be at least 8 characters and include a number.
          </p>
          
          <form onSubmit={handlePasswordChange} className="w-full space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current password</label>
              <input 
                type="password" 
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="w-full p-3 border border-gray-600 rounded-xl bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">New password</label>
              <input 
                type="password" 
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full p-3 border border-gray-600 rounded-xl bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Confirm password</label>
              <input 
                type="password" 
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full p-3 border border-gray-600 rounded-xl bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-red-900 border border-red-700 rounded-xl text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-green-900 border border-green-700 rounded-xl text-sm">
                {passwordSuccess}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => {
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-semibold transition duration-200"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={changingPassword}
                className="flex-1 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl font-semibold transition duration-200 disabled:cursor-not-allowed"
              >
                {changingPassword ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Changing...
                  </div>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>

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
      </div>
    </div>
  );
};

export default Profile;