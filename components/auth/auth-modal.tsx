'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { OtpForm } from './otp-form'
import { ForgotPasswordForm } from './forgot-password-form'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type AuthView = 'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT_PASSWORD'

interface AuthModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    defaultView?: AuthView
    children?: React.ReactNode
}

export function AuthModal({ isOpen, onOpenChange, defaultView = 'LOGIN', children }: AuthModalProps) {
    const [view, setView] = useState<AuthView>(defaultView)
    const [email, setEmail] = useState('')

    // Reset view when modal opens
    useEffect(() => {
        if (isOpen) {
            setView(defaultView)
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
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden gap-0 bg-background border-border shadow-2xl duration-200" aria-describedby={undefined}>
                <DialogTitle className="sr-only">Autenticação</DialogTitle>
                <div className="p-6 md:p-8">
                    <div className="flex justify-center mb-6">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <span className="text-xl font-bold text-primary">P</span>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
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
                        </motion.div>
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    )
}
