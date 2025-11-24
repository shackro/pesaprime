// src/services/api.ts

import axios from "axios";

// ===============================
// TYPES
// ===============================

// Core User Types
export interface User {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
  updated_at?: string;
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
  id: number;
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
  refresh_token?: string;
}

export interface TokenRefreshResponse {
  access: string;
  refresh: string;
}

// Wallet Types
export interface WalletData {
  id: number;
  user_id: number;
  balance: number;
  equity: number;
  currency: string;
  created_at: string;
  updated_at: string;
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

// Transaction Types
export interface Transaction {
  id: number;
  user: number;
  type: 'deposit' | 'withdrawal' | 'investment' | 'bonus';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  currency: string;
  timestamp: string;
}

// Investment Types
export interface UserInvestment {
  id?: number;
  user?: number;
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
  status: 'active' | 'closed';
  created_at?: string;
  completion_time?: string;
}

export interface UserActivity {
  id?: number;
  user_phone?: string;
  activity_type: 'registration' | 'deposit' | 'withdraw' | 'investment';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
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
  type: 'crypto' | 'forex' | 'commodity' | 'stock';
  current_price: number;
  change_percentage: number;
  moving_average: number;
  trend: 'up' | 'down';
  chart_url: string;
  hourly_income: number;
  min_investment: number;
  duration: number;
  total_income: number;
  roi_percentage: number;
}

// Error Types
export interface ApiError {
  message: string;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface ValidationError {
  [field: string]: string[] | string;
}

// Response Wrappers
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

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
  private retryCount: number = 0;
  private maxRetries: number = 5;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://pesaprime-end.onrender.com';
    console.log('API Base URL:', this.baseURL);
  }

  // ===============================
  // TOKEN & HEADERS
  // ===============================
  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  private removeToken(): void {
    localStorage.removeItem('authToken');
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // ===============================
  // FETCH REQUEST HANDLER
  // ===============================
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text();
      let errorMsg = text;
      try { 
        const parsed = JSON.parse(text);
        errorMsg = parsed.detail || parsed.message || JSON.stringify(parsed);
      } catch {}
      throw new Error(errorMsg || response.statusText);
    }
    if (response.status === 204) return {} as T;
    return (await response.json()) as T;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        ...options,
      });
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (this.retryCount < this.maxRetries && (!error.status || error.message.includes('Network'))) {
        this.retryCount++;
        await new Promise(r => setTimeout(r, 500 * this.retryCount));
        return this.request<T>(endpoint, options);
      }
      this.retryCount = 0;
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isNetworkError(error: any): boolean {
    return error instanceof TypeError || error.message?.includes('Network') || error.message?.includes('fetch');
  }

  // ===============================
  // AUTH METHODS
  // ===============================
  async register(userData: UserCreate): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.access_token) this.setToken(data.access_token);
    return data;
  }

  async login(loginData: UserLogin): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
    if (data.access_token) this.setToken(data.access_token);
    return data;
  }

  logout(): void {
    this.removeToken();
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/api/auth/user/');
  }

  async updateProfile(profileData: UserUpdate): Promise<BaseResponse<UserResponse>> {
    return this.request<BaseResponse<UserResponse>>('/api/auth/profile/update/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: { current_password: string; new_password: string; confirm_password?: string; }): Promise<BaseResponse> {
    return this.request<BaseResponse>('/api/auth/password/change/', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  // ===============================
  // WALLET METHODS
  // ===============================
  async getWalletBalance(): Promise<WalletData> {
    return this.request<WalletData>('/api/wallet/balance/');
  }

  async depositFunds(data: DepositRequest): Promise<TransactionResponse> {
    return this.request<TransactionResponse>('/api/wallet/deposit/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async withdrawFunds(data: WithdrawRequest): Promise<TransactionResponse> {
    return this.request<TransactionResponse>('/api/wallet/withdraw/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===============================
  // INVESTMENT METHODS
  // ===============================
  // Fetch via Fetch API
  async getAssets(): Promise<Asset[]> {
    return this.request<Asset[]>('/api/investments/assets/');
  }

  async getMyInvestments(): Promise<UserInvestment[]> {
    return this.request<UserInvestment[]>('/api/investments/my-investments/');
  }

  async buyInvestment(investmentData: InvestmentRequest): Promise<BaseResponse<{ investment: UserInvestment; new_balance: number }>> {
    return this.request<BaseResponse<{ investment: UserInvestment; new_balance: number }>>('/api/investments/buy/', {
      method: 'POST',
      body: JSON.stringify(investmentData),
    });
  }

  // Additional CRUD via Axios for convenience
  private axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://pesaprime-end.onrender.com',
    headers: { 'Content-Type': 'application/json' },
  });

  async createInvestment(data: { title: string; amount: number; category?: string; user_id: string }) {
    const res = await this.axiosInstance.post('/investments/', data);
    return res.data;
  }

  async getInvestments(): Promise<UserInvestment[]> {
    const res = await this.axiosInstance.get('/investments/');
    return res.data;
  }

  async getInvestment(id: number): Promise<UserInvestment> {
    const res = await this.axiosInstance.get(`/investments/${id}`);
    return res.data;
  }

  async updateInvestment(id: number, data: Partial<UserInvestment>): Promise<UserInvestment> {
    const res = await this.axiosInstance.put(`/investments/${id}`, data);
    return res.data;
  }

  async deleteInvestment(id: number): Promise<{ message: string }> {
    const res = await this.axiosInstance.delete(`/investments/${id}`);
    return res.data;
  }

  // ===============================
  // ACTIVITY METHODS
  // ===============================
  async getMyActivities(params?: { page?: number; activity_type?: string; limit?: number }): Promise<UserActivity[]> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.activity_type) query.append('activity_type', params.activity_type);
    if (params?.limit) query.append('limit', params.limit.toString());
    const url = query.toString() ? `/api/activities/?${query}` : '/api/activities/';
    return this.request<UserActivity[]>(url);
  }

  // ===============================
  // FILE UPLOAD & WEBSOCKET
  // ===============================
  async uploadProfileImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.baseURL}/api/auth/upload-profile-image/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.getToken()}` },
      body: formData,
    });
    return this.handleResponse(res);
  }

  getWebSocketUrl(): string {
    const token = this.getToken();
    const wsBase = this.baseURL.replace('http', 'ws');
    return token ? `${wsBase}/ws/investments/?token=${token}` : `${wsBase}/ws/investments/`;
  }

  // ===============================
  // SYSTEM & UTILITY
  // ===============================
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    return this.request('/api/health/');
  }

  async getServerStatus(): Promise<{ status: string; database: boolean; cache: boolean; timestamp: string }> {
    return this.request('/api/status/');
  }

  clearCache(): void {
    localStorage.removeItem('cachedAssets');
    localStorage.removeItem('cachedUserData');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthState(): { isAuthenticated: boolean; token: string | null } {
    return { isAuthenticated: this.isAuthenticated(), token: this.getToken() };
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
export const useApi = () => apiService;
export default apiService;
