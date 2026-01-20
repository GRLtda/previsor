'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

const categories = [
    { label: 'Em Alta', href: '/eventos' },
    { label: 'Novos', href: '/eventos?filter=new' },
    { label: 'Todos', href: '/eventos?filter=all' },
    { label: 'Politica', href: '/eventos?category=politics' },
    { label: 'Esportes', href: '/eventos?category=sports' },
    { label: 'Cultura', href: '/eventos?category=culture' },
    { label: 'Cripto', href: '/eventos?category=crypto' },
    { label: 'Clima', href: '/eventos?category=climate' },
    { label: 'Economia', href: '/eventos?category=economics' },
    { label: 'Mencoes', href: '/eventos?category=mentions' },
    { label: 'Empresas', href: '/eventos?category=companies' },
    { label: 'Financeiro', href: '/eventos?category=financials' },
    { label: 'Tecnologia', href: '/eventos?category=tech' },
]

export function SubHeader() {
    const pathname = usePathname()
    // Simple check for active state, can be improved with search params
    const isActive = (href: string) => pathname === href || (href !== '/eventos' && pathname.startsWith(href))

    return (
        <div className="w-full border-b border-border bg-background">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-center gap-6 overflow-x-auto py-3 no-scrollbar">
                    {categories.map((category) => (
                        <Link
                            key={category.label}
                            href={category.href}
                            className={cn(
                                "whitespace-nowrap text-sm font-medium transition-colors hover:text-foreground",
                                category.label === 'Trending' ? "text-foreground font-bold" : "text-muted-foreground"
                            )}
                        >
                            {category.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
