'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { OtpForm } from './otp-form'
import { ForgotPasswordForm } from './forgot-password-form'
import { ResetPasswordForm } from './reset-password-form'
import { AnimatePresence, motion } from 'framer-motion'
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
            <DialogContent
                className="sm:max-w-[440px] w-[calc(100%-2rem)] rounded-3xl p-0 gap-0 border border-black/10 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden"
            >
                <DialogTitle className="sr-only">Autenticação</DialogTitle>

                <div className="p-6 sm:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
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
