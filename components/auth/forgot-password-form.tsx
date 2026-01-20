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
            <div className="space-y-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Email Enviado</h2>
                    <p className="text-sm text-muted-foreground">
                        Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha.
                    </p>
                </div>
                <Button onClick={onBackToLogin} variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Login
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight">Esqueceu sua senha?</h2>
                <p className="text-sm text-muted-foreground">
                    Digite seu email e enviaremos as instruções para redefinir sua senha
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

                <Button type="submit" className="w-full h-11 font-semibold text-base shadow-sm" disabled={isLoading}>
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
                    className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center mx-auto transition-colors"
                >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Voltar para Login
                </button>
            </div>
        </div>
    )
}
