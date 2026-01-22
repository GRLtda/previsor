'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { AuthModal } from '@/components/auth/auth-modal'

type AuthView = 'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT_PASSWORD'

interface AuthModalContextType {
    openAuthModal: (view?: AuthView) => void
    closeAuthModal: () => void
    isOpen: boolean
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [view, setView] = useState<AuthView>('LOGIN')

    const openAuthModal = (initialView: AuthView = 'LOGIN') => {
        setView(initialView)
        setIsOpen(true)
    }

    const closeAuthModal = () => {
        setIsOpen(false)
    }

    return (
        <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isOpen }}>
            {children}
            <AuthModal 
                isOpen={isOpen} 
                onOpenChange={setIsOpen} 
                defaultView={view} 
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
