'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ApiClientError } from '@/lib/api/client'

interface ResetPasswordFormProps {
    token: string
    onSuccess: () => void
}

export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
    const { resetPassword } = useAuth()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('As senhas não conferem')
            return
        }

        if (!token) {
            toast.error('Token inválido')
            return
        }

        setIsLoading(true)

        try {
            await resetPassword(token, password)
            setSuccess(true)
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error(err.message)
            } else {
                toast.error('Erro ao redefinir senha')
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Senha Redefinida</h2>
                    <p className="text-sm text-muted-foreground">
                        Sua senha foi alterada com sucesso. Você já pode fazer login.
                    </p>
                </div>
                <Button onClick={onSuccess} className="w-full h-11 font-semibold text-base shadow-sm">
                    Fazer Login
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <KeyRound className="h-6 w-6 text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Redefinir Senha</h2>
                <p className="text-sm text-muted-foreground">
                    Digite sua nova senha abaixo
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">Nova Senha</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua nova senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            className="h-11"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres com letras, números e símbolos
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirme sua nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="h-11"
                    />
                </div>

                <Button type="submit" className="w-full h-11 font-semibold text-base shadow-sm" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : 'Redefinir Senha'}
                </Button>
            </form>
        </div>
    )
}
