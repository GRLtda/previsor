'use client'

import React from "react"

import { AuthProvider } from '@/contexts/auth-context'
import { AuthModalProvider } from '@/contexts/auth-modal-context'
import { Toaster } from '@/components/ui/sonner'
import { UserHeader } from '@/components/user/header'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <div className="min-h-screen bg-background">
          <UserHeader />
          <main>{children}</main>
        </div>
        <Toaster position="top-right" />
      </AuthModalProvider>
    </AuthProvider>
  )
}
