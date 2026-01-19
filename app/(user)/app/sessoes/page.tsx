'use client'

import { useState, useEffect, useCallback } from 'react'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Session } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from 'sonner'
import { 
  Laptop, 
  Smartphone, 
  Monitor,
  Globe,
  Clock,
  Trash2,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

function getDeviceIcon(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return Smartphone
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return Laptop
  }
  return Monitor
}

function parseUserAgent(userAgent: string) {
  // Simple parser
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'Navegador'
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [revokeSession, setRevokeSession] = useState<Session | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await userApi.getSessions()
      setSessions(response.data.sessions)
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleRevoke = async () => {
    if (!revokeSession) return

    setIsRevoking(true)
    try {
      await userApi.revokeSession(revokeSession.id)
      toast.success('Sessao encerrada com sucesso!')
      setRevokeSession(null)
      fetchSessions()
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/app/perfil">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Sessoes Ativas</h1>
          <p className="text-muted-foreground">Gerencie seus dispositivos conectados</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma sessao encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.user_agent)
            const browser = parseUserAgent(session.user_agent)
            
            return (
              <Card key={session.id} className={session.current ? 'border-primary' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <DeviceIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{browser}</p>
                          {session.current && (
                            <Badge variant="secondary" className="text-xs">
                              Sessao atual
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {session.ip_address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(session.last_used_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!session.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevokeSession(session)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!revokeSession}
        onOpenChange={(open) => !open && setRevokeSession(null)}
        title="Encerrar Sessao"
        description="Tem certeza que deseja encerrar esta sessao? O dispositivo sera desconectado imediatamente."
        confirmText="Encerrar"
        onConfirm={handleRevoke}
        variant="destructive"
        isLoading={isRevoking}
      />
    </div>
  )
}
