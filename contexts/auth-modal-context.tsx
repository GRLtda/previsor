'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { AuthModal } from '@/components/auth/auth-modal'

type AuthView = 'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'

interface AuthModalContextType {
    openAuthModal: (view?: AuthView, token?: string) => void
    closeAuthModal: () => void
    isOpen: boolean
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [view, setView] = useState<AuthView>('LOGIN')
    const [resetToken, setResetToken] = useState<string | undefined>(undefined)

    const openAuthModal = (initialView: AuthView = 'LOGIN', token?: string) => {
        setView(initialView)
        if (token) setResetToken(token)
        setIsOpen(true)
    }

    const closeAuthModal = () => {
        setIsOpen(false)
        setResetToken(undefined)
    }

    return (
        <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isOpen }}>
            {children}
            <AuthModal
                isOpen={isOpen}
                onOpenChange={(open) => {
                    if (!open) closeAuthModal()
                    else setIsOpen(true)
                }}
                defaultView={view}
                resetToken={resetToken}
            />
        </AuthModalContext.Provider>
    )
}

export function useAuthModal() {
    const context = useContext(AuthModalContext)
    if (context === undefined) {
        throw new Error('useAuthModal must be used within an AuthModalProvider')
    }
    return context
}
