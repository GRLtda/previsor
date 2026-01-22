'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Market } from '@/lib/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthModal } from '@/contexts/auth-modal-context'

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
            const shares = response.data.position.shares
            toast.success(`Posição aberta! Você recebeu ${shares} shares.`)
            onSuccess?.({
                ...market,
                totalPool: response.data.market.totalPool,
                poolYes: response.data.market.poolYes,
                poolNo: response.data.market.poolNo,
                probYes: response.data.market.probYes,
                probNo: response.data.market.probNo,
            })
            setAmount('')
            setQuote(null)
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
        // Part of page layout - NOT fixed, just in the flexbox
        <div className="hidden lg:block w-full max-w-[360px] shrink-0 mt-[20px]">
            <div
                className="flex flex-col border lg:dark:border-none border-black/10 rounded-[20px] bg-white p-5 dark:bg-white/5"
                style={{ boxShadow: '#0000000D 0px 8px 20px' }}
            >
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="h-full">
                        <div className="relative size-full">
                            <div className="flex size-full flex-col rounded-2xl">
                                {/* Header */}
                                <div className="relative flex w-full items-center">
                                    <div className="flex items-center gap-1 w-full rounded-lg border border-black/10 p-2.5 text-xs font-semibold dark:border-white/5 dark:text-white overflow-hidden">
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
                                    <div className="relative my-1 flex h-14 w-full items-center justify-center rounded-lg p-3 text-lg font-semibold">
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

                                {/* Quote Preview */}
                                {quote && amountCents >= 100 && (
                                    <div className="mt-3 space-y-2 rounded-lg border border-black/10 dark:border-white/10 p-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#606E85] dark:text-[#A1A7BB]">Shares:</span>
                                            <span className="font-medium dark:text-white">{quote.shares.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#606E85] dark:text-[#A1A7BB]">Preço Médio:</span>
                                            <span className="font-medium dark:text-white">R$ {quote.avgPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#606E85] dark:text-[#A1A7BB]">Payout Potencial:</span>
                                            <span className="font-medium text-[#00B471]">R$ {(quote.potentialPayout / 100).toFixed(2)}</span>
                                        </div>
                                        {quote.slippageWarning && (
                                            <div className="flex items-center gap-1 text-xs text-amber-500">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <span>Slippage {quote.priceImpact.toFixed(2)}%</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isLoadingQuote && amountCents >= 100 && (
                                    <div className="mt-3 flex justify-center">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#00B471] border-t-transparent"></div>
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
                                        onClick={handleSubmit}
                                        disabled={buttonDisabled}
                                        className={cn(
                                            "gap-x-2 flex items-center justify-center transition duration-200 ease-linear outline-none text-base py-2.5 px-5 h-full min-h-12 mt-4 max-h-12 w-full rounded-[10px] border-transparent font-medium text-white",
                                            buttonDisabled
                                                ? "cursor-not-allowed bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60"
                                                : buttonColor
                                        )}
                                    >
                                        {isLoading ? 'Processando...' : quote ? `${side} ${quote.shares} shares` : `${side}  R$ ${amount || '0'}`}
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
            </div>
        </div>
    )
}
