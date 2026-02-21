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
                                <div className="absolute top-0 inset-x-0 bg-[#35d985] text-black text-[9px] font-black uppercase text-center py-1 tracking-[0.3em] z-20">
                                    CAIXA DE BÔNUS LIBERADA
                                </div>
                                <div className="relative z-10 w-full flex justify-between items-center pr-2 mt-4">
                                    <h2 className="text-[20px] sm:text-[22px] font-black text-white leading-[1.15] tracking-tight">
                                        <span className="text-white drop-shadow-sm text-[16px] font-medium leading-none mb-1 block">COMPRE NO PIX &</span>
                                        <span className="text-white drop-shadow-md text-[28px] leading-none mb-1 block tracking-[-0.02em]">RECEBA NO PIX</span>
                                        <span className="text-white/90 drop-shadow-sm text-[10px] font-semibold tracking-widest block mt-1">ACHE 3 IGUAIS E GANHE NA HORA!</span>
                                    </h2>
                                    <div className="text-white drop-shadow-md mb-2 mr-2">
                                        <div className="w-16 h-16 bg-gradient-to-br from-[#77f0a6] to-[#01b559] rounded-2xl rotate-45 flex items-center justify-center shadow-lg border-[3px] border-[#a0f4c3]">
                                            <div className="w-10 h-10 border-2 border-[#16c66b] border-t-white border-l-white rounded-xl shadow-inner rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section Title */}
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="bg-white dark:bg-white text-black p-1 rounded-sm flex items-center justify-center">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                                    </div>
                                    <h3 className="text-[20px] font-bold text-black dark:text-white tracking-tight">Depósito</h3>
                                </div>
                            </div>




                            {/* Amount Section Title */}
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[14px] font-bold text-black dark:text-white">Valor:</span>
                            </div>

                            {/* Amount Input */}
                            <div className="relative mb-6 group">
                                <input
                                    className="w-full bg-black/5 dark:bg-[#12121a] border border-black/10 dark:border-white/5 focus:border-brand/50 dark:focus:border-brand/50 rounded-xl py-4 pl-4 pr-12 text-black dark:text-white font-semibold text-[15px] outline-none transition-all shadow-sm"
                                    placeholder="R$ 0,00"
                                    value={amount ? `R$ ${amount}` : ''}
                                    onChange={handleInputChange}
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-muted-foreground/70 justify-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 text-sm font-semibold text-red-500 text-center">{error}</div>
                            )}

                            {/* Quick amounts */}
                            <div className="flex flex-wrap gap-2.5 mb-8">
                                {[
                                    { val: 10, isHot: false },
                                    { val: 30, isHot: true },
                                    { val: 50, isHot: false },
                                    { val: 100, isHot: false },
                                    { val: 200, isHot: false },
                                    { val: 500, isHot: false }
                                ].map(({ val, isHot }) => (
                                    <div key={val} className="relative flex-1 min-w-[70px]">
                                        <button
                                            onClick={() => setAmount(val.toString())}
                                            className={cn(
                                                "w-full bg-black/5 dark:bg-[#12121a] hover:bg-black/10 dark:hover:bg-[#1a1a24] border rounded-lg py-2.5 text-[14px] font-semibold transition-colors shadow-sm",
                                                isHot && Number(amount) === val
                                                    ? "border-[#eab308] text-brand"
                                                    : isHot
                                                        ? "border-[#eab308] text-brand"
                                                        : Number(amount) === val
                                                            ? "border-brand text-brand bg-brand/5 dark:bg-brand/10"
                                                            : "border-border dark:border-white/5 text-black dark:text-white"
                                            )}
                                        >
                                            {val.toFixed(2).replace('.', ',')}
                                        </button>
                                        {isHot && (
                                            <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-[9px] font-bold px-1.5 py-[2px] rounded-md shadow-sm whitespace-nowrap z-10 flex items-center gap-0.5">
                                                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.082 10.368c.277-2.3-1.077-4.499-2.227-6.273-1.127-1.74-2.827-3.768-2.827-3.768A.999.999 0 0 0 11.23.639c-.198.536-1.536 4.312-1.396 7.21-1.01.696-1.928 2.37-1.928 4.673a3.5 3.5 0 0 0 .584 1.83 5.483 5.483 0 0 0 .199.309c-.066-.183-.346-.967-.406-2.174-.017-.354-.429-.533-.679-.283-.483.483-1.603 1.879-1.603 4.296 0 3.033 2.467 5.5 5.5 5.5 1.488 0 2.824-.593 3.8-1.551 1.053-.9 1.7-2.348 1.7-3.949a6.007 6.007 0 0 0-.822-2.903c.513.799.349 2.062.261 2.366-.101.349.378.583.593.308.572-.733 1.157-2.31 1.059-4.225l.011-.005C17.07 10.975 17.082 10.368 17.082 10.368z" /></svg>
                                                QUENTE
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleAmountSubmit}
                                disabled={amountNumber < 11 || isLoading}
                                className={cn(
                                    "w-full py-3.5 rounded-xl font-bold text-[15px] transition-all flex justify-center items-center",
                                    amountNumber >= 11 && !isLoading
                                        ? "text-white bg-brand hover:brightness-110 shadow-sm"
                                        : "text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin inline" /> : null}
                                <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5v0a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v0Z" /><path d="M7 10h10" /><path d="M7 14h10" /><path d="M10 10v4" /></svg>
                                Gerar QR Code
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

