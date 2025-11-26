// contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiService, type UserResponse, type UserLogin, type UserCreate } from '../services/api';

interface AuthContextType {
  user: UserResponse | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log('🔄 Starting login process...');
      
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const loginData: UserLogin = { 
        email: email.trim(),
        password: password 
      };
      
      console.log('📤 Sending login request...');
      
      const response = await apiService.login(loginData);
      
      console.log('✅ Login response received:', response);
      
      if (response.access_token) {
        localStorage.setItem('authToken', response.access_token);
        
        // Set user from response
        if (response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
          localStorage.setItem('userData', JSON.stringify(response.user));
          console.log('👤 User authenticated:', response.user);
        } else {
          throw new Error('No user data received');
        }
      } else {
        throw new Error(response.message || 'Login failed - no token received');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Clear any invalid auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
      
      let errorMessage = 'Login failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.detail) {
        errorMessage = error.detail;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserCreate): Promise<void> => {
    setLoading(true);
    try {
      console.log('📝 Registering user...');
      const response = await apiService.register(userData);
      
      if (response.access_token && response.user) {
        localStorage.setItem('authToken', response.access_token);
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.user));
        console.log('✅ Registration successful:', response.user);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      // Clear any invalid data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
      
      let errorMessage = 'Registration failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.detail) {
        errorMessage = error.detail;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
    apiService.logout();
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
