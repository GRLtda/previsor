'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { AvatarUpload } from '@/components/shared/avatar-upload'

export default function EditProfilePage() {
    const params = useParams()
    const router = useRouter()
    const username = params.username as string
    const { user, refreshUser, isAuthenticated } = useAuth()

    const [isLoading, setIsLoading] = useState(false)
    const [displayName, setDisplayName] = useState(user?.full_name || '')
    const [twitterUsername, setTwitterUsername] = useState('')
    const [instagramUsername, setInstagramUsername] = useState('')

    const isOwner = isAuthenticated && user?.id === username

    useEffect(() => {
        if (!isOwner && isAuthenticated !== undefined) {
            router.push(`/u/${username}`)
        }
    }, [isOwner, isAuthenticated, username, router])

    if (!isOwner) {
        return null
    }

    const hasChanges = displayName !== (user?.full_name || '')

    const handleSave = async () => {
        if (!hasChanges) return
        setIsLoading(true)
        try {
            await userApi.updateMe({ full_name: displayName })
            toast.success('Perfil atualizado com sucesso!')
            await refreshUser()
            router.push(`/u/${username}`)
        } catch (err) {
            if (err instanceof ApiClientError) toast.error(err.message)
            else toast.error('Erro ao atualizar perfil')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="mx-auto w-full lg:pt-[60px] pt-0">
            <div className="mx-auto flex h-auto max-w-[600px] flex-col bg-transparent pb-12 dark:bg-background max-sm:px-4">
                {/* Gradient Background */}
                <div
                    className="absolute inset-x-0 -top-20 z-0 mx-auto size-full max-h-[280px] w-svw overflow-hidden bg-center"
                    style={{
                        backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjMjJjNTVlIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjwvc3ZnPg==")`,
                        backgroundSize: 'cover',
                        filter: 'blur(40px)',
                        opacity: 0.5,
                    }}
                />

                <main className="relative mt-20 w-full flex-1 pb-8">
                    {/* Back Button + Title */}
                    <Link
                        href={`/u/${username}`}
                        className="mb-10 flex w-full items-center"
                    >
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-9">
                            <circle cx="16" cy="16" r="16" fill="black" fillOpacity="0.06" />
                            <path d="M18.0002 21.2797L13.6536 16.9331C13.1402 16.4197 13.1402 15.5797 13.6536 15.0664L18.0002 10.7197" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="ml-2 text-3xl font-bold">Editar Perfil</span>
                    </Link>

                    {/* Avatar Section */}
                    <section className="mb-6 mt-2 flex w-full flex-col">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-x-8">
                                <AvatarUpload
                                    currentAvatarUrl={user?.avatar_url}
                                    onSuccess={() => refreshUser()}
                                />
                            </div>

                            {/* Logo on right - hidden on mobile */}
                            <span className="max-w-[116px] w-full h-8 max-sm:hidden object-contain opacity-80 text-muted-foreground font-semibold text-lg">
                                ▲ Previzor
                            </span>
                        </div>
                    </section>

                    {/* Form Section */}
                    <section className="mt-4">
                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="mb-2 block text-sm font-semibold">
                                Nome de Usuário
                            </label>
                            <input
                                id="username"
                                placeholder="Username"
                                maxLength={20}
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full rounded-[10px] border border-black/[0.12] bg-white px-4 py-3 text-sm text-black placeholder:text-black/[0.30] focus:border-black/30 dark:border-white/15 dark:bg-transparent dark:text-white dark:placeholder:text-white/15 focus:dark:border-white/30 outline-none"
                                type="text"
                            />
                        </div>

                        {/* Divider */}
                        <div className="my-5 h-[1px] w-full bg-black/10 dark:bg-white/5" />

                        {/* Social Media */}
                        <label className="mb-2 block text-sm font-semibold mt-5">
                            Mídias Sociais
                        </label>
                        <div className="flex w-full items-center gap-3 max-sm:flex-col">
                            {/* Twitter */}
                            <div className="relative flex h-[46px] w-full items-center rounded-[10px] border border-black/[0.12] bg-white text-sm text-black dark:border-white/15 dark:bg-transparent dark:text-white">
                                <div className="absolute left-0 flex h-full items-center justify-center border-r border-black/10 dark:border-white/10 px-4">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
                                        <path d="M4.95866 1.89587H1.38574L5.60178 7.5176L1.61543 12.1042H2.96803L6.22858 8.35315L9.04199 12.1042H12.6149L8.22124 6.24564L12.0024 1.89587H10.6498L7.59445 5.4106L4.95866 1.89587ZM9.55241 11.0834L3.42741 2.91671H4.44824L10.5732 11.0834H9.55241Z" fill="currentColor" />
                                    </svg>
                                </div>
                                <input
                                    placeholder="Twitter Username"
                                    maxLength={25}
                                    value={twitterUsername}
                                    onChange={(e) => setTwitterUsername(e.target.value)}
                                    className="ml-14 w-full bg-transparent outline-none px-2"
                                    type="text"
                                />
                            </div>

                            {/* Instagram */}
                            <div className="relative flex h-[46px] w-full items-center rounded-[10px] border border-black/[0.12] bg-white text-sm text-black dark:border-white/15 dark:bg-transparent dark:text-white">
                                <div className="absolute left-0 flex h-full items-center justify-center border-r border-black/10 dark:border-white/10 px-4">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-[18px]">
                                        <path d="M10 0C7.28417 0 6.94362 0.0115215 5.877 0.0601678C4.81262 0.108725 4.08569 0.277796 3.4496 0.524957C2.79201 0.780514 2.23434 1.12247 1.67842 1.67839C1.12247 2.23431 0.780514 2.79204 0.524987 3.44963C0.277766 4.08569 0.108755 4.81262 0.060138 5.877C0.0114917 6.94362 0 7.28417 0 10C0 12.7158 0.0114917 13.0564 0.060138 14.123C0.108755 15.1874 0.277766 15.9143 0.524987 16.5504C0.780544 17.208 1.1225 17.7656 1.67842 18.3216C2.23437 18.8775 2.79201 19.2195 3.4496 19.475C4.08569 19.7222 4.81262 19.8912 5.877 19.9398C6.94362 19.9885 7.28417 20 10 20C12.7158 20 13.0564 19.9885 14.123 19.9398C15.1874 19.8913 15.9143 19.7222 16.5504 19.475C17.208 19.2195 17.7656 18.8775 18.3216 18.3216C18.8775 17.7656 19.2195 17.208 19.475 16.5504C19.7222 15.9143 19.8913 15.1874 19.9398 14.123C19.9885 13.0564 20 12.7158 20 10C20 7.28417 19.9885 6.94362 19.9398 5.877C19.8913 4.81262 19.7222 4.08569 19.475 3.44963C19.2195 2.79204 18.8775 2.23431 18.3216 1.67839C17.7656 1.12247 17.208 0.780514 16.5504 0.524957C15.9143 0.277796 15.1874 0.108725 14.123 0.0601678C13.0564 0.0115215 12.7158 0 10 0Z" fill="currentColor" />
                                        <path d="M10.0004 13.3328C8.1594 13.3328 6.66702 11.8404 6.66702 9.9995C6.66702 8.1585 8.1594 6.66613 10.0004 6.66613C11.8413 6.66613 13.3337 8.1585 13.3337 9.9995C13.3337 11.8404 11.8413 13.3328 10.0004 13.3328ZM10.0004 4.86434C7.16429 4.86434 4.86523 7.1634 4.86523 9.9995C4.86523 12.8355 7.16429 15.1346 10.0004 15.1346C12.8364 15.1346 15.1355 12.8355 15.1355 9.9995C15.1355 7.1634 12.8364 4.86434 10.0004 4.86434ZM16.5384 4.66145C16.5384 5.32422 16.0011 5.86144 15.3384 5.86144C14.6757 5.86144 14.1384 5.32422 14.1384 4.66145C14.1384 3.99871 14.6757 3.46143 15.3384 3.46143C16.0011 3.46143 16.5384 3.99871 16.5384 4.66145Z" fill="white" />
                                    </svg>
                                </div>
                                <input
                                    placeholder="Instagram Username"
                                    maxLength={25}
                                    value={instagramUsername}
                                    onChange={(e) => setInstagramUsername(e.target.value)}
                                    className="ml-14 w-full bg-transparent outline-none px-2"
                                    type="text"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isLoading}
                        className={`gap-x-2 flex items-center justify-center transition duration-200 ease-linear outline-none py-0.5 px-3 !mt-[30px] h-[44px] w-full rounded-[10px] text-sm font-semibold ${hasChanges && !isLoading
                            ? 'bg-blue-600 hover:bg-blue-600/80 text-white cursor-pointer'
                            : 'bg-gray-200 dark:bg-muted text-black/60 dark:text-muted-foreground cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? 'Salvando...' : 'Salvar Mudanças'}
                    </button>
                </main>
            </div>
        </div>
    )
}
