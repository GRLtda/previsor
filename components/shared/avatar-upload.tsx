'use client'

import { useState, useRef } from 'react'
import { userApi, ApiClientError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Camera, Loader2, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
    currentAvatarUrl?: string | null
    onSuccess?: (newUrl: string) => void
    disabled?: boolean
}

export function AvatarUpload({ currentAvatarUrl, onSuccess, disabled }: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    let width = img.width
                    let height = img.height

                    const maxDim = 1200
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = (height / width) * maxDim
                            width = maxDim
                        } else {
                            width = (width / height) * maxDim
                            height = maxDim
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob)
                            else reject(new Error('Canvas compression failed'))
                        },
                        'image/jpeg',
                        0.8
                    )
                }
                img.onerror = reject
            }
            reader.onerror = reject
        })
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalFile = e.target.files?.[0]
        if (!originalFile) return

        setIsUploading(true)
        setPreviewUrl(URL.createObjectURL(originalFile))

        try {
            let fileToUpload: File | Blob = originalFile

            // Se for maior que 5MB, comprimimos no cliente
            if (originalFile.size > 5 * 1024 * 1024) {
                toast.info('Imagem grande, otimizando para o envio...')
                fileToUpload = await compressImage(originalFile)
            }

            // Upload
            const formData = new FormData()
            formData.append('file', fileToUpload, originalFile.name)

            const response = await userApi.updateAvatar(formData)
            toast.success('Foto de perfil atualizada!')
            if (onSuccess && response.data?.avatarUrl) {
                onSuccess(response.data.avatarUrl)
            }
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error(err.message)
            } else {
                toast.error('Erro ao fazer upload da imagem')
            }
            setPreviewUrl(null)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const triggerUpload = () => {
        fileInputRef.current?.click()
    }

    const avatarSrc = previewUrl || currentAvatarUrl

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <div
                    className={cn(
                        "h-32 w-32 rounded-full border-2 border-muted overflow-hidden bg-muted flex items-center justify-center relative",
                        !disabled && "cursor-pointer transition-all hover:border-primary/50"
                    )}
                    onClick={!disabled && !isUploading ? triggerUpload : undefined}
                >
                    {avatarSrc ? (
                        <img
                            src={avatarSrc}
                            alt="Avatar"
                            className={cn(
                                "h-full w-full object-cover transition-opacity",
                                isUploading && "opacity-50"
                            )}
                        />
                    ) : (
                        <UserIcon className="h-16 w-16 text-muted-foreground" />
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    {!disabled && !isUploading && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={disabled || isUploading}
                />
            </div>

            <div className="text-center">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerUpload}
                    disabled={disabled || isUploading}
                    className="gap-2"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Camera className="h-4 w-4" />
                            Alterar Foto
                        </>
                    )}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2">
                    JPG, PNG ou WebP. Máx. 5MB.
                </p>
            </div>
        </div>
    )
}
