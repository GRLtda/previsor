'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Market, Position } from '@/lib/types'
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

interface SellQuote {
    sharesSold: number
    grossProceeds: number
    exitFee: number
    netProceeds: number
    avgPrice: number
    priceImpact: number
    slippageWarning: boolean
}

export function PredictionPanel({ market, side, onSuccess }: PredictionPanelProps) {
    const router = useRouter()
    const { isAuthenticated, isOtpVerified, user } = useAuth()
    const { openAuthModal } = useAuthModal()

    // ── Mode: buy | sell ──────────────────────────────────────────────
    const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy')

    // ── BUY state ─────────────────────────────────────────────────────
    const [amount, setAmount] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [quote, setQuote] = useState<Quote | null>(null)
    const [isLoadingQuote, setIsLoadingQuote] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showDepositModal, setShowDepositModal] = useState(false)

    // ── SELL state ────────────────────────────────────────────────────
    const [userPosition, setUserPosition] = useState<Position | null>(null)
    const [isLoadingPosition, setIsLoadingPosition] = useState(false)
    const [sellShares, setSellShares] = useState<number>(0)
    const [sellQuote, setSellQuote] = useState<SellQuote | null>(null)
    const [isLoadingSellQuote, setIsLoadingSellQuote] = useState(false)
    const [isSelling, setIsSelling] = useState(false)
    const [showSellSuccess, setShowSellSuccess] = useState(false)

    const amountCents = Math.round(Number.parseFloat(amount || '0') * 100)
    const balance = user?.wallet?.balance || 0
    const balanceFormatted = (balance / 100).toFixed(2)

    // ── Reset when market/side changes ────────────────────────────────
    useEffect(() => {
        setQuote(null)
        setSellQuote(null)
        setSellShares(0)
    }, [market.id, side])

    // ── Fetch user position for sell tab ─────────────────────────────
    const fetchUserPosition = useCallback(async () => {
        if (!isAuthenticated) return
        setIsLoadingPosition(true)
        try {
            const res = await userApi.getPositions({ marketId: market.id, status: 'active' })
            const pos = res.positions.find(p => p.side === side && p.status === 'active')
            setUserPosition(pos || null)
        } catch {
            setUserPosition(null)
        } finally {
            setIsLoadingPosition(false)
        }
    }, [market.id, side, isAuthenticated])

    useEffect(() => {
        if (tradeMode === 'sell') {
            fetchUserPosition()
        }
    }, [tradeMode, fetchUserPosition])

    // ── BUY: Fetch quote (debounced) ──────────────────────────────────
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
    }, [market.id, side, amountCents, market.probYes, market.probNo])

    useEffect(() => {
        const timer = setTimeout(fetchQuote, 2000)
        return () => clearTimeout(timer)
    }, [fetchQuote])

    // ── SELL: Fetch sell quote when sellShares changes (debounced) ────
    const fetchSellQuote = useCallback(async () => {
        if (!userPosition || sellShares <= 0) {
            setSellQuote(null)
            return
        }
        setIsLoadingSellQuote(true)
        try {
            // probYes/probNo are 0-100 percentage, so price per share in reais = prob/100
            const currentPriceCents = side === 'YES' ? market.probYes : market.probNo
            // grossProceeds in centavos: shares * pricePerShare%
            const grossProceeds = Math.round(sellShares * currentPriceCents)
            setSellQuote({
                sharesSold: sellShares,
                grossProceeds,
                exitFee: 0,
                netProceeds: grossProceeds,
                avgPrice: currentPriceCents / 100,
                priceImpact: 0,
                slippageWarning: false,
            })
        } catch {
            setSellQuote(null)
        } finally {
            setIsLoadingSellQuote(false)
        }
    }, [userPosition, sellShares, market.probYes, market.probNo, side])

    useEffect(() => {
        const timer = setTimeout(fetchSellQuote, 600)
        return () => clearTimeout(timer)
    }, [fetchSellQuote])

    // ── BUY submit ────────────────────────────────────────────────────
    const handleBuySubmit = async () => {
        if (!isAuthenticated) { openAuthModal('LOGIN'); return }
        if (!isOtpVerified) {
            toast.error('Você precisa verificar seu telefone antes de abrir posições')
            router.push('/auth/otp')
            return
        }
        if (amountCents < 100) { toast.error('Valor mínimo: R$ 1,00'); return }
        if (amountCents > balance) { toast.error('Saldo insuficiente'); return }

        setIsLoading(true)
        try {
            const response = await userApi.openPosition(market.id, side, amountCents)
            onSuccess?.({
                ...market,
                qYes: response.market.qYes,
                qNo: response.market.qNo,
                liquidityB: response.market.liquidityB,
                probYes: response.market.probYes,
                probNo: response.market.probNo,
            })
            setShowSuccess(true)
        } catch (err) {
            if (err instanceof ApiClientError) toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    // ── SELL submit ───────────────────────────────────────────────────
    const handleSellSubmit = async () => {
        if (!isAuthenticated) { openAuthModal('LOGIN'); return }
        if (!isOtpVerified) {
            toast.error('Você precisa verificar seu telefone antes de vender posições')
            router.push('/auth/otp')
            return
        }
        if (!userPosition) { toast.error('Nenhuma posição encontrada'); return }
        if (sellShares <= 0) { toast.error('Selecione a quantidade de contratos'); return }

        setIsSelling(true)
        try {
            const response = await userApi.closePosition(userPosition.id, sellShares)
            
            // Re-fetch position to update state for partial sales
            await fetchUserPosition()
            
            setSellShares(0)
            setSellQuote(null)
            setShowSellSuccess(true)
            
            onSuccess?.({
                ...market,
                qYes: response.data.market.qYes,
                qNo: response.data.market.qNo,
                liquidityB: response.data.market.liquidityB,
                probYes: response.data.market.probYes,
                probNo: response.data.market.probNo,
            })
        } catch (err) {
            if (err instanceof ApiClientError) toast.error(err.message)
        } finally {
            setIsSelling(false)
        }
    }

    const addAmount = (value: number) => {
        const current = Number.parseFloat(amount || '0')
        setAmount((current + value).toString())
    }

    const setMaxAmount = () => setAmount((balance / 100).toString())

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
        setAmount(rawValue)
    }

    const handleReturn = () => {
        setShowSuccess(false)
        setShowSellSuccess(false)
        setAmount('')
        setQuote(null)
        setSellShares(0)
        setSellQuote(null)
    }

    const setSellPercent = (pct: number) => {
        if (!userPosition) return
        const shares = Math.floor(userPosition.shares * pct)
        setSellShares(shares)
    }

    const handleSellSharesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!userPosition) return
        const val = e.target.value.replace(/[^0-9.]/g, '')
        const num = Number.parseFloat(val || '0')
        if (num > userPosition.shares) {
            setSellShares(userPosition.shares)
        } else {
            setSellShares(num)
        }
    }

    const isYes = side === 'YES'
    const buttonColor = isYes ? 'bg-[#00B471] hover:bg-[#00A366]' : 'bg-[#EE5F67] hover:bg-[#D6555D]'
    const isMarketOpen = market.status === 'open'
    const buttonDisabled = isLoading || amountCents < 100 || !isMarketOpen

    // ── Success screen (buy) ──────────────────────────────────────────
    if (showSuccess || showSellSuccess) {
        return (
            <div className="hidden lg:block w-full max-w-[360px] shrink-0 mt-[20px]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex flex-col border border-border/40 rounded-xl bg-card/50 p-5 max-h-[calc(100vh-200px)] h-auto"
                >
                    <div className="custom-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
                        <div className="h-full">
                            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center lg:min-h-[290px]">
                                <motion.div
                                    initial={{ scale: 0.5, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 15,
                                        delay: 0.1
                                    }}
                                    className="my-3 flex size-[92px] items-center justify-center rounded-full bg-[#0000000D] p-4 dark:bg-[#FFFFFF0D]"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Success" src="/assets/img/success-check.png" />
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="mb-4 text-xl font-bold text-black dark:text-white"
                                >
                                    {showSellSuccess ? 'Venda realizada com sucesso!' : 'Previsão confirmada com sucesso!'}
                                </motion.h2>
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center gap-1 rounded-lg border border-[#0000001A] p-2.5 text-[13px] font-semibold text-[#0C131F] dark:border-[#FFFFFF0D] dark:text-[#FFFFFF]"
                                >
                                    {showSellSuccess ? 'Posição vendida:' : 'Sua Previsão:'}
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
                                </motion.span>
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    onClick={handleReturn}
                                    className="mt-7 w-full rounded-lg bg-[#0091FF] py-3 text-base font-bold text-white hover:bg-[#007ACC] transition-colors"
                                >
                                    Voltar
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>
                <div className="mt-5 hidden text-center text-xs text-[#606E85] dark:text-[#A1A7BB] lg:block">
                    Ao realizar uma previsão, você aceita os <a target="_blank" className="underline" href="/termos">Termos de Serviço</a>.
                </div>
            </div>
        )
    }

    return (
        <div className="hidden lg:block w-full max-w-[360px] shrink-0 mt-[20px]">
            <div className="flex flex-col border border-border/40 rounded-xl bg-card/50 p-5">
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="h-full">
                        <div className="relative size-full">
                            <div className="flex size-full flex-col rounded-2xl">

                                {/* ── Header ── */}
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

                                {/* ── Buy / Sell Tabs ── */}
                                <div className="flex mt-3 rounded-lg bg-black/5 dark:bg-white/5 p-0.5">
                                    <button
                                        onClick={() => setTradeMode('buy')}
                                        className={cn(
                                            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
                                            tradeMode === 'buy'
                                                ? "bg-white dark:bg-white/10 shadow-sm text-black dark:text-white"
                                                : "text-[#606E85] dark:text-[#A1A7BB] hover:text-black dark:hover:text-white"
                                        )}
                                    >
                                        Comprar
                                    </button>
                                    <button
                                        onClick={() => setTradeMode('sell')}
                                        className={cn(
                                            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
                                            tradeMode === 'sell'
                                                ? "bg-white dark:bg-white/10 shadow-sm text-black dark:text-white"
                                                : "text-[#606E85] dark:text-[#A1A7BB] hover:text-black dark:hover:text-white"
                                        )}
                                    >
                                        Vender
                                    </button>
                                </div>

                                {/* ════════════════════════════════════
                                     BUY MODE
                                ════════════════════════════════════ */}
                                {tradeMode === 'buy' && (
                                    <>
                                        <div className="mx-auto mb-2 mt-3 flex w-fit items-center justify-center rounded-lg bg-black/5 px-3 py-1.5 text-xs font-medium dark:bg-white/5 dark:text-white">
                                            Informar Valor
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

                                        {/* Quote Preview */}
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
                                                onClick={amountCents > balance ? () => setShowDepositModal(true) : handleBuySubmit}
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
                                                    !isMarketOpen ? 'Mercado Encerrado' :
                                                        amountCents > balance ? 'Depositar' :
                                                            `${isYes ? 'Sim' : 'Não'} R$ ${amount || '0'}`}
                                            </button>
                                        )}
                                    </>
                                )}

                                {/* ════════════════════════════════════
                                     SELL MODE
                                ════════════════════════════════════ */}
                                {tradeMode === 'sell' && (
                                    <>
                                        {isLoadingPosition ? (
                                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                <span className="text-xs text-muted-foreground">Carregando posição...</span>
                                            </div>
                                        ) : !isAuthenticated ? (
                                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                                <span className="text-sm text-[#606E85] dark:text-[#A1A7BB] text-center">
                                                    Faça login para ver suas posições
                                                </span>
                                                <button
                                                    onClick={() => openAuthModal('LOGIN')}
                                                    className="gap-x-2 flex items-center justify-center transition duration-200 ease-linear outline-none text-base py-2.5 px-5 h-full min-h-12 max-h-12 w-full rounded-[10px] border-transparent font-medium text-white bg-[#00B471] hover:bg-[#00A366]"
                                                >
                                                    Entrar
                                                </button>
                                            </div>
                                        ) : !userPosition ? (
                                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#606E85] dark:text-[#A1A7BB] opacity-40">
                                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span className="text-sm text-[#606E85] dark:text-[#A1A7BB] text-center">
                                                    Você não tem posição ativa em {isYes ? 'Sim' : 'Não'} neste mercado
                                                </span>
                                            </div>
                                        ) : (
                                            <>


                                                <div className="mx-auto mb-2 mt-3 flex w-fit items-center justify-center rounded-lg bg-black/5 px-3 py-1.5 text-xs font-medium dark:bg-white/5 dark:text-white">
                                                    Contratos
                                                </div>

                                                {/* Sell shares input (large) */}
                                                <div className="mt-4 flex w-full flex-col items-center bg-transparent">
                                                    <div className="relative my-1 flex h-14 w-full items-center justify-center rounded-lg bg-transparent p-3 text-lg font-semibold">
                                                        <input
                                                            className="w-full max-w-full text-center bg-transparent font-bold placeholder:text-[#606E85]/30 dark:placeholder:text-white/30 dark:text-white text-[#0C131F]"
                                                            placeholder="0"
                                                            aria-label="input shares"
                                                            inputMode="decimal"
                                                            autoComplete="off"
                                                            spellCheck="false"
                                                            pattern="[0-9.]*"
                                                            type="text"
                                                            value={sellShares > 0 ? sellShares.toString() : ''}
                                                            onChange={handleSellSharesChange}
                                                            style={{ fontSize: '3rem' }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Available Contracts Display (aligned with Buy mode Balance) */}
                                                <div className="flex items-center justify-center mb-4">
                                                    <span className="whitespace-nowrap text-[13px] font-medium dark:text-white">
                                                        <span className="text-[#606E85] dark:text-[#A1A7BB]">Contratos :</span> {userPosition.shares.toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="w-full items-center justify-between gap-x-[7px] flex">
                                                    {[
                                                        { label: '25%', pct: 0.25 },
                                                        { label: '50%', pct: 0.50 },
                                                        { label: 'MAX', pct: 1.0 },
                                                    ].map(({ label, pct }) => (
                                                        <button
                                                            key={label}
                                                            onClick={() => setSellPercent(pct)}
                                                            className={cn(
                                                                "flex w-full h-full max-h-[32px] items-center transition-all duration-100 justify-center rounded-md border py-2 text-xs font-medium dark:text-white",
                                                                sellShares === Math.floor(userPosition.shares * pct)
                                                                    ? "border-[#606E85]/40 bg-black/10 dark:bg-white/10"
                                                                    : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                                                            )}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Sell Quote / Estimated Return */}
                                                {sellShares > 0 && (
                                                    <div className="mt-4 mb-2 flex flex-col items-center justify-center space-y-1 min-h-[70px]">
                                                        {isLoadingSellQuote ? (
                                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                                <span className="text-xs text-muted-foreground">Calculando...</span>
                                                            </div>
                                                        ) : sellQuote ? (
                                                            <>
                                                                <span className="text-sm font-medium text-[#606E85] dark:text-[#A1A7BB]">
                                                                    Retorno Estimado
                                                                </span>
                                                                <span className="text-4xl font-bold text-[#00B471] tracking-tight">
                                                                    R$ {(sellQuote.netProceeds / 100).toFixed(2)}
                                                                </span>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                )}

                                                {/* Sell Button */}
                                                <button
                                                    onClick={handleSellSubmit}
                                                    disabled={isSelling || sellShares <= 0 || !isMarketOpen}
                                                    className={cn(
                                                        "gap-x-2 flex items-center justify-center transition duration-200 ease-linear outline-none text-base py-2.5 px-5 h-full min-h-12 mt-4 max-h-12 w-full rounded-[10px] border-transparent font-bold text-white",
                                                        !isMarketOpen
                                                            ? "cursor-not-allowed bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60"
                                                            : (isSelling || sellShares <= 0)
                                                                ? "cursor-not-allowed bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60"
                                                                : isYes ? "bg-[#00B471] hover:bg-[#00A366]" : "bg-[#EE5F67] hover:bg-[#D6555D]"
                                                    )}
                                                >
                                                    {isSelling ? 'Processando...' :
                                                        !isMarketOpen ? 'Mercado Encerrado' :
                                                            `Vender ${isYes ? 'Sim' : 'Não'}`}
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms */}
                <div className="mt-5 text-center text-xs text-[#606E85] dark:text-[#A1A7BB]">
                    Ao negociar, você concorda com o{' '}
                    <a target="_blank" className="underline" href="/termos">Termos de Uso</a>.
                </div>

                <DepositModal
                    isOpen={showDepositModal}
                    onOpenChange={setShowDepositModal}
                />
            </div>
        </div>
    )
}
