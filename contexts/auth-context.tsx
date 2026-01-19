'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  userApi,
  getTokens,
  setTokens,
  clearTokens,
  isOtpVerified,
  setOtpVerified,
  ApiClientError,
} from '@/lib/api/client'
import type { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isOtpVerified: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ verified_otp: boolean }>
  register: (data: {
    cpf: string
    email: string
    phone: string
    password: string
    accept_terms: boolean
  }) => Promise<void>
  verifyOtp: (code: string) => Promise<void>
  resendOtp: () => Promise<{ expires_in: number }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [otpVerified, setOtpVerifiedState] = useState(false)

  const refreshUser = useCallback(async () => {
    const tokens = getTokens('user')
    if (!tokens) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const otpOk = isOtpVerified()
      setOtpVerifiedState(otpOk)
      
      if (otpOk) {
        const response = await userApi.getMe()
        setUser(response.data)
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === 'USER_NOT_VERIFIED') {
          setOtpVerifiedState(false)
        } else if (err.status === 401) {
          clearTokens('user')
          setUser(null)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const response = await userApi.login(email, password)
      setTokens('user', {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        verified_otp: response.data.verified_otp,
      })
      setOtpVerifiedState(response.data.verified_otp)
      setOtpVerified(response.data.verified_otp)
      
      if (response.data.verified_otp) {
        await refreshUser()
      }
      
      return { verified_otp: response.data.verified_otp }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      }
      throw err
    }
  }

  const register = async (data: {
    cpf: string
    email: string
    phone: string
    password: string
    accept_terms: boolean
  }) => {
    setError(null)
    try {
      const response = await userApi.register(data)
      setTokens('user', {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        verified_otp: false,
      })
      setOtpVerifiedState(false)
      setOtpVerified(false)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      }
      throw err
    }
  }

  const verifyOtp = async (code: string) => {
    setError(null)
    try {
      const response = await userApi.verifyOtp(code)
      if (response.data.verified) {
        const tokens = getTokens('user')
        if (tokens) {
          setTokens('user', {
            ...tokens,
            access_token: response.data.access_token,
            verified_otp: true,
          })
        }
        setOtpVerifiedState(true)
        setOtpVerified(true)
        await refreshUser()
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      }
      throw err
    }
  }

  const resendOtp = async () => {
    setError(null)
    try {
      const response = await userApi.resendOtp()
      return { expires_in: response.data.expires_in }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      }
      throw err
    }
  }

  const logout = async () => {
    try {
      await userApi.logout()
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens('user')
      setUser(null)
      setOtpVerifiedState(false)
    }
  }

  const forgotPassword = async (email: string) => {
    setError(null)
    try {
      await userApi.forgotPassword(email)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      }
      throw err
    }
  }

  const resetPassword = async (token: string, password: string) => {
    setError(null)
    try {
      await userApi.resetPassword(token, password)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      }
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!getTokens('user'),
        isOtpVerified: otpVerified,
        error,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
