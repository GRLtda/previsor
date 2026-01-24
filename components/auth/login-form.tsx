'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, TrendingUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ApiClientError } from '@/lib/api/client'
import { motion } from 'framer-motion'
import Link from 'next/link'

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
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
                <p className="text-sm text-muted-foreground">
                    Entre na sua conta para continuar
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="h-11"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Senha</Label>
                        <button
                            type="button"
                            onClick={onForgotPasswordClick}
                            className="text-xs text-primary hover:underline font-medium"
                        >
                            Esqueceu a senha?
                        </button>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="h-11 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <Button type="submit" className="w-full h-11 font-semibold text-base shadow-sm" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                        </>
                    ) : 'Entrar'}
                </Button>
            </form>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">Não tem uma conta? </span>
                <button
                    onClick={onRegisterClick}
                    className="font-medium text-primary hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm"
                >
                    Criar conta
                </button>
            </div>
        </div>
    )
}
