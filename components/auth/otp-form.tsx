'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { RefreshCw, Loader2, ShieldCheck } from 'lucide-react'
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
            <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[4%] dark:bg-white/[5%]">
                    <ShieldCheck className="h-6 w-6 text-black/60 dark:text-white/60" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">Verificar Telefone</h2>
                    <p className="text-[13px] text-[#8A8C99] leading-relaxed">
                        Enviamos um código SMS para o número vinculado a{' '}
                        <span className="font-medium text-black dark:text-white">{email}</span>
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <Label htmlFor="code" className="sr-only">Código de Verificação</Label>
                <div className="flex justify-center w-full">
                    <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={(value) => setCode(value)}
                    >
                        <InputOTPGroup className="gap-2 w-full justify-between">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <InputOTPSlot
                                    key={i}
                                    index={i}
                                    className="w-12 h-14 text-xl rounded-xl border-black/[8%] dark:border-white/[8%] bg-black/[3%] dark:bg-white/[4%] font-semibold"
                                />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 font-semibold text-[14px] rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/85 dark:hover:bg-white/90 transition-all"
                    disabled={isLoading || code.length !== 6}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                        </>
                    ) : 'Verificar'}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[13px]">
                    <span className="text-[#8A8C99]">Não recebeu?</span>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={isResending || countdown > 0}
                        className="font-semibold text-black dark:text-white hover:underline transition-colors disabled:opacity-40 disabled:no-underline"
                    >
                        {countdown > 0 ? (
                            <span className="flex items-center gap-1 text-[#8A8C99] font-normal">
                                <RefreshCw className="h-3 w-3" />
                                {countdown}s
                            </span>
                        ) : isResending ? (
                            'Reenviando...'
                        ) : (
                            'Reenviar'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
