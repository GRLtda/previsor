'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, LogOut, Wallet } from 'lucide-react'
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
import { SubHeader } from './sub-header'
import { AuthModal } from '@/components/auth/auth-modal'
import { DepositModal } from '@/components/wallet/deposit-modal'

function SearchInput() {
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
    (name: string, val: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (val) {
        params.set(name, val)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    if (debouncedValue !== currentSearch) {
      router.push(`/eventos?${createQueryString('search', debouncedValue)}`)
    }
  }, [debouncedValue, createQueryString, router, searchParams])

  return (
    <div className="flex h-10 w-full relative items-center rounded-lg transition-all border border-transparent ease-in hover:bg-black/10 hover:dark:bg-white/10 bg-black/5 dark:bg-white/5 p-3 text-sm">
      <div className="flex w-full flex-1 items-center gap-x-1.5">
        <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.631 4.47459C9.79903 2.47688 7.84973 1.17334 5.68572 1.16756C3.35344 1.15527 1.27964 2.64918 0.552616 4.86529C-0.174403 7.08139 0.611446 9.51344 2.49776 10.8851C4.38408 12.2568 6.93994 12.2548 8.82405 10.8801L12.032 14.2691C12.2029 14.4397 12.4796 14.4397 12.6504 14.2691C12.821 14.0983 12.821 13.8216 12.6504 13.6508L9.49489 10.3142C11.0151 8.77413 11.4629 6.47229 10.631 4.47459ZM9.85097 8.2661C9.15245 9.94941 7.50821 11.0458 5.68572 11.0434V11.0201C3.21222 11.0169 1.20424 9.01934 1.18822 6.54589C1.18586 4.7234 2.2822 3.07916 3.96551 2.38064C5.64882 1.68211 7.58719 2.06703 8.87589 3.35572C10.1646 4.64442 10.5495 6.5828 9.85097 8.2661Z" fill="#606e85" stroke="#606e85" strokeWidth="0.571429" />
        </svg>
        <input
          type="text"
          placeholder="Pesquisar por Mercados, Tópicos..."
          className="flex w-full bg-transparent pb-0.5 text-xs text-black placeholder:text-[13px] placeholder:text-[#606E85] dark:text-white dark:placeholder:text-[#A1A7BB] lg:text-base outline-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="absolute right-2 top-1/2 hidden size-[22px] -translate-y-1/2 items-center justify-center rounded bg-black/10 dark:bg-white/10 text-[#606E85] dark:text-[#A1A7BB] text-xs lg:flex">
        /
      </div>
    </div>
  )
}

export function UserHeader() {
  const router = useRouter()
  const { user, isAuthenticated, isOtpVerified, isLoading, logout } = useAuth()

  const [mounted, setMounted] = useState(false)
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: 'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT_PASSWORD' }>({
    isOpen: false,
    view: 'LOGIN',
  })
  const [depositModalOpen, setDepositModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isOtpVerified) {
      setAuthModal({ isOpen: true, view: 'OTP' })
    }
  }, [isLoading, isAuthenticated, isOtpVerified])

  const openAuthModal = (view: 'LOGIN' | 'REGISTER') => {
    setAuthModal({ isOpen: true, view })
  }

  const isLoggedIn = isAuthenticated
  const balanceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((user?.wallet?.balance || 0) / 100)

  return (
    <>
      <header
        id="main-header"
        className="fixed left-0 lg:h-[60px] border-b place-content-center border-black/10 dark:border-white/5 top-0 bg-white dark:bg-[#0E1117] z-30 w-full"
      >
        <div>
          <div className="mx-auto flex h-full max-h-[60px] min-h-[60px] items-center justify-end px-2.5 lg:justify-between lg:px-4">
            {/* Left: Logo & Search */}
            <div className="flex items-center gap-x-4">
              <Link href="/">
                <span className="text-xl font-bold text-[#0055FF] dark:text-white">Previzor</span>
              </Link>

              {/* Search - Hidden on mobile */}
              <div className="hidden xl:flex h-[30px] items-center gap-x-3 text-[13px]">
                <div className="relative w-full max-w-[400px] lg:min-w-[400px]">
                  <Suspense fallback={null}>
                    <SearchInput />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* Right: Balance, Deposit, Avatar */}
            <div className="flex w-full items-center justify-end lg:w-auto lg:justify-start">
              {!mounted ? (
                <div className="w-[100px] h-9" />
              ) : isLoggedIn ? (
                <div className="flex items-center justify-end lg:mr-4">
                  {/* Balance Display */}
                  <Link
                    href="/app/carteira"
                    className="mr-5 flex h-[46px] items-center justify-center rounded-lg px-3 ease-out hover:bg-black/[6%] hover:dark:bg-white/5"
                  >
                    <div className="flex flex-col items-center -space-y-[3px]">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#606E85] dark:text-[#A1A7BB]">
                        Saldo
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7.86016 5.36016C7.60448 5.38964 7.41152 5.60612 7.41152 5.8635C7.41152 6.12087 7.60448 6.33736 7.86016 6.36683C7.9945 6.36869 8.12379 6.31569 8.21815 6.22007C8.31252 6.12444 8.36381 5.99446 8.36016 5.86016C8.35657 5.58552 8.1348 5.36375 7.86016 5.36016Z" fill="#A1A7BB" />
                          <path d="M7.86016 7.28016C7.72701 7.27835 7.59877 7.33045 7.50461 7.42461C7.41045 7.51877 7.35835 7.64701 7.36016 7.78016V9.86016C7.36016 10.1363 7.58402 10.3602 7.86016 10.3602C8.1363 10.3602 8.36016 10.1363 8.36016 9.86016V7.7935C8.36376 7.65859 8.31268 7.52796 8.21851 7.43129C8.12435 7.33462 7.99511 7.28011 7.86016 7.28016Z" fill="#A1A7BB" />
                          <path fillRule="evenodd" clipRule="evenodd" d="M7.86016 1.3335C4.25711 1.33717 1.33717 4.25711 1.3335 7.86016C1.3335 11.4647 4.25558 14.3868 7.86016 14.3868C11.4647 14.3868 14.3868 11.4647 14.3868 7.86016C14.3832 4.25711 11.4632 1.33717 7.86016 1.3335ZM7.86016 13.3868C4.80787 13.3868 2.3335 10.9125 2.3335 7.86016C2.3335 4.80787 4.80787 2.3335 7.86016 2.3335C10.9125 2.3335 13.3868 4.80787 13.3868 7.86016C13.3832 10.9109 10.9109 13.3832 7.86016 13.3868Z" fill="#A1A7BB" />
                        </svg>
                      </span>
                      <span className="truncate font-semibold text-[#00C805] max-sm:text-sm">
                        {balanceFormatted}
                      </span>
                    </div>
                  </Link>

                  {/* Deposit Button */}
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => setDepositModalOpen(true)}
                      className="flex items-center"
                    >
                      <div className="relative z-10 block rounded-lg bg-[#0052FF] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#004AE5] transition-colors">
                        Depositar
                      </div>
                    </button>
                  </div>

                  {/* Avatar Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="relative cursor-pointer z-20 flex items-center gap-x-2.5 ml-2.5">
                        <div className="bg-black/5 dark:bg-transparent rounded-full p-0">
                          <div className="hidden items-center justify-center rounded-full lg:flex">
                            <Avatar className="h-[34px] w-[34px]">
                              <AvatarFallback className="bg-[#eb9947] text-white font-bold">
                                {user?.full_name?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <button className="flex size-[34px] items-center justify-center rounded-full">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="dark:text-white text-black">
                                <path d="M9.96004 4.47501L6.70004 7.73501C6.31504 8.12001 5.68504 8.12001 5.30004 7.73501L2.04004 4.47501" stroke="currentColor" strokeWidth="1.28571" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
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
                  <button
                    onClick={() => openAuthModal('LOGIN')}
                    className="px-4 py-2 text-[13px] font-semibold text-[#0052FF] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => openAuthModal('REGISTER')}
                    className="px-4 py-2.5 text-[13px] font-semibold text-white bg-[#0052FF] hover:bg-[#004AE5] rounded-lg transition-colors"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[60px]" />

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
    </>
  )
}
