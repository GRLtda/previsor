'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, User, Mail, Phone, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { ApiClientError } from '@/lib/api/client'
import Link from 'next/link'

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
    const [formData, setFormData] = useState({
        cpf: '', // For now we keep CPF as asked in the backend, even though it's not in the image explicitly. Let's hide it behind Name or just assume Name is CPF if needed. Actually, let's just make it CPF visibly, or ask Name instead. Since backend needs cpf, let's keep it. But reference has "Nome Completo". Let's show both.
        name: '',
        email: '',
        phone: '',
        password: '',
    })
    const [acceptTerms, setAcceptTerms] = useState(false)
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

        if (!acceptTerms) {
            toast.error('Você precisa aceitar os termos de uso')
            return
        }

        setIsLoading(true)

        try {
            await register({
                cpf: formData.cpf.replace(/\D/g, ''),
                email: formData.email,
                phone: formData.phone.replace(/\D/g, ''),
                password: formData.password,
                accept_terms: true,
                // full_name: formData.name, // assuming we might want to pass name if backend supported it, but we'll stick to what is there
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

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center pb-2">
                <h2 className="text-2xl font-bold tracking-tight dark:text-white">Crie sua conta!</h2>
                <p className="text-[13px] font-medium text-muted-foreground/80">
                    Comece a concorrer a prêmios hoje!
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="cpf" className="text-[12px] font-semibold">CPF</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                                <User className="h-4 w-4 opacity-70" />
                            </div>
                            <Input
                                id="cpf"
                                placeholder="000.000.000-00"
                                value={formData.cpf}
                                onChange={(e) => handleChange('cpf', e.target.value)}
                                required
                                className="h-11 pl-10 bg-black/5 dark:bg-[#12121a] border-border dark:border-white/5 placeholder:text-muted-foreground/50 rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[12px] font-semibold">Email</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                            <Mail className="h-4 w-4 opacity-70" />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            placeholder="example@site.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            autoComplete="email"
                            className="h-11 pl-10 bg-black/5 dark:bg-[#12121a] border-border dark:border-white/5 placeholder:text-muted-foreground/50 rounded-xl"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[12px] font-semibold">Telefone</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                            <Phone className="h-4 w-4 opacity-70" />
                        </div>
                        <Input
                            id="phone"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            required
                            className="h-11 pl-10 bg-black/5 dark:bg-[#12121a] border-border dark:border-white/5 placeholder:text-muted-foreground/50 rounded-xl"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[12px] font-semibold">Escolha uma senha</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                            <Lock className="h-4 w-4 opacity-70" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Digite uma senha forte..."
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            required
                            autoComplete="new-password"
                            className="h-11 pl-10 pr-20 bg-black/5 dark:bg-[#12121a] border-border dark:border-white/5 placeholder:text-muted-foreground/50 rounded-xl"
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

                <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    />
                    <label
                        htmlFor="terms"
                        className="text-[11px] text-muted-foreground font-medium cursor-pointer"
                    >
                        Li e aceito os{' '}
                        <Link href="/termos" target="_blank" className="font-bold text-black dark:text-white hover:underline">
                            Termos
                        </Link>{' '}
                        e{' '}
                        <Link href="/privacidade" target="_blank" className="font-bold text-black dark:text-white hover:underline">
                            Privacidade
                        </Link>
                    </label>
                </div>

                <div className="pt-2">
                    <Button type="submit" className="w-full h-12 font-bold text-[15px] shadow-sm tracking-wide rounded-xl bg-brand text-white hover:brightness-110" disabled={isLoading || !acceptTerms}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando...
                            </>
                        ) : 'CRIAR'}
                    </Button>
                </div>
            </form>

            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border dark:border-white/5"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-bold text-muted-foreground dark:text-white/40 uppercase">OU</span>
                <div className="flex-grow border-t border-border dark:border-white/5"></div>
            </div>

            <div className="text-center text-[13px]">
                <span className="text-muted-foreground font-medium">Já tem uma conta? </span>
                <button
                    onClick={onLoginClick}
                    className="font-bold text-brand hover:underline transition-colors focus:outline-none"
                >
                    Entrar
                </button>
            </div>
        </div>
    )
}
