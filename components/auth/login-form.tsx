'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { ApiClientError } from '@/lib/api/client'

interface LoginFormProps {
    onSuccess: () => void
    onRegisterClick: () => void
    onOtpRequired: (email: string) => void
    onForgotPasswordClick: () => void
}

export function LoginForm({ onSuccess, onRegisterClick, onOtpRequired, onForgotPasswordClick }: LoginFormProps) {
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await login(email, password)

            if (!result.verified_otp) {
                toast.info('Verifique seu telefone para continuar')
                onOtpRequired(email)
            } else {
                toast.success('Login realizado com sucesso!')
                onSuccess()
            }
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error(err.getDetailedMessage())
            } else {
                toast.error('Erro ao fazer login')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-5">
            <div className="space-y-1 text-left">
                <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">Bem vindo de volta</h2>
                <p className="text-[13px] text-[#8A8C99]">
                    Conecte-se para acompanhar seus prêmios e depósitos.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[12px] font-medium text-[#8A8C99]">Email</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8A8C99]">
                            <Mail className="h-[15px] w-[15px]" />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            placeholder="example@site.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="h-11 pl-9 text-[13px] bg-black/[3%] dark:bg-white/[4%] border-black/[8%] dark:border-white/[8%] placeholder:text-black/25 dark:placeholder:text-white/20 rounded-xl focus-visible:ring-1 focus-visible:ring-black/15 dark:focus-visible:ring-white/15 transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[12px] font-medium text-[#8A8C99]">Senha</Label>
                        <button
                            type="button"
                            onClick={onForgotPasswordClick}
                            className="text-[11px] text-[#8A8C99] hover:text-black dark:hover:text-white transition-colors"
                        >
                            Esqueceu?
                        </button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8A8C99]">
                            <Lock className="h-[15px] w-[15px]" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="h-11 pl-9 pr-10 text-[13px] bg-black/[3%] dark:bg-white/[4%] border-black/[8%] dark:border-white/[8%] placeholder:text-black/25 dark:placeholder:text-white/20 rounded-xl focus-visible:ring-1 focus-visible:ring-black/15 dark:focus-visible:ring-white/15 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8C99] hover:text-black dark:hover:text-white transition-colors p-0.5"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="pt-1.5">
                    <Button
                        type="submit"
                        className="w-full h-11 font-medium text-[14px] rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/85 dark:hover:bg-white/90 transition-all"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Entrando...
                            </>
                        ) : 'Entrar'}
                    </Button>
                </div>
            </form>

            <div className="relative flex items-center">
                <div className="flex-grow border-t border-black/[6%] dark:border-white/[6%]"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] font-medium text-[#8A8C99] uppercase tracking-wider">ou</span>
                <div className="flex-grow border-t border-black/[6%] dark:border-white/[6%]"></div>
            </div>

            <div className="text-center text-[13px]">
                <span className="text-[#8A8C99]">Não tem uma conta? </span>
                <button
                    onClick={onRegisterClick}
                    className="font-medium text-black dark:text-white hover:underline transition-colors focus:outline-none"
                >
                    Registrar
                </button>
            </div>
        </div>
    )
}
