'use client'

import React, { Suspense, useCallback, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  User as UserIcon,
  Users,
  CreditCard,
  Settings,
  Info,
  LogOut,
  Moon,
  Sun,
  Plus,
  Share2
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth-context'
import { SubHeader } from './sub-header'
import { AuthModal } from '@/components/auth/auth-modal'
import { DepositModal } from '@/components/wallet/deposit-modal'
import { Logo } from '@/components/ui/logo'

function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Hotkey "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-10 w-full relative items-center rounded-lg transition-all border border-transparent ease-in hover:bg-black/10 hover:dark:bg-white/10 bg-black/5 dark:bg-white/5 p-3 text-sm">
      <div className="flex w-full flex-1 items-center gap-x-1.5">
        <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.631 4.47459C9.79903 2.47688 7.84973 1.17334 5.68572 1.16756C3.35344 1.15527 1.27964 2.64918 0.552616 4.86529C-0.174403 7.08139 0.611446 9.51344 2.49776 10.8851C4.38408 12.2568 6.93994 12.2548 8.82405 10.8801L12.032 14.2691C12.2029 14.4397 12.4796 14.4397 12.6504 14.2691C12.821 14.0983 12.821 13.8216 12.6504 13.6508L9.49489 10.3142C11.0151 8.77413 11.4629 6.47229 10.631 4.47459ZM9.85097 8.2661C9.15245 9.94941 7.50821 11.0458 5.68572 11.0434V11.0201C3.21222 11.0169 1.20424 9.01934 1.18822 6.54589C1.18586 4.7234 2.2822 3.07916 3.96551 2.38064C5.64882 1.68211 7.58719 2.06703 8.87589 3.35572C10.1646 4.64442 10.5495 6.5828 9.85097 8.2661Z" fill="#606e85" stroke="#606e85" strokeWidth="0.571429" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Pesquisar por Mercados, Tópicos..."
          className="flex w-full bg-transparent pb-0.5 text-xs text-black placeholder:text-[13px] placeholder:text-[#606E85] dark:text-white dark:placeholder:text-[#A1A7BB] lg:text-base outline-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="absolute right-2 top-1/2 hidden size-[22px] -translate-y-1/2 items-center justify-center rounded bg-black/10 dark:bg-white/10 text-[#606E85] dark:text-[#A1A7BB] text-xs lg:flex cursor-pointer" onClick={() => inputRef.current?.focus()}>
        /
      </div>
    </div>
  )
}

export function UserHeader() {
  const router = useRouter()
  const { user, isAuthenticated, isOtpVerified, isLoading, logout } = useAuth()

  const [mounted, setMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: 'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT_PASSWORD' }>({
    isOpen: false,
    view: 'LOGIN',
  })
  const [depositModalOpen, setDepositModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      document.documentElement.classList.add('dark')
      setIsDarkMode(true)
    } else if (savedDarkMode === 'false') {
      document.documentElement.classList.remove('dark')
      setIsDarkMode(false)
    } else {
      // Check system preference if no saved preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      }
    }
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
        className="fixed left-0 lg:h-[60px] place-content-center top-0 bg-background z-30 w-full"
      >
        <div>
          <div className="mx-auto flex h-full max-h-[60px] min-h-[60px] items-center justify-between px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-24">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Logo width={100} height={34} />
            </div>

            {/* Center: Search - Hidden on mobile - Absolutely centered */}
            <div className="hidden xl:flex absolute left-1/2 -translate-x-1/2 w-full max-w-[500px] px-8">
              <div className="relative w-full">
                <Suspense fallback={null}>
                  <SearchInput />
                </Suspense>
              </div>
            </div>

            {/* Right: Balance, Deposit, Avatar */}
            <div className="flex w-full items-center justify-end lg:w-auto lg:justify-start">
              {!mounted ? (
                <div className="w-[100px] h-9" />
              ) : isLoggedIn ? (
                <div className="flex items-center justify-end">
                  {/* Unified Balance & Deposit Pill */}
                  <div className="flex items-center hover:bg-black/10 hover:dark:bg-white/10 bg-black/5 dark:bg-white/5 rounded-lg p-1 border border-transparent">
                    <Link
                      href="/app/carteira"
                      className="flex items-center justify-center rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-black dark:text-white text-sm">
                          {balanceFormatted}
                        </span>
                      </div>
                    </Link>

                    <button
                      onClick={() => setDepositModalOpen(true)}
                      className="ml-1 flex items-center justify-center rounded-lg bg-brand px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand/90 shadow-sm"
                    >
                      Depositar
                    </button>
                  </div>

                  {/* Avatar Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="relative cursor-pointer z-20 flex items-center gap-x-2 ml-4">
                        <div className="relative flex w-fit items-center justify-center rounded-full p-[2px] whitespace-nowrap">
                          <div className="rounded-full bg-white p-0.5 dark:bg-[#12121a] ring-1 ring-black/5 dark:ring-white/10">
                            <Avatar className="h-[32px] w-[32px]">
                              {user?.avatar_url ? (
                                <img
                                  src={user.avatar_url.replace('w=256_h=256_q=80', 'w=64_h=64_q=70')}
                                  alt={user.full_name || 'U'}
                                  className="h-full w-full object-cover rounded-full"
                                />
                              ) : (
                                <AvatarFallback className="bg-brand/10 text-brand font-bold text-xs uppercase">
                                  {user?.full_name?.[0] || 'U'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-black dark:text-white hidden sm:block">
                          {user?.full_name?.split(' ')[0] || 'Usuário'}
                        </span>
                        <div className="flex h-[20px] w-[20px] items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="dark:text-white text-black opacity-70">
                            <path d="M9.96004 4.47501L6.70004 7.73501C6.31504 8.12001 5.68504 8.12001 5.30004 7.73501L2.04004 4.47501" stroke="currentColor" strokeWidth="1.28571" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-[280px] p-0 border-black/10 dark:border-white/5 bg-white dark:bg-[#1C1F25] shadow-[0_10px_30px_rgba(0,0,0,0.15)] rounded-[20px] overflow-hidden"
                      align="end"
                      forceMount
                    >
                      {/* Profile Header */}
                      <div className="flex items-center gap-3 px-4 py-4">
                        <div className="relative flex w-fit items-center justify-center rounded-full bg-brand/20 p-[2px]">
                          <div className="rounded-full bg-white p-0.5 dark:bg-[#12121a]">
                            <Avatar className="h-[46px] w-[46px]">
                              {user?.avatar_url ? (
                                <img
                                  src={user.avatar_url.replace('w=256_h=256_q=80', 'w=128_h=128_q=70')}
                                  alt={user.full_name || 'U'}
                                  className="h-full w-full object-cover rounded-full"
                                />
                              ) : (
                                <AvatarFallback className="bg-brand/10 text-brand font-bold text-lg uppercase">
                                  {user?.full_name?.[0] || 'U'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center">
                          <div className="mb-1 flex items-center justify-start gap-2">
                            <span className="text-base font-semibold leading-none text-black dark:text-white">
                              {user?.full_name?.split(' ')[0] || 'Usuário'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (user?.id) {
                                navigator.clipboard.writeText(user.id.slice(0, 4) + '...' + user.id.slice(-4))
                              }
                            }}
                            className="flex w-fit items-center gap-2 rounded bg-black/[6%] px-2 py-1 dark:bg-white/[6%]"
                          >
                            <span className="text-[10px] font-medium text-[#606E85] dark:text-[#A1A7BB]">
                              {user?.id ? `${user.id.slice(0, 4)}...${user.id.slice(-4)}` : '----'}
                            </span>
                            <svg width="10" height="10" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clipPath="url(#clip0_copy)">
                                <path d="M12 9.675V12.825C12 15.45 10.95 16.5 8.325 16.5H5.175C2.55 16.5 1.5 15.45 1.5 12.825V9.675C1.5 7.05 2.55 6 5.175 6H8.325C10.95 6 12 7.05 12 9.675Z" stroke="#A1A7BB" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16.5 5.175V8.325C16.5 10.95 15.45 12 12.825 12H12V9.675C12 7.05 10.95 6 8.325 6H6V5.175C6 2.55 7.05 1.5 9.675 1.5H12.825C15.45 1.5 16.5 2.55 16.5 5.175Z" stroke="#A1A7BB" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
                              </g>
                              <defs>
                                <clipPath id="clip0_copy">
                                  <rect width="18" height="18" fill="#fff" />
                                </clipPath>
                              </defs>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="flex flex-col p-1.5 gap-0.5">
                        {/* Perfil */}
                        <DropdownMenuItem
                          onClick={() => router.push(`/profile/${user?.id}`)}
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-black dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5 outline-none transition-colors"
                        >
                          <UserIcon className="size-5 text-black/50 dark:text-white/50" />
                          <span>Perfil</span>
                        </DropdownMenuItem>


                        {/* Configurações */}
                        <DropdownMenuItem
                          onClick={() => router.push('/configuracoes')}
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-black dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5 outline-none transition-colors"
                        >
                          <Settings className="size-5 text-black/50 dark:text-white/50" />
                          <span>Configurações</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1.5 bg-black/5 dark:bg-white/5" />

                        {/* Modo Escuro */}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            const newDarkMode = !isDarkMode
                            setIsDarkMode(newDarkMode)
                            document.documentElement.classList.toggle('dark')
                            localStorage.setItem('darkMode', String(newDarkMode))
                          }}
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-black dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5 outline-none transition-colors"
                        >
                          {isDarkMode ? (
                            <Moon className="size-5 text-black/50 dark:text-white/50" />
                          ) : (
                            <Sun className="size-5 text-black/50 dark:text-white/50" />
                          )}
                          <div className="flex w-full items-center justify-between">
                            <span>Modo Escuro</span>
                            <div className={`ml-auto flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-brand' : 'bg-black/10'}`}>
                              <span className={`size-3.5 rounded-full shadow-md transition-transform duration-300 bg-white ${isDarkMode ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                            </div>
                          </div>
                        </DropdownMenuItem>

                        {/* Ajuda */}
                        <DropdownMenuItem
                          onClick={() => router.push('/ajuda')}
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-black dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5 outline-none transition-colors"
                        >
                          <Info className="size-5 text-black/50 dark:text-white/50" />
                          <span>Centro de ajuda</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1.5 bg-black/5 dark:bg-white/5" />

                        {/* Logout */}
                        <DropdownMenuItem
                          onClick={() => logout()}
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-black/50 dark:text-white/50 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5 outline-none transition-colors"
                        >
                          <LogOut className="size-5" />
                          <span>Desconectar</span>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAuthModal('LOGIN')}
                    className="px-4 py-2 text-[13px] font-semibold text-brand hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => openAuthModal('REGISTER')}
                    className="px-4 py-2.5 text-[13px] font-semibold text-white bg-brand hover:bg-brand/90 rounded-lg transition-colors"
                  >
                    Cadastre-se
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[60px]" />

      <Suspense fallback={null}>
        <SubHeader />
      </Suspense>

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
