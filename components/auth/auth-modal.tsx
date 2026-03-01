'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { OtpForm } from './otp-form'
import { ForgotPasswordForm } from './forgot-password-form'
import { ResetPasswordForm } from './reset-password-form'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { userApi } from '@/lib/api/client'
import type { Banner } from '@/lib/types'

type AuthView = 'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'

interface AuthModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    defaultView?: AuthView
    resetToken?: string
    children?: React.ReactNode
}

export function AuthModal({ isOpen, onOpenChange, defaultView = 'LOGIN', resetToken, children }: AuthModalProps) {
    const [view, setView] = useState<AuthView>(defaultView)
    const [email, setEmail] = useState('')
    const [loginBanner, setLoginBanner] = useState<Banner | null>(null)
    const [registerBanner, setRegisterBanner] = useState<Banner | null>(null)

    // Reset view when modal opens
    useEffect(() => {
        if (isOpen) {
            setView(defaultView)

            // Fetch banners for Auth
            userApi.getBanners({ placement: 'modal_login' }).then(res => {
                setLoginBanner(res.data.banners.find(b => b.isActive) || null)
            }).catch(console.error)

            userApi.getBanners({ placement: 'modal_register' }).then(res => {
                setRegisterBanner(res.data.banners.find(b => b.isActive) || null)
            }).catch(console.error)
        }
    }, [isOpen, defaultView])

    const handleLoginSuccess = () => {
        onOpenChange(false)
    }

    const handleRegisterSuccess = (email: string) => {
        setEmail(email)
        setView('OTP')
    }

    const handleOtpRequired = (email: string) => {
        setEmail(email)
        setView('OTP')
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[420px] w-full h-[100dvh] sm:h-auto p-0 gap-0 bg-background border-none sm:border border-border shadow-2xl duration-200 flex flex-col rounded-none sm:rounded-2xl top-0 left-0 translate-x-0 translate-y-0 max-w-full sm:top-[50%] sm:left-[50%] sm:-translate-x-1/2 sm:-translate-y-1/2" showCloseButton={true}>
                <DialogTitle className="sr-only">Autenticação</DialogTitle>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6 sm:pb-8 flex flex-col justify-center sm:block pt-12 sm:pt-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-sm mx-auto"
                        >
                            {(() => {
                                const banner = view === 'LOGIN' ? loginBanner : view === 'REGISTER' ? registerBanner : null;
                                if (!banner) return null;
                                return (
                                    <div className="mb-6 w-full rounded-xl overflow-hidden">
                                        {banner.linkUrl ? (
                                            <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer">
                                                <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-auto object-cover" />
                                            </a>
                                        ) : (
                                            <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-auto object-cover" />
                                        )}
                                    </div>
                                )
                            })()}

                            {view === 'LOGIN' && (
                                <LoginForm
                                    onSuccess={handleLoginSuccess}
                                    onRegisterClick={() => setView('REGISTER')}
                                    onOtpRequired={handleOtpRequired}
                                    onForgotPasswordClick={() => setView('FORGOT_PASSWORD')}
                                />
                            )}
                            {view === 'REGISTER' && (
                                <RegisterForm
                                    onSuccess={handleRegisterSuccess}
                                    onLoginClick={() => setView('LOGIN')}
                                />
                            )}
                            {view === 'OTP' && (
                                <OtpForm
                                    email={email}
                                    onSuccess={() => onOpenChange(false)}
                                />
                            )}
                            {view === 'FORGOT_PASSWORD' && (
                                <ForgotPasswordForm
                                    onBackToLogin={() => setView('LOGIN')}
                                />
                            )}
                            {view === 'RESET_PASSWORD' && resetToken && (
                                <ResetPasswordForm
                                    token={resetToken}
                                    onSuccess={() => setView('LOGIN')}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    )
}
