// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  meta: {
    request_id: string
    timestamp: string
    page?: number
    per_page?: number
    total?: number
    total_pages?: number
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    error_id: string
    details?: Record<string, string | string[]>
  }
  meta: {
    request_id: string
    timestamp: string
  }
}

// Auth Types
export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  verified_otp?: boolean
}

export interface User {
  id: string
  email: string
  phone: string
  full_name: string | null
  kyc: {
    status: 'pending' | 'approved' | 'rejected'
    level: 'basic' | 'intermediate' | 'full'
  }
  wallet: {
    balance: number
  }
  permissions: string[]
  created_at: string
}

export interface Session {
  id: string
  ip_address: string
  user_agent: string
  created_at: string
  last_used_at: string
  current: boolean
}

// Events & Markets Types
export interface Event {
  id: string
  slug: string
  title: string
  description: string
  category: string
  status: 'draft' | 'active' | 'closed' | 'archived'
  startsAt: string
  endsAt: string
  resolveRules: string
  sourceUrls: string[]
  imageUrl: string | null
  createdAt: string
  isFavorite?: boolean
  markets?: Market[]
}

export interface Market {
  id: string
  eventId?: string
  statement: string
  status: 'draft' | 'open' | 'closed' | 'settled' | 'canceled'
  opensAt?: string
  closesAt: string
  resolvesAt?: string
  feeBps?: number
  qYes: number
  qNo: number
  liquidityB: number
  probYes: number
  probNo: number
  result: 'YES' | 'NO' | null
  settledAt?: string | null
  createdAt?: string
  event?: {
    id: string
    slug: string
    title: string
    category: string
  }
}

export interface Position {
  id: string
  marketId: string
  marketTitle?: string
  optionTitle?: string
  quantity?: number
  side: 'YES' | 'NO'
  amount: number
  shares: number
  avgPrice: number
  currentPrice?: number // Current market price per share (for live value calculation)
  currentSellValue?: number // Accurate real-time sell value from backend
  currentSellPrice?: number // Accurate real-time sell price from backend
  status: 'active' | 'settled' | 'refunded' | 'open'
  payoutAmount: number | null
  createdAt: string
  settledAt: string | null
  marketStatement?: string
  marketStatus?: string
  marketResult?: 'YES' | 'NO' | null
  eventTitle?: string
  eventSlug?: string
}

// Wallet Types
export interface Wallet {
  id: string
  status: 'active' | 'frozen' | 'suspended'
  balance: number
  balance_formatted: string
  risk_level: 'low' | 'medium' | 'high'
  created_at: string
}

export type WalletInfo = AdminWallet;

export interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  amount_formatted: string
  balance_after: number
  balance_after_formatted: string
  reference_type: string
  reference_id: string
  description: string
  created_at: string
}

export interface WalletEntry {
  id: string
  type: 'credit' | 'debit'
  amount: number
  amount_formatted: string
  balance_after: number
  balance_after_formatted: string
  reference_type: 'deposit' | 'withdraw' | 'position' | 'settlement' | 'bonus'
  reference_id: string
  description: string
  created_at: string
}

export interface Deposit {
  id: string
  amount: number
  amount_formatted: string
  fee_amount?: number
  fee_amount_formatted?: string
  net_amount?: number
  net_amount_formatted?: string
  status: 'pending' | 'paid' | 'failed' | 'expired'
  pix_qrcode?: string
  pix_qrcode_image?: string
  pix_copy_paste?: string
  expires_at: string
  paid_at?: string | null
  created_at: string
}

export interface Withdrawal {
  id: string
  amount: number
  amount_formatted: string
  fee_amount?: number
  fee_amount_formatted?: string
  net_amount?: number
  net_amount_formatted?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  pix_key_type: string
  pix_key_masked?: string
  pix_key_value?: string
  processed_at: string | null
  completed_at: string | null
  failed_at: string | null
  created_at: string
}

// Admin Types
export interface Admin {
  id: string
  email: string
  name?: string
  fullName?: string
  role: string
  mfaEnabled?: boolean
  status?: string
  lastLoginAt?: string
  createdAt?: string
}

export interface AdminUser {
  id: string
  cpf?: string
  email: string
  phone: string
  full_name: string
  birth_date?: string
  mother_name?: string
  gender?: string
  status: 'active' | 'suspended' | 'deleted'
  kyc_status: 'pending' | 'approved' | 'rejected'
  kyc_level: 'basic' | 'intermediate' | 'full'
  flags: Record<string, boolean>
  verified_at: string | null
  accept_terms?: boolean
  accept_terms_at?: string
  created_at: string
  updated_at?: string
  deleted_at?: string | null
}

export interface AdminWallet {
  id: string
  user_id: string
  user_email?: string
  user_full_name?: string
  status: 'active' | 'frozen' | 'closed'
  balance: number
  balance_formatted: string
  risk_level: 'low' | 'medium' | 'high'
  frozen_reason: string | null
  frozen_at: string | null
  frozen_by?: string | null
  created_at: string
}

export interface AdminDeposit {
  id: string
  user_id: string
  user_email: string
  user_full_name: string
  wallet_id: string
  amount: number
  amount_formatted: string
  fee_amount: number
  fee_amount_formatted: string
  net_amount: number
  net_amount_formatted: string
  status: 'pending' | 'paid' | 'failed' | 'expired'
  gateway_transaction_id: string | null
  pix_e2e_id: string | null
  pix_qrcode?: string
  pix_copy_paste?: string
  expires_at: string
  paid_at: string | null
  created_at: string
}

export interface AdminWithdrawal {
  id: string
  user_id: string
  user_email: string
  user_full_name: string
  user_cpf?: string
  wallet_id: string
  amount: number
  amount_formatted: string
  fee_amount: number
  fee_amount_formatted: string
  net_amount: number
  net_amount_formatted: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  gateway?: string
  pix_key_type: string
  pix_key_value: string
  gateway_transaction_id?: string | null
  failure_reason?: string | null
  cancelled_reason?: string | null
  processed_at: string | null
  completed_at: string | null
  failed_at: string | null
  cancelled_at?: string | null
  created_at: string
}

export interface KYC {
  id: string
  user_id: string
  user?: { email: string; full_name: string }
  status: 'pending' | 'approved' | 'rejected'
  level: 'basic' | 'intermediate' | 'full'
  provider: string
  provider_reference?: string | null
  documents?: unknown[]
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  notes?: string | null
  created_at: string
  updated_at?: string
}

export interface KycDocument {
  type: string
  url: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
}

export type KycSubmission = KYC; // Alias para compatibilidade

export interface LedgerEntry {
  id: string
  wallet_id: string
  user_id: string
  user_email: string
  user_full_name: string
  entry_type: 'credit' | 'debit'
  amount: number
  amount_formatted: string
  balance_after: number
  balance_after_formatted: string
  reference_type: string
  reference_id: string
  description: string
  request_id?: string
  created_at: string
}

export interface AuditLog {
  id: string
  admin_id: string
  admin: { email: string; name: string }
  action: string
  resource_type: string
  resource_id: string
  target_user_id?: string
  ip_address: string
  user_agent?: string
  request_id?: string
  payload?: unknown
  metadata?: unknown
  previous_state?: unknown
  new_state?: unknown
  created_at: string
}

export interface FinancialEvent {
  id: string
  user_id: string
  user_email: string
  wallet_id: string
  event_type: string
  reference_type: string
  reference_id: string
  amount: number
  amount_formatted: string
  balance_before: number
  balance_after: number
  metadata?: Record<string, unknown>
  request_id?: string
  created_at: string
}

// Pagination
export interface Pagination {
  total: number
  limit: number
  offset: number
}

export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
  last_page?: number
}
