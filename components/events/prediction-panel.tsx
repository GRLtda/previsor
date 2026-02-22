'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Market } from '@/lib/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthModal } from '@/contexts/auth-modal-context'
import { DepositModal } from '@/components/wallet/deposit-modal'

interface PredictionPanelProps {
    market: Market
    side: 'YES' | 'NO'
    onSuccess?: (market: Market) => void
}

interface Quote {
    shares: number
    avgPrice: number
    priceImpact: number
    slippageWarning: boolean
    potentialPayout: number
}

export function PredictionPanel({ market, side, onSuccess }: PredictionPanelProps) {
    const router = useRouter()
    const { isAuthenticated, isOtpVerified, user } = useAuth()
    const { openAuthModal } = useAuthModal()
    const [amount, setAmount] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [quote, setQuote] = useState<Quote | null>(null)
    const [isLoadingQuote, setIsLoadingQuote] = useState(false)

    const amountCents = Math.round(Number.parseFloat(amount || '0') * 100)
    const balance = user?.wallet?.balance || 0
    const balanceFormatted = (balance / 100).toFixed(2)

    const [showSuccess, setShowSuccess] = useState(false)
    const [showDepositModal, setShowDepositModal] = useState(false)

    // Reset amount and quote when market/side changes
    useEffect(() => {
        setAmount('')
        setQuote(null)
    }, [market.id, side])

    // Fetch quote when amount changes (debounced)
    const fetchQuote = useCallback(async () => {
        if (amountCents < 100) {
            setQuote(null)
            return
        }

        setIsLoadingQuote(true)
        try {
            const response = await userApi.getQuote(market.id, side, amountCents)
            setQuote(response.quote)
        } catch {
            setQuote(null)
        } finally {
            setIsLoadingQuote(false)
        }
    }, [market.id, side, amountCents])

    useEffect(() => {
        const timer = setTimeout(fetchQuote, 300)
        return () => clearTimeout(timer)
    }, [fetchQuote])

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
            const shares = response.position.shares
            onSuccess?.({
                ...market,
                qYes: response.market.qYes,
                qNo: response.market.qNo,
                liquidityB: response.market.liquidityB,
                probYes: response.market.probYes,
                probNo: response.market.probNo,
            })
            setShowSuccess(true)
            // setAmount('') // Keep amount until return? Or clear? Return clears it.
            // setQuote(null)
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

    // Handle return from success screen
    const handleReturn = () => {
        setShowSuccess(false)
        setAmount('')
        setQuote(null)
    }

    const isYes = side === 'YES'
    const buttonColor = isYes ? 'bg-[#00B471] hover:bg-[#00A366]' : 'bg-[#EE5F67] hover:bg-[#D6555D]'
    const buttonDisabled = isLoading || amountCents < 100

    if (showSuccess) {
        return (
            <div className="hidden lg:block w-full max-w-[360px] shrink-0 mt-[20px]">
                <div className="flex flex-col border border-border/40 rounded-xl bg-card/50 p-5 max-h-[calc(100vh-200px)] h-auto animate-in zoom-in-95 fade-in duration-300">
                    <div className="custom-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
                        <div className="h-full" style={{ willChange: 'auto', opacity: 1, transform: 'none' }}>
                            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center lg:min-h-[290px]">
                                <div className="my-3 flex size-[92px] items-center justify-center rounded-full bg-[#0000000D] p-4 dark:bg-[#FFFFFF0D]" style={{ willChange: 'transform', transform: 'scale(1.03663)' }}>
                                    {/* Using standard img for now as asset path is in public */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Success" src="/assets/img/success-check.png" />
                                </div>
                                <h2 className="mb-4 text-xl font-bold text-black dark:text-white">Previsão confirmada com sucesso!</h2>
                                <span className="flex items-center gap-1 rounded-lg border border-[#0000001A] p-2.5 text-[13px] font-semibold text-[#0C131F] dark:border-[#FFFFFF0D] dark:text-[#FFFFFF]">
                                    Sua Previsão:
                                    <span className={cn("flex items-center justify-center gap-[2px]", isYes ? "text-[#00B471]" : "text-[#EE5F67]")}>
                                        {isYes ? (
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 11C8.75 11 11 8.75 11 6C11 3.25 8.75 1 6 1C3.25 1 1 3.25 1 6C1 8.75 3.25 11 6 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                                                <path d="M3.875 5.99996L5.29 7.41496L8.125 4.58496" stroke="currentColor" strokeWidth="1.03571" strokeLinecap="round" strokeLinejoin="round"></path>
                                            </svg>
                                        ) : (
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 11C8.75 11 11 8.75 11 6C11 3.25 8.75 1 6 1C3.25 1 1 3.25 1 6C1 8.75 3.25 11 6 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                                                <path d="M4.58496 7.41496L7.41496 4.58496" stroke="currentColor" strokeWidth="1.03571" strokeLinecap="round" strokeLinejoin="round"></path>
                                                <path d="M7.41496 7.41496L4.58496 4.58496" stroke="currentColor" strokeWidth="0.776786" strokeLinecap="round" strokeLinejoin="round"></path>
                                            </svg>
                                        )}
                                        {isYes ? 'Sim' : 'Não'}
                                    </span>
                                </span>
                                <button
                                    onClick={handleReturn}
                                    className="mt-7 w-full rounded-lg bg-[#0091FF] py-3 text-base font-bold text-white hover:bg-[#007ACC] transition-colors"
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-5 hidden text-center text-xs text-[#606E85] dark:text-[#A1A7BB] lg:block">
                    Ao realizar uma previsão, você aceita os <a target="_blank" className="underline" href="/termos">Termos de Serviço</a>.
                </div>
            </div>
        )
    }

    return (
        // Part of page layout - NOT fixed, just in the flexbox
        <div className="hidden lg:block w-full max-w-[360px] shrink-0 mt-[20px]">
            <div
                className="flex flex-col border border-border/40 rounded-xl bg-card/50 p-5"
            >
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="h-full">
                        <div className="relative size-full">
                            <div className="flex size-full flex-col rounded-2xl">
                                {/* Header */}
                                <div className="relative flex w-full items-center">
                                    <div className="flex items-center gap-1 w-full rounded-lg bg-black/5 dark:bg-white/5 p-2.5 text-xs font-semibold dark:text-white overflow-hidden">
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
                                </div>

                                {/* Step Label */}
                                <div className="mx-auto mb-2 mt-3 flex w-fit items-center justify-center rounded-lg bg-black/5 px-3 py-1.5 text-xs font-medium dark:bg-white/5 dark:text-white">
                                    2. Digite um Valor
                                </div>

                                {/* Amount Input */}
                                <div className="mt-3 flex w-full flex-col items-center bg-transparent">
                                    <div className="relative my-1 flex h-14 w-full items-center justify-center rounded-lg bg-transparent p-3 text-lg font-semibold">
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

                                {/* Balance Display */}
                                <div className="flex items-center justify-center">
                                    <span className="whitespace-nowrap text-[13px] font-medium dark:text-white">
                                        <span className="text-[#606E85] dark:text-[#A1A7BB]">Saldo :</span> R${balanceFormatted}
                                    </span>
                                </div>

                                {/* Quote Preview - Simplified "To Win" Style */}
                                {(quote || isLoadingQuote) && amountCents >= 100 && (
                                    <div className="mt-4 mb-2 flex flex-col items-center justify-center space-y-1 min-h-[100px]">
                                        {isLoadingQuote ? (
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                <span className="text-xs text-muted-foreground">Calculando...</span>
                                            </div>
                                        ) : quote ? (
                                            <>
                                                <span className="text-sm font-medium text-[#606E85] dark:text-[#A1A7BB]">
                                                    Retorno Estimado
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-4xl font-bold text-[#00B471] tracking-tight">
                                                        R$ {(quote.potentialPayout / 100).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-[#606E85] dark:text-[#A1A7BB] mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <span>Preço Médio:</span>
                                                        <span className="font-medium text-black dark:text-white">
                                                            R$ {quote.avgPrice.toFixed(2)}
                                                        </span>
                                                    </span>
                                                    {quote.slippageWarning && (
                                                        <span className="text-amber-500 font-medium">
                                                            • Slippage {quote.priceImpact.toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                )}

                                {/* Quick Amount Buttons */}
                                <div className="w-full items-center gap-x-1 flex">
                                    <div className="w-full items-center justify-between gap-x-[7px] pt-4 flex">
                                        {[10, 20, 50, 100].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => addAmount(val)}
                                                className="flex w-full h-full max-h-[32px] items-center transition-all duration-100 justify-center rounded-md border border-black/10 dark:border-white/10 py-2 text-xs font-medium dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                            >
                                                +R${val}
                                            </button>
                                        ))}
                                        <button
                                            onClick={setMaxAmount}
                                            className="flex w-full h-full max-h-[32px] items-center transition-all duration-100 justify-center rounded-md border border-black/10 dark:border-white/10 py-2 text-xs font-medium dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                        >
                                            MAX
                                        </button>
                                    </div>
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
                                        onClick={amountCents > balance ? () => setShowDepositModal(true) : handleSubmit}
                                        disabled={buttonDisabled && !(amountCents > balance)}
                                        className={cn(
                                            "gap-x-2 flex items-center justify-center transition duration-200 ease-linear outline-none text-base py-2.5 px-5 h-full min-h-12 mt-4 max-h-12 w-full rounded-[10px] border-transparent font-bold text-white",
                                            amountCents > balance
                                                ? "bg-brand hover:bg-brand/90"
                                                : buttonDisabled
                                                    ? "cursor-not-allowed bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60"
                                                    : buttonColor
                                        )}
                                    >
                                        {isLoading ? 'Processando...' :
                                            amountCents > balance ? 'Depositar' :
                                                `${isYes ? 'Sim' : 'Não'} R$ ${amount || '0'}`}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms */}
                <div className="mt-5 text-center text-xs text-[#606E85] dark:text-[#A1A7BB]">
                    Ao realizar uma previsão, você aceita os{' '}
                    <a target="_blank" className="underline" href="/termos">Termos de Serviço</a>.
                </div>

                <DepositModal
                    isOpen={showDepositModal}
                    onOpenChange={setShowDepositModal}
                />
            </div>
        </div>
    )
}
