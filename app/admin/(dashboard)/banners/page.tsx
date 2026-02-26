"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DataTable,
    ColumnDef,
} from "@/components/shared/data-table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Image as ImageIcon,
    Loader2,
    Link as LinkIcon
} from "lucide-react";
import { adminApi, ApiClientError } from "@/lib/api/client";
import type { Banner } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        imageUrl: "",
        linkUrl: "",
        displayOrder: 0,
        isActive: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete state
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadBanners = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminApi.getBanners();
            setBanners(response.banners || []);
        } catch (error) {
            console.error("Error loading banners:", error);
            toast.error("Erro ao carregar banners.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBanners();
    }, [loadBanners]);

    const filteredBanners = banners.filter(b =>
        (b.title?.toLowerCase() || "").includes(search.toLowerCase())
    ).sort((a, b) => a.displayOrder - b.displayOrder);

    const handleOpenDialog = (banner?: Banner) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title || "",
                imageUrl: banner.imageUrl,
                linkUrl: banner.linkUrl || "",
                displayOrder: banner.displayOrder || 0,
                isActive: banner.isActive,
            });
        } else {
            setEditingBanner(null);
            setFormData({
                title: "",
                imageUrl: "",
                linkUrl: "",
                displayOrder: banners.length,
                isActive: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingBanner(null);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Selecione um arquivo de imagem válido.");
            return;
        }

        setIsUploading(true);
        try {
            const data = new FormData();
            data.append("file", file);

            const response = await adminApi.uploadBannerImage(data);

            if (response.imageUrl) {
                setFormData(prev => ({ ...prev, imageUrl: response.imageUrl }));
                toast.success("Imagem enviada com sucesso!");
            }
        } catch (error: any) {
            console.error("Error uploading image:", error);
            toast.error(error.message || "Erro ao fazer upload da imagem.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.imageUrl) {
            toast.error("A Imagem é obrigatória.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingBanner) {
                await adminApi.updateBanner(editingBanner.id, formData);
                toast.success("Banner atualizado com sucesso.");
            } else {
                await adminApi.createBanner(formData);
                toast.success("Banner criado com sucesso.");
            }
            handleCloseDialog();
            loadBanners();
        } catch (error: any) {
            console.error("Error saving banner:", error);
            toast.error(error.message || "Erro ao salvar banner.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await adminApi.deleteBanner(deleteId);
            toast.success("Banner excluído com sucesso.");
            setDeleteId(null);
            loadBanners();
        } catch (error: any) {
            console.error("Error deleting banner", error);
            toast.error(error.message || "Erro ao excluir banner.");
        } finally {
            setIsDeleting(false);
        }
    };

    const columns: ColumnDef<Banner>[] = [
        {
            header: "Ordem",
            className: "w-[80px]",
            cell: (banner) => (
                <span className="font-medium text-muted-foreground">
                    {banner.displayOrder}
                </span>
            ),
        },
        {
            header: "Preview",
            cell: (banner) => (
                <div className="w-32 h-10 relative overflow-hidden rounded border bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {banner.imageUrl ? (
                        <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                    )}
                </div>
            ),
        },
        {
            header: "Título (Admin)",
            className: "font-medium",
            cell: (banner) => banner.title || '-'
        },
        {
            header: "Link",
            cell: (banner) => banner.linkUrl ? (
                <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-500 hover:text-blue-600 hover:underline max-w-[200px] truncate">
                    <LinkIcon className="h-3 w-3 mr-1 inline shrink-0" />
                    {banner.linkUrl}
                </a>
            ) : (
                <span className="text-muted-foreground text-sm">-</span>
            )
        },
        {
            header: "Status",
            cell: (banner) => (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${banner.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                    {banner.isActive ? 'Ativo' : 'Inativo'}
                </span>
            ),
        },
        {
            header: "Ações",
            className: "text-right",
            cell: (banner) => (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(banner)}>
                        <Edit2 className="size-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(banner.id)}>
                        <Trash2 className="size-4 text-rose-500" />
                    </Button>
                </div>
            ),
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Gerencie os banners exibidos no início do app.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Banner
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 w-full rounded-lg border bg-background"
                    />
                </div>
            </div>

            <div className="w-full">
                <DataTable
                    data={filteredBanners}
                    columns={columns}
                    keyExtractor={(cat) => cat.id}
                    isLoading={loading}
                    emptyMessage="Nenhum banner encontrado."
                />
            </div>

            {/* Editor Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">

                        {/* Image Selector */}
                        <div className="space-y-3">
                            <Label>Imagem do Banner *</Label>
                            <div
                                className="w-full aspect-[21/9] bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {formData.imageUrl ? (
                                    <>
                                        <img src={formData.imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white text-sm font-medium flex items-center gap-2">
                                                <Edit2 className="h-4 w-4" /> Alterar Imagem
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        {isUploading ? (
                                            <Loader2 className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-2" />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                        )}
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            {isUploading ? "Enviando..." : "Clique para selecionar a imagem"}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">Recomendado: 21:9 ratio (ex: 2100x900px)</p>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="title">Título de Controle (Interno)</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Ex: Campanha de Carnaval"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="linkUrl">Link de Destino (Opcional)</Label>
                            <Input
                                id="linkUrl"
                                type="url"
                                value={formData.linkUrl}
                                onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="order">Ordem de Exibição</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={formData.displayOrder}
                                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="flex flex-col gap-2 justify-center pt-6">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="active"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                                    />
                                    <Label htmlFor="active">Banner Ativo</Label>
                                </div>
                            </div>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog} disabled={isSubmitting || isUploading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
                            {isSubmitting ? "Salvando..." : "Salvar Banner"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Excluir Banner"
                description="Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita e a imagem será removida do site."
                confirmText="Excluir"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </div>
    );
}
