'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { usePathname, useSearchParams } from 'next/navigation'
import {
    LayoutGrid,
    Bitcoin,
    Trophy,
    Gamepad2,
    Landmark,
    TrendingUp
} from 'lucide-react'

export function SubHeader() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Check if category matches current filter
    const isActive = (href: string) => {
        if (pathname !== '/eventos') return false

        // Exact match for base route
        if (href === '/eventos' && !searchParams.get('category') && !searchParams.get('filter')) return true

        // Check params
        if (href.includes('?')) {
            const param = href.split('?')[1]
            const [key, value] = param.split('=')
            return searchParams.get(key) === value
        }

        return false
    }

    const categories = [
        { label: 'Todos', href: '/eventos', icon: LayoutGrid },
        { label: 'Cripto', href: '/eventos?category=bitcoin', icon: Bitcoin },
        { label: 'Esportes', href: '/eventos?category=sports', icon: Trophy },
        { label: 'Esports', href: '/eventos?category=esports', icon: Gamepad2 },
        { label: 'Política', href: '/eventos?category=politics', icon: Landmark },
        { label: 'Economia', href: '/eventos?category=economics', icon: TrendingUp },
    ]

    return (
        <div className="w-full border-b border-border bg-background">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-center gap-4 py-3 overflow-x-auto no-scrollbar">
                    {categories.map((category) => {
                        const Icon = category.icon
                        const active = isActive(category.href)
                        return (
                            <Link
                                key={category.label}
                                href={category.href}
                                className={cn(
                                    "flex items-center gap-2 min-h-11 rounded-[10px] px-4 transition-all duration-200 whitespace-nowrap",
                                    active
                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-semibold"
                                        : "text-[13px] font-medium text-[#606E85] dark:text-white/70 hover:text-foreground hover:bg-black/[3%] dark:hover:bg-white/[3%]"
                                )}
                            >
                                <Icon className="size-4" />
                                {category.label}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
