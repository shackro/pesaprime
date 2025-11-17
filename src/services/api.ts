// services/api.ts - UPDATED AND FIXED

// Types
export interface WalletData {
  balance: number;
  equity: number;
  currency: string;
}

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

export interface AuthResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
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

export interface ApiError {
  message: string;
  detail?: string;
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
  amount: number;              // Amount in the selected currency
  phone_number: string;
  currency: string;            // Add currency field
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
  hourly_income: number;        // Now in KES (90-220 range)
  min_investment: number;       // Now in KES (450-650 range)
  duration: number;
  total_income?: number;        // Added for display
  roi_percentage?: number;      // Added for display
}

export interface PnLData {
  profit_loss: number;
  percentage: number;
  trend: 'up' | 'down';
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    console.log('API Base URL:', this.baseURL);
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        
        // Try to parse as JSON, but fallback to text
        try {
          const errorData = JSON.parse(errorText);
          
          // Handle Pydantic validation errors specifically
          if (errorData.detail && Array.isArray(errorData.detail)) {
            // This is a Pydantic validation error
            const validationErrors = errorData.detail.map((err: any) => 
              `${err.loc.join('.')}: ${err.msg}`
            );
            errorMessage = `Validation error: ${validationErrors.join(', ')}`;
          } else {
            errorMessage = errorData.detail || errorData.message || errorText;
          }
        } catch {
          errorMessage = errorText || `HTTP error! status: ${response.status}`;
        }
      } catch (parseError) {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
      
      console.error('Throwing error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    try {
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      throw new Error('Invalid JSON response from server');
    }
  }

  // Auth methods
  async register(userData: UserCreate): Promise<AuthResponse> {
    try {
      console.log('Attempting registration with:', userData);
      
      // Create a clean, flat object
      const requestBody = {
        name: userData.name,
        email: userData.email,
        phone_number: userData.phone_number,
        password: userData.password
      };
      
      console.log('📤 Registration request body:', requestBody);
      
      const response = await fetch(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Registration response status:', response.status);
      
      const data = await this.handleResponse<AuthResponse>(response);
      console.log('Registration successful:', data);
      
      if (data.success && data.access_token) {
        localStorage.setItem('authToken', data.access_token);
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
      console.log('📡 Sending request to:', `${this.baseURL}/api/auth/login`);
      
      // Create a clean, flat object without nested structure
      const requestBody = {
        email: loginData.email,
        password: loginData.password
      };
      
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📨 Login response status:', response.status, response.statusText);
      
      const data = await this.handleResponse<AuthResponse>(response);
      console.log('✅ Login successful:', data);
      
      if (data.success && data.access_token) {
        localStorage.setItem('authToken', data.access_token);
        console.log('💾 Token saved to localStorage');
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      // Make sure we're throwing a string, not an object
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error('Unknown login error');
      }
    }
  }

  async getCurrentUser(): Promise<UserResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/me`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<UserResponse>(response);
  }

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
  }

  async getPnL(): Promise<PnLData> {
    const response = await fetch(`${this.baseURL}/api/wallet/pnl`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<PnLData>(response);
  }

  // Wallet methods - UPDATED WITH PHONE NUMBER PARAMETER
  async getWalletBalance(phoneNumber: string): Promise<WalletData> {
    const response = await fetch(`${this.baseURL}/api/wallet/balance/${phoneNumber}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<WalletData>(response);
  }

  async depositFunds(data: DepositRequest): Promise<TransactionResponse> {
    const response = await fetch(`${this.baseURL}/api/wallet/deposit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<TransactionResponse>(response);
  }

  async withdrawFunds(data: WithdrawRequest): Promise<TransactionResponse> {
    const response = await fetch(`${this.baseURL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<TransactionResponse>(response);
  }

  // Investment methods - UPDATED WITH PHONE NUMBER PARAMETER
  async getMyInvestments(phoneNumber: string): Promise<UserInvestment[]> {
    const response = await fetch(`${this.baseURL}/api/investments/my/${phoneNumber}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<UserInvestment[]>(response);
  }

  async buyInvestment(investmentData: InvestmentRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/investments/buy`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(investmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Investment failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Buy investment error:', error);
      throw error;
    }
  }

  // Market data methods
  async getAssets(): Promise<Asset[]> {
    const response = await fetch(`${this.baseURL}/api/assets/market`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Asset[]>(response);
  }

  // Activity methods - UPDATED WITH PHONE NUMBER PARAMETER
  async getMyActivities(phoneNumber: string): Promise<UserActivity[]> {
    const response = await fetch(`${this.baseURL}/api/activities/my/${phoneNumber}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<UserActivity[]>(response);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    const response = await fetch(`${this.baseURL}/api/health`);
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();