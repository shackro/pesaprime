// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BaseLayout from './components/BaseLayout';
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import Assets from './pages/Assets';
import Profile from './pages/Profile';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Bonus from './pages/Bonus';
import AuthPage from './auth/signin';
import { CurrencyProvider } from './contexts/CurrencyContext';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import FAQs from './pages/FAQs';
import Contact from './pages/Contact';
import AboutUs from './pages/AboutUs';
import Trading from './components/Trading';

// Loading component
const LoadingSpinner = () => (
      <div style="position: fixed; top: -2; left: -2; width: 100%; height: 100%; background: #4b5563; display: flex; justify-content: center; align-items: center; z-index: 9999;" class="dark:bg-gray-900">
        <div class="relative text-center items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="currentColor" class="fill-green-600" viewBox="0 0 16 16">
            <path d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-.615-.093-1.022-.43-1.114-.9zm2.177-2.166c-.59-.137-.91-.416-.91-.836 0-.47.345-.822.915-.925v1.76h-.005zm.692 1.193c.717.166 1.048.435 1.048.91 0 .542-.412.914-1.135.982V8.518z"/>
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11m0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12"/>
          </svg>
          <div class="absolute -top-3 -left-3 h-20 w-20 rounded-full border-8 border-dotted border-green-600 animate-spin-slow dark:border-green-400"></div>
        </div>
      </div>
);

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// Public Route component (for auth pages when already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/home" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
          <AuthPage />
      } />
      
      {/* Protected routes */}
      <Route path="/home" element={
        <ProtectedRoute>
          <BaseLayout>
            <Home />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute>
          <BaseLayout>
            <Wallet />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/assets" element={
        <ProtectedRoute>
          <BaseLayout>
            <Assets />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <BaseLayout>
            <Profile />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/deposit" element={
        <ProtectedRoute>
          <BaseLayout>
            <Deposit />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/withdraw" element={
        <ProtectedRoute>
          <BaseLayout>
            <Withdraw />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/bonus" element={
        <ProtectedRoute>
          <BaseLayout>
            <Bonus />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/trading/:pairId?" element={
        <ProtectedRoute>
          <BaseLayout>
            <Trading />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/about" element={
        <ProtectedRoute>
          <BaseLayout>
            <AboutUs />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/contact" element={
        <ProtectedRoute>
          <BaseLayout>
            <Contact />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/faqs" element={
        <ProtectedRoute>
          <BaseLayout>
            <FAQs />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/terms" element={
        <ProtectedRoute>
          <BaseLayout>
            <TermsConditions />
          </BaseLayout>
        </ProtectedRoute>
      } />
      <Route path="/privacy" element={
        <ProtectedRoute>
          <BaseLayout>
            <PrivacyPolicy />
          </BaseLayout>
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <AppRoutes />
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
