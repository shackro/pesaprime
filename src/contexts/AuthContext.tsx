// contexts/AuthContext.tsx - Update the login function
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiService, type UserResponse, type UserLogin, type UserCreate } from '../services/api';

interface AuthContextType {
  user: UserResponse | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithObject?: (credentials: UserLogin) => Promise<void>; // Optional alternative
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
      const token = localStorage.getItem('authToken');
      if (token) {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Login function that accepts two string parameters
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log('🔄 Starting login process...');
      
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (typeof email !== 'string' || typeof password !== 'string') {
        throw new Error('Email and password must be strings');
      }

      const loginData: UserLogin = { 
        email: email.trim(),
        password: password 
      };
      
      console.log('📤 Final login data being sent:', { 
        email: loginData.email, 
        password: '***'.repeat(loginData.password.length) 
      });
      
      const response = await apiService.login(loginData);
      
      console.log('✅ Login response in context:', response);
      
      // FIXED: Handle different response structures
      if (response.access_token) {
        localStorage.setItem('authToken', response.access_token);
        
        // Try to get user data
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
          console.log('👤 User set in context:', userData);
        } catch (userError) {
          console.warn('Could not fetch user data, using response user:', userError);
          // If we have user data in response, use it
          if (response.user) {
            setUser(response.user);
            setIsAuthenticated(true);
          } else {
            throw new Error('Could not retrieve user information');
          }
        }
      } else {
        const errorMsg = response.message || 'Login failed - no token received';
        console.error('❌ Login failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Login error in AuthContext:', error);
      setIsAuthenticated(false);
      
      let errorMessage = 'Login failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.detail) {
        errorMessage = error.detail;
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserCreate): Promise<void> => {
    setLoading(true);
    try {
      console.log('Registering user:', userData);
      const response = await apiService.register(userData);
      
      // FIXED: Handle different response structures
      if (response.access_token) {
        localStorage.setItem('authToken', response.access_token);
        
        // Try to get user data
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
          console.log('Registration successful, user set:', userData);
        } catch (userError) {
          console.warn('Could not fetch user data, using response user:', userError);
          // If we have user data in response, use it
          if (response.user) {
            setUser(response.user);
            setIsAuthenticated(true);
          }
        }
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Alternative login method that accepts an object (for backward compatibility)
  const loginWithObject = async (credentials: UserLogin): Promise<void> => {
    return login(credentials.email, credentials.password);
  };



  const logout = (): void => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    apiService.logout();
  };

  const value: AuthContextType = {
    user,
    login,
    loginWithObject,
    register,
    logout,
    loading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};