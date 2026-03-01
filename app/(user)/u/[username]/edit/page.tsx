'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { AvatarUpload } from '@/components/shared/avatar-upload'
import { ChevronLeft, Instagram, X as TwitterX } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export default function EditProfilePage() {
    const params = useParams()
    const router = useRouter()
    const username = params.username as string
    const { user, refreshUser, isAuthenticated } = useAuth()

    const [isLoading, setIsLoading] = useState(false)
    const [displayName, setDisplayName] = useState(user?.full_name || '')
    const [bio, setBio] = useState(user?.bio || '')
    const [twitterUsername, setTwitterUsername] = useState(user?.twitter_username || '')
    const [instagramUsername, setInstagramUsername] = useState(user?.instagram_username || '')

    const isOwner = isAuthenticated && user?.id === username

    useEffect(() => {
        if (!isOwner && isAuthenticated !== undefined) {
            router.push(`/u/${username}`)
        }
    }, [isOwner, isAuthenticated, username, router])

    // Pre-populate when user data loads
    useEffect(() => {
        if (user) {
            setDisplayName(user.full_name || '')
            setBio(user.bio || '')
            setTwitterUsername(user.twitter_username || '')
            setInstagramUsername(user.instagram_username || '')
        }
    }, [user])

    if (!isOwner) {
        return null
    }

    const hasChanges =
        displayName !== (user?.full_name || '') ||
        bio !== (user?.bio || '') ||
        twitterUsername !== (user?.twitter_username || '') ||
        instagramUsername !== (user?.instagram_username || '')

    const handleSave = async () => {
        if (!hasChanges) return
        setIsLoading(true)
        try {
            await userApi.updateMe({
                full_name: displayName,
                bio: bio || null,
                twitter_username: twitterUsername || null,
                instagram_username: instagramUsername || null,
            })
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
        <div className="flex size-full justify-center px-4 pb-16 pt-[20px] lg:pt-[60px]">
            <div className="mx-auto flex w-full max-w-[640px] flex-col pb-12">
                <main className="relative flex w-full flex-col">
                    {/* Header */}
                    <div className="mb-10 flex w-full items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/u/${username}`}
                                className="flex size-8 items-center justify-center rounded-lg bg-black/5 text-muted-foreground transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                            >
                                <ChevronLeft className="size-5" />
                            </Link>
                            <h1 className="text-2xl font-bold text-black dark:text-white">Editar Perfil</h1>
                        </div>
                        <div className="hidden lg:block">
                            <Logo width={120} height={32} />
                        </div>
                    </div>

                    {/* Avatar Upload */}
                    <div className="mb-10 flex w-full justify-center">
                        <AvatarUpload
                            currentAvatarUrl={user?.avatar_url}
                            onSuccess={() => refreshUser()}
                        />
                    </div>

                    {/* Form Fields */}
                    <div className="flex w-full flex-col gap-6">
                        {/* Name */}
                        <div className="flex w-full flex-col gap-2">
                            <label htmlFor="username" className="text-sm font-semibold text-black dark:text-white">
                                Nome de Usuário
                            </label>
                            <input
                                id="username"
                                placeholder={username}
                                maxLength={20}
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="h-[46px] w-full rounded-lg border border-border bg-transparent px-4 text-sm font-medium text-black placeholder:text-muted-foreground focus:border-brand focus:outline-none dark:text-white"
                                type="text"
                            />
                        </div>

                        {/* Bio */}
                        <div className="flex w-full flex-col gap-2">
                            <label htmlFor="bio" className="text-sm font-semibold text-black dark:text-white">
                                Bio
                            </label>
                            <textarea
                                id="bio"
                                placeholder="Escreva uma breve descrição sobre você..."
                                maxLength={200}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="min-h-[100px] w-full resize-none rounded-lg border border-border bg-transparent p-4 text-sm font-medium text-black placeholder:text-muted-foreground focus:border-brand focus:outline-none dark:text-white"
                            />
                            <span className="text-xs text-muted-foreground text-right">{bio.length}/200</span>
                        </div>

                        {/* Social Links */}
                        <div className="flex w-full flex-col gap-2">
                            <label className="text-sm font-semibold text-black dark:text-white">
                                Mídias Sociais
                            </label>
                            <div className="flex w-full flex-col gap-3 lg:flex-row">
                                {/* Twitter */}
                                <div className="relative flex h-[46px] flex-1 items-center rounded-lg border border-border bg-transparent">
                                    <div className="flex h-full w-[46px] items-center justify-center border-r border-border text-muted-foreground">
                                        <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                    </div>
                                    <input
                                        placeholder="Twitter Username"
                                        maxLength={25}
                                        value={twitterUsername}
                                        onChange={(e) => setTwitterUsername(e.target.value)}
                                        className="h-full w-full bg-transparent px-4 text-sm font-medium text-black placeholder:text-muted-foreground focus:outline-none dark:text-white"
                                        type="text"
                                    />
                                </div>

                                {/* Instagram */}
                                <div className="relative flex h-[46px] flex-1 items-center rounded-lg border border-border bg-transparent">
                                    <div className="flex h-full w-[46px] items-center justify-center border-r border-border text-muted-foreground">
                                        <Instagram className="size-[18px]" />
                                    </div>
                                    <input
                                        placeholder="Instagram Username"
                                        maxLength={25}
                                        value={instagramUsername}
                                        onChange={(e) => setInstagramUsername(e.target.value)}
                                        className="h-full w-full bg-transparent px-4 text-sm font-medium text-black placeholder:text-muted-foreground focus:outline-none dark:text-white"
                                        type="text"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || isLoading}
                            className="mt-4 flex h-[46px] w-full items-center justify-center rounded-lg bg-black/5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Salvando...' : 'Salvar Mudanças'}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    )
}
