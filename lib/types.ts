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
  nickname: string | null
  phone: string
  full_name: string | null
  bio: string | null
  twitter_username: string | null
  instagram_username: string | null
  kyc: {
    status: 'pending' | 'approved' | 'rejected'
    level: 'basic' | 'intermediate' | 'full'
  }
  avatar_url?: string | null
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
  type?: 'standard' | 'quick'
  startsAt: string
  endsAt: string
  resolveRules: string
  sourceUrls: string[]
  imageUrl: string | null
  createdAt: string
  isFavorite?: boolean
  volume?: number
  totalVolume?: number
  total_volume?: number
  markets?: Market[]
}

// Quick Market Types (Mercados Rápidos)
export interface QuickRound {
  id: string
  eventId?: string
  marketId: string
  roundNumber: number
  roundStatus: 'pending' | 'open' | 'closing' | 'settled' | 'annulled'
  openPrice: number
  closePrice?: number | null
  result?: 'YES' | 'NO' | 'ANNULLED' | null
  annulReason?: string | null
  startsAt: string
  endsAt: string
  assetSymbol: string
  resolvedAt?: string | null
}

export interface QuickMarketCurrentResponse {
  round: QuickRound | null
  event: {
    id: string
    slug: string
    title: string
    status: string
  } | null
  market: {
    id: string
    status: string
    qYes: number
    qNo: number
    liquidityB: number
    feeBps: number
    probYes: number
    probNo: number
  } | null
  currentPrice: number | null
  message?: string
}

export interface BtcPriceTick {
  price: number
  timestamp: string
}

export interface BtcPriceResponse {
  currentPrice: number | null
  source: string | null
  timestamp?: string | null
  providerTimestamp?: string | null
  isStale?: boolean
  history: BtcPriceTick[]
  isStreaming: boolean
}

export interface Market {
  id: string
  eventId?: string
  statement: string
  status: 'draft' | 'open' | 'closed' | 'settled' | 'canceled'
  opensAt?: string
  closesAt: string
  resolvesAt?: string
  resolveRules?: string
  imageUrl?: string | null
  feeBps?: number
  qYes: number
  qNo: number
  liquidityB: number
  volume?: number
  totalVolume?: number
  total_volume?: number
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

export interface ActivityItem {
  id: string
  user: {
    userId: string
    firstName: string
    avatarUrl: string | null
    nickname?: string | null
  }
  eventId?: string
  side: 'YES' | 'NO'
  shares: number       // positive = buy, negative = sell
  avgPrice: number
  amount: number
  marketStatement: string
  marketImageUrl: string | null
  createdAt: string
}

export interface CommentUser {
  id: string
  firstName: string
  avatarUrl: string | null
}

export interface Comment {
  id: string
  eventId: string
  userId: string
  parentId: string | null
  content: string
  likesCount: number
  dislikesCount: number
  repliesCount: number
  createdAt: string
  updatedAt: string
  user: CommentUser
  userVote: 'like' | 'dislike' | null
  replies?: Comment[]
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
  currentSellValue?: number | null // Accurate real-time sell value from backend (reais)
  currentSellPrice?: number | null // Accurate real-time sell price from backend (reais)
  grossSellValue?: number | null   // LMSR sell value before fees (reais)
  exitFee?: number | null          // Always null (no exit fee)
  unrealizedPL?: number | null     // Unrealized P&L in centavos (active positions)
  unrealizedPLPct?: number | null  // Unrealized P&L percentage
  realizedPL?: number | null       // Realized P&L in centavos (settled positions)
  realizedPLPct?: number | null    // Realized P&L percentage
  status: 'active' | 'settled' | 'refunded' | 'open'
  payoutAmount: number | null
  createdAt: string
  settledAt: string | null
  marketStatement?: string
  marketStatus?: string
  marketResult?: 'YES' | 'NO' | null
  eventTitle?: string;
  eventSlug?: string;
  eventCategory?: string;
  eventImageUrl?: string | null;
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

export interface AffiliateCampaign {
  id: string
  name: string
  slug: string
  link: string
  landing_path?: string
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  clicks: number
  registrations: number
  active_players: number
  gross_revenue: number
  commission_generated: number
  conversion_rate: number
}

export interface AffiliateReferral {
  id: string
  user_id: string
  masked_identity: string
  registered_at: string
  campaign_name: string | null
  campaign_slug: string | null
  status: 'attributed' | 'active' | 'suspicious' | 'rejected'
  deposited: boolean
  active: boolean
  total_deposit_amount: number
  revenue_generated: number
  commission_generated: number
  last_event_at: string | null
}

export interface AffiliateWithdrawal {
  id: string
  requested_amount: number
  approved_amount: number
  fee_amount: number
  net_amount: number
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled' | 'blocked'
  payment_method: string
  payment_destination: Record<string, unknown>
  admin_notes: string | null
  rejection_reason: string | null
  requested_at: string
  reviewed_at: string | null
  paid_at: string | null
}

export interface AffiliateDashboard {
  profile: {
    status: 'pending' | 'active' | 'blocked' | 'rejected' | 'suspended'
    referral_code: string
    display_name: string
  }
  balances: {
    pending: number
    paid: number
  }
  totals: {
    total_registrations: number
    total_active_players: number
    total_commission_generated: number
  }
  chart: {
    points: Array<{
      day: string
      registrations: number
      active_players: number
      earnings: number
    }>
  }
  campaigns: Array<{
    id: string
    name: string
    link: string
    registrations: number
    commission_generated: number
  }>
}

export interface AdminAffiliate {
  id: string
  user_id: string
  email: string
  full_name: string
  status: 'pending' | 'active' | 'blocked' | 'rejected' | 'suspended'
  referral_code: string
  display_name: string
  balances: {
    pending: number
    available: number
    processing: number
    paid: number
  }
  total_revenue_generated: number
  total_commission_generated: number
  total_referrals: number
  total_active_referrals: number
  parent_affiliate_id: string | null
  approved_at: string | null
  blocked_reason: string | null
  created_at: string
}

export interface AdminAffiliateCommission {
  id: string
  affiliate_id: string
  affiliate_name: string
  affiliate_email: string
  referred_user_id: string | null
  source_type: string
  commission_type: string
  level: number
  basis_amount: number
  rate_bps: number
  amount: number
  status: string
  hold_until: string | null
  available_at: string | null
  created_at: string
}

export interface AdminAffiliateWithdrawal extends AffiliateWithdrawal {
  affiliate_id: string
  affiliate_name: string
  affiliate_email: string
}

export interface AdminAffiliateOverview {
  filters: {
    date_from?: string
    date_to?: string
  }
  totals: {
    affiliates: number
    referrals: number
    active_referrals: number
    deposited_amount: number
    commission_generated: number
    commission_paid: number
    pending_withdrawals_count: number
    pending_withdrawals_amount: number
  }
}

export interface AdminAffiliateSummary {
  affiliate: AdminAffiliate
  summary: {
    total_referrals: number
    total_active_referrals: number
    total_deposit_amount: number
    total_positions_count: number
    revenue_generated: number
    total_commission_generated: number
    total_commission_paid: number
    balances: {
      pending: number
      available: number
      processing: number
      paid: number
    }
  }
}

export interface AdminAffiliateReferralListItem {
  id: string
  user_id: string
  registered_at: string
  status: string
  deposited: boolean
  total_deposit_amount: number
  operations_count: number
  active: boolean
  revenue_generated: number
  commission_generated: number
  masked_identity?: string
  campaign_slug?: string
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
  nickname: string | null
  phone: string
  full_name: string
  birth_date?: string
  mother_name?: string
  gender?: string
  status: 'active' | 'suspended' | 'deleted'
  kyc_status: 'pending' | 'approved' | 'rejected'
  kyc_level: 'basic' | 'intermediate' | 'full'
  avatar_url?: string | null
  flags: Record<string, boolean | string[] | undefined> & { badges?: string[] }
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
  user_avatar_version: number | null;
  user_avatar_ext: string | null;
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

export interface MarketHistory {
  timestamp: string
  probYes: number
  probNo: number
}

export interface Category {
  id: string
  slug: string
  name: string
  icon: string
  displayOrder: number
  isActive: boolean
}

export interface Banner {
  id: string
  placement: string
  title: string | null
  imageUrl: string
  linkUrl: string | null
  displayOrder: number
  isActive: boolean
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
