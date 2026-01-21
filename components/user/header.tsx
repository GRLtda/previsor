
import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Search, User, LogOut, Wallet, ScrollText } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'


import { SubHeader } from './sub-header'
import { AuthModal } from '@/components/auth/auth-modal'
import { DepositModal } from '@/components/wallet/deposit-modal'

function SearchInput() {
  // Debounce hook
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)

      return () => {
        clearTimeout(handler)
      }
    }, [value, delay])

    return debouncedValue
  }

  const router = useRouter()
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const [value, setValue] = useState(initialSearch)
  const debouncedValue = useDebounce(value, 500)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  useEffect(() => {
    // Only push if the value has changed from what's in URL to avoid loops
    // and only if it matches current input (handled by debounce)
    const currentSearch = searchParams.get('search') || ''
    if (debouncedValue !== currentSearch) {
      router.push(`/eventos?${createQueryString('search', debouncedValue)}`)
    }
  }, [debouncedValue, createQueryString, router, searchParams])

  const handleSearch = (term: string) => {
    setValue(term)
  }

  return (
    <>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search markets or profiles"
        className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1"
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </>
  )
}

export function UserHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isOtpVerified, isLoading, logout } = useAuth()

  const [mounted, setMounted] = useState(false)
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: 'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT_PASSWORD' }>({
    isOpen: false,
    view: 'LOGIN',
  })
  const [depositModalOpen, setDepositModalOpen] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Force OTP if authenticated but not verified
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isOtpVerified) {
      setAuthModal({ isOpen: true, view: 'OTP' })
    }
  }, [isLoading, isAuthenticated, isOtpVerified])

  const openAuthModal = (view: 'LOGIN' | 'REGISTER') => {
    setAuthModal({ isOpen: true, view })
  }

  const isLoggedIn = isAuthenticated

  const navLinks = [
    { href: '/eventos', label: 'Markets' },
    { href: '/live', label: 'Live' },
    { href: '/ideas', label: 'Ideas' },
    { href: '/api', label: 'API' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      {/* Top Bar */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">Previzor</span>
            </Link>


          </div>

          {/* Center: Search (Hidden on small mobile) */}
          <div className="hidden sm:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Suspense fallback={null}>
                <SearchInput />
              </Suspense>
            </div>
          </div>

          {/* Right: Auth / Menu */}
          <div className="flex items-center gap-2">
            {!mounted ? (
              // Skeleton/Placeholder to prevent layout shift or just empty
              <div className="w-[100px] h-9" />
            ) : isLoggedIn ? (
              <div className="flex items-center gap-4">
                {/* Balance Display - Clickable */}
                <div
                  className="flex flex-col items-end mr-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => router.push('/app/carteira')}
                  title="Ver carteira"
                >
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Saldo</span>
                    <div className="rounded-full border border-muted-foreground/30 p-[1px]">
                      <span className="sr-only">Info</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 opacity-70"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#00C805] tabular-nums">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((user?.wallet?.balance || 0) / 100)}
                  </span>
                </div>

                {/* Deposit Button */}
                <Button
                  className="bg-[#0055FF] hover:bg-[#0044CC] text-white font-semibold h-9 px-6 rounded-md flex transition-colors"
                  onClick={() => setDepositModalOpen(true)}
                >
                  Depositar
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                          {user?.full_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(`/u/${user?.id}`)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/app/carteira')}>
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Carteira</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/app/posicoes')}>
                      <ScrollText className="mr-2 h-4 w-4" />
                      <span>Minhas Previsões</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="flex text-primary font-semibold hover:text-[#00C805] hover:bg-[#00C805]/10" onClick={() => openAuthModal('LOGIN')}>
                  Log in
                </Button>
                <Button size="sm" className="font-semibold bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => openAuthModal('REGISTER')}>
                  Sign up
                </Button>
              </div>
            )}


          </div>
        </div>
      </div>
      <SubHeader />
      <AuthModal
        isOpen={authModal.isOpen}
        onOpenChange={(open) => setAuthModal((prev) => ({ ...prev, isOpen: open }))}
        defaultView={authModal.view}
      />
      <DepositModal
        isOpen={depositModalOpen}
        onOpenChange={setDepositModalOpen}
      />
    </header>
  )
}
