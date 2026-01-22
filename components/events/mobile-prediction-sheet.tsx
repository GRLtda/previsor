'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Market } from '@/lib/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useAuthModal } from '@/contexts/auth-modal-context'

interface MobilePredictionSheetProps {
    market: Market | null
    side: 'YES' | 'NO'
    open: boolean
    onClose: () => void
    onSuccess?: (market: Market) => void
}

export function MobilePredictionSheet({ market, side, open, onClose, onSuccess }: MobilePredictionSheetProps) {
    const router = useRouter()
    const { isAuthenticated, isOtpVerified, user } = useAuth()
    const { openAuthModal } = useAuthModal()
    const [amount, setAmount] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const amountCents = Math.round(Number.parseFloat(amount || '0') * 100)
    const balance = user?.wallet?.balance || 0
    const balanceFormatted = (balance / 100).toFixed(2)

    // Reset amount when market/side changes
    useEffect(() => {
        setAmount('')
    }, [market?.id, side])

    if (!market || !open) return null

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            openAuthModal('LOGIN')
            return
        }

        if (!isOtpVerified) {
            toast.error('Você precisa verificar seu telefone antes de abrir posições')
            router.push('/auth/otp')
            return
        }

        if (amountCents < 100) {
            toast.error('Valor mínimo: R$ 1,00')
            return
        }

        if (amountCents > balance) {
            toast.error('Saldo insuficiente')
            return
        }

        setIsLoading(true)
        try {
            const response = await userApi.openPosition(market.id, side, amountCents)
            toast.success('Posição aberta com sucesso!')
            onSuccess?.({
                ...market,
                totalPool: response.data.market.totalPool,
                poolYes: response.data.market.poolYes,
                poolNo: response.data.market.poolNo,
                probYes: response.data.market.probYes,
                probNo: response.data.market.probNo,
            })
            setAmount('')
            onClose()
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error(err.message)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const addAmount = (value: number) => {
        const current = Number.parseFloat(amount || '0')
        setAmount((current + value).toString())
    }

    const setMaxAmount = () => {
        setAmount((balance / 100).toString())
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
        setAmount(rawValue)
    }

    const isYes = side === 'YES'
    const buttonColor = isYes ? 'bg-[#00B471] hover:bg-[#00A366]' : 'bg-[#EE5F67] hover:bg-[#D6555D]'
    const buttonDisabled = isLoading || amountCents < 100

    return (
        <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="absolute bottom-0 left-0 right-0 animate-in slide-in-from-bottom duration-300">
                <div
                    className="flex flex-col border border-black/10 rounded-t-[20px] bg-white p-5 dark:bg-[#0E1117] max-h-[calc(100vh-100px)]"
                    style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px -8px 20px' }}
                >
                    <div className="custom-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
                        <div className="h-full">
                            <div className="relative size-full">
                                <div className="flex size-full flex-col rounded-2xl">
                                    {/* Header with Close */}
                                    <div className="relative flex w-full items-center justify-between">
                                        <div className="flex items-center gap-1 flex-1 rounded-lg border border-black/10 p-2.5 text-xs font-semibold dark:border-white/5 dark:text-white overflow-hidden">
                                            <span className="shrink-0">Sua Previsão:</span>
                                            <span className={cn(
                                                "flex items-center gap-[2px] min-w-0",
                                                isYes ? "text-[#00B471]" : "text-[#EE5F67]"
                                            )}>
                                                {isYes ? (
                                                    <svg className="shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M6 11C8.75 11 11 8.75 11 6C11 3.25 8.75 1 6 1C3.25 1 1 3.25 1 6C1 8.75 3.25 11 6 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M3.875 5.99996L5.29 7.41496L8.125 4.58496" stroke="currentColor" strokeWidth="1.03571" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                ) : (
                                                    <svg className="shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M6 11C8.75 11 11 8.75 11 6C11 3.25 8.75 1 6 1C3.25 1 1 3.25 1 6C1 8.75 3.25 11 6 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M4.58496 7.41496L7.41496 4.58496" stroke="currentColor" strokeWidth="1.03571" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M7.41496 7.41496L4.58496 4.58496" stroke="currentColor" strokeWidth="0.776786" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                                <span className="truncate">{market.statement}</span>
                                            </span>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="flex size-9 shrink-0 ml-2 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                                        >
                                            <X className="size-4 text-[#606E85]" />
                                        </button>
                                    </div>

                                    {/* Step Label */}
                                    <div className="mx-auto mb-2 mt-3 flex w-fit items-center justify-center rounded-lg bg-black/5 px-3 py-1.5 text-xs font-medium dark:bg-white/5 dark:text-white">
                                        2. Digite um Valor
                                    </div>

                                    {/* Amount Input */}
                                    <div className="mt-4 flex w-full flex-col items-center bg-transparent">
                                        <div className="relative my-3 flex h-14 w-full items-center justify-center rounded-lg p-3 text-lg font-semibold">
                                            <div className="flex w-full flex-col items-center justify-center">
                                                <div className="relative flex w-full items-center justify-center">
                                                    <input
                                                        className="w-full max-w-full text-center bg-transparent font-bold placeholder:text-[#606E85]/30 dark:placeholder:text-white/30 dark:text-white text-[#0C131F]"
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

                                    {/* Quick Amount Buttons - Mobile */}
                                    <div className="w-full items-center gap-x-1 flex">
                                        <div className="w-full items-center justify-between gap-x-[7px] pt-4 flex">
                                            {[10, 20, 50, 100].map((val) => (
                                                <button
                                                    key={val}
                                                    onClick={() => addAmount(val)}
                                                    className="flex w-full h-full max-h-[32px] items-center transition-all duration-100 justify-center rounded-md border border-black/10 dark:border-white/10 py-2 text-xs font-medium dark:text-white bg-black/5 dark:bg-transparent hover:bg-black/10 dark:hover:bg-white/5"
                                                >
                                                    +R${val}
                                                </button>
                                            ))}
                                            <button
                                                onClick={setMaxAmount}
                                                className="flex w-full h-full max-h-[32px] items-center transition-all duration-100 justify-center rounded-md border border-black/10 dark:border-white/10 py-2 text-xs font-medium dark:text-white bg-black/5 dark:bg-transparent hover:bg-black/10 dark:hover:bg-white/5"
                                            >
                                                MAX
                                            </button>
                                        </div>
                                    </div>

                                    {/* Balance Display - Mobile */}
                                    <div className="mt-4 flex min-h-[38px] w-full flex-row items-center justify-between rounded-[10px] border border-black/10 px-[13px] dark:border-white/10">
                                        <span className="flex items-center text-[13px] font-medium text-[#606E85] dark:text-[#A1A7BB]">
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-[6px] size-[18px]">
                                                <path d="M8.66254 2.30416V4.52083H7.78754V2.30416C7.78754 2.14666 7.64754 2.07083 7.55421 2.07083C7.52504 2.07083 7.49587 2.07666 7.46671 2.08833L2.84087 3.8325C2.53171 3.94917 2.33337 4.24083 2.33337 4.57333V4.96416C1.80254 5.36083 1.45837 5.99666 1.45837 6.71417V4.57333C1.45837 3.87916 1.88421 3.26083 2.53171 3.01583L7.16337 1.26583C7.29171 1.21916 7.42587 1.19583 7.55421 1.19583C8.13754 1.19583 8.66254 1.66833 8.66254 2.30416Z" fill="#606E85" />
                                                <path d="M12.5417 8.45833V9.04166C12.5417 9.19916 12.4192 9.3275 12.2559 9.33333H11.4042C11.0951 9.33333 10.8151 9.10583 10.7917 8.8025C10.7742 8.62166 10.8442 8.4525 10.9609 8.33583C11.0659 8.225 11.2117 8.16666 11.3692 8.16666H12.2501C12.4192 8.1725 12.5417 8.30083 12.5417 8.45833Z" fill="#606E85" />
                                                <path d="M11.3634 7.55417H11.9584C12.2792 7.55417 12.5417 7.29167 12.5417 6.97084V6.71417C12.5417 5.50667 11.5559 4.52084 10.3484 4.52084H3.65171C3.15587 4.52084 2.70087 4.68417 2.33337 4.96417C1.80254 5.36084 1.45837 5.99667 1.45837 6.71417V10.64C1.45837 11.8475 2.44421 12.8333 3.65171 12.8333H10.3484C11.5559 12.8333 12.5417 11.8475 12.5417 10.64V10.5292C12.5417 10.2083 12.2792 9.94584 11.9584 9.94584H11.4509C10.8909 9.94584 10.3542 9.60167 10.2084 9.05917C10.0859 8.61584 10.2317 8.19 10.5234 7.90417C10.7392 7.6825 11.0367 7.55417 11.3634 7.55417ZM8.16671 7.4375H4.08337C3.84421 7.4375 3.64587 7.23917 3.64587 7C3.64587 6.76084 3.84421 6.5625 4.08337 6.5625H8.16671C8.40587 6.5625 8.60421 6.76084 8.60421 7C8.60421 7.23917 8.40587 7.4375 8.16671 7.4375Z" fill="#606E85" />
                                            </svg>
                                            Saldo
                                        </span>
                                        <span className="text-[13px] font-medium text-[#606E85] dark:text-[#A1A7BB]">
                                            R${balanceFormatted}
                                        </span>
                                    </div>

                                    {/* Submit Button */}
                                    {!isAuthenticated ? (
                                        <button
                                            onClick={() => openAuthModal('LOGIN')}
                                            className="gap-x-2 flex items-center justify-center transition duration-200 ease-linear outline-none text-base py-2.5 px-5 h-full min-h-12 mt-4 max-h-12 w-full rounded-[10px] border-transparent font-medium text-white bg-[#00B471] hover:bg-[#00A366]"
                                        >
                                            Entre para Prever
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={buttonDisabled}
                                            className={cn(
                                                "gap-x-2 flex items-center justify-center transition duration-200 ease-linear outline-none text-base py-2.5 px-5 h-full min-h-12 mt-4 max-h-12 w-full rounded-[10px] border-transparent font-medium text-white",
                                                buttonDisabled
                                                    ? "cursor-not-allowed bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60"
                                                    : buttonColor
                                            )}
                                        >
                                            {isLoading ? 'Processando...' : `${side}  R$ ${amount || '0'}`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
