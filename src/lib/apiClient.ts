import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AppConfig } from '@/lib/config';

class ApiClient {
  private client: AxiosInstance;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  private createClient(): AxiosInstance {
    const baseURL = this.getBaseURL();
    
    const client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return client;
  }

  private getBaseURL(): string {
    if (this.config.mode === 'client' && this.config.serverUrl) {
      return this.config.serverUrl;
    }
    
    // Server mode - use local API
    return `http://localhost:${this.config.clientPort || 3000}`;
  }

  public updateConfig(newConfig: AppConfig): void {
    this.config = newConfig;
    this.client = this.createClient();
  }

  // Generic API methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Specific API methods
  public async login(username: string, password: string) {
    return this.post('/api/auth/login', { username, password });
  }

  public async getDashboard() {
    return this.get('/api/dashboard');
  }

  public async getMembers() {
    return this.get('/api/members');
  }

  public async getMember(id: string) {
    return this.get(`/api/members/${id}`);
  }

  public async createMember(data: any) {
    return this.post('/api/members', data);
  }

  public async updateMember(id: string, data: any) {
    return this.put(`/api/members/${id}`, data);
  }

  public async deleteMember(id: string) {
    return this.delete(`/api/members/${id}`);
  }

  public async getPurchases() {
    return this.get('/api/purchases');
  }

  public async createPurchase(data: any) {
    return this.post('/api/purchases', data);
  }

  public async getAdvances() {
    return this.get('/api/advances');
  }

  public async createAdvance(data: any) {
    return this.post('/api/advances', data);
  }

  public async getPrices() {
    return this.get('/api/prices');
  }

  public async updatePrices(data: any) {
    return this.put('/api/prices', data);
  }

  public async getLocations() {
    return this.get('/api/locations');
  }

  // Health check for server connectivity
  public async healthCheck(): Promise<boolean> {
    try {
      await this.get('/api/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get server info
  public async getServerInfo() {
    return this.get('/api/server/info');
  }
}

// Singleton instance
let apiClientInstance: ApiClient | null = null;

export function createApiClient(config: AppConfig): ApiClient {
  apiClientInstance = new ApiClient(config);
  return apiClientInstance;
}

export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    // Try to create with default config if not initialized
    const defaultConfig: AppConfig = {
      mode: 'server',
      serverPort: 3001,
      clientPort: 3000,
    };
    apiClientInstance = new ApiClient(defaultConfig);
  }
  return apiClientInstance;
}

export function updateApiClient(config: AppConfig): void {
  if (apiClientInstance) {
    apiClientInstance.updateConfig(config);
  } else {
    createApiClient(config);
  }
}
