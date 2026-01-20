'use client'

import type { ApiError } from '@/lib/types'

const USER_API_BASE = process.env.NEXT_PUBLIC_API_USER_BASE_URL || 'http://localhost:3001'
const ADMIN_API_BASE = process.env.NEXT_PUBLIC_API_ADMIN_BASE_URL || 'http://localhost:3000/v1/admin'

type ApiType = 'user' | 'admin'

// Token storage keys
const TOKEN_KEYS = {
  user: {
    access: 'previzor_access_token',
    refresh: 'previzor_refresh_token',
    verified_otp: 'previzor_verified_otp',
  },
  admin: {
    access: 'admin_access_token',
    refresh: 'admin_refresh_token',
    mfa_verified: 'admin_mfa_verified',
  },
}

// Token management
export function getTokens(type: ApiType) {
  if (typeof window === 'undefined') return null
  const keys = TOKEN_KEYS[type]
  const access = localStorage.getItem(keys.access)
  const refresh = localStorage.getItem(keys.refresh)
  if (!access || !refresh) return null
  return { access_token: access, refresh_token: refresh }
}

export function setTokens(
  type: ApiType,
  tokens: { access_token: string; refresh_token: string; verified_otp?: boolean; mfa_verified?: boolean }
) {
  if (typeof window === 'undefined') return
  const keys = TOKEN_KEYS[type]
  localStorage.setItem(keys.access, tokens.access_token)
  localStorage.setItem(keys.refresh, tokens.refresh_token)
  if (type === 'user' && tokens.verified_otp !== undefined) {
    localStorage.setItem(keys.verified_otp, String(tokens.verified_otp))
  }
  if (type === 'admin' && tokens.mfa_verified !== undefined) {
    localStorage.setItem(keys.mfa_verified, String(tokens.mfa_verified))
  }
}

export function clearTokens(type: ApiType) {
  if (typeof window === 'undefined') return
  const keys = TOKEN_KEYS[type]
  localStorage.removeItem(keys.access)
  localStorage.removeItem(keys.refresh)
  if (type === 'user') {
    localStorage.removeItem(keys.verified_otp)
  }
  if (type === 'admin') {
    localStorage.removeItem(keys.mfa_verified)
  }
}

export function isOtpVerified(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(TOKEN_KEYS.user.verified_otp) === 'true'
}

export function setOtpVerified(verified: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEYS.user.verified_otp, String(verified))
}

export function isMfaVerified(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(TOKEN_KEYS.admin.mfa_verified) === 'true'
}

export function setMfaVerified(verified: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEYS.admin.mfa_verified, String(verified))
}

// API Error class
export class ApiClientError extends Error {
  code: string
  errorId: string
  status: number

  constructor(error: ApiError['error'], status: number) {
    super(error.message)
    this.name = 'ApiClientError'
    this.code = error.code
    this.errorId = error.error_id
    this.status = status
  }
}

// Refresh token functions
async function refreshUserToken(): Promise<boolean> {
  const tokens = getTokens('user')
  if (!tokens) return false

  try {
    const response = await fetch(`${USER_API_BASE}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    })

    if (!response.ok) return false

    const data = await response.json()
    if (data.success) {
      setTokens('user', data.data)
      return true
    }
    return false
  } catch {
    return false
  }
}

async function refreshAdminToken(): Promise<boolean> {
  const tokens = getTokens('admin')
  if (!tokens) return false

  try {
    const response = await fetch(`${ADMIN_API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    })

    if (!response.ok) return false

    const data = await response.json()
    if (data.success) {
      setTokens('admin', { ...data.data, mfa_verified: isMfaVerified() })
      return true
    }
    return false
  } catch {
    return false
  }
}

// Main fetcher function
interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

async function baseFetch<T>(
  type: ApiType,
  endpoint: string,
  options: FetchOptions = {},
  retry = true
): Promise<T> {
  const baseUrl = type === 'user' ? USER_API_BASE : ADMIN_API_BASE
  const tokens = getTokens(type)

  // Build URL with query params
  let url = `${baseUrl}${endpoint}`
  if (options.params) {
    const params = new URLSearchParams()
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })
    const queryString = params.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (tokens?.access_token) {
    headers['Authorization'] = `Bearer ${tokens.access_token}`
  }

  // Make request
  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json()

  // Handle errors - only check response.ok, not data.success (some endpoints don't have success wrapper)
  if (!response.ok) {
    // Check for token expiration and retry
    if (response.status === 401 && retry) {
      const refreshFn = type === 'user' ? refreshUserToken : refreshAdminToken
      const refreshed = await refreshFn()
      if (refreshed) {
        return baseFetch<T>(type, endpoint, options, false)
      }
      // Clear tokens and throw error
      clearTokens(type)
    }

    throw new ApiClientError(
      data.error || { code: 'UNKNOWN_ERROR', message: 'An error occurred', error_id: '' },
      response.status
    )
  }

  return data
}

// User API client
export const userApi = {
  // Auth
  register: (data: {
    cpf: string
    email: string
    phone: string
    password: string
    accept_terms: boolean
    utm?: { source?: string; campaign?: string; medium?: string; content?: string }
  }) => baseFetch<{ success: true; data: { access_token: string; refresh_token: string; expires_in: number } }>(
    'user',
    '/v1/auth/register',
    { method: 'POST', body: data }
  ),

  login: (email: string, password: string) =>
    baseFetch<{ success: true; data: { access_token: string; refresh_token: string; expires_in: number; verified_otp: boolean } }>(
      'user',
      '/v1/auth/login',
      { method: 'POST', body: { email, password } }
    ),

  verifyOtp: (code: string) =>
    baseFetch<{ success: true; data: { verified: boolean; access_token: string } }>(
      'user',
      '/v1/auth/otp',
      { method: 'POST', body: { code } }
    ),

  resendOtp: () =>
    baseFetch<{ success: true; data: { sent: boolean; expires_in: number } }>(
      'user',
      '/v1/auth/otp/resend',
      { method: 'POST', body: {} }
    ),

  logout: () =>
    baseFetch<{ success: true; data: { logged_out: boolean } }>(
      'user',
      '/v1/auth/logout',
      { method: 'POST' }
    ),

  getSessions: () =>
    baseFetch<{ success: true; data: { sessions: import('@/lib/types').Session[] } }>(
      'user',
      '/v1/auth/sessions'
    ),

  revokeSession: (id: string) =>
    baseFetch<{ success: true; data: { revoked: boolean } }>(
      'user',
      `/v1/auth/sessions/${id}/revoke`,
      { method: 'POST' }
    ),

  forgotPassword: (email: string) =>
    baseFetch<{ success: true; data: { message: string } }>(
      'user',
      '/v1/auth/password/forgot',
      { method: 'POST', body: { email } }
    ),

  resetPassword: (token: string, new_password: string) =>
    baseFetch<{ success: true; data: { message: string } }>(
      'user',
      '/v1/auth/password/reset',
      { method: 'POST', body: { token, new_password } }
    ),

  // Me
  getMe: () =>
    baseFetch<{ success: true; data: import('@/lib/types').User }>(
      'user',
      '/v1/me'
    ),

  updateMe: (data: { phone?: string; preferences?: { notifications?: boolean; theme?: string } }) =>
    baseFetch<{ success: true; data: { updated: boolean } }>(
      'user',
      '/v1/me',
      { method: 'PATCH', body: data }
    ),

  changePassword: (current_password: string, new_password: string) =>
    baseFetch<{ success: true; data: { message: string } }>(
      'user',
      '/v1/me/password',
      { method: 'POST', body: { current_password, new_password } }
    ),

  deleteAccount: (password: string) =>
    baseFetch<{ success: true; data: { deleted: boolean } }>(
      'user',
      '/v1/me/delete',
      { method: 'POST', body: { password } }
    ),

  exportData: () =>
    baseFetch<{ success: true; data: { message: string; export_request_id: string } }>(
      'user',
      '/v1/me/export',
      { method: 'POST' }
    ),

  // Events & Markets
  getEvents: (params?: { status?: string; category?: string; title?: string; limit?: number; offset?: number }) =>
    baseFetch<{ events: import('@/lib/types').Event[]; totalCount: number; limit: number; offset: number }>(
      'user',
      '/v1/events',
      { params }
    ),

  getEvent: (slug: string) =>
    baseFetch<import('@/lib/types').Event>(
      'user',
      `/v1/events/${slug}`
    ),

  getMarket: (id: string) =>
    baseFetch<{ success: true; data: import('@/lib/types').Market }>(
      'user',
      `/v1/markets/${id}`
    ),

  openPosition: (marketId: string, side: 'YES' | 'NO', amount: number) =>
    baseFetch<{
      success: true
      data: {
        position: import('@/lib/types').Position
        newBalance: number
        market: { id: string; totalPool: number; poolYes: number; poolNo: number; probYes: number; probNo: number }
      }
    }>(
      'user',
      `/v1/markets/${marketId}/positions`,
      { method: 'POST', body: { side, amount } }
    ),

  getPositions: (params?: { status?: string; marketId?: string; limit?: number; offset?: number }) =>
    baseFetch<{ positions: import('@/lib/types').Position[]; totalCount: number; limit: number; offset: number }>(
      'user',
      '/v1/me/positions',
      { params }
    ),

  // Wallet
  getWallet: () =>
    baseFetch<{ success: true; data: { wallet: import('@/lib/types').Wallet } }>(
      'user',
      '/v1/wallet'
    ),

  getStatement: (params?: { limit?: number; offset?: number; type?: string }) =>
    baseFetch<{ success: true; data: { entries: import('@/lib/types').WalletEntry[]; pagination: import('@/lib/types').Pagination } }>(
      'user',
      '/v1/wallet/statement',
      { params }
    ),

  createDepositIntention: (amount: number) =>
    baseFetch<{ success: true; data: { deposit: import('@/lib/types').Deposit } }>(
      'user',
      '/v1/wallet/deposit/intention',
      { method: 'POST', body: { amount } }
    ),

  getDeposits: (params?: { limit?: number; offset?: number }) =>
    baseFetch<{ success: true; data: { deposits: import('@/lib/types').Deposit[]; pagination: import('@/lib/types').Pagination } }>(
      'user',
      '/v1/wallet/deposits',
      { params }
    ),

  createWithdrawal: (amount: number, pix_key_type: string, pix_key_value: string) =>
    baseFetch<{ success: true; data: { withdrawal: import('@/lib/types').Withdrawal } }>(
      'user',
      '/v1/wallet/withdraw',
      { method: 'POST', body: { amount, pix_key_type, pix_key_value } }
    ),

  getWithdrawals: (params?: { limit?: number; offset?: number }) =>
    baseFetch<{ success: true; data: { withdrawals: import('@/lib/types').Withdrawal[]; pagination: import('@/lib/types').Pagination } }>(
      'user',
      '/v1/wallet/withdrawals',
      { params }
    ),
}

// Admin API client
export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    baseFetch<{
      success: true
      data: {
        admin: import('@/lib/types').Admin
        access_token: string
        refresh_token: string
        expires_in: number
        mfa_required: boolean
      }
    }>(
      'admin',
      '/auth/login',
      { method: 'POST', body: { email, password } }
    ),

  verifyMfa: (code: string) =>
    baseFetch<{ success: true; data: { verified: boolean; access_token: string } }>(
      'admin',
      '/auth/mfa',
      { method: 'POST', body: { code } }
    ),

  verifyMfaBackup: (backup_code: string) =>
    baseFetch<{ success: true; data: { verified: boolean; access_token: string } }>(
      'admin',
      '/auth/mfa/backup',
      { method: 'POST', body: { backup_code } }
    ),

  setupMfa: () =>
    baseFetch<{
      success: true
      data: {
        secret: string
        otpauth_url: string
        qr_code_url: string
        backup_codes: string[]
        message: string
      }
    }>(
      'admin',
      '/auth/mfa/setup',
      { method: 'POST' }
    ),

  confirmMfa: (code: string) =>
    baseFetch<{ success: true; data: { enabled: boolean; message: string } }>(
      'admin',
      '/auth/mfa/confirm',
      { method: 'POST', body: { code } }
    ),

  logout: () =>
    baseFetch<{ success: true; data: { logged_out: boolean } }>(
      'admin',
      '/auth/logout',
      { method: 'POST' }
    ),

  getMe: () =>
    baseFetch<{ success: true; data: { admin: import('@/lib/types').Admin; permissions: string[] } }>(
      'admin',
      '/me'
    ),

  // Users
  getUsers: (params?: {
    page?: number
    per_page?: number
    status?: string
    kyc_status?: string
    search?: string
    has_flag?: string
  }) =>
    baseFetch<{ success: true; data: import('@/lib/types').AdminUser[]; meta: import('@/lib/types').PaginationMeta }>(
      'admin',
      '/users',
      { params }
    ),

  getUser: (id: string) =>
    baseFetch<{
      success: true
      data: {
        user: import('@/lib/types').AdminUser
        wallet: import('@/lib/types').AdminWallet
      }
    }>(
      'admin',
      `/users/${id}`
    ),

  updateUserStatus: (id: string, status: string, reason: string) =>
    baseFetch<{ success: true; data: { id: string; status: string; updated_at: string } }>(
      'admin',
      `/users/${id}/status`,
      { method: 'PATCH', body: { status, reason } }
    ),

  updateUserFlags: (id: string, flags: Record<string, boolean>) =>
    baseFetch<{ success: true; data: { id: string; flags: Record<string, boolean>; updated_at: string } }>(
      'admin',
      `/users/${id}/flags`,
      { method: 'PATCH', body: flags }
    ),

  // KYC
  getKycList: (params?: { page?: number; per_page?: number; status?: string; level?: string }) =>
    baseFetch<{ success: true; data: import('@/lib/types').KYC[]; meta: import('@/lib/types').PaginationMeta }>(
      'admin',
      '/kyc',
      { params }
    ),

  getKyc: (userId: string) =>
    baseFetch<{ success: true; data: { kyc: import('@/lib/types').KYC } }>(
      'admin',
      `/kyc/${userId}`
    ),

  approveKyc: (userId: string, level: string, notes?: string) =>
    baseFetch<{ success: true; data: { kyc: import('@/lib/types').KYC } }>(
      'admin',
      `/kyc/${userId}/approve`,
      { method: 'POST', body: { level, notes } }
    ),

  rejectKyc: (userId: string, reason: string, notes?: string) =>
    baseFetch<{ success: true; data: { kyc: import('@/lib/types').KYC } }>(
      'admin',
      `/kyc/${userId}/reject`,
      { method: 'POST', body: { reason, notes } }
    ),

  // Deposits
  getDeposits: (params?: {
    page?: number
    per_page?: number
    user_id?: string
    wallet_id?: string
    status?: string
    start_date?: string
    end_date?: string
  }) =>
    baseFetch<{ success: true; data: import('@/lib/types').AdminDeposit[]; meta: import('@/lib/types').PaginationMeta }>(
      'admin',
      '/deposits',
      { params }
    ),

  getDeposit: (id: string) =>
    baseFetch<{ success: true; data: { deposit: import('@/lib/types').AdminDeposit } }>(
      'admin',
      `/deposits/${id}`
    ),

  retryDeposit: (id: string) =>
    baseFetch<{ success: true; data: { deposit_id: string; retry_requested: boolean; message: string } }>(
      'admin',
      `/deposits/${id}/retry`,
      { method: 'POST' }
    ),

  // Withdrawals
  getWithdrawals: (params?: {
    page?: number
    per_page?: number
    user_id?: string
    wallet_id?: string
    status?: string
    start_date?: string
    end_date?: string
  }) =>
    baseFetch<{ success: true; data: import('@/lib/types').AdminWithdrawal[]; meta: import('@/lib/types').PaginationMeta }>(
      'admin',
      '/withdrawals',
      { params }
    ),

  getWithdrawal: (id: string) =>
    baseFetch<{ success: true; data: { withdrawal: import('@/lib/types').AdminWithdrawal } }>(
      'admin',
      `/withdrawals/${id}`
    ),

  approveWithdrawal: (id: string) =>
    baseFetch<{ success: true; data: { withdrawal_id: string; status: string; approved_at: string; message: string } }>(
      'admin',
      `/withdrawals/${id}/approve`,
      { method: 'POST' }
    ),

  rejectWithdrawal: (id: string, reason: string) =>
    baseFetch<{ success: true; data: { withdrawal_id: string; status: string; reason: string; rejected_at: string } }>(
      'admin',
      `/withdrawals/${id}/reject`,
      { method: 'POST', body: { reason } }
    ),

  // Wallets
  getWallets: (params?: {
    page?: number
    per_page?: number
    status?: string
    risk_level?: string
    user_id?: string
  }) =>
    baseFetch<{ success: true; data: import('@/lib/types').AdminWallet[]; meta: import('@/lib/types').PaginationMeta }>(
      'admin',
      '/wallets',
      { params }
    ),

  getWallet: (walletId: string) =>
    baseFetch<{
      success: true
      data: {
        wallet: import('@/lib/types').AdminWallet
        recent_entries: import('@/lib/types').LedgerEntry[]
      }
    }>(
      'admin',
      `/wallets/${walletId}`
    ),

  freezeWallet: (walletId: string, reason: string) =>
    baseFetch<{ success: true; data: { wallet_id: string; status: string; frozen_reason: string; frozen_at: string } }>(
      'admin',
      `/wallets/${walletId}/freeze`,
      { method: 'POST', body: { reason } }
    ),

  unfreezeWallet: (walletId: string) =>
    baseFetch<{ success: true; data: { wallet_id: string; status: string; unfrozen_at: string } }>(
      'admin',
      `/wallets/${walletId}/unfreeze`,
      { method: 'POST' }
    ),

  // Ledger
  getLedger: (params?: {
    page?: number
    per_page?: number
    wallet_id?: string
    user_id?: string
    entry_type?: string
    reference_type?: string
    start_date?: string
    end_date?: string
  }) =>
    baseFetch<{ success: true; data: import('@/lib/types').LedgerEntry[]; meta: import('@/lib/types').PaginationMeta }>(
      'admin',
      '/ledger',
      { params }
    ),

  getLedgerEntry: (id: string) =>
    baseFetch<{ success: true; data: { entry: import('@/lib/types').LedgerEntry } }>(
      'admin',
      `/ledger/${id}`
    ),

  // Audit Logs
  getAuditLogs: (params?: {
    page?: number
    per_page?: number
    admin_id?: string
    action?: string
    resource_type?: string
    target_user_id?: string
    start_date?: string
    end_date?: string
  }) =>
    baseFetch<{ success: true; data: import('@/lib/types').AuditLog[]; meta: import('@/lib/types').PaginationMeta }>(
      'admin',
      '/audit-logs',
      { params }
    ),

  getAuditLog: (id: string) =>
    baseFetch<{ success: true; data: { audit_log: import('@/lib/types').AuditLog } }>(
      'admin',
      `/audit-logs/${id}`
    ),

  // Financial Events
  getFinancialEvents: (params?: {
    page?: number
    per_page?: number
    user_id?: string
    wallet_id?: string
    start_date?: string
    end_date?: string
  }) =>
    baseFetch<{ success: true; data: import('@/lib/types').FinancialEvent[]; meta: import('@/lib/types').PaginationMeta }>(
      'admin',
      '/financial-events',
      { params }
    ),

  // Events & Markets
  createEvent: (data: {
    title: string
    slug: string
    description: string
    category: string
    startsAt: string
    endsAt: string
    resolveRules: string
    sourceUrls?: string[]
  }) =>
    baseFetch<{ success: true; data: { id: string; slug: string; status: string } }>(
      'admin',
      '/events',
      { method: 'POST', body: data }
    ),

  publishEvent: (id: string) =>
    baseFetch<{ success: true; data: { id: string; status: string } }>(
      'admin',
      `/events/${id}/publish`,
      { method: 'POST' }
    ),

  createMarket: (data: {
    eventId: string
    statement: string
    opensAt: string
    closesAt: string
    resolvesAt: string
    feeBps?: number
  }) =>
    baseFetch<{ success: true; data: { id: string; status: string } }>(
      'admin',
      '/markets',
      { method: 'POST', body: data }
    ),

  openMarket: (id: string) =>
    baseFetch<{ success: true; data: { status: string } }>(
      'admin',
      `/markets/${id}/open`,
      { method: 'PATCH' }
    ),

  closeMarket: (id: string) =>
    baseFetch<{ success: true; data: { status: string } }>(
      'admin',
      `/markets/${id}/close`,
      { method: 'PATCH' }
    ),

  resolveMarket: (id: string, result: 'YES' | 'NO') =>
    baseFetch<{
      success: true
      data: {
        id: string
        status: string
        result: string
        settledAt: string
        settlement: { totalPool: number; fee: number; distributablePool: number; winnersCount: number }
      }
    }>(
      'admin',
      `/markets/${id}/resolve`,
      { method: 'POST', body: { result } }
    ),

  cancelMarket: (id: string) =>
    baseFetch<{ success: true; data: { status: string; refundsCount: number; totalRefunded: number } }>(
      'admin',
      `/markets/${id}/cancel`,
      { method: 'POST' }
    ),
}
