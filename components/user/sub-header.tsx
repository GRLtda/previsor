'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { userApi } from '@/lib/api/client'
import type { Category } from '@/lib/types'

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

    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function loadCategories() {
            try {
                const res = await userApi.getCategories()
                if (mounted && res.success && res.data) {
                    setCategories(res.data.categories || [])
                }
            } catch (err) {
                console.error('Failed to load categories', err)
            } finally {
                if (mounted) setIsLoading(false)
            }
        }
        loadCategories()
        return () => { mounted = false }
    }, [])

    // Only show SubHeader on home page and eventos list page
    const shouldShow = pathname === '/' || pathname === '/eventos'

    if (!shouldShow) {
        return null
    }

    return (
        <>
            <div className="fixed top-[60px] left-0 w-full bg-background z-30">
                <div className="px-4 md:px-12 lg:px-24 xl:px-[140px] 2xl:px-[256px]">
                    <div className="flex items-center gap-4 py-1.5 overflow-x-auto no-scrollbar">
                        <Link
                            href="/eventos"
                            className={cn(
                                "flex items-center gap-2 min-h-9 rounded-[10px] px-3 transition-all duration-200 whitespace-nowrap text-[13px]",
                                isActive('/eventos')
                                    ? "bg-brand/10 text-brand font-semibold"
                                    : "font-medium text-[#606E85] dark:text-white/70 hover:text-foreground hover:bg-black/[3%] dark:hover:bg-white/[3%]"
                            )}
                        >
                            <DynamicIcon name="LayoutGrid" className="size-4" />
                            Todos
                        </Link>
                        {!isLoading && categories.map((category) => {
                            const href = `/eventos?category=${category.slug}`
                            const active = isActive(href)
                            return (
                                <Link
                                    key={category.slug}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-2 min-h-9 rounded-[10px] px-3 transition-all duration-200 whitespace-nowrap text-[13px]",
                                        active
                                            ? "bg-brand/10 text-brand font-semibold"
                                            : "font-medium text-[#606E85] dark:text-white/70 hover:text-foreground hover:bg-black/[3%] dark:hover:bg-white/[3%]"
                                    )}
                                >
                                    {category.icon && <DynamicIcon name={category.icon} className="size-4" />}
                                    {category.name}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
            {/* Spacer for fixed subheader */}
            <div className="h-[44px]" />
        </>
    )
}
