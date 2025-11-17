import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FAQBot from './FAQBot';
import { apiService, type PnLData } from '../services/api';
import CurrencyDropdown from './CurrencyDropdown';
import { useCurrency } from '../contexts/CurrencyContext';

// Interface definitions
interface BaseLayoutProps {
  children: ReactNode;
}

interface NavItemProps {
  to: string;
  icon: ReactNode;
  label: string;
}

interface MobileNavigationProps {
  currentPath: string;
}

interface MobileNavItemProps {
  to: string;
  icon: string;
  label: string;
  isActive: boolean;
}

const BaseLayout = ({ children }: BaseLayoutProps) => {
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const location = useLocation();
  const { formatCurrency } = useCurrency();

  // Real-time P/L data fetching
  const fetchPnLData = async () => {
    try {
      const data = await apiService.getPnL();
      setPnlData(data);
    } catch (error) {
      console.error('Failed to fetch P&L data:', error);
      // Set default data if API fails or endpoint doesn't exist yet
      setPnlData({ profit_loss: 0, percentage: 0, trend: 'up' });
    }
  };

  const applyTheme = (themeToApply: string) => {
    if (themeToApply === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
    
    // Apply the theme
    applyTheme(savedTheme || theme);
    
    // Initial P&L data fetch
    fetchPnLData();

    // Set up real-time updates every 5 seconds
    const pnlInterval = setInterval(fetchPnLData, 2000);
    
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 2000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(pnlInterval);
    };
  }, [theme]);

  // Enhanced P/L display with better loading states and styling
  const formatPnL = () => {
    if (!pnlData) return (
      <div className="flex items-center justify-center animate-pulse">
        <div className="w-16 h-4 bg-yellow-300 rounded mr-2"></div>
        <span className="text-yellow-200 text-sm">Loading...</span>
      </div>
    );
    
    const sign = pnlData.profit_loss >= 0 ? '+' : '';
    const color = pnlData.profit_loss >= 0 ? 'text-green-400' : 'text-red-400';
    const bgColor = pnlData.profit_loss >= 0 ? 'bg-green-900/30' : 'bg-red-900/30';
    const borderColor = pnlData.profit_loss >= 0 ? 'border-green-500/30' : 'border-red-500/30';
    
    return (
      <div className={`px-3 py-2 rounded-lg ${bgColor} border ${borderColor} transition-all duration-300 hover:scale-105`}>
        <div className="flex flex-col items-center">
          <span className={`text-sm font-bold ${color}`}>
            {sign}{formatCurrency(Math.abs(pnlData.profit_loss))}
          </span>
          <span className={`text-xs ${color} opacity-80`}>
            ({sign}{pnlData.percentage.toFixed(2)}%)
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <div className={`flex flex-col min-h-screen bg-white text-gray-900 w-full overflow-x-hidden ${theme === 'dark' ? 'dark' : ''}`}>
        {/* Desktop Navbar */}
        <nav className="fixed top-0 z-40 bg-emerald-900 text-white backdrop-blur transition-all duration-500 hidden lg:block dark:bg-gray-800 w-full">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="flex items-center justify-between py-2 md:py-5 w-full ">
            {/* Brand */}
            <div className="flex-shrink-0">
              <Link to="/" className=" hover:scale-105 transition-transform duration-200">
                <span className="text-yellow-700 font-bold text-3xl">Pesa</span>
                <span className="text-teal-300 font-bold">Prime</span>
              </Link>
            </div>

            <div className="flex-1 text-center px-4 ">
              {formatPnL()}
            </div>

            {/* Desktop nav links */}
            <ul className="flex items-center gap-x-2 text-sm flex-shrink-0">
              <NavItem 
                to="/wallet" 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-wallet2" viewBox="0 0 16 16">
                    <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5z"/>
                  </svg>
                }
                label="Wallet"
              />
              
              <NavItem 
                to="/assets" 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-currency-exchange" viewBox="0 0 16 16">
                    <path d="M0 5a5 5 0 0 0 4.027 4.905 6.5 6.5 0 0 1 .544-2.073C3.695 7.536 3.132 6.864 3 5.91h-.5v-.426h.466V5.05q-.001-.07.004-.135H2.5v-.427h.511C3.236 3.24 4.213 2.5 5.681 2.5c.316 0 .59.031.819.085v.733a3.5 3.5 0 0 0-.815-.082c-.919 0-1.538.466-1.734 1.252h1.917v.427h-1.98q-.004.07-.003.147v.422h1.983v.427H3.93c.118.602.468 1.03 1.005 1.229a6.5 6.5 0 0 1 4.97-3.113A5.002 5.002 0 0 0 0 5m16 5.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0m-7.75 1.322c.069.835.746 1.485 1.964 1.562V14h.54v-.62c1.259-.086 1.996-.74 1.996-1.69 0-.865-.563-1.31-1.57-1.54l-.426-.1V8.374c.54.06.884.347.966.745h.948c-.07-.804-.779-1.433-1.914-1.502V7h-.54v.629c-1.076.103-1.808.732-1.808 1.622 0 .787.544 1.288 1.45 1.493l.358.085v1.78c-.554-.08-.92-.376-1.003-.787zm1.96-1.895c-.532-.12-.82-.364-.82-.732 0-.41.311-.719.824-.809v1.54h-.005zm.622 1.044c.645.145.943.38.943.796 0 .474-.37.8-1.02.86v-1.674z"/>
                  </svg>
                }
                label="Assets"
              />

              <span className="hidden w-2 h-12 bg-gray-500 md:block dark:bg-gray-600 rounded-full"></span>
                
              <NavItem 
                to="/profile" 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-person-badge text-blue-300" viewBox="0 0 16 16">
                    <path d="M6.5 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                    <path d="M4.5 0A2.5 2.5 0 0 0 2 2.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2.5A2.5 2.5 0 0 0 11.5 0zM3 2.5A1.5 1.5 0 0 1 4.5 1h7A1.5 1.5 0 0 1 13 2.5v10.795a4.2 4.2 0 0 0-.776-.492C11.392 12.387 10.063 12 8 12s-3.392.387-4.224.803a4.2 4.2 0 0 0-.776.492z"/>
                  </svg>
                }
                label="Profile"
              />

             <li>
                <CurrencyDropdown />
              </li>
              
            </ul>
          </div>
        </div>
      </nav>

      {/* Mobile header */}
      <div className="fixed top-0 z-40 bg-emerald-900 text-white backdrop-blur transition-all duration-500 block lg:hidden p-4 dark:bg-gray-800 w-full">
        <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
              <span className="text-yellow-700 font-bold text-2xl">Pesa</span>
              <span className="text-teal-300 font-bold">Prime</span>
            </Link>
          </div>
              
          <div className="flex-1 text-center px-2">
            {formatPnL()}
          </div>

          {/* Currency Dropdown for Mobile */}
          <div className="flex-col text-center px-2">
            <CurrencyDropdown />
          </div>
        </div>
      </div>

      {/* Main content - FIXED: Added proper width constraints */}
      <main className="flex w-full px-4 pt-8 mb-10 lg:-mb-4 dark:bg-gray-900">
        <div className="mt-20 mx-1 w-full min-h-screen overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation currentPath={location.pathname} />

      {/* Chat Bot */}
      <FAQBot />

      {/* Footer */}
      <Footer />
    </div>
  );
};

// Helper Components
const NavItem = ({ to, icon, label }: NavItemProps) => (
  <li className="text-white text-center border rounded-xl border-yellow-700 space-x-2 px-4 py-2 hover:bg-yellow-900 hover:scale-105 transition-transform duration-200 dark:hover:bg-yellow-800">
    <Link to={to} className="flex items-center space-x-2">
      {icon}
      <span>{label}</span>
    </Link>
  </li>
);

const MobileNavigation = ({ currentPath }: MobileNavigationProps) => {
  const navItems = [
    { to: "/", icon: "home", label: "Home" },
    { to: "/wallet", icon: "wallet", label: "Wallet" },
    { to: "/assets", icon: "assets", label: "Assets" },
    { to: "/profile", icon: "profile", label: "Account" }
  ];

  return (
    <div className="block lg:hidden">
      <div className="fixed bottom-0 left-0 right-0 w-full rounded-t-3xl bg-emerald-900 dark:bg-gray-800 border-t border-emerald-700">
        <div className="flex justify-around p-2 text-white max-w-7xl mx-auto">
          {navItems.map((item, index) => (
            <MobileNavItem 
              key={index}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.to}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const MobileNavItem = ({ to, icon, label, isActive }: MobileNavItemProps) => {
  // Function to render the appropriate SVG icon based on the icon type
  const renderIcon = () => {
    switch (icon) {
      case "home":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-bank" viewBox="0 0 16 16">
            <path d="m8 0 6.61 3h.89a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H15v7a.5.5 0 0 1 .485.38l.5 2a.498.498 0 0 1-.485.62H.5a.498.498 0 0 1-.485-.62l.5-2A.5.5 0 0 1 1 13V6H.5a.5.5 0 0 1-.5-.5v-2A.5.5 0 0 1 .5 3h.89zM3.777 3h8.447L8 1zM2 6v7h1V6zm2 0v7h2.5V6zm3.5 0v7h1V6zm2 0v7H12V6zM13 6v7h1V6zm2-1V4H1v1zm-.39 9H1.39l-.25 1h13.72z"/>
          </svg>
        );
      case "wallet":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-wallet" viewBox="0 0 16 16">
            <path d="M0 3a2 2 0 0 1 2-2h13.5a.5.5 0 0 1 0 1H15v2a1 1 0 0 1 1 1v8.5a1.5 1.5 0 0 1-1.5 1.5h-12A2.5 2.5 0 0 1 0 12.5zm1 1.732V12.5A1.5 1.5 0 0 0 2.5 14h12a.5.5 0 0 0 .5-.5V5H2a2 2 0 0 1-1-.268M1 3a1 1 0 0 0 1 1h12V2H2a1 1 0 0 0-1 1"/>
          </svg>
        );
      case "assets":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-currency-exchange" viewBox="0 0 16 16">
            <path d="M0 5a5 5 0 0 0 4.027 4.905 6.5 6.5 0 0 1 .544-2.073C3.695 7.536 3.132 6.864 3 5.91h-.5v-.426h.466V5.05q-.001-.07.004-.135H2.5v-.427h.511C3.236 3.24 4.213 2.5 5.681 2.5c.316 0 .59.031.819.085v.733a3.5 3.5 0 0 0-.815-.082c-.919 0-1.538.466-1.734 1.252h1.917v.427h-1.98q-.004.07-.003.147v.422h1.983v.427H3.93c.118.602.468 1.03 1.005 1.229a6.5 6.5 0 0 1 4.97-3.113A5.002 5.002 0 0 0 0 5m16 5.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0m-7.75 1.322c.069.835.746 1.485 1.964 1.562V14h.54v-.62c1.259-.086 1.996-.74 1.996-1.69 0-.865-.563-1.31-1.57-1.54l-.426-.1V8.374c.54.06.884.347.966.745h.948c-.07-.804-.779-1.433-1.914-1.502V7h-.54v.629c-1.076.103-1.808.732-1.808 1.622 0 .787.544 1.288 1.45 1.493l.358.085v1.78c-.554-.08-.92-.376-1.003-.787zm1.96-1.895c-.532-.12-.82-.364-.82-.732 0-.41.311-.719.824-.809v1.54h-.005zm.622 1.044c.645.145.943.38.943.796 0 .474-.37.8-1.02.86v-1.674z"/>
          </svg>
        );
      case "profile":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-person-vcard-fill" viewBox="0 0 16 16">
            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm9 1.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1h-4a.5.5 0 0 0-.5.5M9 8a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1h-4A.5.5 0 0 0 9 8m1 2.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 0-1h-3a.5.5 0 0 0-.5.5m-1 2C9 10.567 7.21 9 5 9c-2.086 0-3.8 1.398-3.984 3.181A1 1 0 0 0 2 13h6.96q.04-.245.04-.5M7 6a2 2 0 1 0-4 0 2 2 0 0 0 4 0"/>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center hover:scale-105 transition-transform duration-200 rounded-xl px-3 py-2 ${isActive ? 'bg-amber-900' : ''}`}>
      <Link to={to} className="flex flex-col items-center">
        {renderIcon()}
        <p className="mt-1 text-center text-xs">{label}</p>
      </Link>
    </div>
  );
};

// LoadingOverlay and Footer components remain the same...
const LoadingOverlay = () => (
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

const Footer = () => (
  <div className="bg-emerald-800 text-white text-center rounded-t-2xl hidden lg:block dark:bg-gray-800  border-t border-green-300">
    <footer className="bg-emerald-900 text-white rounded-2xl px-2 pb-6 text-center item-center dark:bg-gray-900">
      <br />
      <span className="text-yellow-700 font-bold">Pesa</span>
      <span className="text-blue-300 font-bold">Prime</span> Capital.
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          <div>
            <div className="max-w-lg mx-auto text-center">
              <br />
              <p className="leading-relaxed text-center text-[14px] dark:text-gray-300">
                PesaPrime Capital was founded in 2023 with a mission to make investment accessible to all. Since then, we've proudly served thousands of happy customers across Kenya and beyond. Our passion is delivering quality and value you can trust.
              </p>
            </div>
            {/* Newsletter */}
            <div className="max-w-lg mx-auto mt-8">
              <form className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full sm:w-auto px-4 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg shadow-md transition dark:bg-indigo-700 dark:hover:bg-indigo-600">
                  Subscribe
                </button>
              </form>
              <p className="text-sm text-gray-400 mt-2 text-center dark:text-gray-500">
                Join our newsletter to get the latest deals & updates.
              </p>
            </div>
          </div>

          <div className="text-center">
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
    
      <div className="py-8">
        <div className="mt-4 sm:mt-0 dark:text-gray-400">
          &copy; 2025 PesaPrime Capital. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
);

export default BaseLayout;