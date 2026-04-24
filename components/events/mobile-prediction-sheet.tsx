import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Market, Position, QuickRound } from '@/lib/types'
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
    isMultiMarket?: boolean
    isQuickMarket?: boolean
    onSideChange?: (side: 'YES' | 'NO') => void
    quickRound?: QuickRound | null
    onFollowLiveMarket?: () => void
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

export function MobilePredictionSheet({ market, side, open, onClose, onSuccess, isMultiMarket, isQuickMarket, onSideChange, quickRound, onFollowLiveMarket }: MobilePredictionSheetProps) {
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
    const [sellSharesInput, setSellSharesInput] = useState<string>('')
    const sellShares = Number.parseFloat(sellSharesInput || '0')
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
        setShowSuccess(false)
        setShowSellSuccess(false)
        setTradeMode('buy')
        setAmount('')
        setQuote(null)
        setUserPosition(null)
        setSellQuote(null)
        setSellSharesInput('')
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

            setSellSharesInput('')
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
        setSellSharesInput('')
        setSellQuote(null)
        setShowSuccess(false)
        setShowSellSuccess(false)
        onClose()
    }

    const setSellPercent = (pct: number) => {
        if (!userPosition) return
        const val = userPosition.shares * pct
        if (pct === 1.0) {
            setSellSharesInput(val.toString()) // give exact precision to backend
        } else {
            setSellSharesInput((Math.floor(val * 100) / 100).toString()) // floor to 2 digits max
        }
    }

    const handleSellSharesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9.]/g, '')

        // Prevent multiple dots
        const parts = val.split('.')
        if (parts.length > 2) {
            val = parts[0] + '.' + parts.slice(1).join('')
        }

        // Limit to 2 decimals visually
        if (val.includes('.')) {
            const [intPart, decPart] = val.split('.')
            if (decPart && decPart.length > 2) {
                val = `${intPart}.${decPart.slice(0, 2)}`
            }
        }

        const maxSharesStr = (userPosition?.shares || 0).toFixed(2)
        const maxShares = Number.parseFloat(maxSharesStr)
        const num = Number.parseFloat(val || '0')

        if (num > maxShares) {
            setSellSharesInput(maxSharesStr)
        } else {
            setSellSharesInput(val)
        }
    }

    const isYes = side === 'YES'
    const yesLabel = isQuickMarket ? 'Sobe' : 'Sim'
    const noLabel = isQuickMarket ? 'Desce' : 'Não'
    const buttonColor = isYes ? 'bg-[#00B471] hover:bg-[#00A366]' : 'bg-[#EE5F67] hover:bg-[#D6555D]'
    const buttonDisabled = isLoading || amountCents < 100
    const isMarketOpen = market.status === 'open'
    const quickOpenPrice = quickRound?.openPrice ?? 0
    const quickClosePrice = quickRound?.closePrice ?? null
    const quickIsAnnulled = quickRound?.roundStatus === 'annulled' || quickRound?.result === 'ANNULLED'
    const quickMovedUp = quickClosePrice != null ? quickClosePrice > quickOpenPrice : quickRound?.result === 'YES'
    const quickMovedDown = quickClosePrice != null ? quickClosePrice < quickOpenPrice : quickRound?.result === 'NO'
    const quickChange = quickClosePrice != null ? quickClosePrice - quickOpenPrice : 0
    const quickChangePct = quickClosePrice != null && quickOpenPrice > 0
        ? (quickChange / quickOpenPrice) * 100
        : 0

    if (isQuickMarket && quickRound && quickRound.roundStatus !== 'open') {
        const round = quickRound
        const title = quickIsAnnulled
            ? 'Rodada finalizada sem vencedor'
            : quickMovedUp
                ? 'Rodada encerrada acima da abertura'
                : quickMovedDown
                    ? 'Rodada encerrada abaixo da abertura'
                    : 'Rodada finalizada'
        const subtitle = quickIsAnnulled
            ? 'Mercado anulado'
            : quickMovedUp
                ? 'Resultado: Sobe'
                : quickMovedDown
                    ? 'Resultado: Desce'
                    : 'Resultado indisponível'
        const description = quickIsAnnulled
            ? 'Empate no preço ou falha no feed. As posições dessa rodada são reembolsadas.'
            : quickMovedUp
                ? 'O Bitcoin fechou acima do preço inicial desta rodada.'
                : quickMovedDown
                    ? 'O Bitcoin fechou abaixo do preço inicial desta rodada.'
                    : 'Aguardando atualização final do fechamento.'
        const accentClass = quickIsAnnulled
            ? 'text-amber-400'
            : quickMovedUp
                ? 'text-[#00B471]'
                : 'text-[#EE5F67]'
        const badgeClass = quickIsAnnulled
            ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
            : quickMovedUp
                ? 'border-[#00B471]/20 bg-[#00B471]/10 text-[#00D28E]'
                : 'border-[#EE5F67]/20 bg-[#EE5F67]/10 text-[#FF8C93]'

        return (
            <div className="lg:hidden fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div className="absolute bottom-0 left-0 right-0 animate-in slide-in-from-bottom duration-300">
                    <div
                        className="flex flex-col border border-black/10 rounded-t-[20px] bg-white p-5 dark:bg-[#0E1117] max-h-[calc(100vh-100px)]"
                        style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px -8px 20px' }}
                    >
                        <div className="flex items-center justify-end mb-2">
                            <button
                                onClick={onClose}
                                className="flex size-9 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                            >
                                <X className="size-4 text-[#606E85]" />
                            </button>
                        </div>

                        <div className="rounded-[24px] border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
                            <span className={cn('inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]', badgeClass)}>
                                {subtitle}
                            </span>
                            <h2 className="mt-4 text-2xl font-bold text-black dark:text-white">{title}</h2>
                            <p className="mt-3 text-sm leading-relaxed text-[#606E85] dark:text-[#A1A7BB]">{description}</p>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#606E85] dark:text-[#A1A7BB]">Abertura</div>
                                    <div className="mt-1 text-base font-bold text-black dark:text-white">
                                        {round.openPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#606E85] dark:text-[#A1A7BB]">Fechamento</div>
                                    <div className="mt-1 text-base font-bold text-black dark:text-white">
                                        {quickClosePrice != null
                                            ? quickClosePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            : '--'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 rounded-2xl border border-black/10 bg-black/[0.03] px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#606E85] dark:text-[#A1A7BB]">Variação da rodada</div>
                                <div className={cn('mt-1 text-base font-bold', accentClass)}>
                                    {quickClosePrice != null
                                        ? `${quickChange >= 0 ? '+' : ''}${quickChange.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${quickChangePct >= 0 ? '+' : ''}${quickChangePct.toFixed(2)}%`
                                        : '--'}
                                </div>
                            </div>

                            <button
                                onClick={onFollowLiveMarket}
                                className="mt-6 w-full rounded-lg bg-[#0091FF] py-3 text-base font-bold text-white hover:bg-[#007ACC] transition-colors"
                            >
                                Acompanhar Novo Mercado Ao Vivo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

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
                                    <div className={`relative flex w-full items-center ${isMultiMarket ? 'justify-between mb-3' : 'justify-end mb-1'}`}>
                                        {isMultiMarket && (
                                            <div className="flex items-center gap-3 flex-1 pr-4 min-w-0">
                                                {market.imageUrl && (
                                                    <div className="shrink-0 overflow-hidden rounded-[8px] bg-muted flex items-center justify-center size-9">
                                                        <img src={market.imageUrl} alt={market.statement} className="size-full object-cover" />
                                                    </div>
                                                )}
                                                <span className="text-[17px] font-bold dark:text-white truncate">
                                                    {market.statement}
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            onClick={onClose}
                                            className="flex size-9 shrink-0 ml-auto items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                                        >
                                            <X className="size-4 text-[#606E85]" />
                                        </button>
                                    </div>

                                    {/* ── Buy / Sell Tabs ── */}
                                    <div className="flex mt-1 rounded-lg bg-black/5 dark:bg-white/5 p-0.5">
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

                                    {/* ── Sim / Não Selectors ── */}
                                    <div className="flex gap-2 w-full mt-4">
                                        <button
                                            onClick={() => onSideChange?.('YES')}
                                            className={cn(
                                                "flex-1 py-2.5 px-4 rounded-[10px] font-bold text-[15px] transition-all flex items-center justify-between border",
                                                side === 'YES' 
                                                    ? "bg-[#00B471] border-[#00B471] text-white" 
                                                    : "bg-transparent border-black/10 dark:border-white/10 text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <span>{yesLabel}</span>
                                            <span className={side === 'YES' ? "text-white/80" : "text-[#606E85] dark:text-[#A1A7BB]"}>{Math.round(market.probYes)}%</span>
                                        </button>
                                        <button
                                            onClick={() => onSideChange?.('NO')}
                                            className={cn(
                                                "flex-1 py-2.5 px-4 rounded-[10px] font-bold text-[15px] transition-all flex items-center justify-between border",
                                                side === 'NO' 
                                                    ? "bg-[#EE5F67] border-[#EE5F67] text-white" 
                                                    : "bg-transparent border-black/10 dark:border-white/10 text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <span>{noLabel}</span>
                                            <span className={side === 'NO' ? "text-white/80" : "text-[#606E85] dark:text-[#A1A7BB]"}>{Math.round(market.probNo)}%</span>
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
                                            {/* Amount Input & Balance */}
                                            <div className="mt-5 mb-1 flex w-full items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xl font-bold text-foreground dark:text-white">Valor</span>
                                                    <span className="text-[13px] font-medium text-[#606E85] dark:text-[#A1A7BB] mt-0.5 whitespace-nowrap">
                                                        Saldo R${balanceFormatted}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end w-1/2">
                                                    <input
                                                        className="w-full text-right bg-transparent font-bold placeholder:text-[#606E85]/30 dark:placeholder:text-white/20 dark:text-white text-[#0C131F] outline-none"
                                                        placeholder="R$0"
                                                        aria-label="input amount"
                                                        inputMode="decimal"
                                                        autoComplete="off"
                                                        spellCheck="false"
                                                        pattern="[0-9.,]*"
                                                        type="text"
                                                        value={amount ? `R$${amount}` : ''}
                                                        onChange={handleInputChange}
                                                        style={{ fontSize: '2.5rem', lineHeight: '1' }}
                                                    />
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
                                                            `Comprar ${isYes ? yesLabel : noLabel}`}
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
                                                <>
                                                    <div className="mt-5 mb-5 flex w-full items-center justify-between opacity-60">
                                                        <div className="flex flex-col">
                                                            <span className="text-xl font-bold text-foreground dark:text-white">Contratos</span>
                                                            <span className="text-[13px] font-medium text-[#606E85] dark:text-[#A1A7BB] mt-0.5 whitespace-nowrap">
                                                                Disp. 0.00
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-end w-1/2">
                                                            <input
                                                                className="w-full text-right bg-transparent font-bold placeholder:text-[#606E85]/30 dark:placeholder:text-white/20 dark:text-white text-[#0C131F] outline-none"
                                                                placeholder="0"
                                                                aria-label="input shares"
                                                                inputMode="decimal"
                                                                autoComplete="off"
                                                                spellCheck="false"
                                                                pattern="[0-9.]*"
                                                                type="text"
                                                                value=""
                                                                readOnly
                                                                disabled
                                                                style={{ fontSize: '2.5rem', lineHeight: '1' }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="w-full items-center justify-between gap-x-[7px] flex opacity-60">
                                                        {[
                                                            { label: '25%', pct: 0.25 },
                                                            { label: '50%', pct: 0.50 },
                                                            { label: 'MAX', pct: 1.0 },
                                                        ].map(({ label, pct }) => (
                                                            <button
                                                                key={label}
                                                                disabled
                                                                onClick={undefined}
                                                                className="flex w-full h-full max-h-[32px] items-center transition-all duration-100 justify-center rounded-md border border-black/10 dark:border-white/10 py-2 text-xs font-medium dark:text-white bg-black/5 dark:bg-transparent cursor-not-allowed"
                                                            >
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={() => openAuthModal('LOGIN')}
                                                        className="gap-x-2 flex items-center justify-center transition duration-200 ease-linear outline-none text-base py-2.5 px-5 h-full min-h-12 mt-4 max-h-12 w-full rounded-[10px] border-transparent font-medium text-white bg-[#00B471] hover:bg-[#00A366]"
                                                    >
                                                        Entre para vender
                                                    </button>
                                                </>
                                            ) : (
                                                <>


                                                    {/* Contratos Input & Disp */}
                                                    <div className="mt-5 mb-5 flex w-full items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-xl font-bold text-foreground dark:text-white">Contratos</span>
                                                            <span className="text-[13px] font-medium text-[#606E85] dark:text-[#A1A7BB] mt-0.5 whitespace-nowrap">
                                                                Disp. {(userPosition?.shares || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-end w-1/2">
                                                            <input
                                                                className="w-full text-right bg-transparent font-bold placeholder:text-[#606E85]/30 dark:placeholder:text-white/20 dark:text-white text-[#0C131F] outline-none"
                                                                placeholder="0"
                                                                aria-label="input shares"
                                                                inputMode="decimal"
                                                                autoComplete="off"
                                                                spellCheck="false"
                                                                pattern="[0-9.]*"
                                                                type="text"
                                                                value={sellSharesInput}
                                                                onChange={handleSellSharesChange}
                                                                style={{ fontSize: '2.5rem', lineHeight: '1' }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="w-full items-center justify-between gap-x-[7px] flex">
                                                        {[
                                                            { label: '25%', pct: 0.25 },
                                                            { label: '50%', pct: 0.50 },
                                                            { label: 'MAX', pct: 1.0 },
                                                        ].map(({ label, pct }) => {
                                                            const checkVal = pct === 1.0 ? userPosition?.shares?.toString() : Math.floor((userPosition?.shares || 0) * pct * 100) / 100;
                                                            return (
                                                                <button
                                                                    key={label}
                                                                    onClick={userPosition ? () => setSellPercent(pct) : undefined}
                                                                    className={cn(
                                                                        "flex w-full h-full max-h-[32px] items-center transition-all duration-100 justify-center rounded-md border border-black/10 dark:border-white/10 py-2 text-xs font-medium dark:text-white bg-black/5 dark:bg-transparent hover:bg-black/10 dark:hover:bg-white/5",
                                                                        userPosition && sellSharesInput === checkVal?.toString()
                                                                            ? "border-[#606E85]/40 bg-black/10 dark:bg-white/10"
                                                                            : ""
                                                                    )}
                                                                >
                                                                    {label}
                                                                </button>
                                                            );
                                                        })}
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
                                                                `Vender ${isYes ? yesLabel : noLabel}`}
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
                                                        {isYes ? yesLabel : noLabel}
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
