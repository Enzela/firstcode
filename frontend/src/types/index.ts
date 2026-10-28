export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  balance: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RouteHealth {
  route_name: string;
  priority: number;
  balance: number;
  failure_rate: number;
  failure_rate_percent: number;
  is_active: boolean;
  total_requests_24h: number;
  success_requests_24h: number;
  failed_requests_24h: number;
  success_rate_24h: number;
  health_percentage: number;
}

export interface SMSLogItem {
  id: string;
  recipient: string;
  original_recipient: string;
  message: string;
  encoding: 'GSM_7' | 'UNICODE';
  parts: number;
  cost: number;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'REFUNDED' | 'DELIVERED' | 'UNDELIVERED';
  provider_name?: string | null;
  refunded: boolean;
  batch_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedLogs {
  items: SMSLogItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface EstimateResult {
  encoding: 'GSM_7' | 'UNICODE';
  character_count: number;
  parts_per_message: number;
  valid_recipients: string[];
  invalid_recipients: Array<{ input: string; reason: string }>;
  total_valid: number;
  total_invalid: number;
  cost_per_message: number;
  total_cost: number;
}

export interface SendSMSResult {
  batch_id: string;
  encoding: string;
  parts_per_message: number;
  total_recipients: number;
  valid_count: number;
  invalid_count: number;
  sent_count: number;
  failed_count: number;
  total_charged: number;
  total_refunded: number;
  net_cost: number;
  final_wallet_balance: number;
  sent_messages: Array<{
    id: string;
    recipient: string;
    status: string;
    provider: string;
    attempts: Array<{ route: string; attempt: number; status: string; reason?: string }>;
    parts: number;
    cost: number;
    refunded: boolean;
  }>;
  failed_messages: Array<{
    id: string;
    recipient: string;
    status: string;
    provider?: string | null;
    attempts: Array<{ route: string; attempt: number; status: string; reason?: string }>;
    parts: number;
    cost: number;
    refunded: boolean;
  }>;
  invalid_recipients: Array<{ input: string; reason: string }>;
}

export interface LedgerItem {
  id: string;
  transaction_type: 'INITIAL' | 'TOPUP' | 'CHARGE' | 'REFUND';
  amount: number;
  balance_after: number;
  reference_id?: string | null;
  description?: string | null;
  created_at: string;
}

export interface ConcurrencyTestResult {
  scenario: string;
  initial_credits: number;
  parallel_requests: number;
  success_count: number;
  rejected_count: number;
  error_count: number;
  final_wallet_balance: number;
  test_passed: boolean;
  verdict: string;
  requests: Array<{
    index: number;
    status: string;
    message: string;
    batch_id?: string;
  }>;
}
