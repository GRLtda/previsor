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
import { UserAvatar } from '@/components/shared/user-avatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { SubHeader } from './sub-header'
import { AuthModal } from '@/components/auth/auth-modal'
import { DepositModal } from '@/components/wallet/deposit-modal'
import { Logo } from '@/components/ui/logo'
import { userApi } from '@/lib/api/client'
import { Event } from '@/lib/types'
import { DynamicIcon } from '@/components/ui/dynamic-icon'

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
  const debouncedValue = useDebounce(value, 300)

  // Dropdown state
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'markets' | 'profiles'>('markets')
  const [isSearching, setIsSearching] = useState(false)
  const [markets, setMarkets] = useState<Event[]>([])
  const [profiles, setProfiles] = useState<any[]>([])

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

  const handleSearchSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    if (value.trim()) {
      setIsOpen(false)
      if (activeTab === 'markets') {
        router.push(`/eventos?${createQueryString('search', value.trim())}`)
      } else {
        // Just keep the state, clicking a profile directly works, 
        // there is no dedicated search-all-profiles page.
      }
    }
  }

  // Fetch data when debounced value or active tab changes
  useEffect(() => {
    if (!debouncedValue.trim()) {
      setMarkets([])
      setProfiles([])
      setIsSearching(false)
      return
    }

    const fetchResults = async () => {
      setIsSearching(true)
      try {
        if (activeTab === 'markets') {
          const res = await userApi.getEvents({ title: debouncedValue, limit: 5 })
          setMarkets(res.events || [])
        } else {
          const res = await userApi.searchPublicProfiles(debouncedValue, 5)
          if (res.success) {
            setProfiles(res.data.users || [])
          }
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    fetchResults()
  }, [debouncedValue, activeTab])

  // Click outside to close
  const dropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    <div className="w-full relative">
      <div
        className={cn(
          "flex h-[42px] w-full relative items-center transition-all ease-in border text-sm rounded-lg",
          isOpen
            ? "border-white/10 bg-black/5 dark:bg-white/5"
            : "border-transparent hover:bg-black/10 hover:dark:bg-white/10 bg-black/5 dark:bg-white/5"
        )}
      >
        <div className="flex w-full flex-1 items-center gap-x-3 px-3">
          <svg width="15" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#606E85] dark:text-[#A1A7BB]">
            <path fillRule="evenodd" clipRule="evenodd" d="M10.631 4.47459C9.79903 2.47688 7.84973 1.17334 5.68572 1.16756C3.35344 1.15527 1.27964 2.64918 0.552616 4.86529C-0.174403 7.08139 0.611446 9.51344 2.49776 10.8851C4.38408 12.2568 6.93994 12.2548 8.82405 10.8801L12.032 14.2691C12.2029 14.4397 12.4796 14.4397 12.6504 14.2691C12.821 14.0983 12.821 13.8216 12.6504 13.6508L9.49489 10.3142C11.0151 8.77413 11.4629 6.47229 10.631 4.47459ZM9.85097 8.2661C9.15245 9.94941 7.50821 11.0458 5.68572 11.0434V11.0201C3.21222 11.0169 1.20424 9.01934 1.18822 6.54589C1.18586 4.7234 2.2822 3.07916 3.96551 2.38064C5.64882 1.68211 7.58719 2.06703 8.87589 3.35572C10.1646 4.64442 10.5495 6.5828 9.85097 8.2661Z" fill="currentColor" stroke="currentColor" strokeWidth="0.571429" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Pesquisar por Mercados, Perfis..."
            className="flex w-full bg-transparent text-sm text-black placeholder:text-[14px] placeholder:font-medium placeholder:text-[#606E85] dark:text-white dark:placeholder:text-[#6b7280] outline-none"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={() => {
              if (value.trim()) setIsOpen(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit(e)
              }
            }}
          />
        </div>
        {!isOpen && (
          <div className="absolute right-2 top-1/2 hidden size-[22px] -translate-y-1/2 items-center justify-center rounded bg-black/10 dark:bg-white/10 text-[#606E85] dark:text-[#A1A7BB] text-xs lg:flex cursor-pointer" onClick={() => inputRef.current?.focus()}>
            /
          </div>
        )}
        {isOpen && (
          <button
            onClick={() => {
              setIsOpen(false)
              setValue('')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606E85] hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && value.trim() && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-[48px] w-full bg-background border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col"
        >
          {/* Tabs */}
          <div className="flex px-4 pt-4 pb-2">
            <button
              onClick={() => setActiveTab('markets')}
              onMouseDown={(e) => e.preventDefault()}
              className={cn(
                "px-3.5 py-1.5 text-[14px] font-bold transition-all duration-200 rounded-lg relative",
                activeTab === 'markets'
                  ? "text-white bg-white/10"
                  : "text-[#8E9AAE] hover:text-white hover:bg-white/5"
              )}
            >
              Markets
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              onMouseDown={(e) => e.preventDefault()}
              className={cn(
                "px-3.5 py-1.5 text-[14px] font-bold transition-all duration-200 rounded-lg relative ml-2",
                activeTab === 'profiles'
                  ? "text-white bg-white/10"
                  : "text-[#8E9AAE] hover:text-white hover:bg-white/5"
              )}
            >
              Profiles
            </button>
          </div>

          <div className="h-[1px] w-full bg-white/5 mt-1" />

          {/* List Content */}
          <div className="flex flex-col overflow-y-auto max-h-[460px] pb-2">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : activeTab === 'markets' ? (
              markets.length > 0 ? (
                <div className="flex flex-col">
                  {markets.map((market) => (
                    <Link
                      key={market.id}
                      href={`/eventos/${market.slug || market.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors"
                    >
                      {/* Market Icon */}
                      <div className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-[#22252C] overflow-hidden border border-white/5">
                        {market.imageUrl ? (
                          <img src={market.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <DynamicIcon name={(market as any).category?.icon || 'LayoutGrid'} className="size-6 text-white/50" />
                        )}
                      </div>

                      {/* Market Details */}
                      <div className="flex flex-col flex-1 min-w-0 pr-3">
                        <span className="text-[15px] font-bold text-white leading-tight line-clamp-2">
                          {market.title}
                        </span>
                      </div>

                      {/* Market Stats */}
                      {market.markets && market.markets[0] && (
                        <div className="flex flex-col items-end shrink-0 justify-center">
                          <span className="text-[18px] font-bold text-white tracking-tight leading-none mb-1.5">
                            {Math.round(market.markets[0].probYes)}%
                          </span>
                          <span className="text-[12px] font-medium text-[#8E9AAE] leading-none text-right line-clamp-1 max-w-[80px]">
                            {market.markets[0].statement || 'Sim'}
                          </span>
                        </div>
                      )}
                    </Link>
                  ))}

                  {/* See all results link */}
                  <div className="px-4 py-3 mt-1">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-[14px] font-semibold text-[#0099FF] hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      See all results
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-[#8E9AAE]">
                  Nenhum mercado encontrado
                </div>
              )
            ) : (
              profiles.length > 0 ? (
                <div className="flex flex-col">
                  {profiles.map((profile) => (
                    <Link
                      key={profile.userId}
                      href={profile.nickname ? `/@${profile.nickname}` : `/profile/${profile.userId}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors"
                    >
                      {/* Avatar */}
                      <UserAvatar
                        src={profile.avatar_url}
                        fallback={profile.display_name?.[0]?.toUpperCase() || 'U'}
                        size={42}
                        showRing={true}
                        gapClassName="bg-[#12121a]" // Blend with dropdown background
                      />

                      {/* Info */}
                      <div className="flex flex-col flex-1 min-w-0 pr-3 justify-center">
                        <span className="text-[15px] font-bold text-white leading-tight">
                          {profile.nickname ? `@${profile.nickname}` : `@${profile.userId.slice(0, 8)}`}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-[#8E9AAE]">
                  Nenhum perfil encontrado
                </div>
              )
            )}
          </div>
        </div>
      )}
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
        className="fixed left-0 lg:h-[60px] place-content-center top-0 bg-background z-40 w-full"
      >
        <div>
          <div className="mx-auto flex h-full max-h-[60px] min-h-[60px] items-center justify-between px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-24">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Logo width={100} height={34} />
            </div>

            {/* Center: Search - Hidden on mobile - Absolutely centered */}
            <div className="hidden xl:flex absolute left-1/2 -translate-x-1/2 w-full max-w-[560px] px-8">
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
                        <UserAvatar
                          src={user?.avatar_url?.replace('w=256_h=256_q=80', 'w=64_h=64_q=70')}
                          fallback={user?.full_name?.[0] || 'U'}
                          size={36}
                          showRing={true}
                          gapClassName="bg-[#0B0B0F]" // Blend with header background
                        />
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
                        <UserAvatar
                          src={user?.avatar_url?.replace('w=256_h=256_q=80', 'w=128_h=128_q=70')}
                          fallback={user?.full_name?.[0] || 'U'}
                          size={52}
                          showRing={true}
                          gapClassName="bg-[#12121a]" // Blend with dropdown background
                        />
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
