'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle, Lock } from 'lucide-react'
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
    const [showConfirm, setShowConfirm] = useState(false)
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
            <div className="space-y-5 text-center">
                <div className="flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00B471]/8">
                        <CheckCircle className="h-6 w-6 text-[#00B471]" />
                    </div>
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">Senha Redefinida</h2>
                    <p className="text-[13px] text-[#8A8C99] leading-relaxed">
                        Sua senha foi alterada com sucesso.
                    </p>
                </div>
                <Button
                    onClick={onSuccess}
                    className="w-full h-11 font-semibold text-[14px] rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/85 dark:hover:bg-white/90 transition-all"
                >
                    Fazer Login
                </Button>
            </div>
        )
    }

    const inputClasses = "h-11 text-[13px] bg-black/[3%] dark:bg-white/[4%] border-black/[8%] dark:border-white/[8%] placeholder:text-black/25 dark:placeholder:text-white/20 rounded-xl focus-visible:ring-1 focus-visible:ring-black/15 dark:focus-visible:ring-white/15 transition-colors"

    return (
        <div className="space-y-5">
            <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[4%] dark:bg-white/[5%]">
                    <KeyRound className="h-6 w-6 text-black/60 dark:text-white/60" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">Redefinir Senha</h2>
                    <p className="text-[13px] text-[#8A8C99]">
                        Digite sua nova senha abaixo
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-[12px] font-medium text-[#8A8C99]">Nova Senha</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8A8C99]">
                            <Lock className="h-[15px] w-[15px]" />
                        </div>
                        <Input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            className={`${inputClasses} pl-9 pr-10`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8C99] hover:text-black dark:hover:text-white transition-colors p-0.5"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-[11px] text-[#8A8C99]">
                        Mínimo 8 caracteres com letras, números e símbolos
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-[12px] font-medium text-[#8A8C99]">Confirmar Senha</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8A8C99]">
                            <Lock className="h-[15px] w-[15px]" />
                        </div>
                        <Input
                            id="confirm-password"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            className={`${inputClasses} pl-9 pr-10`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8C99] hover:text-black dark:hover:text-white transition-colors p-0.5"
                        >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="pt-1">
                    <Button
                        type="submit"
                        className="w-full h-11 font-semibold text-[14px] rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/85 dark:hover:bg-white/90 transition-all"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : 'Redefinir Senha'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
