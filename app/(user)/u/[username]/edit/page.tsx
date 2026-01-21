'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import { toast } from 'sonner'
import { ArrowLeft, Camera } from 'lucide-react'
import Link from 'next/link'

export default function EditProfilePage() {
    const params = useParams()
    const router = useRouter()
    const username = params.username as string
    const { user, refreshUser, isAuthenticated } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isLoading, setIsLoading] = useState(false)
    const [displayName, setDisplayName] = useState(user?.full_name || '')
    const [twitterUsername, setTwitterUsername] = useState('')
    const [instagramUsername, setInstagramUsername] = useState('')

    // Check if current user is the profile owner
    const isOwner = isAuthenticated && user?.id === username

    // Redirect if not owner
    if (!isLoading && !isOwner && typeof window !== 'undefined') {
        router.push(`/u/${username}`)
        return null
    }

    const hasChanges = displayName !== (user?.full_name || '')

    const handleSave = async () => {
        if (!hasChanges) return

        setIsLoading(true)
        try {
            await userApi.updateMe({
                full_name: displayName,
            })
            toast.success('Perfil atualizado com sucesso!')
            await refreshUser()
            router.push(`/u/${username}`)
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error(err.message)
            } else {
                toast.error('Erro ao atualizar perfil')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // TODO: Implement avatar upload
            toast.info('Upload de avatar em breve!')
        }
    }

    const truncateAddress = (address: string) => {
        if (address.length <= 12) return address
        return `${address.slice(0, 4)}...${address.slice(-4)}`
    }

    return (
        <div className="min-h-screen">
            {/* Gradient Background */}
            <div className="absolute inset-x-0 -top-20 h-[280px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-50"
                    style={{
                        backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjMjJjNTVlIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjwvc3ZnPg==")`,
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative mx-auto w-full max-w-[600px] px-4 pt-0 lg:pt-[60px] pb-12">
                {/* Back Button + Title */}
                <Link
                    href={`/u/${username}`}
                    className="mb-10 flex w-full items-center mt-20"
                >
                    <div className="size-9 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                        <ArrowLeft className="h-5 w-5" />
                    </div>
                    <span className="ml-2 text-3xl font-bold">Editar Perfil</span>
                </Link>

                {/* Avatar Section */}
                <section className="mb-6 mt-2 flex w-full flex-col">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-4">
                            {/* Avatar with border */}
                            <div className="relative mb-4 flex size-[130px] items-center justify-center">
                                {/* Dashed border circle */}
                                <div className="absolute inset-0 rounded-full border-2 border-dashed border-muted-foreground/30" />

                                {/* Avatar */}
                                <div
                                    className="w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center text-4xl font-bold text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                    }}
                                >
                                    {(user?.full_name || 'U').charAt(0).toUpperCase()}
                                </div>
                            </div>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                accept="image/*"
                                className="hidden"
                                type="file"
                                onChange={handleFileChange}
                            />

                            {/* Upload Button */}
                            <Button
                                onClick={handleAvatarClick}
                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-[42px] rounded-[10px] font-semibold"
                            >
                                <Camera className="h-4 w-4" />
                                Upload
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Username Field */}
                <section className="mt-4">
                    <div>
                        <Label htmlFor="username" className="mb-2 block text-sm font-semibold">
                            Nome de Usuário
                        </Label>
                        <Input
                            id="username"
                            placeholder="Username"
                            maxLength={20}
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full rounded-[10px] border border-border bg-background px-4 py-3 text-sm"
                        />
                    </div>

                    {/* Divider */}
                    <div className="my-5 h-[1px] w-full bg-border" />

                    {/* Social Media */}
                    <Label className="mb-2 block text-sm font-semibold mt-5">
                        Mídias Sociais
                    </Label>
                    <div className="flex w-full items-center gap-3 max-sm:flex-col">
                        {/* Twitter */}
                        <div className="relative flex h-[46px] w-full items-center rounded-[10px] border border-border bg-background px-4 text-sm">
                            <div className="absolute left-0 flex h-full items-center justify-center border-r border-border px-4">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
                                    <path d="M4.95866 1.89587H1.38574L5.60178 7.5176L1.61543 12.1042H2.96803L6.22858 8.35315L9.04199 12.1042H12.6149L8.22124 6.24564L12.0024 1.89587H10.6498L7.59445 5.4106L4.95866 1.89587ZM9.55241 11.0834L3.42741 2.91671H4.44824L10.5732 11.0834H9.55241Z" fill="currentColor" />
                                </svg>
                            </div>
                            <Input
                                placeholder="Twitter Username"
                                maxLength={25}
                                value={twitterUsername}
                                onChange={(e) => setTwitterUsername(e.target.value)}
                                className="ml-10 w-full bg-transparent border-0 focus-visible:ring-0 p-0"
                            />
                        </div>

                        {/* Instagram */}
                        <div className="relative flex h-[46px] w-full items-center rounded-[10px] border border-border bg-background px-4 text-sm">
                            <div className="absolute left-0 flex h-full items-center justify-center border-r border-border px-4">
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-[18px]">
                                    <path d="M10 0C7.28417 0 6.94362 0.0115215 5.877 0.0601678C4.81262 0.108725 4.08569 0.277796 3.4496 0.524957C2.79201 0.780514 2.23434 1.12247 1.67842 1.67839C1.12247 2.23431 0.780514 2.79204 0.524987 3.44963C0.277766 4.08569 0.108755 4.81262 0.060138 5.877C0.0114917 6.94362 0 7.28417 0 10C0 12.7158 0.0114917 13.0564 0.060138 14.123C0.108755 15.1874 0.277766 15.9143 0.524987 16.5504C0.780544 17.208 1.1225 17.7656 1.67842 18.3216C2.23437 18.8775 2.79201 19.2195 3.4496 19.475C4.08569 19.7222 4.81262 19.8912 5.877 19.9398C6.94362 19.9885 7.28417 20 10 20C12.7158 20 13.0564 19.9885 14.123 19.9398C15.1874 19.8913 15.9143 19.7222 16.5504 19.475C17.208 19.2195 17.7656 18.8775 18.3216 18.3216C18.8775 17.7656 19.2195 17.208 19.475 16.5504C19.7222 15.9143 19.8913 15.1874 19.9398 14.123C19.9885 13.0564 20 12.7158 20 10C20 7.28417 19.9885 6.94362 19.9398 5.877C19.8913 4.81262 19.7222 4.08569 19.475 3.44963C19.2195 2.79204 18.8775 2.23431 18.3216 1.67839C17.7656 1.12247 17.208 0.780514 16.5504 0.524957C15.9143 0.277796 15.1874 0.108725 14.123 0.0601678C13.0564 0.0115215 12.7158 0 10 0Z" fill="currentColor" />
                                    <path d="M10.0004 13.3328C8.1594 13.3328 6.66702 11.8404 6.66702 9.9995C6.66702 8.1585 8.1594 6.66613 10.0004 6.66613C11.8413 6.66613 13.3337 8.1585 13.3337 9.9995C13.3337 11.8404 11.8413 13.3328 10.0004 13.3328ZM10.0004 4.86434C7.16429 4.86434 4.86523 7.1634 4.86523 9.9995C4.86523 12.8355 7.16429 15.1346 10.0004 15.1346C12.8364 15.1346 15.1355 12.8355 15.1355 9.9995C15.1355 7.1634 12.8364 4.86434 10.0004 4.86434ZM16.5384 4.66145C16.5384 5.32422 16.0011 5.86144 15.3384 5.86144C14.6757 5.86144 14.1384 5.32422 14.1384 4.66145C14.1384 3.99871 14.6757 3.46143 15.3384 3.46143C16.0011 3.46143 16.5384 3.99871 16.5384 4.66145Z" fill="white" />
                                </svg>
                            </div>
                            <Input
                                placeholder="Instagram Username"
                                maxLength={25}
                                value={instagramUsername}
                                onChange={(e) => setInstagramUsername(e.target.value)}
                                className="ml-12 w-full bg-transparent border-0 focus-visible:ring-0 p-0"
                            />
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isLoading}
                    className={`mt-[30px] h-[44px] w-full rounded-[10px] text-sm font-semibold ${hasChanges
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                >
                    {isLoading ? 'Salvando...' : 'Salvar Mudanças'}
                </Button>
            </div>
        </div>
    )
}
