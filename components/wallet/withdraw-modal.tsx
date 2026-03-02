'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Flame, Phone, Mail, User, Building2, Asterisk } from 'lucide-react'
import { userApi, ApiClientError } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Banner } from '@/lib/types'

interface WithdrawModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function WithdrawModal({ isOpen, onOpenChange }: WithdrawModalProps) {
    const { refreshUser, user } = useAuth()
    const [amount, setAmount] = useState('')
    const [pixKeyType, setPixKeyType] = useState('')
    const [pixKeyValue, setPixKeyValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const [banner, setBanner] = useState<Banner | null>(null)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            userApi.getBanners({ placement: 'modal_withdraw' })
                .then(res => {
                    const activeBanner = res.data.banners.find(b => b.isActive)
                    setBanner(activeBanner || null)
                })
                .catch(console.error)
        }
    }, [isOpen])

    const amountNumber = parseFloat(amount.replace(',', '.') || '0')

    const handleClose = () => {
        onOpenChange(false)
        setTimeout(() => {
            setAmount('')
            setPixKeyType('')
            setPixKeyValue('')
            setError(null)
        }, 300)
    }

    const addAmount = (value: number) => {
        const current = parseFloat(amount.replace(',', '.') || '0')
        const nextValue = current + value

        if (nextValue > 1000000) {
            setAmount('1000000')
            return
        }

        setAmount(nextValue.toString())
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
        const numericValue = parseFloat(rawValue || '0')

        if (numericValue > 1000000) {
            setAmount('1000000')
            return
        }

        setAmount(rawValue)
    }

    const formatPixKey = (type: string, value: string) => {
        const v = value.replace(/\D/g, '')

        switch (type) {
            case 'cpf':
                return v
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                    .replace(/(-\d{2})\d+?$/, '$1')
            case 'cnpj':
                return v
                    .replace(/(\d{2})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1/$2')
                    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
                    .replace(/(-\d{2})\d+?$/, '$1')
            case 'phone':
                return v
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{5})(\d)/, '$1-$2')
                    .replace(/(-\d{4})\d+?$/, '$1')
            case 'random': {
                const hex = value.replace(/[^a-fA-F0-9]/g, '').slice(0, 32)
                return hex
                    .replace(/^([a-fA-F0-9]{8})([a-fA-F0-9])/, '$1-$2')
                    .replace(/^([a-fA-F0-9]{8}-[a-fA-F0-9]{4})([a-fA-F0-9])/, '$1-$2')
                    .replace(/^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4})([a-fA-F0-9])/, '$1-$2')
                    .replace(/^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4})([a-fA-F0-9])/, '$1-$2')
            }
            default:
                return value
        }
    }

    const handlePixKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setPixKeyValue(formatPixKey(pixKeyType, val))
    }

    const handleCreateWithdraw = async () => {
        if (amountNumber < 10) {
            setError('Valor mínimo: R$ 10,00')
            return
        }
        if (amountNumber > 1000000) {
            return
        }
        if (!pixKeyType || !pixKeyValue) {
            setError('Preencha o tipo e a sua chave PIX')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const amountInCents = Math.round(amountNumber * 100)

            let finalPixKey = pixKeyValue.trim()
            if (pixKeyType === 'phone' || pixKeyType === 'cpf' || pixKeyType === 'cnpj') {
                finalPixKey = finalPixKey.replace(/\D/g, '')
                if (pixKeyType === 'phone' && finalPixKey.length > 0) {
                    finalPixKey = finalPixKey.startsWith('55') ? `+${finalPixKey}` : `+55${finalPixKey}`
                }
            }

            await userApi.createWithdrawal(amountInCents, pixKeyType, finalPixKey)
            toast.success('Saque solicitado com sucesso!')
            await refreshUser()
            handleClose()
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message || 'Erro ao processar o saque')
            } else {
                setError('Ocorreu um erro ao processar o saque')
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (!mounted) return null

    // Fallback balance reading logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentBalance = (user as any)?.balance ?? (user as any)?.wallet?.balance ?? 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose()
        }}>
            <DialogContent
                className="flex flex-col h-fit max-h-[90vh] w-[95%] sm:max-w-[430px] max-w-[430px] overflow-hidden rounded-[24px] bg-white dark:bg-[#151515] p-0 shadow-xl border border-black/10 dark:border-white/5 outline-none duration-200 gap-0"
                showCloseButton={false}
            >
                <DialogTitle className="sr-only">Sacar</DialogTitle>
                <div className="relative h-auto overflow-y-auto max-h-[90vh] custom-scrollbar text-black dark:text-white">

                    <div className="p-6 flex flex-col relative pt-8">
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute right-4 top-4 z-10 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors p-2 bg-black/10 dark:bg-white/10 rounded-full hover:bg-black/20 dark:hover:bg-white/20 backdrop-blur-sm"
                        >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.4 14L0 12.6L5.6 7L0 1.4L1.4 0L7 5.6L12.6 0L14 1.4L8.4 7L14 12.6L12.6 14L7 8.4L1.4 14Z" fill="currentColor" />
                            </svg>
                        </button>

                        {/* Optional Banner */}
                        {banner && (
                            <div className="mb-6 w-full rounded-xl overflow-hidden shadow-sm">
                                {banner.linkUrl ? (
                                    <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-auto object-cover max-h-[140px]" />
                                    </a>
                                ) : (
                                    <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-auto object-cover max-h-[140px]" />
                                )}
                            </div>
                        )}

                        {/* Header with Title and Balance */}
                        <div className="flex flex-col flex-1 items-center mb-2">
                            <h3 className="text-[18px] font-bold text-black dark:text-white mb-0.5">Valor do Saque</h3>
                            <span className="text-[13px] text-[#606E85] dark:text-[#A1A7BB] font-medium">
                                Saldo Atual: R$ {(currentBalance / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Amount Input */}
                        <div className="flex w-full flex-col items-center bg-transparent mb-6">
                            <div className="relative flex w-full items-center justify-center bg-transparent p-1 font-semibold">
                                <input
                                    className="w-full max-w-full text-center bg-transparent font-semibold placeholder:text-black/80 dark:placeholder:text-white/80 dark:text-white text-black outline-none"
                                    placeholder="R$ 0"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    spellCheck="false"
                                    pattern="[0-9.,]*"
                                    type="text"
                                    value={amount ? `R$ ${amount}` : ''}
                                    onChange={handleInputChange}
                                    style={{ fontSize: '3.5rem', letterSpacing: '-0.03em', height: '60px' }}
                                />
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="flex items-center justify-center mb-4 animate-in fade-in zoom-in-95 duration-200">
                                <span className="text-sm font-semibold text-[#FF3B30]">{error}</span>
                            </div>
                        )}

                        {/* Quick Amount Buttons */}
                        <div className="w-full items-center gap-x-1 flex mb-8">
                            <div className="w-full items-center justify-between gap-x-2 flex">
                                {[20, 50, 100, 200, 500].map((val) => (
                                    <div key={val} className="relative flex-1">
                                        <button
                                            onClick={() => addAmount(val)}
                                            className={cn(
                                                "flex w-full h-[40px] items-center transition-all duration-200 justify-center rounded-[12px] border text-[13px] font-bold bg-transparent",
                                                "border-black/10 dark:border-white/10 dark:text-white text-black hover:bg-black/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            +R${val}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Withdraw Fields */}
                        <div className="w-full space-y-4 mb-8">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-black/60 dark:text-white/60">Chave PIX</label>
                                <div className="flex gap-2">
                                    <Select value={pixKeyType} onValueChange={setPixKeyType}>
                                        <SelectTrigger className="w-[90px] !h-12 !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent border border-black/10 dark:border-white/10 rounded-[12px] px-4 text-[14px] flex items-center justify-between outline-none transition-colors focus:border-black/30 dark:focus:border-white/30 shadow-none">
                                            <SelectValue placeholder="*">
                                                {pixKeyType === 'phone' && <Phone className="size-4" />}
                                                {pixKeyType === 'email' && <Mail className="size-4" />}
                                                {pixKeyType === 'cpf' && <User className="size-4" />}
                                                {pixKeyType === 'cnpj' && <Building2 className="size-4" />}
                                                {pixKeyType === 'random' && <Asterisk className="size-4" />}
                                                {!pixKeyType && <Asterisk className="size-4" />}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[12px] dark:!bg-[#151515] dark:!border-white/10 border-black/10">
                                            <SelectItem value="phone" className="dark:hover:!bg-white/5 dark:data-[highlighted]:!bg-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="size-4" />
                                                    <span>Telefone</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="email" className="dark:hover:!bg-white/5 dark:data-[highlighted]:!bg-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="size-4" />
                                                    <span>Email</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="cpf" className="dark:hover:!bg-white/5 dark:data-[highlighted]:!bg-white/5">
                                                <div className="flex items-center gap-2">
                                                    <User className="size-4" />
                                                    <span>CPF</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="cnpj" className="dark:hover:!bg-white/5 dark:data-[highlighted]:!bg-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="size-4" />
                                                    <span>CNPJ</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="random" className="dark:hover:!bg-white/5 dark:data-[highlighted]:!bg-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Asterisk className="size-4" />
                                                    <span>Chave aleatória</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <input
                                        type="text"
                                        className="flex-1 h-12 bg-transparent border border-black/10 dark:border-white/10 rounded-[12px] px-4 text-[14px] outline-none transition-colors focus:border-black/30 dark:focus:border-white/30"
                                        placeholder={
                                            pixKeyType === 'cpf' ? '000.000.000-00' :
                                                pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                                                    pixKeyType === 'email' ? 'seu@email.com' :
                                                        pixKeyType === 'phone' ? '(11) 99999-9999' : 'Chave PIX'
                                        }
                                        value={pixKeyValue}
                                        onChange={handlePixKeyChange}
                                    />
                                </div>
                            </div>

                            {amountNumber >= 10 && (
                                <div className="bg-black/5 dark:bg-white/5 rounded-[12px] p-4 mt-2 space-y-2">
                                    <div className="flex justify-between text-[13px] font-semibold text-black/70 dark:text-white/70">
                                        <span>Valor do saque:</span>
                                        <span>R$ {amountNumber.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px] font-semibold text-black/50 dark:text-white/50">
                                        <span>Taxa (2%):</span>
                                        <span>-R$ {(amountNumber * 0.02).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[14px] font-bold border-t border-black/10 dark:border-white/10 pt-3 mt-1">
                                        <span>Você receberá:</span>
                                        <span className="text-[#00B471]">R$ {(amountNumber * 0.98).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleCreateWithdraw}
                            disabled={amountNumber < 10 || isLoading || !pixKeyType || !pixKeyValue}
                            className={cn(
                                "w-full py-4 rounded-[12px] font-bold text-[15px] transition-all flex justify-center items-center outline-none",
                                amountNumber >= 10 && pixKeyType && pixKeyValue && !isLoading
                                    ? "text-white bg-[#2A75FF] hover:bg-[#1C60E6] active:bg-[#154BC0]"
                                    : "text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin inline" /> : null}
                            Solicitar Saque
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
