import axios from 'axios';
import {
  AuthResponse,
  User,
  RouteHealth,
  PaginatedLogs,
  EstimateResult,
  SendSMSResult,
  LedgerItem,
  ConcurrencyTestResult
} from '../types';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('nest_sms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Authentication
  async register(email: string, password: string): Promise<User> {
    const res = await apiClient.post<User>('/auth/register', { email, password });
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('nest_sms_token', res.data.access_token);
    return res.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('nest_sms_token');
  },

  // Wallet
  async getWalletBalance(): Promise<{ balance: number; currency: string }> {
    const res = await apiClient.get('/wallet/balance');
    return res.data;
  },

  async topUpWallet(amount: number, description?: string): Promise<{ balance: number }> {
    const res = await apiClient.post('/wallet/topup', { amount, description });
    return res.data;
  },

  async getWalletLedger(limit = 20): Promise<LedgerItem[]> {
    const res = await apiClient.get<LedgerItem[]>('/wallet/ledger', { params: { limit } });
    return res.data;
  },

  // SMS Management
  async estimateSMS(to: string[], message: string): Promise<EstimateResult> {
    const res = await apiClient.post<EstimateResult>('/sms/estimate', { to, message });
    return res.data;
  },

  async sendSMS(to: string[], message: string, forceFailRoute?: string): Promise<SendSMSResult> {
    const res = await apiClient.post<SendSMSResult>('/sms/send', {
      to,
      message,
      force_fail_route: forceFailRoute || null,
    });
    return res.data;
  },

  async getSMSLogs(params: {
    status?: string;
    number?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedLogs> {
    const res = await apiClient.get<PaginatedLogs>('/sms/logs', { params });
    return res.data;
  },

  // Routes Health
  async getRouteHealth(): Promise<RouteHealth[]> {
    const res = await apiClient.get<RouteHealth[]>('/routes/health');
    return res.data;
  },

  async updateRouteConfig(
    name: string,
    data: { priority?: number; balance?: number; failure_rate?: number; is_active?: boolean }
  ): Promise<any> {
    const res = await apiClient.put(`/routes/${name}/config`, data);
    return res.data;
  },

  // Bonus B3: Webhook Delivery Report
  async submitDeliveryReport(data: {
    message_id: string;
    status: string;
    provider: string;
  }): Promise<any> {
    const res = await apiClient.post('/webhooks/delivery-report', data);
    return res.data;
  },

  // Interview Concurrency Test Demo
  async runConcurrencyTest(
    initialCredits = 10,
    parallelRequests = 20
  ): Promise<ConcurrencyTestResult> {
    const res = await apiClient.post<ConcurrencyTestResult>('/demo/run-concurrency-test', null, {
      params: { initial_credits: initialCredits, parallel_requests: parallelRequests },
    });
    return res.data;
  },
};
