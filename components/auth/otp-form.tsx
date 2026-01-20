'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ApiClientError } from '@/lib/api/client'

interface OtpFormProps {
    email: string
    onSuccess: () => void
}

export function OtpForm({ email, onSuccess }: OtpFormProps) {
    const { verifyOtp, resendOtp } = useAuth()
    const [code, setCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (code.length !== 6) {
            toast.error('Digite o código de 6 dígitos')
            return
        }

        setIsLoading(true)
        try {
            await verifyOtp(code)
            toast.success('Telefone verificado com sucesso!')
            onSuccess()
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error(err.message)
            } else {
                toast.error('Código inválido')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        setIsResending(true)
        try {
            const result = await resendOtp()
            toast.success('Código reenviado!')
            setCountdown(Math.floor(result.expires_in / 60) * 60 || 60)
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error(err.message)
            } else {
                toast.error('Erro ao reenviar código')
            }
        } finally {
            setIsResending(false)
        }
    }



    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight">Verificar Telefone</h2>
                <p className="text-sm text-muted-foreground">
                    Enviamos um código SMS de 6 dígitos para o número cadastrado no email <br />
                    <span className="font-medium text-foreground">{email}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Label htmlFor="code" className="sr-only">Código de Verificação</Label>
                <div className="flex justify-center w-full">
                    <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={(value) => setCode(value)}
                    >
                        <InputOTPGroup className="gap-2 w-full justify-between">
                            <InputOTPSlot index={0} className="w-12 h-14 text-2xl rounded-md border shadow-sm" />
                            <InputOTPSlot index={1} className="w-12 h-14 text-2xl rounded-md border shadow-sm" />
                            <InputOTPSlot index={2} className="w-12 h-14 text-2xl rounded-md border shadow-sm" />
                            <InputOTPSlot index={3} className="w-12 h-14 text-2xl rounded-md border shadow-sm" />
                            <InputOTPSlot index={4} className="w-12 h-14 text-2xl rounded-md border shadow-sm" />
                            <InputOTPSlot index={5} className="w-12 h-14 text-2xl rounded-md border shadow-sm" />
                        </InputOTPGroup>
                    </InputOTP>
                </div>


                <Button type="submit" className="w-full h-11 font-semibold text-base shadow-sm" disabled={isLoading || code.length !== 6}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                        </>
                    ) : 'Verificar'}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                        Não recebeu?
                    </span>
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={handleResend}
                        disabled={isResending || countdown > 0}
                        className="p-0 h-auto font-medium"
                    >
                        {countdown > 0 ? (
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <RefreshCw className="h-3 w-3" />
                                Aguarde {countdown}s
                            </span>
                        ) : isResending ? (
                            'Reenviando...'
                        ) : (
                            'Reenviar código'
                        )}
                    </Button>
                </div>
            </form >
        </div >
    )
}
