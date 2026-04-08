import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Market, Position } from '@/lib/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useAuthModal } from '@/contexts/auth-modal-context'
import { DepositModal } from '@/components/wallet/deposit-modal'

interface MobilePredictionSheetProps {
    market: Market | null
    side: 'YES' | 'NO'
    open: boolean
    onClose: () => void
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
}

export function MobilePredictionSheet({ market, side, open, onClose, onSuccess }: MobilePredictionSheetProps) {
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
    const [showDepositModal, setShowDepositModal] = useState(false)

    // ── SELL state ────────────────────────────────────────────────────
    const [userPosition, setUserPosition] = useState<Position | null>(null)
    const [isLoadingPosition, setIsLoadingPosition] = useState(false)
    const [sellShares, setSellShares] = useState<number>(0)
    const [sellQuote, setSellQuote] = useState<SellQuote | null>(null)
    const [isLoadingSellQuote, setIsLoadingSellQuote] = useState(false)
    const [isSelling, setIsSelling] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showSellSuccess, setShowSellSuccess] = useState(false)

    const amountCents = Math.round(Number.parseFloat(amount || '0') * 100)
    const balance = user?.wallet?.balance || 0
    const balanceFormatted = (balance / 100).toFixed(2)

    // ── Reset when market/side/open changes ───────────────────────────
    useEffect(() => {
        setQuote(null)
        setSellQuote(null)
        setSellShares(0)
    }, [market?.id, side])

    // ── Reset mode when sheet closes ──────────────────────────────────
    useEffect(() => {
        if (!open) {
            setTradeMode('buy')
            setShowSuccess(false)
            setShowSellSuccess(false)
        }
    }, [open])

    // ── Fetch user position for sell tab ─────────────────────────────
    const fetchUserPosition = useCallback(async () => {
        if (!market || !isAuthenticated) return
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
    }, [market, side, isAuthenticated])

    useEffect(() => {
        if (tradeMode === 'sell' && open) {
            fetchUserPosition()
        }
    }, [tradeMode, open, fetchUserPosition])

    // ── BUY: Fetch quote (debounced) ──────────────────────────────────
    const fetchQuote = useCallback(async () => {
        if (!market || amountCents < 100) {
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
    }, [market, side, amountCents])

    useEffect(() => {
        const timer = setTimeout(fetchQuote, 2000)
        return () => clearTimeout(timer)
    }, [fetchQuote])

    // ── SELL: Estimate proceeds from shares ───────────────────────────
    const fetchSellQuote = useCallback(async () => {
        if (!market || !userPosition || sellShares <= 0) {
            setSellQuote(null)
            return
        }
        setIsLoadingSellQuote(true)
        try {
            // probYes/probNo are 0-100 percentage, price per share in centavos = prob
            const currentPriceCents = side === 'YES' ? market.probYes : market.probNo
            const grossProceeds = Math.round(sellShares * currentPriceCents)
            setSellQuote({
                sharesSold: sellShares,
                grossProceeds,
                exitFee: 0,
                netProceeds: grossProceeds,
                avgPrice: currentPriceCents / 100,
                priceImpact: 0,
            })
        } catch {
            setSellQuote(null)
        } finally {
            setIsLoadingSellQuote(false)
        }
    }, [market, userPosition, sellShares, side])

    useEffect(() => {
        const timer = setTimeout(fetchSellQuote, 600)
        return () => clearTimeout(timer)
    }, [fetchSellQuote])

    if (!market || !open) return null

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
            toast.success('Posição aberta com sucesso!')
            onSuccess?.({
                ...market,
                qYes: response.market.qYes,
                qNo: response.market.qNo,
                liquidityB: response.market.liquidityB,
                probYes: response.market.probYes,
                probNo: response.market.probNo,
            })
            setAmount('')
            setQuote(null)
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
        setAmount(rawValue)
    }

    const addAmount = (value: number) => {
        const current = Number.parseFloat(amount || '0')
        setAmount((current + value).toString())
    }

    const setMaxAmount = () => setAmount((balance / 100).toString())

    const handleReturn = () => {
        setAmount('')
        setQuote(null)
        setSellShares(0)
        setSellQuote(null)
        setShowSuccess(false)
        setShowSellSuccess(false)
        onClose()
    }

    const setSellPercent = (pct: number) => {
        if (!userPosition) return
        setSellShares(Math.floor(userPosition.shares * pct))
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
    const buttonDisabled = isLoading || amountCents < 100
    const isMarketOpen = market.status === 'open'

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
                                            {/* Step Label */}
                                            <div className="mx-auto mb-2 mt-3 flex w-fit items-center justify-center rounded-lg bg-black/5 px-3 py-1.5 text-xs font-medium dark:bg-white/5 dark:text-white">
                                            Informar Valor
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


                                                    {/* Quotas label */}
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

                                                    {/* Available Contracts Display (aligned with Buy mode Balance - Mobile style) */}
                                                    <div className="mb-4 flex min-h-[38px] w-full flex-row items-center justify-between rounded-[10px] border border-black/10 px-[13px] dark:border-white/10">
                                                        <span className="flex items-center text-[13px] font-medium text-[#606E85] dark:text-[#A1A7BB]">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-[6px] size-[18px]">
                                                                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            Contratos
                                                        </span>
                                                        <span className="text-[13px] font-medium text-[#606E85] dark:text-[#A1A7BB]">
                                                            {userPosition.shares.toFixed(2)}
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
                                                                    "flex w-full h-full max-h-[32px] items-center transition-all duration-100 justify-center rounded-md border border-black/10 dark:border-white/10 py-2 text-xs font-medium dark:text-white bg-black/5 dark:bg-transparent hover:bg-black/10 dark:hover:bg-white/5",
                                                                    sellShares === Math.floor(userPosition!.shares * pct)
                                                                        ? "border-[#606E85]/40 bg-black/10 dark:bg-white/10"
                                                                        : ""
                                                                )}
                                                            >
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Sell Quote */}
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

                                    {/* Terms */}
                                    <div className="mt-4 text-center text-xs text-[#606E85] dark:text-[#A1A7BB]">
                                        Ao negociar, você concorda com o{' '}
                                        <a target="_blank" className="underline" href="/termos">Termos de Uso</a>.
                                    </div>

                                    {/* Success Screen Logic */}
                                    <AnimatePresence>
                                        {(showSuccess || showSellSuccess) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 50 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 50 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white text-center dark:bg-[#0E1117]"
                                            >
                                                <motion.div
                                                    initial={{ scale: 0.5, rotate: -10 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
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
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DepositModal
                    isOpen={showDepositModal}
                    onOpenChange={setShowDepositModal}
                />
            </div>
        </div>
    )
}
