'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Event } from '@/lib/types'
import { OutcomeRow } from '@/components/events/outcome-row'
import { userApi, getTokens } from '@/lib/api/client'
import { toast } from 'sonner'
import { useAuthModal } from '@/contexts/auth-modal-context'

interface EventCardProps {
  event: Event
  isFavorite?: boolean
  onFavoriteChange?: (eventId: string, isFavorite: boolean) => void
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

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="flex hover:shadow-md cursor-pointer min-w-[341px] h-[198px] dark:hover:shadow-none hover:dark:bg-white/[7%] w-full flex-col rounded-2xl border border-black/10 dark:border-transparent bg-white px-3 pt-3 text-start hover:cursor-pointer dark:bg-white/5 pb-0 transition-all"
    >
      {/* Header */}
      <div className="flex h-auto w-full flex-col gap-y-2.5 lg:gap-y-3">
        <div className="flex gap-x-2.5 items-start">
          {/* Event Image */}
          <div className="size-[40px] min-w-[40px] max-w-[40px] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {event.imageUrl ? (
              <img
                alt={event.title}
                loading="lazy"
                width={40}
                height={40}
                className="size-full object-cover"
                src={event.imageUrl}
              />
            ) : (
              <span className="text-lg">📊</span>
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
      </div>
    </Link>
  )
}
