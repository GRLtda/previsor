'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
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
        cpf: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
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

        if (formData.password !== formData.confirmPassword) {
            toast.error('As senhas não conferem')
            return
        }

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
            })

            toast.success('Conta criada! Verifique seu telefone.')
            onSuccess(formData.email)
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error(err.message)
            } else {
                toast.error('Erro ao criar conta')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight">Criar uma conta</h2>
                <p className="text-sm text-muted-foreground">
                    Preencha os dados abaixo para começar
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => handleChange('cpf', e.target.value)}
                        required
                        className="h-10"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                        autoComplete="email"
                        className="h-10"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                        id="phone"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        required
                        className="h-10"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Senha"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                required
                                autoComplete="new-password"
                                className="h-10 pr-8"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Senha"
                            value={formData.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            required
                            autoComplete="new-password"
                            className="h-10"
                        />
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
                        className="text-xs text-muted-foreground leading-tight cursor-pointer"
                    >
                        Li e aceito os{' '}
                        <Link href="/termos" target="_blank" className="text-primary hover:underline">
                            Termos
                        </Link>{' '}
                        e{' '}
                        <Link href="/privacidade" target="_blank" className="text-primary hover:underline">
                            Privacidade
                        </Link>
                    </label>
                </div>

                <Button type="submit" className="w-full h-11 font-semibold text-base shadow-sm mt-2" disabled={isLoading || !acceptTerms}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                        </>
                    ) : 'Criar conta'}
                </Button>
            </form>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">Já tem uma conta? </span>
                <button
                    onClick={onLoginClick}
                    className="font-medium text-primary hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm"
                >
                    Entrar
                </button>
            </div>
        </div>
    )
}
