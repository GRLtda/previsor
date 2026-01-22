'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Copy, Check, Loader2 } from 'lucide-react'
import { userApi, ApiClientError } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import type { Deposit } from '@/lib/types'

interface DepositModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

type DepositStep = 'method' | 'amount' | 'pix'

export function DepositModal({ isOpen, onOpenChange }: DepositModalProps) {
    const { refreshUser } = useAuth()
    const [step, setStep] = useState<DepositStep>('method')
    const [amount, setAmount] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deposit, setDeposit] = useState<Deposit | null>(null)
    const [copied, setCopied] = useState(false)

    const amountNumber = parseFloat(amount.replace(',', '.') || '0')

    const handleClose = () => {
        onOpenChange(false)
        setTimeout(() => {
            setStep('method')
            setAmount('')
            setDeposit(null)
            setError(null)
            setCopied(false)
        }, 300)
    }

    const handleSelectPix = () => {
        setStep('amount')
        setError(null)
    }

    const handleBack = () => {
        if (step === 'amount') {
            setStep('method')
            setAmount('')
            setError(null)
        } else if (step === 'pix') {
            setStep('amount')
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
        if (amountNumber < 10) {
            setError('Valor mínimo: R$ 10,00')
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

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[998] bg-black/50 animate-fade animate-duration-200"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[999] m-auto animate-fade-up animate-duration-300 animate-once animate-ease-linear h-fit max-h-[90vh] w-11/12 max-w-[430px] overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/5 dark:bg-[#0E1117] lg:w-full lg:min-w-[430px]">
                <div className="relative h-auto">
                    {/* Close Button */}
                    <button
                        className="absolute right-6 top-6 z-10 w-fit cursor-pointer"
                        onClick={handleClose}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.77764 8.00537L13.8413 2.95881C14.0529 2.74527 14.0529 2.39933 13.8413 2.18579C13.6335 1.96843 13.2903 1.9619 13.0745 2.1712L8.01085 7.21775L3.01226 2.1712C2.90978 2.06192 2.76719 2 2.61802 2C2.46884 2 2.32625 2.06192 2.22377 2.1712C2.0362 2.37752 2.0362 2.69416 2.22377 2.90047L7.22236 7.93973L2.15867 12.979C1.94711 13.1925 1.94711 13.5385 2.15867 13.752C2.25938 13.856 2.3979 13.914 2.54206 13.9125C2.689 13.9245 2.83468 13.8773 2.94716 13.7812L8.01085 8.73464L13.0745 13.8395C13.1753 13.9435 13.3138 14.0015 13.4579 14C13.6019 14.0007 13.7401 13.9428 13.8413 13.8395C14.0529 13.626 14.0529 13.28 13.8413 13.0665L8.77764 8.00537Z" fill="#7F8996" />
                        </svg>
                    </button>

                    {/* Step 1: Method Selection */}
                    {step === 'method' && (
                        <div className="px-4 py-5 text-black dark:text-white">
                            <h3 className="text-xl font-bold">Escolha o Método de Depósito</h3>
                            <div className="mt-[18px] flex flex-col">
                                <button
                                    onClick={handleSelectPix}
                                    className="mt-2.5 flex w-full items-center gap-x-3 rounded-xl border border-black/10 p-4 transition-all duration-100 ease-in hover:bg-black/10 dark:border-none dark:bg-white/5 dark:hover:bg-white/10 sm:gap-x-5 sm:px-5"
                                >
                                    <div className="flex h-10 w-20 items-center justify-center">
                                        <svg width="68" height="24" viewBox="0 0 68 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.7608 8.66959L14.1481 12.3135L17.7608 15.9573C18.6266 16.8304 19.8828 16.8304 20.7486 15.9573L22.8037 13.8832C23.6695 13.0101 23.6695 11.6169 22.8037 10.7438L20.7486 8.66959C19.8828 7.79647 18.4964 7.79647 17.7608 8.66959Z" fill="#32BCAD" />
                                            <path d="M5.19895 8.66959L3.14383 10.7438C2.27808 11.6169 2.27808 13.0101 3.14383 13.8832L5.19895 15.9573C6.06469 16.8304 7.32091 16.8304 8.18665 15.9573L11.7994 12.3135L8.18665 8.66959C7.32091 7.79647 5.93427 7.79647 5.19895 8.66959Z" fill="#32BCAD" />
                                            <path d="M14.1481 12.3135L11.7994 14.6836C11.0641 15.4261 9.80785 15.4261 8.94211 14.6836L6.98117 12.7066C6.85074 12.5759 6.85074 12.3135 6.98117 12.1829L11.7994 7.33386C12.0299 7.10272 12.3905 7.10272 12.6211 7.33386L14.1481 8.66959C14.2785 8.80021 14.2785 9.06259 14.1481 9.19322L10.9331 12.3135L14.1481 15.4337C14.2785 15.5644 14.2785 15.8267 14.1481 15.9573L12.6211 17.293C12.3905 17.5242 12.0299 17.5242 11.7994 17.293L6.98117 12.444C6.85074 12.3135 6.85074 12.0511 6.98117 11.9204L8.94211 9.94335C9.80785 9.20084 11.0641 9.20084 11.7994 9.94335L14.1481 12.3135Z" fill="#32BCAD" />
                                        </svg>
                                    </div>
                                    <div className="h-11 w-[1px] bg-black/10 dark:bg-white/10" />
                                    <div className="flex flex-1 flex-col space-y-1 text-left">
                                        <span className="font-semibold">Pix</span>
                                        <span className="text-xs font-medium text-[#606E85]">Depósito em Real brasileiro</span>
                                    </div>
                                    <div className="flex w-fit shrink-0 items-center justify-center rounded-full bg-black/10 px-2.5 py-0.5 text-xs font-medium text-black dark:bg-white/5 dark:text-white">
                                        5 minutos
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Amount Input */}
                    {step === 'amount' && (
                        <div className="flex min-h-[400px] flex-col justify-between p-5 animate-duration-[400ms] animate-once animate-ease-linear">
                            {/* Header with Back */}
                            <div className="flex items-center">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center justify-center text-black dark:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.2875 14.94L6.39747 10.05C5.81997 9.4725 5.81997 8.5275 6.39747 7.95L11.2875 3.06" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="ml-2.5 flex items-center gap-x-1">
                                        <h3 className="text-lg font-bold">Depósito Pix</h3>
                                    </div>
                                </button>
                            </div>

                            {/* Amount Input Section */}
                            <div className="flex flex-col items-center justify-center">
                                <span className="mb-[15px] font-medium text-[#0C131F] dark:text-white">Valor</span>

                                {error && (
                                    <div className="mb-4 text-sm text-red-500 text-center">{error}</div>
                                )}

                                <div className="mt-4 flex w-full flex-col items-center bg-transparent lg:mt-3">
                                    <div className="relative my-3 flex h-14 w-full items-center justify-center rounded-lg p-3 text-lg font-semibold lg:my-1">
                                        <div className="flex w-full flex-col items-center justify-center">
                                            <div className="relative flex w-full items-center justify-center">
                                                <input
                                                    className="w-full max-w-full text-center bg-transparent font-bold placeholder:text-[#606E85]/30 dark:placeholder:text-white/30 dark:text-white text-[#0C131F] pl-0"
                                                    placeholder="R$0"
                                                    aria-label="input amount"
                                                    inputMode="decimal"
                                                    autoComplete="off"
                                                    spellCheck="false"
                                                    pattern="[0-9.,]*"
                                                    type="text"
                                                    value={amount ? `R$${amount}` : ''}
                                                    onChange={handleInputChange}
                                                    style={{ fontSize: '3rem' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <span className="mt-[7px] text-[13px] font-medium text-[#606E85] dark:text-[#A1A7BB]">
                                    Sem Limite de Depósito
                                </span>
                            </div>

                            {/* Quick Amounts + Continue Button */}
                            <div className="mt-2">
                                <div className="w-full items-center gap-x-1 mb-3 flex">
                                    <div className="flex w-full items-center justify-between gap-x-1.5">
                                        {[10, 20, 50, 100].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => addAmount(val)}
                                                className="flex w-full h-full max-h-[28px] items-center transition-all duration-100 bg-black/5 dark:bg-white/[8%] justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 py-1.5 text-xs font-medium text-black dark:text-white"
                                            >
                                                +R${val}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setAmount('1000')}
                                            className="flex w-full h-full max-h-[28px] items-center transition-all duration-100 bg-black/5 dark:bg-white/[8%] justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 py-1.5 text-xs font-medium text-black dark:text-white"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAmountSubmit}
                                    disabled={amountNumber < 10 || isLoading}
                                    className={cn(
                                        "gap-x-2 flex items-center justify-center transition duration-200 ease-linear outline-none text-sm py-1 px-3 h-[46px] w-full rounded-[10px] font-semibold",
                                        amountNumber >= 10 && !isLoading
                                            ? "bg-[#0055FF] hover:bg-[#0044CC] text-white cursor-pointer"
                                            : "cursor-not-allowed bg-gray-200 dark:bg-[#1E232B] text-black/60 dark:text-white/40"
                                    )}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Gerando PIX...
                                        </>
                                    ) : (
                                        'Continuar'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: PIX Payment */}
                    {step === 'pix' && deposit && (
                        <div className="flex min-h-[400px] flex-col justify-between p-5">
                            {/* Header with Back */}
                            <div className="flex items-center mb-4">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center justify-center text-black dark:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.2875 14.94L6.39747 10.05C5.81997 9.4725 5.81997 8.5275 6.39747 7.95L11.2875 3.06" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="ml-2.5 flex items-center gap-x-1">
                                        <h3 className="text-lg font-bold">Pague com PIX</h3>
                                    </div>
                                </button>
                            </div>

                            {/* QR Code */}
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="bg-white p-4 rounded-xl mb-4">
                                    {deposit.pix_qrcode_image ? (
                                        <img
                                            src={deposit.pix_qrcode_image}
                                            alt="PIX QR Code"
                                            className="w-40 h-40"
                                        />
                                    ) : (
                                        <div className="w-40 h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                                            QR Code
                                        </div>
                                    )}
                                </div>

                                {/* Amount Display */}
                                <div className="text-center mb-4">
                                    <p className="text-sm text-[#606E85] dark:text-[#A1A7BB]">Valor a pagar</p>
                                    <p className="text-2xl font-bold text-[#00B471]">
                                        {deposit.amount_formatted}
                                    </p>
                                </div>

                                {/* Copy PIX Code */}
                                {deposit.pix_copy_paste && (
                                    <div className="w-full mb-4">
                                        <p className="text-sm font-medium text-[#606E85] dark:text-[#A1A7BB] mb-2">Código PIX Copia e Cola</p>
                                        <div className="flex gap-2">
                                            <input
                                                value={deposit.pix_copy_paste}
                                                readOnly
                                                className="flex-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-[#606E85] dark:text-white truncate"
                                            />
                                            <button
                                                onClick={handleCopyPixCode}
                                                className="flex items-center justify-center px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                            >
                                                {copied ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4 text-[#606E85]" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Instructions */}
                            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 mb-4">
                                <p className="text-sm font-semibold text-black dark:text-white mb-2">Como pagar:</p>
                                <ol className="text-xs text-[#606E85] dark:text-[#A1A7BB] space-y-1 list-decimal list-inside">
                                    <li>Abra o app do seu banco</li>
                                    <li>Escolha pagar com PIX</li>
                                    <li>Escaneie o QR Code ou cole o código</li>
                                    <li>Confirme o pagamento</li>
                                </ol>
                                <p className="text-xs text-[#606E85] dark:text-[#A1A7BB] mt-3">
                                    O saldo será creditado automaticamente após a confirmação.
                                </p>
                            </div>

                            {/* Complete Button */}
                            <button
                                onClick={handleDepositComplete}
                                className="w-full h-[46px] rounded-[10px] border border-black/10 dark:border-white/10 font-semibold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                Já fiz o pagamento
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
