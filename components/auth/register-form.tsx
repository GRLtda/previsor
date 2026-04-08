'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, User, Mail, Phone, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { ApiClientError } from '@/lib/api/client'
import Link from 'next/link'
import { getStoredAffiliateTracking } from '@/lib/affiliate-tracking'

interface RegisterFormProps {
    onSuccess: (email: string) => void
    onLoginClick: () => void
}

function formatCPF(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
    const { register } = useAuth()
    const affiliateTracking = getStoredAffiliateTracking()
    const [formData, setFormData] = useState({
        cpf: '',
        name: '',
        email: '',
        phone: '',
        password: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (field: string, value: string) => {
        if (field === 'cpf') {
            setFormData({ ...formData, cpf: formatCPF(value) })
        } else if (field === 'phone') {
            setFormData({ ...formData, phone: formatPhone(value) })
        } else {
            setFormData({ ...formData, [field]: value })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await register({
                cpf: formData.cpf.replace(/\D/g, ''),
                email: formData.email,
                phone: formData.phone.replace(/\D/g, ''),
                password: formData.password,
                accept_terms: true,
                affiliate: affiliateTracking
                    ? {
                        click_id: affiliateTracking.click_id,
                        campaign_slug: affiliateTracking.campaign_slug,
                    }
                    : undefined,
            })

            toast.success('Conta criada! Verifique seu telefone.')
            onSuccess(formData.email)
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error(err.getDetailedMessage())
            } else {
                toast.error('Erro ao criar conta')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const inputClasses = "h-11 pl-9 text-[13px] bg-black/[3%] dark:bg-white/[4%] border-black/[8%] dark:border-white/[8%] placeholder:text-black/25 dark:placeholder:text-white/20 rounded-xl focus-visible:ring-1 focus-visible:ring-black/15 dark:focus-visible:ring-white/15 transition-colors"

    return (
        <div className="space-y-5">
            <div className="space-y-1 text-left">
                <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">Crie sua conta</h2>
                <p className="text-[13px] text-[#8A8C99]">
                    Comece a concorrer a prêmios hoje.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-left">
                <div className="space-y-1.5">
                    <Label htmlFor="cpf" className="text-[12px] font-medium text-[#8A8C99]">CPF</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8A8C99]">
                            <User className="h-[15px] w-[15px]" />
                        </div>
                        <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => handleChange('cpf', e.target.value)}
                            required
                            className={inputClasses}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-[12px] font-medium text-[#8A8C99]">Email</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8A8C99]">
                            <Mail className="h-[15px] w-[15px]" />
                        </div>
                        <Input
                            id="reg-email"
                            type="email"
                            placeholder="example@site.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            autoComplete="email"
                            className={inputClasses}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[12px] font-medium text-[#8A8C99]">Telefone</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8A8C99]">
                            <Phone className="h-[15px] w-[15px]" />
                        </div>
                        <Input
                            id="phone"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            required
                            className={inputClasses}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="reg-password" className="text-[12px] font-medium text-[#8A8C99]">Senha</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8A8C99]">
                            <Lock className="h-[15px] w-[15px]" />
                        </div>
                        <Input
                            id="reg-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            required
                            autoComplete="new-password"
                            className={`${inputClasses} pr-10`}
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

                <p className="text-[11px] text-[#8A8C99] text-center pt-1">
                    Ao se registrar você concorda com nossos{' '}
                    <Link href="/termos" target="_blank" className="font-medium text-black dark:text-white hover:underline">
                        Termos de Uso
                    </Link>
                </p>

                <div className="pt-1">
                    <Button
                        type="submit"
                        className="w-full h-11 font-semibold text-[14px] rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/85 dark:hover:bg-white/90 transition-all"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando...
                            </>
                        ) : 'Criar Conta'}
                    </Button>
                </div>
            </form>

            <div className="relative flex items-center">
                <div className="flex-grow border-t border-black/[6%] dark:border-white/[6%]"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] font-medium text-[#8A8C99] uppercase tracking-wider">ou</span>
                <div className="flex-grow border-t border-black/[6%] dark:border-white/[6%]"></div>
            </div>

            <div className="text-center text-[13px]">
                <span className="text-[#8A8C99]">Já tem uma conta? </span>
                <button
                    onClick={onLoginClick}
                    className="font-semibold text-black dark:text-white hover:underline transition-colors focus:outline-none"
                >
                    Entrar
                </button>
            </div>
        </div>
    )
}
