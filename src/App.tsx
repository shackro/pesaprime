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
import InvestmentsPage from "./pages/InvestmentsPage";

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
        <PublicRoute>
          <AuthPage />
        </PublicRoute>
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
      <Route path="/investments" element={
        <ProtectedRoute>
          <BaseLayout>
            <InvestmentsPage />
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
