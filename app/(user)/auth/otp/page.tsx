'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Smartphone, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ApiClientError, getTokens } from '@/lib/api/client'

export default function OTPPage() {
  const router = useRouter()
  const { verifyOtp, resendOtp, isOtpVerified, isAuthenticated } = useAuth()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    // Redirect if not authenticated
    if (!getTokens('user')) {
      router.push('/')
      return
    }

    // Redirect if already verified
    if (isOtpVerified) {
      router.push('/app')
    }
  }, [isOtpVerified, isAuthenticated, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (code.length !== 6) {
      toast.error('Digite o codigo de 6 digitos')
      return
    }

    setIsLoading(true)
    try {
      await verifyOtp(code)
      toast.success('Telefone verificado com sucesso!')
      router.push('/app')
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      } else {
        toast.error('Codigo invalido')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      const result = await resendOtp()
      toast.success('Codigo reenviado!')
      setCountdown(Math.floor(result.expires_in / 60) * 60 || 60) // Use expires_in or default to 60s
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      } else {
        toast.error('Erro ao reenviar codigo')
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Smartphone className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verificar Telefone</CardTitle>
          <CardDescription>
            Digite o codigo de 6 digitos enviado para seu telefone via SMS
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Codigo de Verificacao</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? 'Verificando...' : 'Verificar'}
            </Button>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                Nao recebeu o codigo?
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleResend}
                disabled={isResending || countdown > 0}
                className="p-0 h-auto"
              >
                {countdown > 0 ? (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    {countdown}s
                  </span>
                ) : isResending ? (
                  'Reenviando...'
                ) : (
                  'Reenviar'
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
