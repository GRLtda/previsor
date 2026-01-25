'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Event, Market } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronDown, Star, Link as LinkIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import Link from 'next/link'
import { MarketCardTriad } from '@/components/events/market-card-triad'
import { CountdownTimer } from '@/components/events/countdown-timer'
import { PredictionPanel } from '@/components/events/prediction-panel'
import { MobilePredictionSheet } from '@/components/events/mobile-prediction-sheet'
import { PlaceholderIcon } from '@/components/ui/placeholder-icon'

interface PageProps {
  params: Promise<{ slug: string }>
}

function formatVolume(amount: number): string {
  const value = amount / 100
  if (value >= 1000000) {
    return `R$${(value / 1000000).toFixed(1)}m`
  }
  if (value >= 1000) {
    return `R$${(value / 1000).toFixed(0)}k`
  }
  return `R$${value.toFixed(2)}`
}

export default function EventDetailPage({ params }: PageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>('YES')
  const [showFullRules, setShowFullRules] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchEvent() {
      setIsLoading(true)
      try {
        const fetchedEvent = await userApi.getEvent(slug)
        setEvent(fetchedEvent)

        // Params Handling
        const paramMarketId = searchParams.get('marketId')
        const paramSide = searchParams.get('side') as 'YES' | 'NO' | null

        if (fetchedEvent.markets && fetchedEvent.markets.length > 0) {
          let defaultMarket = fetchedEvent.markets[0]

          if (paramMarketId) {
            const found = fetchedEvent.markets.find(m => m.id === paramMarketId)
            if (found) defaultMarket = found
          }

          setSelectedMarket(defaultMarket)
          if (paramSide === 'YES' || paramSide === 'NO') {
            setSelectedSide(paramSide)
          } else {
            setSelectedSide('YES')
          }
        }

        // Check if event is favorited (only if user is logged in)
        try {
          const favResponse = await userApi.getFavorites({ limit: 100 })
          const isFav = favResponse.data.favorites.some(f => f.id === fetchedEvent.id)
          setIsFavorite(isFav)
        } catch {
          // User not logged in or error - ignore
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          toast.error(err.message)
          if (err.code === 'RESOURCE_NOT_FOUND') {
            router.push('/eventos')
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvent()
  }, [slug, router, searchParams])

  // ESC hotkey to go back to events list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea or if a modal is open
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Check if any dialog/modal is open
      const hasOpenModal = document.querySelector('[role="dialog"]')
      if (hasOpenModal) {
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        router.push('/eventos')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const handleMarketUpdate = (updatedMarket: Market) => {
    if (event) {
      setEvent({
        ...event,
        markets: event.markets?.map((m) =>
          m.id === updatedMarket.id ? { ...m, ...updatedMarket } : m
        ),
      })
    }
  }

  const handleSelectPrediction = (market: Market, side: 'YES' | 'NO') => {
    setSelectedMarket(market)
    setSelectedSide(side)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copiado!')
  }

  const handleFavoriteToggle = async () => {
    if (!event || isFavoriteLoading) return

    setIsFavoriteLoading(true)
    try {
      const response = await userApi.toggleFavorite(event.id)
      setIsFavorite(response.data.isFavorite)
      toast.success(response.data.isFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos')
    } catch {
      toast.error('Erro ao atualizar favorito')
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="relative z-10 mx-auto flex w-full bg-white py-0 dark:bg-transparent lg:gap-x-[26px] lg:p-2.5">
        <div className="flex w-full flex-col lg:max-w-[calc(100%-380px)] px-4">
          <Skeleton className="h-8 w-32 mb-8 mt-6" />
          <div className="flex gap-4 items-start mb-6">
            <Skeleton className="size-20 rounded-2xl" />
            <Skeleton className="h-10 w-3/4" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  /* Volume calculation to be implemented for LMSR. Using 0 for now or liquidityB as placeholder? */
  const totalVolume = 0 // event.markets?.reduce((acc, m) => acc + (m.liquidityB || 0), 0) || 0
  const closestMarketClose = event.markets?.length
    ? new Date(Math.min(...event.markets.map(m => new Date(m.closesAt).getTime())))
    : new Date(event.endsAt)

  return (
    <div className="relative z-10 mx-auto flex w-full bg-white py-0 dark:bg-transparent lg:gap-x-[26px] lg:p-2.5">
      <div className="flex w-full flex-col lg:max-w-[calc(100%-380px)] px-4">
        {/* Back Button - Desktop */}
        <Link
          href="/eventos"
          className="mb-4 mt-5 hidden items-center justify-center rounded-lg bg-black/5 hover:bg-black/[8%] dark:bg-white/5 hover:dark:bg-white/[8%] lg:flex lg:h-8 lg:w-[110px] transition-all duration-200"
        >
          <div className="flex items-center gap-x-1.5">
            <div className="flex items-center gap-x-1">
              <ChevronLeft className="size-4" strokeWidth={2} />
              <span className="text-xs font-medium dark:text-[#A1A7BB]">Voltar</span>
            </div>
            <div className="flex h-4 w-8 items-center justify-center rounded bg-white text-[10px] font-medium dark:bg-white/5 dark:text-[#A1A7BB]">
              ESC
            </div>
          </div>
        </Link>

        {/* Header - Desktop */}
        <div className="hidden lg:flex flex-row w-full items-center justify-between mt-4 lg:mt-0">
          <div className="hidden transform-gpu items-center gap-4 lg:flex">
            {/* Event Image */}
            <div className="size-20 rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
              {event.imageUrl && !imageError ? (
                <img
                  alt={event.title}
                  src={event.imageUrl}
                  className="size-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <PlaceholderIcon size={80} />
              )}
            </div>
            {/* Title */}
            <span className="flex items-center justify-center gap-3 font-semibold dark:text-white" style={{ fontSize: '30px' }}>
              {event.title}
            </span>
          </div>
        </div>

        {/* Mobile Header with Image */}
        <div className="relative block h-[200px] w-full lg:hidden -mx-4">
          <div className="absolute top-1 flex w-full items-center justify-between p-2.5 z-10">
            <Link
              href="/eventos"
              className="flex size-9 items-center justify-center rounded-full bg-white shadow-sm shadow-black/25"
            >
              <ChevronLeft className="size-5" />
            </Link>
          </div>
          <div className="w-full h-full bg-muted flex items-center justify-center">
            {event.imageUrl && !imageError ? (
              <img
                alt={event.title}
                className="w-full h-full object-cover object-top"
                src={event.imageUrl}
                onError={() => setImageError(true)}
              />
            ) : (
              <PlaceholderIcon size={120} />
            )}
          </div>
        </div>

        {/* Badges Row */}
        <div className="hidden flex-wrap items-center gap-2 sm:gap-x-2 lg:flex mt-4">
          {/* Official Badge */}
          <div className="flex items-center gap-1 h-6 rounded bg-blue-500/10 text-blue-500 dark:text-white pr-2 pl-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="8" height="9" fill="white" />
              <path d="M14.1163 6.42625C13.8806 6.18 13.6369 5.92625 13.545 5.70312C13.46 5.49875 13.455 5.16 13.45 4.83187C13.4406 4.22187 13.4306 3.53062 12.95 3.05C12.4694 2.56937 11.7781 2.55937 11.1681 2.55C10.84 2.545 10.5013 2.54 10.2969 2.455C10.0744 2.36312 9.82 2.11937 9.57375 1.88375C9.1425 1.46937 8.6525 1 8 1C7.3475 1 6.85812 1.46937 6.42625 1.88375C6.18 2.11937 5.92625 2.36312 5.70312 2.455C5.5 2.54 5.16 2.545 4.83187 2.55C4.22187 2.55937 3.53062 2.56937 3.05 3.05C2.56937 3.53062 2.5625 4.22187 2.55 4.83187C2.545 5.16 2.54 5.49875 2.455 5.70312C2.36312 5.92562 2.11937 6.18 1.88375 6.42625C1.46937 6.8575 1 7.3475 1 8C1 8.6525 1.46937 9.14187 1.88375 9.57375C2.11937 9.82 2.36312 10.0737 2.455 10.2969C2.54 10.5013 2.545 10.84 2.55 11.1681C2.55937 11.7781 2.56937 12.4694 3.05 12.95C3.53062 13.4306 4.22187 13.4406 4.83187 13.45C5.16 13.455 5.49875 13.46 5.70312 13.545C5.92562 13.6369 6.18 13.8806 6.42625 14.1163C6.8575 14.5306 7.3475 15 8 15C8.6525 15 9.14187 14.5306 9.57375 14.1163C9.82 13.8806 10.0737 13.6369 10.2969 13.545C10.5013 13.46 10.84 13.455 11.1681 13.45C11.7781 13.4406 12.4694 13.4306 12.95 12.95C13.4306 12.4694 13.4406 11.7781 13.45 11.1681C13.455 10.84 13.46 10.5013 13.545 10.2969C13.6369 10.0744 13.8806 9.82 14.1163 9.57375C14.5306 9.1425 15 8.6525 15 8C15 7.3475 14.5306 6.85812 14.1163 6.42625ZM10.8538 6.85375L7.35375 10.3538C7.30731 10.4002 7.25217 10.4371 7.19147 10.4623C7.13077 10.4874 7.06571 10.5004 7 10.5004C6.93429 10.5004 6.86923 10.4874 6.80853 10.4623C6.74783 10.4371 6.69269 10.4002 6.64625 10.3538L5.14625 8.85375C5.09979 8.8073 5.06294 8.75214 5.0378 8.69145C5.01266 8.63075 4.99972 8.5657 4.99972 8.5C4.99972 8.4343 5.01266 8.36925 5.0378 8.30855C5.06294 8.24786 5.09979 8.1927 5.14625 8.14625C5.24007 8.05243 5.36732 7.99972 5.5 7.99972C5.5657 7.99972 5.63075 8.01266 5.69145 8.0378C5.75214 8.06294 5.8073 8.09979 5.85375 8.14625L7 9.29313L10.1462 6.14625C10.1927 6.09979 10.2479 6.06294 10.3086 6.0378C10.3692 6.01266 10.4343 5.99972 10.5 5.99972C10.5657 5.99972 10.6308 6.01266 10.6914 6.0378C10.7521 6.06294 10.8073 6.09979 10.8538 6.14625C10.9002 6.1927 10.9371 6.24786 10.9622 6.30855C10.9873 6.36925 11.0003 6.4343 11.0003 6.5C11.0003 6.5657 10.9873 6.63075 10.9622 6.69145C10.9371 6.75214 10.9002 6.8073 10.8538 6.85375Z" fill="#0052FF" />
            </svg>
            <span className="text-xs font-medium">Oficial</span>
          </div>

          {/* Volume */}
          <div className="flex items-center whitespace-nowrap text-xs text-[#606E85] dark:text-[#A1A7BB] lg:text-sm">
            <div className="mr-1.5">
              <svg width="15" height="9" viewBox="0 0 15 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.4803 3.71489H12.5603C12.0752 3.71252 11.6094 3.90461 11.267 4.24823L8.32033 7.19489V0.828226C8.31825 0.491057 8.1132 0.188365 7.80085 0.0613821C7.4885 -0.0656011 7.13041 0.00815054 6.89366 0.248225L3.67366 3.46823C3.51724 3.62709 3.30327 3.71605 3.08033 3.71489H1.16699C0.89085 3.71489 0.666992 3.93875 0.666992 4.21489C0.666992 4.49103 0.89085 4.71489 1.16699 4.71489H3.08033C3.57992 4.72484 4.06178 4.52969 4.41366 4.17489L7.30699 1.23489V7.60156C7.30631 7.93772 7.50925 8.24081 7.82033 8.36823C7.92115 8.41261 8.03017 8.43532 8.14033 8.43489C8.36111 8.43501 8.57262 8.34608 8.72699 8.18823L11.9737 4.95489C12.13 4.80074 12.3408 4.71449 12.5603 4.71489H14.4803C14.7565 4.71489 14.9803 4.49103 14.9803 4.21489C14.9803 3.93875 14.7565 3.71489 14.4803 3.71489V3.71489Z" fill="#606e85" />
              </svg>
            </div>
            <span className="mr-1">Total Vol:</span>
            <span>{formatVolume(totalVolume)}</span>
          </div>

          {/* End Date */}
          <div className="flex items-center whitespace-nowrap text-xs text-[#606E85] dark:text-[#A1A7BB] lg:text-sm">
            <div className="mr-1.5 flex items-center gap-1.5">
              <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 6.5C11 9.26 8.76 11.5 6 11.5C3.24 11.5 1 9.26 1 6.5C1 3.74 3.24 1.5 6 1.5C8.76 1.5 11 3.74 11 6.5Z" stroke="#606E85" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7.85494 8.09L6.30494 7.165C6.03494 7.005 5.81494 6.62 5.81494 6.305V4.255" stroke="#606E85" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Fim:
            </div>
            <span>{format(new Date(event.endsAt), "dd MMM yyyy", { locale: ptBR })}</span>
          </div>

          {/* Action Buttons */}
          <div className="hidden items-center justify-between gap-2 lg:flex lg:justify-end ml-auto">
            <button
              onClick={handleFavoriteToggle}
              disabled={isFavoriteLoading}
              className={`flex size-[30px] items-center justify-center rounded-md hover:bg-black/5 hover:dark:bg-white/5 ${isFavoriteLoading ? 'opacity-50' : ''}`}
            >
              <Star className="size-5" fill={isFavorite ? '#f2be47' : 'none'} color={isFavorite ? '#f2be47' : 'currentColor'} />
            </button>
            <button
              onClick={copyLink}
              className="flex size-[30px] items-center justify-center rounded-md hover:bg-black/5 hover:dark:bg-white/5"
            >
              <LinkIcon className="size-5" />
            </button>
          </div>
        </div>

        {/* Mobile Title */}
        <div className="lg:hidden mt-4">
          <h1 className="text-center font-bold text-2xl dark:text-white">
            {event.title}
          </h1>
          <div className="mt-3 flex flex-col items-center justify-center gap-3">
            <span className="rounded-lg bg-black/5 dark:bg-white/5 px-3 py-[5px] text-sm font-medium dark:text-[#A1A7BB]">
              1. Escolha sua previsão
            </span>
          </div>
        </div>

        {/* Markets Grid */}
        <div className="mt-4 lg:mt-6">
          <div className="size-full overflow-hidden rounded-lg pb-1 lg:mt-0 lg:overflow-visible lg:pb-0">
            {!event.markets || event.markets.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-black/5 dark:bg-white/5">
                <p className="text-muted-foreground">
                  Nenhum mercado disponível para este evento ainda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
                {event.markets.map((market) => (
                  <MarketCardTriad
                    key={market.id}
                    market={market}
                    onYesClick={() => handleSelectPrediction(market, 'YES')}
                    onNoClick={() => handleSelectPrediction(market, 'NO')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mt-5 lg:mt-3">
          <CountdownTimer targetDate={closestMarketClose} />
        </div>

        {/* Mobile Action Buttons */}
        <div className="my-4 flex gap-2 lg:hidden">
          <button
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading}
            className={`flex w-[180px] flex-1 items-center justify-start gap-2 rounded-[10px] border border-black/10 p-3 text-sm font-medium dark:bg-white/5 dark:text-white ${isFavoriteLoading ? 'opacity-50' : ''}`}
          >
            <Star className="size-[18px]" fill={isFavorite ? '#f2be47' : 'none'} color={isFavorite ? '#f2be47' : 'currentColor'} />
            {isFavorite ? 'Favoritado' : 'Favoritar'}
          </button>
          <button
            onClick={copyLink}
            className="flex w-[180px] flex-1 items-center justify-start gap-2 rounded-[10px] border border-black/10 p-3 text-sm font-medium dark:bg-white/5 dark:text-white"
          >
            <LinkIcon className="size-[18px]" />
            Copiar link
          </button>
        </div>

        {/* Rules Section */}
        <div className="mb-6 mt-[30px] w-full rounded-xl">
          <p className="text-lg font-bold dark:text-white">Regras e Detalhes do Mercado</p>
          <p className={`mt-2 text-[14px] font-medium text-[#606E85] dark:text-[#A1A7BB] ${!showFullRules ? 'line-clamp-2' : ''}`}>
            {event.resolveRules}
          </p>
          <button
            onClick={() => setShowFullRules(!showFullRules)}
            className="mt-3 flex items-center gap-1 text-[14px] font-semibold hover:underline dark:text-white"
          >
            {showFullRules ? 'Ver menos' : 'Ver mais'}
            <ChevronDown className={`size-3.5 transition-transform ${showFullRules ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Tabs - Activity (Placeholder) */}
        <div className="mt-7 w-full lg:mt-0 lg:block mb-10">
          <div className="relative mx-auto w-full pb-10 lg:pb-0">
            <div className="relative flex items-baseline mx-auto mb-0 w-full gap-x-4 lg:mt-10 lg:px-0">
              <button className="relative outline-0 py-3 dark:text-white flex pb-5 px-0 items-center justify-center font-bold h-7 text-xl whitespace-nowrap w-fit">
                <span className="relative flex items-center">
                  <span className="flex items-center">Atividade</span>
                </span>
              </button>
              <button className="relative outline-0 py-3 text-[#606E85]/30 dark:text-[#A1A7BB]/30 flex pb-5 px-0 items-center justify-center font-bold h-7 text-xl whitespace-nowrap w-fit hover:text-[#606E85]/50 dark:hover:text-[#A1A7BB]/50">
                <span className="relative flex items-center">
                  <span className="flex items-center">Titulares</span>
                </span>
              </button>
            </div>

            <div className="mt-5 w-full lg:pb-20">
              <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
                <p>Nenhuma atividade recente</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Panel - Desktop Sidebar (ALWAYS visible, uses first market as default) */}
      {event.markets && event.markets.length > 0 && (
        <PredictionPanel
          market={selectedMarket || event.markets[0]}
          side={selectedSide}
          onSuccess={(updatedMarket) => {
            handleMarketUpdate(updatedMarket)
          }}
        />
      )}

      {/* Mobile Prediction Sheet - Bottom Popup */}
      <MobilePredictionSheet
        market={selectedMarket}
        side={selectedSide}
        open={!!selectedMarket}
        onClose={() => setSelectedMarket(null)}
        onSuccess={(updatedMarket) => {
          handleMarketUpdate(updatedMarket)
        }}
      />
    </div>
  )
}
