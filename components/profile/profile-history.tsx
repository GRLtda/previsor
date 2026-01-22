'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Position } from '@/lib/types'
import { CustomSelect } from '@/components/ui/custom-select'

type ActivityType = 'bought' | 'sold' | 'lost' | 'won'

interface ActivityItem {
    id: string
    type: ActivityType
    position: Position
    timestamp: string
}

interface ProfileHistoryProps {
    positions: Position[]
    isLoading?: boolean
}

export function ProfileHistory({ positions, isLoading = false }: ProfileHistoryProps) {
    const [search, setSearch] = useState('')
    const [sortOrder, setSortOrder] = useState('newest')

    // Convert positions to activity items
    const activities: ActivityItem[] = positions.map((pos) => {
        let type: ActivityType = 'bought'
        if (pos.status === 'settled') {
            type = pos.payoutAmount && pos.payoutAmount > pos.amount ? 'won' : 'lost'
        }
        return {
            id: pos.id,
            type,
            position: pos,
            timestamp: pos.settledAt || pos.createdAt,
        }
    })

    const filteredActivities = activities
        .filter((act) => {
            if (search && !act.position.marketStatement?.toLowerCase().includes(search.toLowerCase())) {
                return false
            }
            return true
        })
        .sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime()
            const dateB = new Date(b.timestamp).getTime()
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
        })

    const formatCurrency = (value: number) => {
        return `R$${(value / 100).toFixed(2).replace('.', ',')}`
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleDateString('pt-BR')
    }

    const sortOptions = [
        { value: 'newest', label: 'Mais Recente' },
        { value: 'oldest', label: 'Mais Antigo' },
    ]

    return (
        <div className="mt-2 max-h-[calc(100%-80px)] overflow-auto lg:overflow-x-hidden">
            {/* Filters */}
            <div className="mt-3 flex items-center gap-x-1.5">
                {/* Search */}
                <div className="flex h-10 w-full items-center justify-between rounded-lg p-3.5 text-sm transition-all border border-transparent bg-black/5 hover:bg-black/10 dark:bg-white/5 hover:dark:bg-white/10 max-sm:col-span-2">
                    <div className="flex h-10 w-full items-center gap-x-1.5">
                        <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
                            <path fillRule="evenodd" clipRule="evenodd" d="M10.631 4.47459C9.79903 2.47688 7.84973 1.17334 5.68572 1.16756C3.35344 1.15527 1.27964 2.64918 0.552616 4.86529C-0.174403 7.08139 0.611446 9.51344 2.49776 10.8851C4.38408 12.2568 6.93994 12.2548 8.82405 10.8801L12.032 14.2691C12.2029 14.4397 12.4796 14.4397 12.6504 14.2691C12.821 14.0983 12.821 13.8216 12.6504 13.6508L9.49489 10.3142C11.0151 8.77413 11.4629 6.47229 10.631 4.47459ZM9.85097 8.2661C9.15245 9.94941 7.50821 11.0458 5.68572 11.0434V11.0201C3.21222 11.0169 1.20424 9.01934 1.18822 6.54589C1.18586 4.7234 2.2822 3.07916 3.96551 2.38064C5.64882 1.68211 7.58719 2.06703 8.87589 3.35572C10.1646 4.64442 10.5495 6.5828 9.85097 8.2661Z" fill="#606e85" stroke="#606e85" strokeWidth="0.571429" />
                        </svg>
                        <input
                            placeholder="Procurar por mercados, tópicos.."
                            className="flex w-full flex-1 bg-transparent outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Sort Dropdown */}
                <CustomSelect
                    options={sortOptions}
                    value={sortOrder}
                    onChange={setSortOrder}
                    prefix="Ordenar"
                    className="min-w-44"
                />
            </div>

            {/* Info Banner */}
            <div className="mt-3 flex h-[34px] items-center justify-center rounded-lg border border-black/5 bg-transparent dark:border-none dark:bg-white/5">
                <span className="text-xs font-medium text-muted-foreground">
                    Apenas mercados resolvidos são exibidos aqui. Suas previsões ativas estão disponíveis na aba Previsões.
                </span>
            </div>

            {/* Table */}
            <table className="h-full min-w-full divide-y divide-[#E5E5E5] dark:divide-white/5">
                <thead className="h-11 border-[#E5E5E5] dark:border-white/5 border-t-0">
                    <tr>
                        <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize tracking-wider text-muted-foreground lg:px-3">
                            <div className="relative w-full text-left text-xs">Activity</div>
                        </th>
                        <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize tracking-wider text-muted-foreground lg:px-3">
                            <span className="relative ml-auto w-full text-right text-xs">Mercado - Resultado Previsto</span>
                        </th>
                        <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize tracking-wider text-muted-foreground lg:px-3">
                            <span className="ml-auto block text-right">Previu no valor de</span>
                        </th>
                        <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize tracking-wider text-muted-foreground lg:px-3">
                            <span className="ml-auto block text-right">Data de Fechamento</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <tr key={i} className="lg:transition-all lg:duration-150 lg:ease-in-out cursor-default hover:bg-black/[3%] dark:lg:hover:bg-white/5">
                                <td colSpan={4} className="px-5 py-4 text-center">
                                    <div className="animate-pulse bg-muted h-4 w-48 mx-auto rounded" />
                                </td>
                            </tr>
                        ))
                    ) : filteredActivities.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center py-20 text-muted-foreground">
                                <svg width="85" height="83" viewBox="0 0 85 83" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-20 mx-auto mb-4 opacity-60">
                                    <path d="M18.8867 72.4155V25.3873V2H57.2318L74.1543 18.7958V72.4155H18.8867Z" fill="#DFE3EA" />
                                    <path d="M27.126 33.3101V29.127H64.9006V33.3101H27.126Z" fill="#14161B" />
                                    <path d="M27.126 41.9927V37.8096H64.9006V41.9927H27.126Z" fill="#14161B" />
                                    <path d="M27.126 50.9927V46.8096H64.9006V50.9927H27.126Z" fill="#14161B" />
                                </svg>
                                <p>Nenhuma atividade encontrada</p>
                            </td>
                        </tr>
                    ) : (
                        filteredActivities.map((activity) => (
                            <tr key={activity.id} className="lg:transition-all lg:duration-150 lg:ease-in-out cursor-default hover:bg-black/[3%] dark:lg:hover:bg-white/5">
                                {/* Activity */}
                                <td className="px-5 py-4 text-sm first-of-type:rounded-l-[10px] last-of-type:rounded-r-[10px] lg:px-3">
                                    <span className="ml-auto block pl-1 text-right text-xs font-medium lg:text-sm">
                                        <span className="flex items-center gap-x-1">
                                            {/* Plus Icon */}
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-500">
                                                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M8 5V11M5 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            Comprado
                                        </span>
                                    </span>
                                </td>

                                {/* Mercado - Resultado Previsto */}
                                <td className="px-5 py-4 text-sm first-of-type:rounded-l-[10px] last-of-type:rounded-r-[10px] lg:px-3">
                                    <div className="flex items-center max-[768px]:mr-2">
                                        <Link
                                            href={`/eventos/${activity.position.eventSlug || '#'}`}
                                            className="mr-1 size-8 rounded bg-black/5 dark:bg-white/5 lg:mr-4 lg:size-[34px] flex items-center justify-center"
                                        >
                                            <span className={cn(
                                                "text-sm font-bold",
                                                activity.position.side === 'YES' ? 'text-green-600' : 'text-red-500'
                                            )}>
                                                {activity.position.side === 'YES' ? '↑' : '↓'}
                                            </span>
                                        </Link>
                                        <div>
                                            <Link
                                                href={`/eventos/${activity.position.eventSlug || '#'}`}
                                                className="flex flex-col gap-y-1"
                                            >
                                                <span className="w-fit max-w-[280px] truncate whitespace-nowrap text-[11px] font-medium lg:max-w-full lg:text-sm">
                                                    {activity.position.marketStatement || 'Mercado'}
                                                </span>
                                            </Link>
                                            <div className="flex items-center gap-x-1">
                                                <span className={cn(
                                                    "text-[11px] bg-opacity-10 max-w-96 truncate line-clamp-1 font-semibold w-fit rounded-[2px] px-1",
                                                    activity.position.side === 'YES'
                                                        ? "bg-green-500/10 text-green-600"
                                                        : "bg-[#FF5A5A33] text-red-500"
                                                )}>
                                                    {activity.position.side === 'YES' ? 'Sim' : 'Não'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Previu no valor de */}
                                <td className="px-5 py-4 text-sm first-of-type:rounded-l-[10px] last-of-type:rounded-r-[10px] lg:px-3">
                                    <div className="relative ml-auto flex flex-col items-end justify-end text-right">
                                        <div className="flex flex-col items-end gap-x-1">
                                            <span className="text-right text-sm font-semibold">
                                                {formatCurrency(activity.position.amount)}
                                            </span>
                                            <span className="flex justify-end text-xs font-medium text-muted-foreground lg:ml-0">
                                                {(activity.position.amount / 100).toFixed(2)} Shares
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Data de Fechamento */}
                                <td className="px-5 py-4 text-sm first-of-type:rounded-l-[10px] last-of-type:rounded-r-[10px] lg:px-3">
                                    <div className="relative ml-auto w-fit">
                                        <span className="flex items-center text-right text-xs font-medium text-muted-foreground">
                                            {formatDate(activity.timestamp)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
