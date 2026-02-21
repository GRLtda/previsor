"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Edit, Plus, Trash, Loader2, Check, Trophy } from "lucide-react";
import { adminApi, userApi } from "@/lib/api/client";
import type { Event } from "@/lib/types";
import { PlaceholderIcon } from "@/components/ui/placeholder-icon";

export default function AdminEventDetailsPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [createMarketOpen, setCreateMarketOpen] = useState(false);
    const [newMarket, setNewMarket] = useState({
        statement: "",
        opensAt: "",
        closesAt: "",
        resolvesAt: "",
        feeBps: 200,
    });

    const [editEventOpen, setEditEventOpen] = useState(false);
    const [editEventData, setEditEventData] = useState({
        title: "",
        description: "",
        category: "",
        startsAt: "",
        endsAt: "",
        resolveRules: "",
        imageUrl: ""
    });

    const [resolveEventOpen, setResolveEventOpen] = useState(false);
    const [selectedWinnerMarketId, setSelectedWinnerMarketId] = useState<string>("");

    const loadEvent = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminApi.getEvent(id);
            setEvent((response as any)?.data?.event || (response as any)?.data || response);
        } catch (err: any) {
            console.error("Error loading event details:", err);
            setError("Não foi possível carregar os detalhes do evento.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (event && !editEventOpen) {
            setEditEventData({
                title: event.title || "",
                description: event.description || "",
                category: event.category || "",
                startsAt: event.startsAt ? new Date(event.startsAt).toISOString().slice(0, 16) : "",
                endsAt: event.endsAt ? new Date(event.endsAt).toISOString().slice(0, 16) : "",
                resolveRules: event.resolveRules || "",
                imageUrl: event.imageUrl || ""
            });
        }
    }, [event, editEventOpen]);

    const handlePublishEvent = async () => {
        setActionLoading(true);
        try {
            await adminApi.publishEvent(id);
            toast.success("Evento publicado com sucesso!");
            loadEvent();
        } catch (err: any) {
            toast.error(err.message || "Erro ao publicar evento.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateMarket = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await adminApi.createMarket({
                eventId: id,
                statement: newMarket.statement,
                opensAt: new Date(newMarket.opensAt).toISOString(),
                closesAt: new Date(newMarket.closesAt).toISOString(),
                resolvesAt: new Date(newMarket.resolvesAt).toISOString(),
                feeBps: Number(newMarket.feeBps),
            });
            toast.success("Mercado criado com sucesso!");
            setCreateMarketOpen(false);
            setNewMarket({ statement: "", opensAt: "", closesAt: "", resolvesAt: "", feeBps: 200 });
            loadEvent();
        } catch (err: any) {
            toast.error(err.message || "Erro ao criar mercado.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await adminApi.updateEvent(id, {
                title: editEventData.title,
                description: editEventData.description,
                category: editEventData.category,
                startsAt: new Date(editEventData.startsAt).toISOString(),
                endsAt: new Date(editEventData.endsAt).toISOString(),
                resolveRules: editEventData.resolveRules,
                imageUrl: editEventData.imageUrl
            });
            toast.success("Evento atualizado com sucesso!");
            setEditEventOpen(false);
            loadEvent();
        } catch (err: any) {
            toast.error(err.message || "Erro ao atualizar evento.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleResolveEvent = async () => {
        if (!selectedWinnerMarketId) {
            toast.error("Selecione o mercado vencedor.");
            return;
        }
        setActionLoading(true);
        try {
            await adminApi.resolveEvent(id, selectedWinnerMarketId);
            toast.success("Evento finalizado com sucesso! Todos os mercados foram resolvidos.");
            setResolveEventOpen(false);
            setSelectedWinnerMarketId("");
            loadEvent();
        } catch (err: any) {
            toast.error(err.message || "Erro ao finalizar evento.");
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        loadEvent();
    }, [loadEvent]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            active: "default",
            draft: "secondary",
            closed: "outline",
            cancelled: "destructive",
        };
        const labels: Record<string, string> = {
            active: "Ativo",
            draft: "Rascunho",
            closed: "Encerrado",
            cancelled: "Cancelado",
        };
        return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 p-8">
                <p className="text-xl font-semibold text-destructive">{error || "Evento não encontrado"}</p>
                <Button variant="outline" onClick={() => router.push("/admin/eventos")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Eventos
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/admin/eventos")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Detalhes do Evento</h1>
                </div>
                <div className="flex items-center gap-2">
                    {event.status === "draft" && (
                        <Button variant="outline" className="gap-2" onClick={handlePublishEvent} disabled={actionLoading}>
                            <Check className="h-4 w-4" />
                            Publicar
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Gerais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-1/3">
                                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                                        {event.imageUrl ? (
                                            <img
                                                src={event.imageUrl}
                                                alt={event.title}
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                                    if (placeholder) placeholder.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div style={{ display: event.imageUrl ? 'none' : 'flex' }} className="h-full w-full items-center justify-center">
                                            <PlaceholderIcon size={48} />
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-2/3 space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-semibold">{event.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">ID: {event.id}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {getStatusBadge(event.status)}
                                        <Badge variant="outline">{event.category || "Sem categoria"}</Badge>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-1">Descrição</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {event.description || "Nenhuma descrição fornecida."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Data de Início</h4>
                                    <p className="font-medium mt-1">
                                        {event.startsAt ? new Date(event.startsAt).toLocaleDateString("pt-BR") : "-"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Data de Fim</h4>
                                    <p className="font-medium mt-1">
                                        {event.endsAt ? new Date(event.endsAt).toLocaleDateString("pt-BR") : "-"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Markets Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Mercados Associados</CardTitle>
                            <Dialog open={createMarketOpen} onOpenChange={setCreateMarketOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Novo Mercado
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleCreateMarket}>
                                        <DialogHeader>
                                            <DialogTitle>Criar Novo Mercado</DialogTitle>
                                            <DialogDescription>
                                                Adicione um novo mercado vinculando a este evento.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="statement">Afirmação (Statement)</Label>
                                                <Input id="statement" required value={newMarket.statement} onChange={e => setNewMarket({ ...newMarket, statement: e.target.value })} placeholder="Ex: Brasil ganha a Copa do Mundo?" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="opensAt">Data de Abertura</Label>
                                                <Input id="opensAt" type="datetime-local" required value={newMarket.opensAt} onChange={e => setNewMarket({ ...newMarket, opensAt: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="closesAt">Data de Fechamento</Label>
                                                    <Input id="closesAt" type="datetime-local" required value={newMarket.closesAt} onChange={e => setNewMarket({ ...newMarket, closesAt: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="resolvesAt">Data de Resolução</Label>
                                                    <Input id="resolvesAt" type="datetime-local" required value={newMarket.resolvesAt} onChange={e => setNewMarket({ ...newMarket, resolvesAt: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="feeBps">Taxa Base (bps)</Label>
                                                <Input id="feeBps" type="number" required value={newMarket.feeBps} onChange={e => setNewMarket({ ...newMarket, feeBps: Number(e.target.value) })} />
                                                <p className="text-xs text-muted-foreground">200 bps = 2%</p>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setCreateMarketOpen(false)}>Cancelar</Button>
                                            <Button type="submit" disabled={actionLoading}>Salvar Mercado</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {event.markets && event.markets.length > 0 ? (
                                <div className="space-y-4">
                                    {event.markets.map((market) => (
                                        <Link href={`/admin/mercados/${market.id}`} key={market.id}>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4 hover:border-primary transition-colors cursor-pointer mb-4">
                                                <div>
                                                    <h4 className="font-semibold text-base">{market.statement}</h4>
                                                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                                        <Badge variant={market.status === 'open' ? 'default' : market.status === 'closed' ? 'secondary' : market.status === 'settled' ? 'outline' : 'outline'}>
                                                            {market.status === 'open' ? 'Aberto' : market.status === 'closed' ? 'Fechado' : market.status === 'settled' ? 'Resolvido' : market.status}
                                                        </Badge>
                                                        <span>ID: {market.id}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 md:gap-6">
                                                    <div className="text-right">
                                                        <span className="text-xs text-muted-foreground block">Sim</span>
                                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{market.probYes ?? 0}%</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs text-muted-foreground block">Não</span>
                                                        <span className="font-medium text-rose-600 dark:text-rose-400">{market.probNo ?? 0}%</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs text-muted-foreground block">Liquidez</span>
                                                        <span className="font-medium">R$ {((market.liquidityB ?? 0) / 100).toFixed(2)}</span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="shrink-0">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                    <p className="text-muted-foreground mb-4">Nenhum mercado cadastrado para este evento ainda.</p>
                                    <Button variant="outline">Adicionar primeiro mercado</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ações do Evento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Dialog open={editEventOpen} onOpenChange={setEditEventOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar Informações
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <form onSubmit={handleEditEvent}>
                                        <DialogHeader>
                                            <DialogTitle>Editar Evento</DialogTitle>
                                            <DialogDescription>
                                                Altere as informações deste evento.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Título do Evento</Label>
                                                <Input id="title" required value={editEventData.title} onChange={e => setEditEventData({ ...editEventData, title: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">Descrição</Label>
                                                <Textarea id="description" required value={editEventData.description} onChange={e => setEditEventData({ ...editEventData, description: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="category">Categoria</Label>
                                                    <Input id="category" required value={editEventData.category} onChange={e => setEditEventData({ ...editEventData, category: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="imageUrl">URL da Imagem</Label>
                                                    <Input id="imageUrl" value={editEventData.imageUrl} onChange={e => setEditEventData({ ...editEventData, imageUrl: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="startsAt">Data de Início</Label>
                                                    <Input id="startsAt" type="datetime-local" required value={editEventData.startsAt} onChange={e => setEditEventData({ ...editEventData, startsAt: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="endsAt">Data de Fim</Label>
                                                    <Input id="endsAt" type="datetime-local" required value={editEventData.endsAt} onChange={e => setEditEventData({ ...editEventData, endsAt: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="resolveRules">Regras de Resolução</Label>
                                                <Textarea id="resolveRules" required value={editEventData.resolveRules} onChange={e => setEditEventData({ ...editEventData, resolveRules: e.target.value })} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setEditEventOpen(false)}>Cancelar</Button>
                                            <Button type="submit" disabled={actionLoading}>Salvar Alterações</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                            {event.status !== 'closed' && event.markets && event.markets.length > 0 && (
                                <Dialog open={resolveEventOpen} onOpenChange={setResolveEventOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200">
                                            <Trophy className="mr-2 h-4 w-4" />
                                            Finalizar Evento
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Finalizar Evento</DialogTitle>
                                            <DialogDescription>
                                                Selecione o mercado vencedor (resultado SIM). Todos os outros mercados serão automaticamente resolvidos como NÃO.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-3 py-4">
                                            {event.markets.filter(m => m.status !== 'settled' && m.status !== 'canceled').map((market) => (
                                                <label key={market.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedWinnerMarketId === market.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`}>
                                                    <input
                                                        type="radio"
                                                        name="winnerMarket"
                                                        value={market.id}
                                                        checked={selectedWinnerMarketId === market.id}
                                                        onChange={() => setSelectedWinnerMarketId(market.id)}
                                                        className="accent-primary"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-sm">{market.statement}</p>
                                                        <p className="text-xs text-muted-foreground">Prob: {market.probYes ?? 50}% Sim</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setResolveEventOpen(false)}>Cancelar</Button>
                                            <Button
                                                type="button"
                                                onClick={handleResolveEvent}
                                                disabled={actionLoading || !selectedWinnerMarketId}
                                                className="bg-amber-600 hover:bg-amber-700"
                                            >
                                                <Trophy className="mr-2 h-4 w-4" />
                                                Confirmar Resolução
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" disabled>
                                <Trash className="mr-2 h-4 w-4" />
                                Excluir Evento
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Estatísticas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground text-sm">Mercados Ativos</span>
                                    <span className="font-semibold">{event.markets?.filter(m => m.status === 'open' || m.status === 'active' as any).length || 0}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground text-sm">Liquidez Total</span>
                                    <span className="font-semibold">
                                        R$ {((event.markets?.reduce((acc, m) => acc + (m.liquidityB || 0), 0) || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground text-sm">Total de Apostas</span>
                                    <span className="font-semibold">-</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
