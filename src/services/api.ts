// src/services/api.ts
import axios from "axios";

// ===============================
// TYPES
// ===============================

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
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  user: UserResponse;
}

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
  profit_loss: number;
  profit_loss_percentage: number;
  status: string;
  created_at: string;
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

// ===============================
// API SERVICE
// ===============================

class ApiService {
  private baseURL: string;
  
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://pesaprime-end.onrender.com';
    console.log('API Base URL:', this.baseURL);
  }

  private getToken(): string | null {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private setToken(token: string): void {
    try {
      localStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  private removeToken(): void {
    try {
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    try {
      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorText;
        } catch {
          // If not JSON, use the text as is
        }
        throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  // ===============================
  // AUTH METHODS
  // ===============================
  async register(userData: UserCreate): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(loginData: UserLogin): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  logout(): void {
    this.removeToken();
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/api/auth/me');
  }

  // ===============================
  // WALLET METHODS
  // ===============================
  async getWalletBalance(phoneNumber: string): Promise<WalletData> {
    return this.request<WalletData>(`/api/wallet/balance/${phoneNumber}`);
  }

  async depositFunds(data: DepositRequest): Promise<TransactionResponse> {
    return this.request<TransactionResponse>('/api/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async withdrawFunds(data: WithdrawRequest): Promise<TransactionResponse> {
    return this.request<TransactionResponse>('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===============================
  // INVESTMENT METHODS
  // ===============================
  async getMarketAssets(): Promise<Asset[]> {
    return this.request<Asset[]>('/api/assets/market');
  }

  async getMyInvestments(phoneNumber: string): Promise<UserInvestment[]> {
    return this.request<UserInvestment[]>(`/api/investments/my/${phoneNumber}`);
  }

  async buyInvestment(investmentData: InvestmentRequest): Promise<any> {
    return this.request('/api/investments/buy', {
      method: 'POST',
      body: JSON.stringify(investmentData),
    });
  }

  // ===============================
  // ACTIVITY METHODS
  // ===============================
  async getMyActivities(phoneNumber: string): Promise<UserActivity[]> {
    return this.request<UserActivity[]>(`/api/activities/my/${phoneNumber}`);
  }

  // ===============================
  // UTILITY METHODS
  // ===============================
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    return this.request('/api/health');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUserPhone(): string | null {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.phone_number;
      }
      return null;
    } catch (error) {
      console.error('Error getting user phone:', error);
      return null;
    }
  }
}

// ===============================
// ERROR HANDLER
// ===============================
export class ApiErrorHandler {
  static handle(error: any, context: string = ''): string {
    console.error(`API Error in ${context}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return 'Unable to connect to server. Please check your internet connection.';
      }
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        return 'Your session has expired. Please login again.';
      }
      if (error.message.includes('404')) {
        return 'Requested resource not found.';
      }
      if (error.message.includes('500')) {
        return 'Server error. Please try again later.';
      }
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }
}

// ===============================
// EXPORT SINGLETON
// ===============================
export const apiService = new ApiService();
export default apiService;
