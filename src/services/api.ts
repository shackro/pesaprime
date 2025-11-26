// src/services/api.ts

import axios from "axios";

// ===============================
// TYPES
// ===============================

// Core User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserCreate {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  password_confirm?: string;
}

export interface UserUpdate {
  name?: string;
  phone_number?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

// Auth Types
export interface AuthResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  user: UserResponse;
}

// Wallet Types
export interface WalletData {
  balance: number;
  equity: number;
  currency: string;
}

export interface DepositRequest {
  amount: number;
  phone_number: string;
}

export interface WithdrawRequest {
  amount: number;
  phone_number: string;
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  new_balance: number;
  new_equity: number;
  transaction_id?: string;
}

// Investment Types
export interface UserInvestment {
  id: string;
  user_phone: string;
  asset_id: string;
  asset_name: string;
  invested_amount: number;
  current_value: number;
  units: number;
  entry_price: number;
  current_price: number;
  hourly_income?: number;
  total_income?: number;
  duration?: number;
  roi_percentage?: number;
  profit_loss: number;
  profit_loss_percentage: number;
  status: string;
  created_at: string;
  completion_time?: string;
}

export interface UserActivity {
  id: string;
  user_phone: string;
  activity_type: string;
  amount: number;
  description: string;
  timestamp: string;
  status: string;
}

export interface InvestmentRequest {
  asset_id: string;
  amount: number;
  phone_number: string;
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: string;
  current_price: number;
  change_percentage: number;
  moving_average: number;
  trend: string;
  chart_url: string;
  hourly_income: number;
  min_investment: number;
  duration: number;
  total_income: number;
  roi_percentage: number;
}

// PnL Types
export interface PnLData {
  profit_loss: number;
  percentage: number;
  trend: string;
}

// Error Types
export interface ApiError {
  message: string;
  detail?: string;
  code?: string;
}

export interface ValidationError {
  [field: string]: string[] | string;
}

// Response Wrappers
export interface BaseResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError;
}

// ===============================
// API SERVICE
// ===============================

class ApiService {
  private baseURL: string;
  
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://pesaprime-end.onrender.com';
    console.log('API Base URL:', this.baseURL);
    
    // Setup axios interceptors
    this.setupInterceptors();
  }

  // ===============================
  // TOKEN MANAGEMENT
  // ===============================
  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  private removeToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }

  // ===============================
  // AXIOS SETUP
  // ===============================
  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['Content-Type'] = 'application/json';
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/signin';
        }
        return Promise.reject(error);
      }
    );
  }

  private axiosInstance = axios.create({
    baseURL: this.baseURL,
    timeout: 30000,
  });

  // ===============================
  // AUTH METHODS
  // ===============================
  async register(userData: UserCreate): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>('/api/auth/register', userData);
      if (response.data.access_token) {
        this.setToken(response.data.access_token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Registration failed');
    }
  }

  async login(loginData: UserLogin): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>('/api/auth/login', loginData);
      if (response.data.access_token) {
        this.setToken(response.data.access_token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Login failed');
    }
  }

  logout(): void {
    this.removeToken();
  }

  async getCurrentUser(): Promise<UserResponse> {
    try {
      const cachedUser = localStorage.getItem('userData');
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      const response = await this.axiosInstance.get<UserResponse>('/api/auth/me');
      localStorage.setItem('userData', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get user data');
    }
  }

  // ===============================
  // WALLET METHODS
  // ===============================
  async getWalletBalance(phoneNumber: string): Promise<WalletData> {
    try {
      const response = await this.axiosInstance.get<WalletData>(`/api/wallet/balance/${phoneNumber}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get wallet balance');
    }
  }

  async depositFunds(data: DepositRequest): Promise<TransactionResponse> {
    try {
      const response = await this.axiosInstance.post<TransactionResponse>('/api/wallet/deposit', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Deposit failed');
    }
  }

  async withdrawFunds(data: WithdrawRequest): Promise<TransactionResponse> {
    try {
      const response = await this.axiosInstance.post<TransactionResponse>('/api/wallet/withdraw', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Withdrawal failed');
    }
  }

  async getUserPnL(): Promise<PnLData> {
    try {
      const response = await this.axiosInstance.get<PnLData>('/api/wallet/pnl');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get PnL data');
    }
  }

  // ===============================
  // INVESTMENT METHODS
  // ===============================
  async getMarketAssets(): Promise<Asset[]> {
    try {
      const response = await this.axiosInstance.get<Asset[]>('/api/assets/market');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get market assets');
    }
  }

  async getMyInvestments(phoneNumber: string): Promise<UserInvestment[]> {
    try {
      const response = await this.axiosInstance.get<UserInvestment[]>(`/api/investments/my/${phoneNumber}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get investments');
    }
  }

  async buyInvestment(investmentData: InvestmentRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/api/investments/buy', investmentData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Investment failed');
    }
  }

  // ===============================
  // ACTIVITY METHODS
  // ===============================
  async getMyActivities(phoneNumber: string): Promise<UserActivity[]> {
    try {
      const response = await this.axiosInstance.get<UserActivity[]>(`/api/activities/my/${phoneNumber}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get activities');
    }
  }

  // ===============================
  // SYSTEM & UTILITY
  // ===============================
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    try {
      const response = await this.axiosInstance.get('/api/health');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Health check failed');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthState(): { isAuthenticated: boolean; token: string | null; user: UserResponse | null } {
    const token = this.getToken();
    const userData = localStorage.getItem('userData');
    return { 
      isAuthenticated: !!token, 
      token, 
      user: userData ? JSON.parse(userData) : null 
    };
  }

  // Helper method to get current user's phone number
  getCurrentUserPhone(): string | null {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      return user.phone_number;
    }
    return null;
  }
}

// ===============================
// ERROR HANDLER UTILITIES
// ===============================
export class ApiErrorHandler {
  static handle(error: any, context: string = ''): string {
    console.error(`API Error in ${context}:`, error);
    if (error instanceof Error) {
      if (error.message.includes('Network') || error.message.includes('fetch')) return 'Network error. Check your connection.';
      if (error.message.includes('Authentication') || error.message.includes('401')) return 'Session expired. Login again.';
      if (error.message.includes('500')) return 'Server error. Try again later.';
      return error.message;
    }
    return 'An unexpected error occurred.';
  }

  static extractValidationErrors(error: any): ValidationError {
    if (error.errors && typeof error.errors === 'object') return error.errors;
    return {};
  }
}

// ===============================
// EXPORT SINGLETON
// ===============================
export const apiService = new ApiService();
export default apiService;
