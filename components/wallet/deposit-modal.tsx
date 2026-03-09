'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Copy, Check, Loader2, Flame } from 'lucide-react'
import { userApi, ApiClientError } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import type { Deposit, Banner } from '@/lib/types'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'

interface DepositModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

type DepositStep = 'form' | 'pix'

export function DepositModal({ isOpen, onOpenChange }: DepositModalProps) {
    const { refreshUser, user } = useAuth()
    const [step, setStep] = useState<DepositStep>('form')
    const [amount, setAmount] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deposit, setDeposit] = useState<Deposit | null>(null)
    const [copied, setCopied] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [banner, setBanner] = useState<Banner | null>(null)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            userApi.getBanners({ placement: 'modal_deposit' })
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
            setStep('form')
            setAmount('')
            setDeposit(null)
            setError(null)
            setCopied(false)
        }, 300)
    }

    const handleBack = () => {
        if (step === 'pix') {
            setStep('form')
            setDeposit(null)
        }
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

    const handleAmountSubmit = async () => {
        if (amountNumber < 10) {
            setError('Valor mínimo: R$ 10,00')
            return
        }

        if (amountNumber > 1000000) {
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const amountInCents = Math.round(amountNumber * 100)
            const response = await userApi.createDepositIntention(amountInCents)
            setDeposit(response.data.deposit)
            setStep('pix')
        } catch (err) {
            if (err instanceof ApiClientError) {
                switch (err.code) {
                    case 'DEPOSIT_MIN_AMOUNT':
                        setError('Valor mínimo para depósito é R$ 10,00')
                        break
                    case 'DEPOSIT_MAX_AMOUNT':
                        setError('Valor máximo para depósito excedido')
                        break
                    case 'WALLET_FROZEN':
                        setError('Sua carteira está congelada. Entre em contato com o suporte.')
                        break
                    default:
                        setError(err.message || 'Não autorizado')
                }
            } else {
                setError('Não autorizado')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopyPixCode = async () => {
        if (!deposit?.pix_copy_paste) return
        try {
            await navigator.clipboard.writeText(deposit.pix_copy_paste)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    const handleDepositComplete = async () => {
        await refreshUser()
        handleClose()
    }

    if (!mounted) return null

    // Fallback balance reading logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentBalance = (user as any)?.balance ?? (user as any)?.wallet?.balance ?? 0.57;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose()
        }}>
            <DialogContent
                className="flex flex-col h-fit max-h-[90vh] w-[95%] sm:max-w-[430px] max-w-[430px] overflow-hidden rounded-[24px] bg-white dark:bg-[#151515] p-0 shadow-xl border border-black/10 dark:border-white/5 outline-none duration-200 gap-0"
                showCloseButton={false}
            >
                <DialogTitle className="sr-only">Depositar</DialogTitle>
                <div className="relative h-auto overflow-y-auto max-h-[90vh] custom-scrollbar text-black dark:text-white">

                    {step === 'form' && (
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
                            <div className="flex flex-col flex-1 items-center m-2">
                                <h3 className="text-[18px] font-bold text-black dark:text-white mb-0.5">Valor do Depósito</h3>
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
                            {error && (
                                <div className="flex items-center justify-center mb-6 animate-in fade-in zoom-in-95 duration-200">
                                    <span className="text-[12px] font-semibold text-[#FF3B30] text-center">{error}</span>
                                </div>
                            )}

                            {/* Quick Amount Buttons */}
                            <div className="w-full items-center gap-x-1 flex mb-8">
                                <div className="w-full items-center justify-between gap-x-2 flex">
                                    {[20, 50, 100, 200, 500].map((val) => (
                                        <div key={val} className="relative flex-1">
                                            {val === 50 && (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                                                    <span className="bg-[#FF3B30] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-lg shadow-md flex items-center gap-0.5 border border-white/20 dark:border-black/20 whitespace-nowrap">
                                                        <Flame className="size-3 fill-white" />
                                                        QUENTE
                                                    </span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => addAmount(val)}
                                                className={cn(
                                                    "flex w-full h-[40px] items-center transition-all duration-200 justify-center rounded-[12px] border text-[13px] font-bold bg-transparent",
                                                    val === 50
                                                        ? "border-[#FF3B30] text-[#FF3B30] bg-[#FF3B30]/5 hover:bg-[#FF3B30]/10"
                                                        : "border-black/10 dark:border-white/10 dark:text-white text-black hover:bg-black/5 dark:hover:bg-white/5"
                                                )}
                                            >
                                                +R${val}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Amount to Receive Display (Summary Box) */}
                            {amountNumber >= 10 && (
                                <div className="w-full bg-black/5 dark:bg-white/5 rounded-[16px] p-4 mb-8 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex justify-between text-[13px] font-semibold text-black/60 dark:text-white/60">
                                        <span>Valor do depósito:</span>
                                        <span>R$ {amountNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px] font-semibold text-black/40 dark:text-white/40">
                                        <span>Taxa (2%):</span>
                                        <span>-R$ {(amountNumber * 0.02).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-[14px] font-bold border-t border-black/10 dark:border-white/10 pt-3 mt-1 text-black dark:text-white">
                                        <span>Você recebe:</span>
                                        <span className="text-[#00B471]">
                                            R$ {(amountNumber * 0.98).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleAmountSubmit}
                                disabled={amountNumber < 10 || isLoading}
                                className={cn(
                                    "w-full py-3.5 rounded-xl font-bold text-[15px] transition-all flex justify-center items-center outline-none",
                                    amountNumber >= 10 && !isLoading
                                        ? "text-white bg-[#2A75FF] hover:bg-[#1C60E6] active:bg-[#154BC0]"
                                        : "text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin inline" /> : null}
                                <svg key="icon-qr" className="w-5 h-5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h6v6H4z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6H4z" /><path d="M14 14h6v6h-6z" /><path d="M7 7h.01" /><path d="M17 7h.01" /><path d="M7 17h.01" /><path d="M17 17h.01" /></svg>
                                Gerar QR Code
                            </button>
                        </div>
                    )}

                    {step === 'pix' && deposit && (
                        <div className="flex flex-col p-6 text-black dark:text-white">
                            {/* Header with Back */}
                            <div className="flex items-center mb-8 relative">
                                <button
                                    onClick={handleBack}
                                    className="text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                                >
                                    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.2875 14.94L6.39747 10.05C5.81997 9.4725 5.81997 8.5275 6.39747 7.95L11.2875 3.06" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <h3 className="text-[18px] font-bold ml-2">Pague com PIX</h3>
                                <button
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                                    onClick={handleClose}
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1.4 14L0 12.6L5.6 7L0 1.4L1.4 0L7 5.6L12.6 0L14 1.4L8.4 7L14 12.6L12.6 14L7 8.4L1.4 14Z" fill="currentColor" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex flex-col items-center">
                                {/* QR Code */}
                                <div className="bg-white p-3 rounded-[16px] mb-6">
                                    {deposit.pix_qrcode_image ? (
                                        <img
                                            src={deposit.pix_qrcode_image}
                                            alt="PIX QR Code"
                                            className="w-[180px] h-[180px]"
                                        />
                                    ) : (
                                        <div className="w-[180px] h-[180px] bg-gray-100 flex items-center justify-center text-gray-400 font-semibold rounded-[12px]">
                                            QR Code
                                        </div>
                                    )}
                                </div>

                                {/* Amount Display */}
                                <div className="text-center mb-8">
                                    <p className="text-[14px] text-black/50 dark:text-white/50 font-semibold mb-1">Valor a pagar</p>
                                    <p className="text-[28px] font-black text-[#2A75FF] tracking-tight leading-none">
                                        {deposit.amount_formatted}
                                    </p>
                                </div>
                            </div>

                            {/* Copy PIX Code */}
                            {deposit.pix_copy_paste && (
                                <div className="w-full mb-6 relative">
                                    <p className="text-[14px] font-bold text-black/60 dark:text-white/60 mb-2">Código PIX Copia e Cola</p>
                                    <div className="flex items-center">
                                        <input
                                            value={deposit.pix_copy_paste}
                                            readOnly
                                            className="w-full text-[13px] bg-transparent border border-black/10 dark:border-white/10 rounded-xl pl-4 pr-14 py-3.5 text-black/80 dark:text-white/80 truncate outline-none"
                                        />
                                        <button
                                            onClick={handleCopyPixCode}
                                            className="absolute right-2 flex items-center justify-center h-10 w-10 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                        >
                                            {copied ? (
                                                <Check className="h-[18px] w-[18px] text-[#2A75FF]" />
                                            ) : (
                                                <Copy className="h-[18px] w-[18px] text-black/40 dark:text-white/40" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            <div className="border border-black/5 dark:border-white/5 rounded-2xl p-5 mb-8 bg-transparent">
                                <p className="text-[15px] font-bold text-black dark:text-white mb-3">Como pagar:</p>
                                <ol className="text-[13px] text-black/70 dark:text-white/70 space-y-[10px] list-decimal list-outside ml-4 font-semibold">
                                    <li className="pl-1">Abra o app do seu banco</li>
                                    <li className="pl-1">Escolha pagar com PIX</li>
                                    <li className="pl-1">Escaneie o QR Code ou cole o código</li>
                                    <li className="pl-1">Confirme o pagamento</li>
                                </ol>
                                <div className="h-[1px] w-full bg-black/5 dark:bg-white/5 my-5"></div>
                                <p className="text-[12px] font-semibold text-black/40 dark:text-white/40 text-center leading-relaxed max-w-[80%] mx-auto">
                                    O saldo será creditado automaticamente após a confirmação.
                                </p>
                            </div>

                            {/* Complete Button */}
                            <button
                                onClick={handleDepositComplete}
                                className="w-full py-4 rounded-[12px] font-bold text-[15px] text-white bg-[#2A75FF] hover:bg-[#1C60E6] active:bg-[#154BC0] transition-all outline-none"
                            >
                                Já fiz o pagamento
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

