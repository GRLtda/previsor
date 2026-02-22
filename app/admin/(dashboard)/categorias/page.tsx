"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    MoreHorizontal
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { Category } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        slug: "",
        name: "",
        icon: "LayoutGrid",
        displayOrder: 0,
        isActive: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete state
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminApi.getCategories();
            setCategories(response.categories || []);
        } catch (error) {
            console.error("Error loading categories:", error);
            toast.error("Erro ao carregar categorias.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.slug.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.displayOrder - b.displayOrder);

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                slug: category.slug,
                name: category.name,
                icon: category.icon || "LayoutGrid",
                displayOrder: category.displayOrder || 0,
                isActive: category.isActive,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                slug: "",
                name: "",
                icon: "LayoutGrid",
                displayOrder: categories.length,
                isActive: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingCategory(null);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.slug) {
            toast.error("Nome e Slug são obrigatórios.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await adminApi.updateCategory(editingCategory.id, formData);
                toast.success("Categoria atualizada com sucesso.");
            } else {
                await adminApi.createCategory(formData);
                toast.success("Categoria criada com sucesso.");
            }
            handleCloseDialog();
            loadCategories();
        } catch (error: any) {
            console.error("Error saving category:", error);
            toast.error(error.message || "Erro ao salvar categoria.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await adminApi.deleteCategory(deleteId);
            toast.success("Categoria excluída com sucesso.");
            setDeleteId(null);
            loadCategories();
        } catch (error: any) {
            console.error("Error deleting category", error);
            toast.error(error.message || "Erro ao excluir categoria.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Gerencie as categorias de eventos da plataforma.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou slug..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 w-full rounded-lg border bg-background"
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Ordem</TableHead>
                                <TableHead>Ícone</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : filteredCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhuma categoria encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCategories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-medium text-muted-foreground">
                                            {cat.displayOrder}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex size-8 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                                                <DynamicIcon name={cat.icon || "LayoutGrid"} className="size-4" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cat.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                                {cat.isActive ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(cat)}>
                                                    <Edit2 className="size-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(cat.id)}>
                                                    <Trash2 className="size-4 text-rose-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Editor Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        name: val,
                                        // Auto-slugify on creation if empty or matching old auto-slug
                                        slug: !editingCategory ? val.toLowerCase().replace(/\s+/g, '-') : prev.slug
                                    }));
                                }}
                                placeholder="Ex: Criptomoedas"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug (URL)</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                placeholder="Ex: criptomoedas"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="icon">Ícone (Nomes do Lucide)</Label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    id="icon"
                                    value={formData.icon}
                                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                                    placeholder="Ex: Bitcoin"
                                    className="flex-1"
                                />
                                <div className="flex size-10 items-center justify-center rounded-md bg-slate-100 border shrink-0">
                                    <DynamicIcon name={formData.icon || "HelpCircle"} className="size-4" />
                                </div>
                            </div>
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
                                    <Label htmlFor="active">Categoria Ativa</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar Categoria"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Excluir Categoria"
                description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </div>
    );
}
