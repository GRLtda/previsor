'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { ApiClientError } from '@/lib/api/client'

interface ForgotPasswordFormProps {
    onBackToLogin: () => void
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
    const { forgotPassword } = useAuth()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await forgotPassword(email)
            setSent(true)
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error(err.message)
            } else {
                toast.error('Erro ao enviar email')
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="space-y-5 text-center">
                <div className="flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00B471]/8">
                        <CheckCircle className="h-6 w-6 text-[#00B471]" />
                    </div>
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">Email Enviado</h2>
                    <p className="text-[13px] text-[#8A8C99] leading-relaxed">
                        Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha.
                    </p>
                </div>
                <Button
                    onClick={onBackToLogin}
                    variant="outline"
                    className="w-full h-11 font-semibold text-[14px] rounded-xl border-black/[8%] dark:border-white/[8%] bg-transparent hover:bg-black/[3%] dark:hover:bg-white/[4%] text-black dark:text-white transition-all"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Login
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[4%] dark:bg-white/[5%]">
                    <Mail className="h-6 w-6 text-black/60 dark:text-white/60" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">Esqueceu sua senha?</h2>
                    <p className="text-[13px] text-[#8A8C99] leading-relaxed">
                        Digite seu email e enviaremos as instruções.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-[12px] font-medium text-[#8A8C99]">Email</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8A8C99]">
                            <Mail className="h-[15px] w-[15px]" />
                        </div>
                        <Input
                            id="forgot-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="h-11 pl-9 text-[13px] bg-black/[3%] dark:bg-white/[4%] border-black/[8%] dark:border-white/[8%] placeholder:text-black/25 dark:placeholder:text-white/20 rounded-xl focus-visible:ring-1 focus-visible:ring-black/15 dark:focus-visible:ring-white/15 transition-colors"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 font-semibold text-[14px] rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/85 dark:hover:bg-white/90 transition-all"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                        </>
                    ) : 'Enviar Email'}
                </Button>
            </form>

            <div className="text-center">
                <button
                    onClick={onBackToLogin}
                    className="text-[13px] text-[#8A8C99] hover:text-black dark:hover:text-white flex items-center justify-center mx-auto transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    Voltar
                </button>
            </div>
        </div>
    )
}
