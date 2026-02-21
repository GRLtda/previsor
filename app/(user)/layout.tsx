'use client'

import React from "react"

import { AuthProvider } from '@/contexts/auth-context'
import { AuthModalProvider } from '@/contexts/auth-modal-context'
import { Toaster } from '@/components/ui/sonner'
import { UserHeader } from '@/components/user/header'
import { UserFooter } from '@/components/user/footer'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <div className="flex flex-col min-h-screen bg-background">
          <UserHeader />
          <main className="flex-1 pb-10">{children}</main>
          <UserFooter />
        </div>
        <Toaster position="top-right" />
      </AuthModalProvider>
    </AuthProvider>
  )
}
