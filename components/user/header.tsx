'use client'

import React, { Suspense, useCallback, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
          <div className="mx-auto flex h-full max-h-[60px] min-h-[60px] items-center justify-between px-4 md:px-12 lg:px-24 xl:px-[140px] 2xl:px-[256px]">
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
                <div className="flex items-center justify-end lg:mr-4">
                  {/* Unified Balance & Deposit Pill */}
                  <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-xl p-1 mr-4 border border-black/5 dark:border-white/5">
                    <Link
                      href="/app/carteira"
                      className="flex items-center justify-center rounded-lg px-3 py-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-brand/10 text-brand">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.86016 5.36016C7.60448 5.38964 7.41152 5.60612 7.41152 5.8635C7.41152 6.12087 7.60448 6.33736 7.86016 6.36683C7.9945 6.36869 8.12379 6.31569 8.21815 6.22007C8.31252 6.12444 8.36381 5.99446 8.36016 5.86016C8.35657 5.58552 8.1348 5.36375 7.86016 5.36016Z" fill="currentColor" />
                            <path d="M7.86016 7.28016C7.72701 7.27835 7.59877 7.33045 7.50461 7.42461C7.41045 7.51877 7.35835 7.64701 7.36016 7.78016V9.86016C7.36016 10.1363 7.58402 10.3602 7.86016 10.3602C8.1363 10.3602 8.36016 10.1363 8.36016 9.86016V7.7935C8.36376 7.65859 8.31268 7.52796 8.21851 7.43129C8.12435 7.33462 7.99511 7.28011 7.86016 7.28016Z" fill="currentColor" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M7.86016 1.3335C4.25711 1.33717 1.33717 4.25711 1.3335 7.86016C1.3335 11.4647 4.25558 14.3868 7.86016 14.3868C11.4647 14.3868 14.3868 11.4647 14.3868 7.86016C14.3832 4.25711 11.4632 1.33717 7.86016 1.3335ZM7.86016 13.3868C4.80787 13.3868 2.3335 10.9125 2.3335 7.86016C2.3335 4.80787 4.80787 2.3335 7.86016 2.3335C10.9125 2.3335 13.3868 4.80787 13.3868 7.86016C13.3832 10.9109 10.9109 13.3832 7.86016 13.3868Z" fill="currentColor" />
                          </svg>
                        </span>
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
                      <div className="relative cursor-pointer z-20 flex items-center gap-x-2 ml-2.5">
                        <div className="relative flex w-fit items-center justify-center rounded-full bg-brand/20 p-[2px] transition-colors hover:bg-brand/40">
                          <div className="rounded-full bg-white p-0.5 dark:bg-[#12121a]">
                            <Avatar className="h-[32px] w-[32px]">
                              <AvatarFallback className="bg-brand/10 text-brand font-bold text-xs uppercase">
                                {user?.full_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        <button className="flex size-[20px] items-center justify-center rounded-full">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="dark:text-white text-black">
                            <path d="M9.96004 4.47501L6.70004 7.73501C6.31504 8.12001 5.68504 8.12001 5.30004 7.73501L2.04004 4.47501" stroke="currentColor" strokeWidth="1.28571" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-[260px] p-0 border-black/20 dark:border-white/5 bg-white dark:bg-[#1C1F25] shadow-[0_8px_20px_rgba(0,0,0,0.3)] rounded-lg"
                      align="end"
                      forceMount
                    >
                      {/* Profile Header */}
                      <div className="flex items-center gap-3 px-4 py-4">
                        <div className="relative flex w-fit items-center justify-center rounded-full bg-brand/20 p-[2px]">
                          <div className="rounded-full bg-white p-0.5 dark:bg-[#12121a]">
                            <Avatar className="h-[46px] w-[46px]">
                              <AvatarFallback className="bg-brand/10 text-brand font-bold text-lg uppercase">
                                {user?.full_name?.[0] || 'U'}
                              </AvatarFallback>
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
                      <div className="border-t border-black/10 dark:border-white/5">
                        <div className="flex flex-col px-1 pt-1.5 pb-1.5">
                          {/* Perfil */}
                          <DropdownMenuItem
                            onClick={() => router.push(`/u/${user?.id}`)}
                            className="flex h-12 w-full items-center gap-2 rounded-lg px-4 text-sm font-medium text-black dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5">
                              <path d="M10 2.49951C11.8408 2.49969 13.333 3.99266 13.333 5.8335C13.3328 7.67419 11.8407 9.16633 10 9.1665C8.15916 9.1665 6.66619 7.6743 6.66602 5.8335C6.66602 3.99255 8.15905 2.49951 10 2.49951Z" fill="#afb6c2" stroke="#afb6c2" strokeWidth="1.66667" />
                              <path d="M9.99981 12.0835C5.8248 12.0835 2.4248 14.8835 2.4248 18.3335C2.4248 18.5668 2.60814 18.7502 2.84147 18.7502H17.1581C17.3915 18.7502 17.5748 18.5668 17.5748 18.3335C17.5748 14.8835 14.1748 12.0835 9.99981 12.0835Z" fill="#afb6c2" />
                            </svg>
                            <span>Perfil</span>
                          </DropdownMenuItem>

                          {/* Modo Escuro */}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              const newDarkMode = !isDarkMode
                              setIsDarkMode(newDarkMode)
                              document.documentElement.classList.toggle('dark')
                              localStorage.setItem('darkMode', String(newDarkMode))
                            }}
                            className="flex h-12 w-full items-center gap-2 rounded-lg px-4 text-sm font-medium text-black dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5">
                              <path d="M8.08203 2.50586C8.11142 2.51122 8.12666 2.51905 8.13281 2.52246C8.13953 2.5262 8.14348 2.52924 8.14453 2.53027C8.13617 2.52185 8.14884 2.52895 8.15625 2.57129C8.16404 2.61591 8.17774 2.77023 8.04492 3.0752L8.04395 3.07715C7.62208 4.05212 7.41699 5.08203 7.41699 6.1416V6.14551C7.4264 8.06421 8.17883 9.83211 9.3877 11.1807V11.1797C10.7546 12.7135 12.7187 13.7121 14.8936 13.8066V13.8076C15.4886 13.836 16.0764 13.7875 16.6455 13.6865H16.6465C16.9953 13.6242 17.154 13.6731 17.2002 13.6924C17.2166 13.6992 17.2259 13.7056 17.2305 13.709L17.2363 13.7188C17.2382 13.7255 17.2407 13.7404 17.2393 13.7656C17.236 13.82 17.2091 13.9856 17.0039 14.2725C15.512 16.2992 13.1455 17.4911 10.6172 17.4912C10.5142 17.4912 10.4063 17.4852 10.2686 17.4766L10.2598 17.4756H10.25C9.50099 17.4456 8.77335 17.303 8.08203 17.0625H8.08105C5.26615 16.0875 3.13423 13.5513 2.7998 10.5859L2.77344 10.2979C2.54945 6.99856 4.45051 3.91392 7.53125 2.61816L7.53027 2.61719C7.85737 2.48187 8.0267 2.49582 8.08203 2.50586Z" fill="#afb6c2" stroke="#afb6c2" strokeWidth="1.66667" />
                            </svg>
                            <div className="flex w-full items-center justify-between">
                              <span>Modo Escuro</span>
                              <div className={`ml-auto flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-brand' : 'bg-black/10'}`}>
                                <span className={`size-4 rounded-full shadow-md transition-transform duration-300 bg-white ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                              </div>
                            </div>
                          </DropdownMenuItem>

                          {/* Como Funciona? */}
                          <DropdownMenuItem
                            onClick={() => router.push('/como-funciona')}
                            className="flex h-12 w-full items-center gap-2 rounded-lg px-4 text-sm font-medium text-black dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5">
                              <path d="M17 2.42969H7C4 2.42969 2 4.42969 2 7.42969V13.4297C2 16.4297 4 18.4297 7 18.4297V20.5597C7 21.3597 7.89 21.8397 8.55 21.3897L13 18.4297H17C20 18.4297 22 16.4297 22 13.4297V7.42969C22 4.42969 20 2.42969 17 2.42969ZM12 14.5997C11.58 14.5997 11.25 14.2597 11.25 13.8497C11.25 13.4397 11.58 13.0997 12 13.0997C12.42 13.0997 12.75 13.4397 12.75 13.8497C12.75 14.2597 12.42 14.5997 12 14.5997ZM13.26 10.4497C12.87 10.7097 12.75 10.8797 12.75 11.1597V11.3697C12.75 11.7797 12.41 12.1197 12 12.1197C11.59 12.1197 11.25 11.7797 11.25 11.3697V11.1597C11.25 9.99969 12.1 9.42969 12.42 9.20969C12.79 8.95969 12.91 8.78969 12.91 8.52969C12.91 8.02969 12.5 7.61969 12 7.61969C11.5 7.61969 11.09 8.02969 11.09 8.52969C11.09 8.93969 10.75 9.27969 10.34 9.27969C9.93 9.27969 9.59 8.93969 9.59 8.52969C9.59 7.19969 10.67 6.11969 12 6.11969C13.33 6.11969 14.41 7.19969 14.41 8.52969C14.41 9.66969 13.57 10.2397 13.26 10.4497Z" fill="#afb6c2" />
                            </svg>
                            <span>Como Funciona?</span>
                          </DropdownMenuItem>

                          {/* Ajuda */}
                          <DropdownMenuItem
                            onClick={() => router.push('/ajuda')}
                            className="flex h-12 w-full items-center gap-2 rounded-lg px-4 text-sm font-medium text-black dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5">
                              <path d="M12 1.33301H4C2.89333 1.33301 2 2.21967 2 3.31301V10.5863C2 11.6797 2.89333 12.5663 4 12.5663H4.50667C5.04 12.5663 5.54667 12.773 5.92 13.1463L7.06 14.273C7.58 14.7863 8.42667 14.7863 8.94667 14.273L10.0867 13.1463C10.46 12.773 10.9733 12.5663 11.5 12.5663H12C13.1067 12.5663 14 11.6797 14 10.5863V3.31301C14 2.21967 13.1067 1.33301 12 1.33301ZM6.92 8.67301C7.19333 8.67301 7.42 8.89967 7.42 9.17301C7.42 9.44634 7.19333 9.67301 6.92 9.67301H5.13333C4.84 9.67301 4.56667 9.53301 4.39333 9.29301C4.22667 9.06634 4.18667 8.78634 4.26667 8.51967C4.5 7.80634 5.07333 7.41967 5.58 7.07301C6.11333 6.71301 6.41333 6.48634 6.41333 6.09967C6.41333 5.75301 6.13333 5.47301 5.78667 5.47301C5.44 5.47301 5.16667 5.75967 5.16667 6.10634C5.16667 6.37967 4.94 6.60634 4.66667 6.60634C4.39333 6.60634 4.16667 6.37967 4.16667 6.10634C4.16667 5.21301 4.89333 4.47967 5.79333 4.47967C6.69333 4.47967 7.42 5.20634 7.42 6.10634C7.42 7.04634 6.71333 7.52634 6.14667 7.91301C5.79333 8.15301 5.46 8.37967 5.29333 8.67968H6.92V8.67301ZM11.3333 8.71967H11.1933V9.17968C11.1933 9.45301 10.9667 9.67968 10.6933 9.67968C10.42 9.67968 10.1933 9.45301 10.1933 9.17968V8.71967H8.88667C8.88667 8.71967 8.88667 8.71967 8.88 8.71967C8.55333 8.71967 8.25333 8.54634 8.08667 8.26634C7.92 7.97967 7.92 7.62634 8.08667 7.34634C8.54 6.56634 9.06667 5.67967 9.54667 4.90634C9.76 4.56634 10.1667 4.41301 10.5467 4.51967C10.9267 4.63301 11.1933 4.97967 11.1867 5.37967V7.72634H11.3333C11.6067 7.72634 11.8333 7.95301 11.8333 8.22634C11.8333 8.49967 11.6067 8.71967 11.3333 8.71967Z" fill="#afb6c2" />
                              <path d="M10.1935 7.72074V5.76074C9.80019 6.40074 9.39352 7.08741 9.02686 7.71408H10.1935V7.72074Z" fill="#afb6c2" />
                            </svg>
                            <span>Ajuda</span>
                          </DropdownMenuItem>
                        </div>
                      </div>

                      {/* Desconectar */}
                      <div className="border-t border-black/10 dark:border-white/5 px-1 py-1.5">
                        <DropdownMenuItem
                          onClick={() => logout()}
                          className="flex h-12 w-full items-center gap-2 rounded-lg px-4 text-sm font-medium text-[#606E85] dark:text-white cursor-pointer hover:bg-black/5 hover:shadow dark:hover:bg-white/5"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5">
                            <path d="M6 1.6665H8.16667C10.8333 1.6665 12.5 3.33317 12.5 5.99984V9.37484H7.29167C6.95 9.37484 6.66667 9.65817 6.66667 9.99984C6.66667 10.3415 6.95 10.6248 7.29167 10.6248H12.5V13.9998C12.5 16.6665 10.8333 18.3332 8.16667 18.3332H6.00833C3.34167 18.3332 1.675 16.6665 1.675 13.9998V5.99984C1.66667 3.33317 3.33333 1.6665 6 1.6665Z" fill="#afb6c2" />
                            <path d="M16.1998 9.37503L14.4748 7.65003C14.3498 7.52503 14.2915 7.3667 14.2915 7.20837C14.2915 7.05003 14.3498 6.88337 14.4748 6.7667C14.7165 6.52503 15.1165 6.52503 15.3581 6.7667L18.1498 9.55837C18.3915 9.80003 18.3915 10.2 18.1498 10.4417L15.3581 13.2334C15.1165 13.475 14.7165 13.475 14.4748 13.2334C14.2331 12.9917 14.2331 12.5917 14.4748 12.35L16.1998 10.625H12.4998V9.37503H16.1998V9.37503Z" fill="#afb6c2" />
                          </svg>
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
