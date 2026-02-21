'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Copy, Check, Loader2 } from 'lucide-react'
import { userApi, ApiClientError } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import type { Deposit } from '@/lib/types'
import { createPortal } from 'react-dom'

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

    useEffect(() => {
        setMounted(true)
    }, [])

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
        setAmount((current + value).toString())
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
        setAmount(rawValue)
    }

    const handleAmountSubmit = async () => {
        if (amountNumber < 11) {
            setError('Valor mínimo: R$ 11,00')
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
                        setError('Valor mínimo para depósito é R$ 11,00')
                        break
                    case 'DEPOSIT_MAX_AMOUNT':
                        setError('Valor máximo para depósito excedido')
                        break
                    case 'WALLET_FROZEN':
                        setError('Sua carteira está congelada. Entre em contato com o suporte.')
                        break
                    default:
                        setError(err.message || 'Erro ao criar depósito. Tente novamente.')
                }
            } else {
                setError('Erro ao criar depósito. Tente novamente.')
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

    if (!isOpen || !mounted) return null

    // Fallback balance reading logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentBalance = (user as any)?.balance ?? (user as any)?.wallet?.balance ?? 0.57;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[998] bg-black/60 dark:bg-black/80 animate-fade animate-duration-200"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[999] m-auto flex flex-col animate-fade-up animate-duration-300 animate-once animate-ease-linear h-fit max-h-[90vh] w-11/12 max-w-[430px] overflow-hidden rounded-[20px] bg-white dark:bg-[#121214] shadow-xl border border-black/10 dark:border-white/5 lg:w-full lg:min-w-[430px]">
                <div className="relative h-auto overflow-y-auto max-h-[90vh] custom-scrollbar">

                    {step === 'form' && (
                        <div className="p-5 flex flex-col">
                            {/* Banner Section */}
                            <div className="relative rounded-2xl bg-brand pt-6 pb-6 px-6 overflow-hidden mb-6 h-[140px] flex items-center shadow-md">
                                {/* Close Button */}
                                <button
                                    className="absolute right-4 top-4 z-20 text-white/70 hover:text-white transition-colors"
                                    onClick={handleClose}
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1.4 14L0 12.6L5.6 7L0 1.4L1.4 0L7 5.6L12.6 0L14 1.4L8.4 7L14 12.6L12.6 14L7 8.4L1.4 14Z" fill="currentColor" />
                                    </svg>
                                </button>

                                {/* Z Background Pattern */}
                                <div className="absolute right-0 top-0 bottom-0 w-[60%] z-0 opacity-10 flex flex-wrap gap-4 items-center justify-center -rotate-12 scale-150 pointer-events-none">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <svg key={i} width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                            <path d="M10 12H38L18 36H40" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ))}
                                </div>

                                {/* Banner Content */}
                                <div className="relative z-10 w-full flex justify-between items-center pr-2 mt-2">
                                    <h2 className="text-[20px] sm:text-[22px] font-black italic text-white leading-[1.15] tracking-wide">
                                        GANHE <span className="text-white drop-shadow-md">CASHBACK</span><br />
                                        TODOS OS DIAS
                                    </h2>
                                    <div className="text-white drop-shadow-md mb-2 mr-2">
                                        <svg width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 12H38L18 36H40" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Section Title */}
                            <div className="mb-[18px]">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-[3px] h-5 bg-brand rounded-full"></div>
                                    <h3 className="text-[19px] font-bold text-black dark:text-white tracking-tight">Depositar</h3>
                                </div>
                                <p className="text-sm font-medium text-[#606E85] dark:text-white/50 ml-3.5">
                                    Saldo atual: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentBalance)}
                                </p>
                            </div>

                            {/* Pix Method Card */}
                            <div className="rounded-xl border border-brand/40 bg-brand/[0.03] dark:bg-brand/[0.05] p-4 flex items-center justify-between mb-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <img src="/assets/img/pix-logo-modal.png" alt="Pix" className="h-[22px] object-contain ml-1 brightness-0 dark:brightness-100 dark:opacity-90" />
                                    <div className="h-9 w-[1px] bg-black/10 dark:bg-white/10 mx-1"></div>
                                    <div className="flex flex-col">
                                        <span className="text-black dark:text-white font-bold text-[17px] leading-tight">Pix</span>
                                        <span className="text-[#606E85] dark:text-white/50 text-[13px] font-medium mt-0.5">Depósito Real brasileiro</span>
                                    </div>
                                </div>
                                <div className="bg-black/5 dark:bg-white/10 rounded-full px-3.5 py-1 text-xs font-bold text-[#606E85] dark:text-white/80 tracking-wide">
                                    5 minutos
                                </div>
                            </div>

                            {/* Amount Section Title */}
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[15px] font-bold text-black dark:text-white tracking-wide">Valor a ser depositado:</span>
                                <button className="text-[13px] font-semibold text-brand hover:text-brand/80 transition-colors">Possui cupom?</button>
                            </div>

                            {/* Amount Input */}
                            <div className="relative mb-4 group">
                                <input
                                    className="w-full bg-white dark:bg-[#18181B] border border-black/10 dark:border-white/5 focus:border-brand/50 dark:focus:border-brand/50 rounded-[14px] py-[18px] pl-5 pr-24 text-black dark:text-white font-bold text-lg placeholder:text-black/30 dark:placeholder:text-white/30 outline-none transition-all shadow-sm"
                                    placeholder="R$0"
                                    value={amount ? `R$${amount}` : ''}
                                    onChange={handleInputChange}
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <div className="w-[18px] h-[18px] rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-[#1E1E22]">
                                        <img src="https://flagcdn.com/br.svg" alt="BRL" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-black dark:text-white font-bold text-sm tracking-wide">BRL</span>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 text-sm font-semibold text-red-500 text-center">{error}</div>
                            )}

                            {/* Quick amounts */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[
                                    { val: 20, isHot: false },
                                    { val: 50, isHot: true },
                                    { val: 100, isHot: false },
                                    { val: 250, isHot: true },
                                    { val: 500, isHot: false },
                                    { val: 1000, isHot: true }
                                ].map(({ val, isHot }) => (
                                    <div key={val} className="relative">
                                        <button
                                            onClick={() => addAmount(val)}
                                            className="w-full bg-white dark:bg-[#18181B] hover:bg-black/5 dark:hover:bg-[#202024] border border-black/10 dark:border-white/5 rounded-xl py-3.5 text-[15px] font-bold text-black dark:text-white transition-colors shadow-sm"
                                        >
                                            +R${val}
                                        </button>
                                        {isHot && (
                                            <div className="absolute -top-1.5 -right-1.5 bg-brand text-white text-[9px] font-black italic px-1.5 py-[3px] rounded shadow-sm tracking-wider leading-none">
                                                HOT
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Min Amount Indicator */}
                            <p className="text-[#606E85] dark:text-white/40 text-[13px] font-medium mb-6 ml-1">
                                Depósito mínimo: R$11.00
                            </p>

                            {/* Submit Button */}
                            <button
                                onClick={handleAmountSubmit}
                                disabled={amountNumber < 11 || isLoading}
                                className={cn(
                                    "w-full py-4 rounded-xl font-bold text-[16px] transition-all flex justify-center items-center tracking-wide",
                                    amountNumber >= 11 && !isLoading
                                        ? "text-white bg-brand hover:brightness-110 shadow-md"
                                        : "text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin inline" /> : null}
                                Continuar
                            </button>
                        </div>
                    )}

                    {step === 'pix' && deposit && (
                        <div className="flex min-h-[400px] flex-col justify-between p-6 text-black dark:text-white">
                            {/* Header with Back */}
                            <div className="flex items-center mb-6 relative">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center justify-center text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
                                >
                                    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.2875 14.94L6.39747 10.05C5.81997 9.4725 5.81997 8.5275 6.39747 7.95L11.2875 3.06" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <h3 className="text-xl font-bold ml-3">Pague com PIX</h3>

                                <button
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                                    onClick={handleClose}
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1.4 14L0 12.6L5.6 7L0 1.4L1.4 0L7 5.6L12.6 0L14 1.4L8.4 7L14 12.6L12.6 14L7 8.4L1.4 14Z" fill="currentColor" />
                                    </svg>
                                </button>
                            </div>

                            {/* QR Code */}
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="bg-white p-5 rounded-2xl mb-6 shadow-lg border border-black/5 dark:border-none">
                                    {deposit.pix_qrcode_image ? (
                                        <img
                                            src={deposit.pix_qrcode_image}
                                            alt="PIX QR Code"
                                            className="w-[180px] h-[180px]"
                                        />
                                    ) : (
                                        <div className="w-[180px] h-[180px] bg-gray-100 flex items-center justify-center text-gray-400 font-semibold rounded-xl">
                                            QR Code
                                        </div>
                                    )}
                                </div>

                                {/* Amount Display */}
                                <div className="text-center mb-6">
                                    <p className="text-[15px] text-[#606E85] dark:text-white/50 font-medium tracking-wide">Valor a pagar</p>
                                    <p className="text-[28px] font-black text-brand tracking-tight mt-1">
                                        {deposit.amount_formatted}
                                    </p>
                                </div>

                                {/* Copy PIX Code */}
                                {deposit.pix_copy_paste && (
                                    <div className="w-full mb-6">
                                        <p className="text-sm font-semibold text-[#606E85] dark:text-white/50 mb-2.5">Código PIX Copia e Cola</p>
                                        <div className="flex gap-2">
                                            <input
                                                value={deposit.pix_copy_paste}
                                                readOnly
                                                className="flex-1 text-[13px] font-mono bg-black/5 dark:bg-[#18181B] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3.5 text-black/80 dark:text-white/80 truncate outline-none"
                                            />
                                            <button
                                                onClick={handleCopyPixCode}
                                                className="flex items-center justify-center w-[52px] rounded-xl border border-black/10 dark:border-white/10 bg-black/5 hover:bg-black/10 dark:bg-[#18181B] dark:hover:bg-[#202024] transition-colors"
                                            >
                                                {copied ? (
                                                    <Check className="h-5 w-5 text-brand" />
                                                ) : (
                                                    <Copy className="h-5 w-5 text-[#606E85] dark:text-white/70" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Recommendations */}
                            <div className="bg-black/[0.03] dark:bg-[#18181B] border border-black/5 dark:border-white/5 rounded-xl p-5 mb-6">
                                <p className="text-[15px] font-bold text-black dark:text-white mb-3">Como pagar:</p>
                                <ol className="text-sm text-[#606E85] dark:text-white/60 space-y-2.5 list-decimal list-outside ml-4 font-medium">
                                    <li className="pl-1">Abra o app do seu banco</li>
                                    <li className="pl-1">Escolha pagar com PIX</li>
                                    <li className="pl-1">Escaneie o QR Code ou cole o código</li>
                                    <li className="pl-1">Confirme o pagamento</li>
                                </ol>
                                <div className="h-[1px] w-full bg-black/5 dark:bg-white/5 my-4"></div>
                                <p className="text-[13px] font-medium text-[#606E85] dark:text-white/40 text-center leading-relaxed">
                                    O saldo será creditado automaticamente<br />após a confirmação.
                                </p>
                            </div>

                            {/* Complete Button */}
                            <button
                                onClick={handleDepositComplete}
                                className="w-full py-4 rounded-xl font-bold text-[16px] text-white bg-brand hover:brightness-110 transition-all tracking-wide shadow-md"
                            >
                                Já fiz o pagamento
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>,
        document.body
    )
}

