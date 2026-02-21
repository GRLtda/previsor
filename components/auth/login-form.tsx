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
        <div className="space-y-6">
            <div className="space-y-2 text-center pb-2">
                <h2 className="text-2xl font-bold tracking-tight dark:text-white">Bem vindo de volta!</h2>
                <p className="text-[13px] font-medium text-muted-foreground/80">
                    Conecte-se para acompanhar seus prêmios,<br />depósitos e muito mais.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[13px] font-semibold">Email</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                            <Mail className="h-4 w-4 opacity-70" />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            placeholder="example@site.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="h-12 pl-10 bg-black/5 dark:bg-[#12121a] border-border dark:border-white/5 placeholder:text-muted-foreground/50 rounded-xl"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[13px] font-semibold">Digite sua senha</Label>
                        <button
                            type="button"
                            onClick={onForgotPasswordClick}
                            className="text-[11px] text-brand hover:underline font-semibold"
                        >
                            Esqueceu a senha?
                        </button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                            <Lock className="h-4 w-4 opacity-70" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Insira sua senha..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="h-12 pl-10 pr-20 bg-black/5 dark:bg-[#12121a] border-border dark:border-white/5 placeholder:text-muted-foreground/50 rounded-xl"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-brand hover:text-brand/80 transition-colors"
                        >
                            Mostrar
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <Button type="submit" className="w-full h-12 font-bold text-[15px] shadow-sm tracking-wide rounded-xl bg-brand text-white hover:brightness-110" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Entrando...
                            </>
                        ) : 'ENTRAR'}
                    </Button>
                </div>
            </form>

            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border dark:border-white/5"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-bold text-muted-foreground dark:text-white/40 uppercase">OU</span>
                <div className="flex-grow border-t border-border dark:border-white/5"></div>
            </div>

            <div className="text-center text-[13px]">
                <span className="text-muted-foreground font-medium">Ainda não tem uma conta? </span>
                <button
                    onClick={onRegisterClick}
                    className="font-bold text-brand hover:underline transition-colors focus:outline-none"
                >
                    Registrar
                </button>
            </div>
        </div>
    )
}
