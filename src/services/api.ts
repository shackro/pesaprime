// services/api.ts - COMPREHENSIVE DJANGO BACKEND INTEGRATION

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
  transaction_id: string;
}

export interface PnLData {
  profit_loss: number;
  percentage: number;
  trend: 'up' | 'down';
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
  logout() {
    throw new Error('Method not implemented.');
  }
  private baseURL: string;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    this.baseURL = 'https://pesaprime-end.onrender.com' || import.meta.env.VITE_API_BASE_URL;
    console.log('API Base URL:', this.baseURL);
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  private removeToken(): void {
    localStorage.removeItem('authToken');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      // Token expired or invalid
      this.removeToken();
      window.dispatchEvent(new Event('unauthorized'));
      throw new Error('Authentication failed. Please login again.');
    }

    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }

    if (response.status === 404) {
      throw new Error('Resource not found.');
    }

    if (response.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    try {
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      // Return empty object for 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }
      throw new Error('Invalid JSON response from server');
    }
  }

  private async handleErrorResponse(response: Response): Promise<void> {
    let errorMessage = 'Request failed';
    let errorDetail = '';
    
    try {
      const errorText = await response.text();
      console.error('Error response text:', errorText);
      
      if (errorText) {
        try {
          const errorData = JSON.parse(errorText);
          
          // Handle Django REST framework error formats
          if (typeof errorData === 'object') {
            // Django REST framework common error fields
            if (errorData.detail) {
              errorMessage = errorData.detail;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else if (Array.isArray(errorData)) {
              errorMessage = errorData.join(', ');
            } else if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else {
              // Handle field-specific validation errors
              const fieldErrors = Object.keys(errorData).map(key => {
                const value = errorData[key];
                if (Array.isArray(value)) {
                  return `${key}: ${value.join(', ')}`;
                } else if (typeof value === 'string') {
                  return `${key}: ${value}`;
                }
                return `${key}: ${JSON.stringify(value)}`;
              }).filter(Boolean);
              
              if (fieldErrors.length > 0) {
                errorMessage = 'Validation failed';
                errorDetail = fieldErrors.join('; ');
              }
            }
          }
        } catch {
          errorMessage = errorText || `HTTP error! status: ${response.status}`;
        }
      } else {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
    } catch (parseError) {
      errorMessage = `HTTP error! status: ${response.status}`;
    }
    
    const error = new Error(errorMessage) as any;
    if (errorDetail) {
      error.detail = errorDetail;
    }
    error.status = response.status;
    
    console.error('Throwing error:', error);
    throw error;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      // Retry logic for network errors
      if (this.retryCount < this.maxRetries && this.isNetworkError(error)) {
        this.retryCount++;
        console.log(`Retrying request (${this.retryCount}/${this.maxRetries})...`);
        await this.delay(1000 * this.retryCount); // Exponential backoff
        return this.request<T>(endpoint, options);
      }
      
      this.retryCount = 0; // Reset retry count
      throw error;
    }
  }

  private isNetworkError(error: any): boolean {
    return (
      error instanceof TypeError || // Network failure
      error.message?.includes('Network') ||
      error.message?.includes('fetch')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


// ===============================
// AUTHENTICATION METHODS - FIXED
// ===============================

async register(userData: UserCreate): Promise<AuthResponse> {
  try {
    console.log('Attempting registration with:', userData);
    
    const requestBody: any = {
      name: userData.name,
      email: userData.email,
      phone_number: userData.phone_number,
      password: userData.password
    };

    // Add password confirmation if provided
    if (userData.password_confirm) {
      requestBody.password_confirm = userData.password_confirm;
    }
    
    console.log('📤 Registration request body:', requestBody);
    
    const data = await this.request<AuthResponse>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    console.log('Registration successful:', data);
    
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

async login(loginData: UserLogin): Promise<AuthResponse> {
  try {
    console.log('🔐 Attempting login with:', loginData);
    
    const requestBody = {
      email: loginData.email,
      password: loginData.password
    };
    
    console.log('📤 Request body:', requestBody);
    
    const data = await this.request<AuthResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    console.log('✅ Login successful:', data);
    
    if (data.access_token) {
      this.setToken(data.access_token);
      console.log('💾 Token saved to localStorage');
    }
    
    return data;
  } catch (error: any) {
    console.error('❌ Login error:', error);
    throw error;
  }
}

// ===============================
// PROFILE MANAGEMENT - FIXED
// ===============================

async getCurrentUser(): Promise<UserResponse> {
  try {
    return await this.request<UserResponse>('/api/auth/user/');
  } catch (error) {
    console.error('Failed to get current user:', error);
    throw error;
  }
}

// ===============================
// WALLET METHODS - FIXED
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
// INVESTMENT METHODS - FIXED
// ===============================

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

// ===============================
// ACTIVITY METHODS - FIXED
// ===============================

async getMyActivities(params?: {
  page?: number;
  activity_type?: string;
  limit?: number;
}): Promise<UserActivity[]> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.activity_type) queryParams.append('activity_type', params.activity_type);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const url = queryString 
    ? `/api/activities/?${queryString}`
    : '/api/activities/';
  
  return this.request<UserActivity[]>(url);
}

  // ===============================
  // PROFILE MANAGEMENT
  // ===============================

  async updateProfile(profileData: UserUpdate): Promise<BaseResponse<UserResponse>> {
    return this.request<BaseResponse<UserResponse>>('/api/auth/profile/update/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: {
    current_password: string;
    new_password: string;
    confirm_password?: string;
  }): Promise<BaseResponse> {
    return this.request<BaseResponse>('/api/auth/password/change/', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async checkEmailAvailability(email: string): Promise<{ available: boolean; message: string }> {
    return this.request(`/api/auth/check-email/?email=${encodeURIComponent(email)}`);
  }

  async checkPhoneAvailability(phoneNumber: string): Promise<{ available: boolean; message: string }> {
    return this.request(`/api/auth/check-phone/?phone_number=${encodeURIComponent(phoneNumber)}`);
  }

  

  // ===============================
  // ADMIN METHODS (if needed)
  // ===============================

  async getUsers(params?: { page?: number; search?: string }): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `/api/admin/users/?${queryString}` : '/api/admin/users/';
    
    return this.request<PaginatedResponse<User>>(url);
  }

  // ===============================
  // SYSTEM METHODS
  // ===============================

  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    return this.request('/api/health/');
  }

  async getServerStatus(): Promise<{
    status: string;
    database: boolean;
    cache: boolean;
    timestamp: string;
  }> {
    return this.request('/api/status/');
  }

  // ===============================
  // FILE UPLOAD METHODS (if needed)
  // ===============================

  async uploadProfileImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/auth/upload-profile-image/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: formData,
    });

    return this.handleResponse(response);
  }

  // ===============================
  // REAL-TIME METHODS (WebSocket ready)
  // ===============================

  getWebSocketUrl(): string {
    const token = this.getToken();
    const wsBase = this.baseURL.replace('http', 'ws');
    return token 
      ? `${wsBase}/ws/investments/?token=${token}`
      : `${wsBase}/ws/investments/`;
  }

  // ===============================
  // CACHE MANAGEMENT
  // ===============================

  clearCache(): void {
    // Clear any cached data
    localStorage.removeItem('cachedAssets');
    localStorage.removeItem('cachedUserData');
  }

  // ===============================
  // ERROR BOUNDARY SUPPORT
  // ===============================

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthState(): { isAuthenticated: boolean; token: string | null } {
    return {
      isAuthenticated: this.isAuthenticated(),
      token: this.getToken(),
    };
  }
}

// ===============================
// ERROR HANDLER UTILITIES
// ===============================

export class ApiErrorHandler {
  static handle(error: any, context: string = ''): string {
    console.error(`API Error in ${context}:`, error);

    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        return 'Network error. Please check your internet connection.';
      }

      // Authentication errors
      if (error.message.includes('Authentication') || error.message.includes('401')) {
        return 'Your session has expired. Please login again.';
      }

      // Server errors
      if (error.message.includes('500')) {
        return 'Server error. Please try again later.';
      }

      // Return the actual error message
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  static extractValidationErrors(error: any): ValidationError {
    if (error.errors && typeof error.errors === 'object') {
      return error.errors;
    }
    return {};
  }
}

// ===============================
// EXPORT SINGLETON INSTANCE
// ===============================

export const apiService = new ApiService();

// ===============================
// REACT HOOKS READY (for use in components)
// ===============================

export const useApi = () => {
  return apiService;
};

// Default export for convenience
export default apiService;
