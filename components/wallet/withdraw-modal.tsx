'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { userApi, ApiClientError } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

    useEffect(() => {
        setMounted(true)
    }, [])

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
        setAmount((current + value).toString())
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
        setAmount(rawValue)
    }

    const handleCreateWithdraw = async () => {
        if (amountNumber < 10) {
            setError('Valor mínimo: R$ 10,00')
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
            if (pixKeyType === 'phone') {
                const digits = finalPixKey.replace(/\D/g, '')
                if (digits.length > 0) {
                    finalPixKey = digits.startsWith('55') ? `+${digits}` : `+55${digits}`
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
                className="flex flex-col h-fit max-h-[90vh] w-[95%] sm:w-11/12 max-w-[430px] overflow-hidden rounded-[24px] bg-white dark:bg-[#151515] p-0 shadow-xl border border-black/10 dark:border-white/5 outline-none duration-200 gap-0"
                showCloseButton={false}
            >
                <DialogTitle className="sr-only">Sacar</DialogTitle>
                <div className="relative h-auto overflow-y-auto max-h-[90vh] custom-scrollbar text-black dark:text-white">

                    <div className="p-6 flex flex-col">
                        {/* Header with Back */}
                        <div className="flex items-center mb-10 relative">
                            <div className="flex flex-col flex-1 items-center">
                                <h3 className="text-[18px] font-bold text-black dark:text-white mb-0.5">Valor do Saque</h3>
                                <span className="text-[13px] text-[#606E85] dark:text-[#A1A7BB] font-medium">
                                    Saldo Atual: R$ {(currentBalance / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <button
                                onClick={handleClose}
                                className="absolute right-0 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.4 14L0 12.6L5.6 7L0 1.4L1.4 0L7 5.6L12.6 0L14 1.4L8.4 7L14 12.6L12.6 14L7 8.4L1.4 14Z" fill="currentColor" />
                                </svg>
                            </button>
                        </div>

                        {/* Amount Input */}
                        <div className="flex w-full flex-col items-center bg-transparent mb-6">
                            <div className="relative flex w-full items-center justify-center bg-transparent p-1 font-semibold">
                                <input
                                    className="w-full max-w-full text-center bg-transparent font-bold placeholder:text-black/80 dark:placeholder:text-white/80 dark:text-white text-black outline-none"
                                    placeholder="R$ 0"
                                    aria-label="input amount"
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
                        <div className="h-6 flex items-center justify-center mb-4">
                            {error && (
                                <span className="text-sm font-semibold text-[#FF3B30]">{error}</span>
                            )}
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="w-full items-center gap-x-1 flex mb-8">
                            <div className="w-full items-center justify-between gap-x-2 flex">
                                {[20, 50, 100, 200, 500].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => addAmount(val)}
                                        className="flex w-full h-[36px] items-center transition-all duration-100 justify-center rounded-[10px] border border-black/10 dark:border-white/10 text-[13px] font-bold dark:text-white text-black hover:bg-black/5 dark:hover:bg-white/5 bg-transparent"
                                    >
                                        +R${val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Withdraw Fields */}
                        <div className="w-full space-y-4 mb-8">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-black/60 dark:text-white/60">Tipo de Chave PIX</label>
                                <Select value={pixKeyType} onValueChange={setPixKeyType}>
                                    <SelectTrigger className="w-full h-12 bg-transparent border-black/10 dark:border-white/10 rounded-[12px] text-[14px]">
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[12px] border-black/10 dark:border-white/10">
                                        <SelectItem value="cpf">CPF</SelectItem>
                                        <SelectItem value="cnpj">CNPJ</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="phone">Telefone</SelectItem>
                                        <SelectItem value="random">Chave Aleatória</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-black/60 dark:text-white/60">Sua Chave PIX</label>
                                <input
                                    type="text"
                                    className="w-full h-12 bg-transparent border border-black/10 dark:border-white/10 rounded-[12px] px-4 text-[14px] outline-none transition-colors focus:border-black/30 dark:focus:border-white/30"
                                    placeholder={
                                        pixKeyType === 'cpf' ? '000.000.000-00' :
                                            pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                                                pixKeyType === 'email' ? 'seu@email.com' :
                                                    pixKeyType === 'phone' ? '+55 11 99999-9999' : 'Coloque sua chave PIX'
                                    }
                                    value={pixKeyValue}
                                    onChange={(e) => setPixKeyValue(e.target.value)}
                                />
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
