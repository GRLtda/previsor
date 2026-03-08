"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Edit, Plus, Trash, Loader2, Check, Trophy, Camera, X, Sparkles } from "lucide-react";
import { adminApi, userApi } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/client";
import type { Event } from "@/lib/types";
import { PlaceholderIcon } from "@/components/ui/placeholder-icon";

export default function AdminEventDetailsPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();

    const [event, setEvent] = useState<Event | null>(null);
    const [categories, setCategories] = useState<import("@/lib/types").Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [createMarketOpen, setCreateMarketOpen] = useState(false);
    const [newMarket, setNewMarket] = useState(() => {
        const pad = (n: number) => String(n).padStart(2, '0');
        const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        const today = new Date();
        const plus3 = new Date(today); plus3.setDate(plus3.getDate() + 3);
        return {
            statement: "",
            opensAt: fmt(today),
            closesAt: fmt(plus3),
            resolvesAt: "",
            resolveRules: "",
            imageUrl: "",
            feeBps: 200,
        };
    });
    // Deferred image upload for create market
    const [createMarketPendingFile, setCreateMarketPendingFile] = useState<File | null>(null);
    const [createMarketPreview, setCreateMarketPreview] = useState("");
    const createMarketFileRef = useRef<HTMLInputElement>(null);

    const [editMarketOpen, setEditMarketOpen] = useState(false);
    const [editMarketData, setEditMarketData] = useState({
        id: "",
        statement: "",
        opensAt: "",
        closesAt: "",
        resolvesAt: "",
        resolveRules: "",
        imageUrl: "",
        feeBps: 200,
    });
    // Deferred image upload for edit market
    const [editMarketPendingFile, setEditMarketPendingFile] = useState<File | null>(null);
    const [editMarketPreview, setEditMarketPreview] = useState("");
    const editMarketFileRef = useRef<HTMLInputElement>(null);

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
    // Deferred image upload for edit event
    const [editEventPendingFile, setEditEventPendingFile] = useState<File | null>(null);
    const [editEventPreview, setEditEventPreview] = useState("");
    const editEventFileRef = useRef<HTMLInputElement>(null);

    const [resolveEventOpen, setResolveEventOpen] = useState(false);
    const [selectedWinnerMarketId, setSelectedWinnerMarketId] = useState<string>("");

    const loadEvent = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [response, catResponse] = await Promise.all([
                adminApi.getEvent(id),
                userApi.getCategories()
            ]);
            setEvent((response as any)?.data?.event || (response as any)?.data || response);
            if (catResponse.success && catResponse.data) {
                setCategories(catResponse.data.categories || []);
            }
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
            setEditEventPendingFile(null);
            setEditEventPreview(event.imageUrl || "");
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

    // ── Image file selection helpers (deferred — upload only on submit) ──────
    const pickFile = (
        fileRef: React.RefObject<HTMLInputElement | null>,
        setPending: (f: File | null) => void,
        setPreview: (url: string) => void,
        currentPreview: string
    ) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (currentPreview && currentPreview.startsWith("blob:")) URL.revokeObjectURL(currentPreview);
        const localUrl = URL.createObjectURL(file);
        setPending(file);
        setPreview(localUrl);
        if (fileRef.current) fileRef.current.value = "";
    };

    const uploadFile = async (pending: File | null, fallback: string): Promise<string | undefined> => {
        if (!pending) return fallback || undefined;
        const fd = new FormData();
        fd.append("file", pending, pending.name);
        const res = await adminApi.uploadEventImage(fd);
        return res.data.imageUrl;
    };

    const handleCreateMarket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMarket.statement.trim().length < 5) {
            toast.error("A afirmação precisa ter pelo menos 5 caracteres");
            return;
        }
        setActionLoading(true);
        try {
            const uploadedUrl = await uploadFile(createMarketPendingFile, newMarket.imageUrl);
            await adminApi.createMarket({
                eventId: id,
                statement: newMarket.statement,
                opensAt: new Date(newMarket.opensAt).toISOString(),
                closesAt: new Date(newMarket.closesAt).toISOString(),
                resolvesAt: new Date(newMarket.resolvesAt).toISOString(),
                resolveRules: newMarket.resolveRules,
                imageUrl: uploadedUrl || undefined,
                feeBps: Number(newMarket.feeBps),
            });
            toast.success("Mercado criado com sucesso!");
            setCreateMarketOpen(false);
            setNewMarket(() => {
                const pad = (n: number) => String(n).padStart(2, '0');
                const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                const today = new Date();
                const plus3 = new Date(today); plus3.setDate(plus3.getDate() + 3);
                return { statement: "", opensAt: fmt(today), closesAt: fmt(plus3), resolvesAt: "", resolveRules: "", imageUrl: "", feeBps: 200 };
            });
            if (createMarketPreview.startsWith("blob:")) URL.revokeObjectURL(createMarketPreview);
            setCreateMarketPendingFile(null);
            setCreateMarketPreview("");
            loadEvent();
        } catch (err: any) {
            toast.error(err.message || "Erro ao criar mercado.");
        } finally {
            setActionLoading(false);
        }
    };

    const openEditMarket = (market: any) => {
        setEditMarketData({
            id: market.id,
            statement: market.statement || "",
            opensAt: market.opensAt ? new Date(market.opensAt).toISOString().slice(0, 16) : "",
            closesAt: market.closesAt ? new Date(market.closesAt).toISOString().slice(0, 16) : "",
            resolvesAt: market.resolvesAt ? new Date(market.resolvesAt).toISOString().slice(0, 16) : "",
            resolveRules: market.resolveRules || "",
            imageUrl: market.imageUrl || "",
            feeBps: market.feeBps ?? 200,
        });
        setEditMarketPendingFile(null);
        setEditMarketPreview(market.imageUrl || "");
        setEditMarketOpen(true);
    };

    const handleEditMarket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editMarketData.statement.trim().length < 5) {
            toast.error("A afirmação precisa ter pelo menos 5 caracteres");
            return;
        }
        setActionLoading(true);
        try {
            const uploadedUrl = await uploadFile(editMarketPendingFile, editMarketData.imageUrl);
            await adminApi.updateMarket(editMarketData.id, {
                statement: editMarketData.statement,
                imageUrl: uploadedUrl || null,
                resolveRules: editMarketData.resolveRules || null,
                opensAt: editMarketData.opensAt ? new Date(editMarketData.opensAt).toISOString() : undefined,
                closesAt: editMarketData.closesAt ? new Date(editMarketData.closesAt).toISOString() : undefined,
                resolvesAt: editMarketData.resolvesAt ? new Date(editMarketData.resolvesAt).toISOString() : undefined,
                feeBps: Number(editMarketData.feeBps),
            });
            toast.success("Mercado atualizado com sucesso!");
            setEditMarketOpen(false);
            if (editMarketPreview.startsWith("blob:")) URL.revokeObjectURL(editMarketPreview);
            setEditMarketPendingFile(null);
            setEditMarketPreview("");
            loadEvent();
        } catch (err: any) {
            toast.error(err.message || "Erro ao atualizar mercado.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const uploadedUrl = await uploadFile(editEventPendingFile, editEventData.imageUrl);
            await adminApi.updateEvent(id, {
                title: editEventData.title,
                description: editEventData.description,
                category: editEventData.category,
                startsAt: new Date(editEventData.startsAt).toISOString(),
                endsAt: new Date(editEventData.endsAt).toISOString(),
                resolveRules: editEventData.resolveRules,
                imageUrl: uploadedUrl || editEventData.imageUrl
            });
            toast.success("Evento atualizado com sucesso!");
            setEditEventOpen(false);
            if (editEventPreview.startsWith("blob:")) URL.revokeObjectURL(editEventPreview);
            setEditEventPendingFile(null);
            setEditEventPreview("");
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
            archived: "outline",
        };
        const labels: Record<string, string> = {
            active: "Ativo",
            draft: "Rascunho",
            closed: "Encerrado",
            cancelled: "Cancelado",
            archived: "Arquivado",
        };
        return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
    };

    const getMarketStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400';
            case 'closed': return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400';
            case 'settled': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400';
            default: return 'text-muted-foreground bg-muted';
        }
    };
    const getMarketStatusLabel = (status: string) => {
        const map: Record<string, string> = { open: 'Aberto', closed: 'Fechado', settled: 'Resolvido', draft: 'Rascunho', canceled: 'Cancelado' };
        return map[status] || status;
    };

    // Date helpers for create market modal
    const toLocalISO = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const addDays = (base: Date, days: number) => { const d = new Date(base); d.setDate(d.getDate() + days); return d; };
    const addMonths = (base: Date, months: number) => { const d = new Date(base); d.setMonth(d.getMonth() + months); return d; };
    const now = new Date();
    const DATE_PILLS = [
        { label: 'Hoje', date: now },
        { label: '+3d', date: addDays(now, 3) },
        { label: '+7d', date: addDays(now, 7) },
        { label: '+1m', date: addMonths(now, 1) },
        { label: '+3m', date: addMonths(now, 3) },
    ];

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
        <div className="space-y-0">
            {/* Hero banner */}
            <div className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden bg-muted mb-6">
                {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-background flex items-center justify-center">
                        <PlaceholderIcon size={64} />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {/* Back button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/admin/eventos")}
                    className="absolute top-4 left-4 h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                {/* Top-right actions */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    {event.status === "draft" && (
                        <Button size="sm" onClick={handlePublishEvent} disabled={actionLoading}
                            className="rounded-full gap-2 bg-white/90 text-foreground hover:bg-white text-xs font-semibold">
                            <Check className="h-3.5 w-3.5" />
                            Publicar
                        </Button>
                    )}
                </div>
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 pt-8">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${event.status === 'active' ? 'bg-emerald-500/90 text-white' :
                            event.status === 'draft' ? 'bg-white/20 text-white' :
                                'bg-white/20 text-white'
                            }`}>{{
                                active: 'Ativo', draft: 'Rascunho', closed: 'Encerrado', cancelled: 'Cancelado', archived: 'Arquivado'
                            }[event.status] || event.status}</span>
                        {event.category && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">{event.category}</span>
                        )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight drop-shadow">{event.title}</h1>
                    <p className="text-xs text-white/60 mt-0.5 font-mono">{event.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Info strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[{
                            label: 'Início', value: event.startsAt ? new Date(event.startsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }) : '-'
                        }, {
                            label: 'Fim', value: event.endsAt ? new Date(event.endsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }) : '-'
                        }, {
                            label: 'Mercados', value: String(event.markets?.length || 0)
                        }, {
                            label: 'Liquidez', value: `R$ ${((event.markets?.reduce((a, m) => a + (m.liquidityB || 0), 0) || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        }].map(({ label, value }) => (
                            <div key={label} className="rounded-xl border bg-card p-3">
                                <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
                                <p className="text-sm font-bold mt-0.5">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="rounded-xl border bg-card p-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Descrição</p>
                            <p className="text-sm leading-relaxed">{event.description}</p>
                        </div>
                    )}

                    {/* Markets Section */}
                    <Card className="rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base">Mercados</CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">{event.markets?.length || 0} mercado{(event.markets?.length || 0) !== 1 ? 's' : ''} associado{(event.markets?.length || 0) !== 1 ? 's' : ''}</p>
                            </div>
                            <Dialog open={createMarketOpen} onOpenChange={setCreateMarketOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="rounded-lg">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Novo Mercado
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl gap-0 max-h-[90vh] overflow-y-auto">
                                    <form onSubmit={handleCreateMarket}>
                                        {/* Hero image */}
                                        <div className="px-6 pt-6 pb-0">
                                            <div
                                                className="relative w-full h-36 rounded-xl overflow-hidden cursor-pointer group border border-border bg-muted/40"
                                                onClick={() => createMarketFileRef.current?.click()}
                                            >
                                                {createMarketPreview ? (
                                                    <>
                                                        <img src={createMarketPreview} alt="" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="flex items-center gap-1.5 bg-white/90 text-foreground text-xs font-medium px-3 py-1.5 rounded-full">
                                                                <Camera className="h-3.5 w-3.5" /> Trocar foto
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); if (createMarketPreview.startsWith("blob:")) URL.revokeObjectURL(createMarketPreview); setCreateMarketPreview(""); setCreateMarketPendingFile(null); }}
                                                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 z-10"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border"><Camera className="h-4 w-4" /></div>
                                                        <span className="text-xs font-medium">Clique para adicionar foto</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input ref={createMarketFileRef} type="file" accept="image/*" className="hidden"
                                                onChange={pickFile(createMarketFileRef, setCreateMarketPendingFile, setCreateMarketPreview, createMarketPreview)} />
                                            {/* Suggestion: use event image */}
                                            {event.imageUrl && !createMarketPreview && (
                                                <button type="button"
                                                    onClick={() => { setCreateMarketPreview(event.imageUrl!); setCreateMarketPendingFile(null); }}
                                                    className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                                                >
                                                    <img src={event.imageUrl} alt={event.title} className="h-8 w-8 rounded-md object-cover border shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                                            <Sparkles className="h-3 w-3 text-amber-500" /> Sugestão
                                                        </p>
                                                        <p className="text-xs text-foreground truncate">Usar foto do evento</p>
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                        <DialogHeader className="px-6 pt-4 pb-0">
                                            <DialogTitle>Criar Novo Mercado</DialogTitle>
                                            <DialogDescription>Adicione um novo mercado vinculando a este evento.</DialogDescription>
                                        </DialogHeader>
                                        <div className="px-6 py-4 space-y-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="cm-statement">Afirmação</Label>
                                                <Input id="cm-statement" required value={newMarket.statement}
                                                    onChange={e => setNewMarket({ ...newMarket, statement: e.target.value })}
                                                    placeholder="Ex: Brasil ganha a Copa do Mundo?"
                                                    className={newMarket.statement.length > 0 && newMarket.statement.length < 5 ? "border-destructive" : ""}
                                                />
                                                {newMarket.statement.length > 0 && newMarket.statement.length < 5 && (
                                                    <p className="text-[11px] text-destructive">Mínimo de 5 caracteres</p>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="cm-opensAt">Data de Abertura</Label>
                                                <Input id="cm-opensAt" type="datetime-local" required value={newMarket.opensAt} onChange={e => setNewMarket({ ...newMarket, opensAt: e.target.value })} className="rounded-lg" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label>Fechamento</Label>
                                                    <Input type="datetime-local" required value={newMarket.closesAt} onChange={e => setNewMarket({ ...newMarket, closesAt: e.target.value })} className="rounded-lg" />
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {DATE_PILLS.map((pill) => (
                                                            <button key={pill.label} type="button"
                                                                onClick={() => setNewMarket(prev => ({ ...prev, closesAt: toLocalISO(pill.date) }))}
                                                                className="px-2 py-0.5 rounded-full border border-border text-[11px] text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                                                            >{pill.label}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Resolução</Label>
                                                    <Input type="datetime-local" required value={newMarket.resolvesAt} onChange={e => setNewMarket({ ...newMarket, resolvesAt: e.target.value })} className="rounded-lg" />
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {DATE_PILLS.map((pill) => (
                                                            <button key={pill.label} type="button"
                                                                onClick={() => setNewMarket(prev => ({ ...prev, resolvesAt: toLocalISO(pill.date) }))}
                                                                className="px-2 py-0.5 rounded-full border border-border text-[11px] text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                                                            >{pill.label}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="cm-fee">Taxa Base (bps)</Label>
                                                <Input id="cm-fee" type="number" value={newMarket.feeBps} onChange={e => setNewMarket({ ...newMarket, feeBps: Number(e.target.value) })} className="rounded-lg" />
                                                <p className="text-xs text-muted-foreground">200 bps = 2%</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="cm-rules">Regras de Resolução</Label>
                                                <Textarea id="cm-rules" rows={2} value={newMarket.resolveRules} onChange={e => setNewMarket({ ...newMarket, resolveRules: e.target.value })} placeholder="Descreva os critérios de resolução..." className="rounded-lg" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
                                            <Button type="button" variant="outline" onClick={() => setCreateMarketOpen(false)} className="rounded-lg">Cancelar</Button>
                                            <Button type="submit" disabled={actionLoading} className="rounded-lg">
                                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Criar Mercado
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            {event.markets && event.markets.length > 0 ? (
                                <div>
                                    {event.markets.map((market, idx) => (
                                        <Link href={`/admin/mercados/${market.id}`} key={market.id}>
                                            <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer group ${idx < (event.markets?.length || 0) - 1 ? 'border-b border-border' : ''
                                                }`}>
                                                {/* Thumbnail */}
                                                <div className="shrink-0 h-10 w-10 rounded-lg overflow-hidden bg-muted border">
                                                    {market.imageUrl ? (
                                                        <img src={market.imageUrl} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                                            <PlaceholderIcon size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Statement and meta */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium leading-snug truncate">{market.statement}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getMarketStatusColor(market.status)}`}>
                                                            {getMarketStatusLabel(market.status)}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground font-mono truncate hidden sm:block">{market.id.slice(0, 8)}…</span>
                                                    </div>
                                                </div>
                                                {/* Probabilities */}
                                                <div className="hidden sm:flex items-center gap-4 shrink-0">
                                                    <div className="text-center">
                                                        <div className="text-[11px] text-muted-foreground">Sim</div>
                                                        <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{market.probYes ?? 0}%</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-[11px] text-muted-foreground">Não</div>
                                                        <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">{market.probNo ?? 0}%</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-[11px] text-muted-foreground">Liquidez</div>
                                                        <div className="text-sm font-semibold">R$ {((market.liquidityB ?? 0) / 100).toFixed(2)}</div>
                                                    </div>
                                                </div>
                                                {/* Edit button */}
                                                <Button variant="ghost" size="icon"
                                                    className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditMarket(market); }}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </Link>
                                    ))}

                                    {/* Edit Market Dialog */}
                                    <Dialog open={editMarketOpen} onOpenChange={setEditMarketOpen}>
                                        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl gap-0 max-h-[90vh] overflow-y-auto">
                                            <form onSubmit={handleEditMarket}>
                                                {/* Hero image */}
                                                <div className="px-6 pt-6 pb-0">
                                                    <div
                                                        className="relative w-full h-36 rounded-xl overflow-hidden cursor-pointer group border border-border bg-muted/40"
                                                        onClick={() => editMarketFileRef.current?.click()}
                                                    >
                                                        {editMarketPreview ? (
                                                            <>
                                                                <img src={editMarketPreview} alt="" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <div className="flex items-center gap-1.5 bg-white/90 text-foreground text-xs font-medium px-3 py-1.5 rounded-full">
                                                                        <Camera className="h-3.5 w-3.5" /> Trocar foto
                                                                    </div>
                                                                </div>
                                                                <button type="button"
                                                                    onClick={(e) => { e.stopPropagation(); if (editMarketPreview.startsWith("blob:")) URL.revokeObjectURL(editMarketPreview); setEditMarketPreview(""); setEditMarketPendingFile(null); setEditMarketData(p => ({ ...p, imageUrl: "" })); }}
                                                                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 z-10"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border"><Camera className="h-4 w-4" /></div>
                                                                <span className="text-xs font-medium">Clique para adicionar foto</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <input ref={editMarketFileRef} type="file" accept="image/*" className="hidden"
                                                        onChange={pickFile(editMarketFileRef, setEditMarketPendingFile, setEditMarketPreview, editMarketPreview)} />
                                                </div>
                                                <DialogHeader className="px-6 pt-4 pb-0">
                                                    <DialogTitle>Editar Mercado</DialogTitle>
                                                    <DialogDescription>Altere as informações deste mercado.</DialogDescription>
                                                </DialogHeader>
                                                <div className="px-6 py-4 space-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label>Afirmação</Label>
                                                        <Input required value={editMarketData.statement}
                                                            onChange={e => setEditMarketData({ ...editMarketData, statement: e.target.value })}
                                                            className={`rounded-lg ${editMarketData.statement.length > 0 && editMarketData.statement.length < 5 ? "border-destructive" : ""}`}
                                                        />
                                                        {editMarketData.statement.length > 0 && editMarketData.statement.length < 5 && (
                                                            <p className="text-[11px] text-destructive">Mínimo de 5 caracteres</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label>Data de Abertura</Label>
                                                        <Input type="datetime-local" value={editMarketData.opensAt} onChange={e => setEditMarketData({ ...editMarketData, opensAt: e.target.value })} className="rounded-lg" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <Label>Fechamento</Label>
                                                            <Input type="datetime-local" value={editMarketData.closesAt} onChange={e => setEditMarketData({ ...editMarketData, closesAt: e.target.value })} className="rounded-lg" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label>Resolução</Label>
                                                            <Input type="datetime-local" value={editMarketData.resolvesAt} onChange={e => setEditMarketData({ ...editMarketData, resolvesAt: e.target.value })} className="rounded-lg" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label>Taxa Base (bps)</Label>
                                                        <Input type="number" value={editMarketData.feeBps} onChange={e => setEditMarketData({ ...editMarketData, feeBps: Number(e.target.value) })} className="rounded-lg" />
                                                        <p className="text-xs text-muted-foreground">200 bps = 2%</p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label>Regras de Resolução</Label>
                                                        <Textarea rows={2} value={editMarketData.resolveRules} onChange={e => setEditMarketData({ ...editMarketData, resolveRules: e.target.value })} className="rounded-lg" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
                                                    <Button type="button" variant="outline" onClick={() => setEditMarketOpen(false)} className="rounded-lg">Cancelar</Button>
                                                    <Button type="submit" disabled={actionLoading} className="rounded-lg">
                                                        {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Salvar Alterações
                                                    </Button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                        <Plus className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium">Nenhum mercado ainda</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Clique em "Novo Mercado" para começar</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card className="rounded-xl">
                        <CardContent className="p-4 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ações</p>
                            <Dialog open={editEventOpen} onOpenChange={setEditEventOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start rounded-lg">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar Informações
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl gap-0 max-h-[90vh] overflow-y-auto">
                                    <form onSubmit={handleEditEvent}>
                                        {/* Hero image */}
                                        <div className="px-6 pt-6 pb-0">
                                            <div
                                                className="relative w-full h-44 rounded-xl overflow-hidden cursor-pointer group border border-border bg-muted/40"
                                                onClick={() => editEventFileRef.current?.click()}
                                            >
                                                {editEventPreview ? (
                                                    <>
                                                        <img src={editEventPreview} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="flex items-center gap-1.5 bg-white/90 text-foreground text-xs font-medium px-3 py-1.5 rounded-full">
                                                                <Camera className="h-3.5 w-3.5" /> Trocar foto
                                                            </div>
                                                        </div>
                                                        <button type="button"
                                                            onClick={(e) => { e.stopPropagation(); if (editEventPreview.startsWith("blob:")) URL.revokeObjectURL(editEventPreview); setEditEventPreview(""); setEditEventPendingFile(null); setEditEventData(p => ({ ...p, imageUrl: "" })); }}
                                                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 z-10"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border"><Camera className="h-4 w-4" /></div>
                                                        <span className="text-xs font-medium">Clique para adicionar foto</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input ref={editEventFileRef} type="file" accept="image/*" className="hidden"
                                                onChange={pickFile(editEventFileRef, setEditEventPendingFile, setEditEventPreview, editEventPreview)} />
                                        </div>
                                        <DialogHeader className="px-6 pt-4 pb-0">
                                            <DialogTitle>Editar Evento</DialogTitle>
                                            <DialogDescription>Altere as informações deste evento.</DialogDescription>
                                        </DialogHeader>
                                        <div className="px-6 py-4 space-y-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="ee-title">Título</Label>
                                                <Input id="ee-title" required value={editEventData.title} onChange={e => setEditEventData({ ...editEventData, title: e.target.value })} className="rounded-lg" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="ee-desc">Descrição</Label>
                                                <Textarea id="ee-desc" required value={editEventData.description} onChange={e => setEditEventData({ ...editEventData, description: e.target.value })} className="rounded-lg" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Categoria</Label>
                                                <Select value={editEventData.category} onValueChange={value => setEditEventData({ ...editEventData, category: value })}>
                                                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((cat) => (
                                                            <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="ee-start">Início</Label>
                                                    <Input id="ee-start" type="datetime-local" required value={editEventData.startsAt} onChange={e => setEditEventData({ ...editEventData, startsAt: e.target.value })} className="rounded-lg" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="ee-end">Fim</Label>
                                                    <Input id="ee-end" type="datetime-local" required value={editEventData.endsAt} onChange={e => setEditEventData({ ...editEventData, endsAt: e.target.value })} className="rounded-lg" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="ee-rules">Regras de Resolução</Label>
                                                <Textarea id="ee-rules" value={editEventData.resolveRules} onChange={e => setEditEventData({ ...editEventData, resolveRules: e.target.value })} className="rounded-lg" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
                                            <Button type="button" variant="outline" onClick={() => setEditEventOpen(false)} className="rounded-lg">Cancelar</Button>
                                            <Button type="submit" disabled={actionLoading} className="rounded-lg">
                                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Salvar Alterações
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                            {event.status !== 'closed' && event.markets && event.markets.length > 0 && (
                                <Dialog open={resolveEventOpen} onOpenChange={setResolveEventOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 rounded-lg">
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
                            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive rounded-lg" disabled>
                                <Trash className="mr-2 h-4 w-4" />
                                Excluir Evento
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card className="rounded-xl">
                        <CardContent className="p-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Estatísticas</p>
                            <div className="space-y-3">
                                {[{
                                    label: 'Mercados Ativos',
                                    value: String(event.markets?.filter(m => m.status === 'open' || m.status === ('active' as any)).length || 0)
                                }, {
                                    label: 'Total de Mercados',
                                    value: String(event.markets?.length || 0)
                                }, {
                                    label: 'Liquidez Total',
                                    value: `R$ ${((event.markets?.reduce((acc, m) => acc + (m.liquidityB || 0), 0) || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                }].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">{label}</span>
                                        <span className="text-sm font-semibold">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Event details card */}
                    {(event.resolveRules) && (
                        <Card className="rounded-xl">
                            <CardContent className="p-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Regras de Resolução</p>
                                <p className="text-xs leading-relaxed text-muted-foreground">{event.resolveRules}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
