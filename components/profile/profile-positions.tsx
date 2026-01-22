'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Position } from '@/lib/types'
import { CustomSelect } from '@/components/ui/custom-select'

interface ProfilePositionsProps {
    positions: Position[]
    isLoading?: boolean
}

export function ProfilePositions({ positions, isLoading = false }: ProfilePositionsProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredPositions = positions.filter((pos) => {
        if (search && !pos.marketStatement?.toLowerCase().includes(search.toLowerCase())) {
            return false
        }
        if (statusFilter !== 'all' && pos.status !== statusFilter) {
            return false
        }
        return true
    })

    const formatCurrency = (value: number) => {
        return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`
    }

    const statusOptions = [
        { value: 'all', label: 'Todas' },
        { value: 'active', label: 'Abertas' },
        { value: 'settled', label: 'Resolvidas' },
    ]

    return (
        <section className="mt-5 w-full">
            {/* Filters */}
            <div className="grid w-full grid-cols-2 items-center gap-2.5 md:flex">
                {/* Search */}
                <div className="flex h-10 w-full items-center justify-between rounded-lg p-3.5 text-sm transition-all border border-transparent bg-black/5 hover:bg-black/10 dark:bg-white/5 hover:dark:bg-white/10 max-sm:col-span-2">
                    <div className="flex w-full items-center gap-x-1.5">
                        <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
                            <path fillRule="evenodd" clipRule="evenodd" d="M10.631 4.47459C9.79903 2.47688 7.84973 1.17334 5.68572 1.16756C3.35344 1.15527 1.27964 2.64918 0.552616 4.86529C-0.174403 7.08139 0.611446 9.51344 2.49776 10.8851C4.38408 12.2568 6.93994 12.2548 8.82405 10.8801L12.032 14.2691C12.2029 14.4397 12.4796 14.4397 12.6504 14.2691C12.821 14.0983 12.821 13.8216 12.6504 13.6508L9.49489 10.3142C11.0151 8.77413 11.4629 6.47229 10.631 4.47459ZM9.85097 8.2661C9.15245 9.94941 7.50821 11.0458 5.68572 11.0434V11.0201C3.21222 11.0169 1.20424 9.01934 1.18822 6.54589C1.18586 4.7234 2.2822 3.07916 3.96551 2.38064C5.64882 1.68211 7.58719 2.06703 8.87589 3.35572C10.1646 4.64442 10.5495 6.5828 9.85097 8.2661Z" fill="#606e85" stroke="#606e85" strokeWidth="0.571429" />
                        </svg>
                        <input
                            placeholder="Pesquisar por Mercados, Tópicos..."
                            className="flex w-full flex-1 bg-transparent outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status Dropdown */}
                <CustomSelect
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    prefix="Status"
                    className="max-w-[175px] lg:min-w-[175px]"
                />

                {/* Type */}
                <div className="relative flex size-full h-10 max-w-[175px] items-center gap-2 whitespace-nowrap rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-medium dark:border-none dark:bg-white/5 dark:text-white">
                    <span className="text-muted-foreground">Tipo:</span>
                    Previsões
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(100%-80px)] lg:overflow-visible w-full rounded-lg pb-1 lg:pb-0 mt-4">
                <table className="h-full min-w-full divide-y divide-[#E5E5E5] dark:divide-white/5">
                    <thead className="h-11 border-[#E5E5E5] dark:border-white/5 border-t-0">
                        <tr>
                            <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-t-0 pt-4 tracking-normal text-muted-foreground lg:px-3">
                                Resultado Previsto
                            </th>
                            <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-t-0 pt-4 tracking-normal text-muted-foreground lg:px-3">
                                <div className="flex justify-end">Preço de entrada → Agora</div>
                            </th>
                            <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-t-0 pt-4 tracking-normal text-muted-foreground lg:px-3">
                                <div className="flex justify-end">Previu No Valor De</div>
                            </th>
                            <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-t-0 pt-4 tracking-normal text-muted-foreground lg:px-3">
                                <div className="flex justify-end">Para Ganhar</div>
                            </th>
                            <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-t-0 pt-4 tracking-normal text-muted-foreground lg:px-3">
                                <div className="flex justify-end">Valor Atual</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="space-y-3 border-none">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="lg:transition-all lg:duration-150 lg:ease-in-out hover:bg-[#00000008] dark:hover:bg-white/5">
                                    <td colSpan={5} className="px-5 py-5 text-center">
                                        <div className="animate-pulse bg-muted h-4 w-48 mx-auto rounded" />
                                    </td>
                                </tr>
                            ))
                        ) : filteredPositions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-20 text-muted-foreground">
                                    <svg width="85" height="83" viewBox="0 0 85 83" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-20 mx-auto mb-4 opacity-60">
                                        <path d="M18.8867 72.4155V25.3873V2H57.2318L74.1543 18.7958V72.4155H18.8867Z" fill="#DFE3EA" />
                                        <path d="M27.126 33.3101V29.127H64.9006V33.3101H27.126Z" fill="#14161B" />
                                        <path d="M27.126 41.9927V37.8096H64.9006V41.9927H27.126Z" fill="#14161B" />
                                        <path d="M27.126 50.9927V46.8096H64.9006V50.9927H27.126Z" fill="#14161B" />
                                    </svg>
                                    <p>Sem Previsões Encontradas</p>
                                </td>
                            </tr>
                        ) : (
                            filteredPositions.map((pos) => (
                                <tr key={pos.id} className="lg:transition-all lg:duration-150 lg:ease-in-out hover:bg-[#00000008] dark:hover:bg-white/5 cursor-default">
                                    {/* Resultado Previsto */}
                                    <td className="px-5 text-sm first-of-type:rounded-l-lg last-of-type:rounded-r-lg lg:px-5 py-5">
                                        <div className="flex gap-x-1 lg:gap-x-3">
                                            {/* Icon */}
                                            <div
                                                className={cn(
                                                    "size-7 min-h-7 min-w-7 rounded-full flex items-center justify-center lg:size-10 lg:min-w-10",
                                                    pos.side === 'YES' ? 'bg-green-500/20' : 'bg-red-500/20'
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    pos.side === 'YES' ? 'text-green-600' : 'text-red-500'
                                                )}>
                                                    {pos.side === 'YES' ? '↑' : '↓'}
                                                </span>
                                            </div>
                                            {/* Content */}
                                            <div>
                                                <Link
                                                    href={`/eventos/${pos.eventSlug || '#'}`}
                                                    className="line-clamp-1 w-fit max-w-[330px] truncate whitespace-nowrap text-[11px] font-medium hover:underline lg:text-sm"
                                                >
                                                    {pos.marketStatement || 'Mercado'}
                                                </Link>
                                                <div className="flex items-center gap-x-2.5">
                                                    <span className={cn(
                                                        "text-[11px] bg-opacity-10 max-w-96 truncate line-clamp-1 font-semibold w-fit rounded-[2px] px-1",
                                                        pos.side === 'YES'
                                                            ? "bg-green-500/10 text-green-600"
                                                            : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {pos.side === 'YES' ? 'Sim' : 'Não'}
                                                    </span>
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {(pos.amount / 100).toFixed(2)} shares
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Preço de entrada → Agora */}
                                    <td className="px-5 text-sm first-of-type:rounded-l-lg last-of-type:rounded-r-lg lg:px-5 py-5">
                                        <div className="relative left-1 ml-auto flex w-fit items-center">
                                            <span className="mr-0.5 whitespace-nowrap text-right text-xs font-semibold text-muted-foreground lg:text-sm">--</span>
                                            <span className="ml-px whitespace-nowrap text-right text-xs font-semibold lg:text-sm">→ --</span>
                                        </div>
                                    </td>

                                    {/* Previu No Valor De */}
                                    <td className="px-5 text-sm first-of-type:rounded-l-lg last-of-type:rounded-r-lg lg:px-5 py-5">
                                        <div className="relative left-1.5 ml-auto flex flex-col items-end justify-end text-right">
                                            <span className="text-right text-xs font-semibold lg:text-sm">
                                                {formatCurrency(pos.amount)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Para Ganhar */}
                                    <td className="px-5 text-sm first-of-type:rounded-l-lg last-of-type:rounded-r-lg lg:px-5 py-5">
                                        <div className="ml-auto relative left-1 w-fit text-right whitespace-nowrap text-green-500">
                                            <span className="text-sm font-semibold">--</span>
                                        </div>
                                    </td>

                                    {/* Valor Atual */}
                                    <td className="px-5 text-sm first-of-type:rounded-l-lg last-of-type:rounded-r-lg lg:px-5 py-5">
                                        <div className="ml-auto relative w-fit text-right whitespace-nowrap">
                                            <span className="text-muted-foreground">--</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
