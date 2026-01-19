'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  adminApi,
  getTokens,
  setTokens,
  clearTokens,
  isMfaVerified,
  setMfaVerified,
  ApiClientError,
} from '@/lib/api/client'
import type { Admin } from '@/lib/types'

interface AdminAuthContextType {
  admin: Admin | null
  permissions: string[]
  isLoading: boolean
  isAuthenticated: boolean
  isMfaVerified: boolean
  mfaRequired: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ mfa_required: boolean }>
  verifyMfa: (code: string) => Promise<void>
  verifyMfaBackup: (code: string) => Promise<void>
  logout: () => Promise<void>
  refreshAdmin: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mfaVerified, setMfaVerifiedState] = useState(false)
  const [mfaRequired, setMfaRequired] = useState(false)

  const refreshAdmin = useCallback(async () => {
    const tokens = getTokens('admin')
    if (!tokens) {
      setAdmin(null)
      setIsLoading(false)
      return
    }

    try {
      const mfaOk = isMfaVerified()
      setMfaVerifiedState(mfaOk)
      
      if (mfaOk) {
        const response = await adminApi.getMe()
        setAdmin(response.data.admin)
        setPermissions(response.data.permissions)
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === 'MFA_REQUIRED') {
          setMfaVerifiedState(false)
          setMfaRequired(true)
        } else if (err.status === 401) {
          clearTokens('admin')
          setAdmin(null)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAdmin()
  }, [refreshAdmin])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const response = await adminApi.login(email, password)
      setTokens('admin', {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        mfa_verified: false,
      })
      setAdmin(response.data.admin)
      setMfaRequired(response.data.mfa_required)
      
      return { mfa_required: response.data.mfa_required }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      }
      throw err
    }
  }

  const verifyMfa = async (code: string) => {
    setError(null)
    try {
      const response = await adminApi.verifyMfa(code)
      if (response.data.verified) {
        const tokens = getTokens('admin')
        if (tokens) {
          setTokens('admin', {
            ...tokens,
            access_token: response.data.access_token,
            mfa_verified: true,
          })
        }
        setMfaVerifiedState(true)
        setMfaVerified(true)
        setMfaRequired(false)
        await refreshAdmin()
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      }
      throw err
    }
  }

  const verifyMfaBackup = async (code: string) => {
    setError(null)
    try {
      const response = await adminApi.verifyMfaBackup(code)
      if (response.data.verified) {
        const tokens = getTokens('admin')
        if (tokens) {
          setTokens('admin', {
            ...tokens,
            access_token: response.data.access_token,
            mfa_verified: true,
          })
        }
        setMfaVerifiedState(true)
        setMfaVerified(true)
        setMfaRequired(false)
        await refreshAdmin()
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      }
      throw err
    }
  }

  const logout = async () => {
    try {
      await adminApi.logout()
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens('admin')
      setAdmin(null)
      setPermissions([])
      setMfaVerifiedState(false)
      setMfaRequired(false)
    }
  }

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        permissions,
        isLoading,
        isAuthenticated: !!getTokens('admin'),
        isMfaVerified: mfaVerified,
        mfaRequired,
        error,
        login,
        verifyMfa,
        verifyMfaBackup,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
