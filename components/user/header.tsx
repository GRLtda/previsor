'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { TrendingUp, User, Wallet, LogOut, Menu, LayoutDashboard, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

const navLinks = [
  { href: '/eventos', label: 'Eventos' },
]

export function UserHeader() {
  const pathname = usePathname()
  const { user, isAuthenticated, isOtpVerified, logout, isLoading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLoggedIn = isAuthenticated && !isLoading

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/eventos" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Previzor</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === link.href
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {isOtpVerified && user && (
                  <Link href="/app/carteira">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Wallet className="h-4 w-4" />
                      R$ {((user.wallet?.balance || 0) / 100).toFixed(2)}
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      {user?.full_name || user?.email?.split('@')[0] || 'Minha Conta'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/app" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/app/carteira" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Carteira
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/app/posicoes" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Minhas Posicoes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/app/perfil" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/auth/cadastro">
                  <Button size="sm">Criar Conta</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'text-lg font-medium transition-colors hover:text-primary',
                      pathname === link.href
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-4" />
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/app"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/app/carteira"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <Wallet className="h-4 w-4" />
                      Carteira
                    </Link>
                    <Link
                      href="/app/posicoes"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <History className="h-4 w-4" />
                      Minhas Posicoes
                    </Link>
                    <Link
                      href="/app/perfil"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setMobileOpen(false)
                      }}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/auth/cadastro"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button className="w-full">Criar Conta</Button>
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
