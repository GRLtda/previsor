'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthModal } from '@/contexts/auth-modal-context'
import { Loader2 } from 'lucide-react'

function ResetPasswordHandler() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { openAuthModal } = useAuthModal()

    useEffect(() => {
        const token = searchParams.get('token')

        if (token) {
            // Open the auth modal with the reset password view and pass the token
            openAuthModal('RESET_PASSWORD', token)
        }

        // Redirect to the main page to clean up the URL
        router.replace('/eventos')
    }, [searchParams, openAuthModal, router])

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordHandler />
        </Suspense>
    )
}
