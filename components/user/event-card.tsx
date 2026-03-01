'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Event } from '@/lib/types'
import { OutcomeRow } from '@/components/events/outcome-row'
import { userApi, getTokens } from '@/lib/api/client'
import { toast } from 'sonner'
import { useAuthModal } from '@/contexts/auth-modal-context'
import { PlaceholderIcon } from '@/components/ui/placeholder-icon'

interface EventCardProps {
  event: Event
  isFavorite?: boolean
  onFavoriteChange?: (eventId: string, isFavorite: boolean) => void
}

function calcMultiplier(prob: number): string {
  if (prob <= 0) return '∞'
  const mult = 100 / prob
  if (mult >= 100) return '100.00x'
  return `${mult.toFixed(2)}x`
}


function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

export function EventCard({ event, isFavorite: initialIsFavorite = false, onFavoriteChange }: EventCardProps) {
  const router = useRouter()
  const markets = event.markets || []
  const hasMarkets = markets.length > 0
  const endDate = event.endsAt ? formatDate(event.endsAt) : null
  const { openAuthModal } = useAuthModal()

  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Check if user is logged in
    if (!getTokens('user')) {
      openAuthModal('LOGIN')
      return
    }

    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await userApi.toggleFavorite(event.id)
      const newIsFavorite = response.data.isFavorite
      setIsFavorite(newIsFavorite)
      onFavoriteChange?.(event.id, newIsFavorite)
      toast.success(newIsFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos')
    } catch {
      toast.error('Erro ao atualizar favorito')
    } finally {
      setIsLoading(false)
    }
  }

  const isSingleMarket = markets.length === 1

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="flex min-w-[341px] min-h-[198px] w-full flex-col rounded-xl border border-border/40 bg-card/50 px-3 pt-3 pb-3 text-start transition-all duration-300 ease-in-out hover:border-border/80 cursor-pointer"
    >
      {/* Header */}
      <div className="flex h-auto w-full flex-col gap-y-2.5 lg:gap-y-3">
        <div className="flex gap-x-2.5 items-start">
          {/* Event Image */}
          <div className="size-[40px] min-w-[40px] max-w-[40px] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {event.imageUrl && !imageError ? (
              <img
                alt={event.title}
                loading="lazy"
                width={40}
                height={40}
                className="size-full object-cover"
                src={event.imageUrl}
                onError={() => setImageError(true)}
              />
            ) : (
              <PlaceholderIcon size={40} />
            )}
          </div>

          {/* Title */}
          <span className="flex flex-1">
            <span className="text-sm font-semibold dark:text-white line-clamp-2">
              {event.title}
            </span>
          </span>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-x-2">
            {/* Favorite Button */}
            <button
              className={`flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${isLoading ? 'opacity-50' : ''}`}
              onClick={handleFavoriteClick}
              disabled={isLoading}
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill={isFavorite ? '#f2be47' : 'none'} xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4421 2.9252L12.9087 5.85853C13.1087 6.26686 13.6421 6.65853 14.0921 6.73353L16.7504 7.1752C18.4504 7.45853 18.8504 8.69186 17.6254 9.90853L15.5587 11.9752C15.2087 12.3252 15.0171 13.0002 15.1254 13.4835L15.7171 16.0419C16.1837 18.0669 15.1087 18.8502 13.3171 17.7919L10.8254 16.3169C10.3754 16.0502 9.63375 16.0502 9.17541 16.3169L6.68375 17.7919C4.90041 18.8502 3.81708 18.0585 4.28375 16.0419L4.87541 13.4835C4.98375 13.0002 4.79208 12.3252 4.44208 11.9752L2.37541 9.90853C1.15875 8.69186 1.55041 7.45853 3.25041 7.1752L5.90875 6.73353C6.35041 6.65853 6.88375 6.26686 7.08375 5.85853L8.55041 2.9252C9.35041 1.33353 10.6504 1.33353 11.4421 2.9252Z" stroke={isFavorite ? '#f2be47' : '#606E85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Time Tooltip */}
            {endDate && (
              <div className="flex size-7 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 6.5C11 9.26 8.76 11.5 6 11.5C3.24 11.5 1 9.26 1 6.5C1 3.74 3.24 1.5 6 1.5C8.76 1.5 11 3.74 11 6.5Z" stroke="#606E85" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7.85494 8.09L6.30494 7.165C6.03494 7.005 5.81494 6.62 5.81494 6.305V4.255" stroke="#606E85" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Markets List */}
      <div className="w-full flex-1">
        {isSingleMarket ? (
          <div className="mt-4 flex flex-col w-full gap-2 font-medium">
            {/* Probabilities Row */}
            <div className="flex justify-between items-center text-[15px] font-bold dark:text-white mb-0.5 px-0.5">
              <span>{Math.round(markets[0].probYes)}%</span>
              <span className="text-[13px] font-semibold text-[#606E85] dark:text-[#A1A7BB]">Chance</span>
              <span>{Math.round(markets[0].probNo)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="flex h-1.5 w-full rounded-full gap-0.5 overflow-hidden">
              <div className="bg-[#22c55e] h-full" style={{ width: `${markets[0].probYes}%` }} />
              <div className="bg-[#ef4444] h-full" style={{ width: `${markets[0].probNo}%` }} />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-3">
              {/* Sim Button Area */}
              <div className="flex flex-col flex-1 items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/eventos/${event.slug}?marketId=${markets[0].id}&side=YES`)
                  }}
                  className="w-full h-[40px] flex justify-center items-center rounded-[10px] bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20 transition-colors font-bold text-[13px] gap-1.5 border border-[#22c55e]/10 hover:border-[#22c55e]/30"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="min-w-3.5">
                    <path d="M6.99935 12.8332C10.2077 12.8332 12.8327 10.2082 12.8327 6.99984C12.8327 3.7915 10.2077 1.1665 6.99935 1.1665C3.79102 1.1665 1.16602 3.7915 1.16602 6.99984C1.16602 10.2082 3.79102 12.8332 6.99935 12.8332Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.52051 6.99995L6.17134 8.65079L9.47884 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sim - {calcMultiplier(markets[0].probYes)}
                </button>
                <span className="text-[11px] font-bold text-black dark:text-white">
                  R$10.00 <span className="text-[#606E85] dark:text-[#A1A7BB] font-normal px-0.5">→</span> <span className="text-[#22c55e]">R${(10 * (100 / (markets[0].probYes || 1))).toFixed(2)}</span>
                </span>
              </div>

              {/* Nao Button Area */}
              <div className="flex flex-col flex-1 items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/eventos/${event.slug}?marketId=${markets[0].id}&side=NO`)
                  }}
                  className="w-full h-[40px] flex justify-center items-center rounded-[10px] bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors font-bold text-[13px] gap-1.5 border border-[#ef4444]/10 hover:border-[#ef4444]/30"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.99935 12.8332C10.2077 12.8332 12.8327 10.2082 12.8327 6.99984C12.8327 3.7915 10.2077 1.1665 6.99935 1.1665C3.79102 1.1665 1.16602 3.7915 1.16602 6.99984C1.16602 10.2082 3.79102 12.8332 6.99935 12.8332Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.34863 8.65079L8.6503 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.6503 8.65079L5.34863 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Não - {calcMultiplier(markets[0].probNo)}
                </button>
                <span className="text-[11px] font-bold text-black dark:text-white">
                  R$10.00 <span className="text-[#606E85] dark:text-[#A1A7BB] font-normal px-0.5">→</span> <span className="text-[#22c55e]">R${(10 * (100 / (markets[0].probNo || 1))).toFixed(2)}</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-[135px] overflow-y-auto custom-scroll pr-1">
            <div className="mt-3 flex size-full flex-col items-center justify-center gap-y-1">
              {hasMarkets ? (
                markets.map((market) => (
                  <OutcomeRow
                    key={market.id}
                    market={market}
                    onYesClick={() => router.push(`/eventos/${event.slug}?marketId=${market.id}&side=YES`)}
                    onNoClick={() => router.push(`/eventos/${event.slug}?marketId=${market.id}&side=NO`)}
                  />
                ))
              ) : (
                <div className="py-4 text-xs text-muted-foreground text-center">
                  Aguardando mercados
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
