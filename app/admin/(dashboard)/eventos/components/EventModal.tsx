"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, X, Loader2, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, ApiClientError } from "@/lib/api/client";
import type { Event, Category } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function localDateStr(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayStr() {
  return localDateStr(new Date());
}

function addDays(base: string, days: number) {
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

function addMonths(base: string, months: number) {
  const d = new Date(base + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  return localDateStr(d);
}

const PERIOD_PILLS = [
  { label: "3 dias", fn: (s: string) => addDays(s, 3) },
  { label: "7 dias", fn: (s: string) => addDays(s, 7) },
  { label: "1 mês", fn: (s: string) => addMonths(s, 1) },
  { label: "3 meses", fn: (s: string) => addMonths(s, 3) },
  { label: "6 meses", fn: (s: string) => addMonths(s, 6) },
];

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = (height / width) * maxDim; width = maxDim; }
          else { width = (width / height) * maxDim; height = maxDim; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => { if (blob) resolve(blob); else reject(new Error("Canvas compression failed")); },
          "image/jpeg",
          0.8
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// ── Components ────────────────────────────────────────────────────────────────

interface ImageHeroProps {
  imageUrl: string;
  isUploading: boolean;
  onClick: () => void;
  onClear?: () => void;
  className?: string;
}

function ImageHero({ imageUrl, isUploading, onClick, onClear, className = "h-44" }: ImageHeroProps) {
  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden cursor-pointer group border flex-shrink-0 border-border bg-muted/40 ${className}`}
      onClick={!isUploading ? onClick : undefined}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Imagem"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/90 text-foreground text-xs font-medium px-3 py-1.5 rounded-full">
              <Camera className="h-3.5 w-3.5" />
              Trocar foto
            </div>
          </div>
          {onClear && (
             <button
               type="button"
               onClick={(e) => { e.stopPropagation(); onClear(); }}
               className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
             >
               <X className="h-3.5 w-3.5" />
             </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground select-none">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          </div>
          <span className="text-xs font-medium">
            {isUploading ? "Enviando..." : "Adicionar foto"}
          </span>
        </div>
      )}
      {isUploading && imageUrl && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketItem {
  id: string;
  statement: string;
  imageUrl: string;
  pendingFile: File | null;
}

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: Event | null;
  categories: Category[];
  onSaved: () => void;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function EventModal({ isOpen, onClose, eventToEdit, categories, onSaved }: EventModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const t = todayStr();
  const isEditing = !!eventToEdit;
  
  // Note: Edit mode hides step 2 (markets). We only allow market creation in new events.
  const totalSteps = isEditing ? 2 : 3;

  // Event State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState(t);
  const [endDate, setEndDate] = useState(addMonths(t, 1));
  const [resolveRules, setResolveRules] = useState("");
  const [eventImage, setEventImage] = useState("");
  const [eventFile, setEventFile] = useState<File | null>(null);
  
  // Markets State
  const [markets, setMarkets] = useState<MarketItem[]>([]);

  const eventFileInputRef = useRef<HTMLInputElement>(null);
  const marketFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const createdBlobs = useRef<Set<string>>(new Set());

  // Reset or load data when opening
  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setTitle(eventToEdit.title);
        setDescription(eventToEdit.description || "");
        setCategory(eventToEdit.category || "");
        setStartDate(eventToEdit.startsAt ? localDateStr(new Date(eventToEdit.startsAt)) : t);
        setEndDate(eventToEdit.endsAt ? localDateStr(new Date(eventToEdit.endsAt)) : addMonths(t, 1));
        setResolveRules(eventToEdit.resolveRules || "");
        setEventImage(eventToEdit.imageUrl || "");
        setEventFile(null);
        setMarkets([]);
      } else {
        setTitle("");
        setDescription("");
        setCategory("");
        setStartDate(t);
        setEndDate(addMonths(t, 1));
        setResolveRules("");
        setEventImage("");
        setEventFile(null);
        setMarkets([{ id: crypto.randomUUID(), statement: "", imageUrl: "", pendingFile: null }]);
      }
      setStep(1);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, eventToEdit]);

  // Clean up object URLs when modal closes
  useEffect(() => {
    if (!isOpen) {
      createdBlobs.current.forEach(blob => URL.revokeObjectURL(blob));
      createdBlobs.current.clear();
    }
  }, [isOpen]);

  const uploadFile = async (file: File) => {
    const fileToUpload = file.size > 5 * 1024 * 1024 ? await compressImage(file) : file;
    const fd = new FormData();
    fd.append("file", fileToUpload, file.name);
    const res = await adminApi.uploadEventImage(fd);
    return res.data.imageUrl;
  };

  const handleEventFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    createdBlobs.current.add(localUrl);
    setEventFile(file);
    setEventImage(localUrl);
    if (eventFileInputRef.current) eventFileInputRef.current.value = "";
    setErrors(prev => ({ ...prev, eventImage: false }));
  };

  const handleMarketFileChange = (marketId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    createdBlobs.current.add(localUrl);
    setMarkets(prev => prev.map(m => {
      if (m.id === marketId) {
        return { ...m, pendingFile: file, imageUrl: localUrl };
      }
      return m;
    }));
    if (marketFileInputRefs.current[marketId]) {
      marketFileInputRefs.current[marketId]!.value = "";
    }
  };

  const addMarket = () => {
    setMarkets(prev => [...prev, { id: crypto.randomUUID(), statement: "", imageUrl: "", pendingFile: null }]);
  };

  const removeMarket = (id: string) => {
    setMarkets(prev => prev.filter(m => m.id !== id));
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    let errorStep = -1;

    // Step 1: Basic Info
    if (!title.trim()) newErrors.title = true;
    if (!category) newErrors.category = true;
    if (!startDate) newErrors.startDate = true;
    if (!endDate) newErrors.endDate = true;
    // We can allow no image, but normally we'd force it. Let's make it required for better UX if they forget.
    if (!eventImage && !eventFile && !isEditing) newErrors.eventImage = true;

    if (Object.keys(newErrors).length > 0) {
      errorStep = 1;
    }

    // Step 2: Markets (only if not editing)
    if (!isEditing) {
      markets.forEach((m) => {
        if (m.statement.trim().length < 5) {
          newErrors[`market_${m.id}`] = true;
          if (errorStep === -1) errorStep = 2;
        }
      });
      if (markets.length === 0) {
        toast.error("Adicione pelo menos um mercado.");
        if (errorStep === -1) errorStep = 2;
      }
    }

    // Step 3: Rules
    if (!resolveRules.trim()) {
      newErrors.resolveRules = true;
      if (errorStep === -1) errorStep = isEditing ? 2 : 3;
    }

    setErrors(newErrors);

    if (errorStep !== -1) {
      setStep(errorStep);
      toast.error("Preencha os campos obrigatórios em vermelho.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateAll()) return;
    setLoading(true);

    try {
      // 1. Upload Event Image
      let finalEventImageUrl = eventToEdit?.imageUrl || undefined;
      if (eventFile) {
        finalEventImageUrl = await uploadFile(eventFile);
      }

      // Format Slug (We keep frontend slug generation, but do not block typing)
      const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");

      if (isEditing && eventToEdit) {
        await adminApi.updateEvent(eventToEdit.id, {
          title,
          description,
          category,
          imageUrl: finalEventImageUrl,
          startsAt: startDate ? new Date(startDate + "T00:00").toISOString() : undefined,
          endsAt: endDate ? new Date(endDate + "T23:59").toISOString() : undefined,
          resolveRules,
        });
        toast.success("Evento atualizado com sucesso!");
      } else {
        // Create Event
        const createRes = await adminApi.createEvent({
          title,
          slug,
          description,
          category,
          startsAt: startDate ? new Date(startDate + "T00:00").toISOString() : new Date().toISOString(),
          endsAt: endDate ? new Date(endDate + "T23:59").toISOString() : new Date().toISOString(),
          resolveRules,
        });

        // Safely get the event ID since backend response wrapping can vary
        const eventId = createRes?.data?.id || (createRes as any)?.id;

        if (finalEventImageUrl && eventId) {
          await adminApi.updateEvent(eventId, { imageUrl: finalEventImageUrl });
        }

        // Create Markets
        if (eventId) {
          for (const m of markets) {
            let marketImageUrl = undefined;
            if (m.pendingFile) {
              marketImageUrl = await uploadFile(m.pendingFile);
            }
            await adminApi.createMarket({
              eventId: eventId,
              statement: m.statement,
              opensAt: new Date(startDate + "T00:00").toISOString(),
              closesAt: new Date(endDate + "T23:59").toISOString(),
              resolvesAt: new Date(endDate + "T23:59").toISOString(),
              resolveRules: resolveRules,
              imageUrl: marketImageUrl || undefined,
              feeBps: 200,
            });
          }
        }
        toast.success("Evento criado com sucesso!");
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
      if (error instanceof ApiClientError) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao salvar o evento.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = (s: number) => {
    if (isEditing) return s === 1 ? "Informações Básicas" : "Regras";
    if (s === 1) return "Informações Básicas";
    if (s === 2) return "Mercados";
    return "Regras";
  };

  const getActualStepIndex = (s: number) => {
    // se formos editar, passo 2 é regras (que era o 3)
    if (isEditing && s === 2) return 3;
    return s;
  };

  const LabelUI = ({ text, required = false, isError = false }: { text: string, required?: boolean, isError?: boolean }) => (
    <Label className={`text-sm font-medium ${isError ? 'text-destructive' : ''}`}>
      {text} {required && <span className="text-destructive font-bold">*</span>}
    </Label>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-1xl md:max-w-2xl p-0 overflow-hidden rounded-2xl gap-0 bg-background flex flex-col h-[65vh] max-h-[800px]">
        
        {/* Header / Stepper */}
        <div className="flex-shrink-0 border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {isEditing ? "Editar Evento" : "Criar Novo Evento"}
            </h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const current = i + 1;
              const isActive = step === current;
              const isPast = step > current;
              return (
                <div key={current} className="flex items-center">
                  <button
                    onClick={() => setStep(current)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" :
                      isPast ? "bg-primary/20 text-primary hover:bg-primary/30" :
                      "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs ${isActive || isPast ? "bg-background/20" : "bg-background/50"}`}>
                      {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : current}
                    </div>
                    {getStepTitle(current)}
                  </button>
                  {current < totalSteps && (
                    <div className="w-4 h-[1px] bg-border mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto w-full p-6">
          <div className="w-full max-w-2xl mx-auto space-y-6">
            
            {/* STEP 1: EVENT INFO */}
            {getActualStepIndex(step) === 1 && (
              <div className="flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Left Column: Image */}
                <div className="md:w-1/3 flex-shrink-0 space-y-2">
                  <LabelUI text="Capa do Evento" required={!isEditing} isError={errors.eventImage} />
                  <div className={`rounded-xl overflow-hidden ${errors.eventImage ? "border-destructive" : "border-border"}`}>
                    <ImageHero
                      imageUrl={eventImage}
                      isUploading={false}
                      className="aspect-square w-full h-auto"
                      onClick={() => eventFileInputRef.current?.click()}
                      onClear={eventImage ? () => {
                        if (eventImage.startsWith("blob:")) URL.revokeObjectURL(eventImage);
                        setEventImage("");
                        setEventFile(null);
                      } : undefined}
                    />
                  </div>
                  <input type="file" ref={eventFileInputRef} className="hidden" accept="image/*" onChange={handleEventFileChange} />
                </div>

                {/* Right Column: Fields */}
                <div className="flex-1 min-w-0 space-y-6">
                  {/* Título e Categoria */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <LabelUI text="Título" required isError={errors.title} />
                      <Input
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); setErrors(p => ({ ...p, title: false })); }}
                        placeholder="Ex: Quem vencerá as eleições de 2026?"
                        className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <LabelUI text="Categoria" required isError={errors.category} />
                      <Select
                        value={category}
                        onValueChange={(val) => { setCategory(val); setErrors(p => ({ ...p, category: false })); }}
                      >
                        <SelectTrigger className={errors.category ? "border-destructive focus-visible:ring-destructive" : ""}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <LabelUI text="Data de Início" required isError={errors.startDate} />
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setErrors(p => ({ ...p, startDate: false })); }}
                        className={errors.startDate ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <LabelUI text="Data de Fim" required isError={errors.endDate} />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setErrors(p => ({ ...p, endDate: false })); }}
                        className={errors.endDate ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                    </div>
                  </div>
                  
                  {/* Pills de tempo */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground font-medium mr-0.5">Auto-preencher Duração:</span>
                    {PERIOD_PILLS.map((pill) => (
                      <button
                        key={pill.label}
                        type="button"
                        onClick={() => {
                          setEndDate(pill.fn(startDate || t));
                          setErrors(p => ({ ...p, endDate: false }));
                        }}
                        className="px-2.5 py-1 rounded-full border border-border text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  {/* Descrição */}
                  <div className="space-y-1.5">
                    <LabelUI text="Descrição do Evento" />
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva o contexto do evento..."
                      className="h-28 w-full max-w-full resize-none break-all [overflow-wrap:anywhere] [field-sizing:fixed]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: MARKETS (Only Create Mode) */}
            {getActualStepIndex(step) === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">
                    Crie os mercados (perguntas específicas) que farão parte deste evento. <span className="text-destructive font-bold">*</span>
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={addMarket}>
                    <Plus className="w-4 h-4 mr-1.5" /> Novo Mercado
                  </Button>
                </div>
                
                {markets.map((market, index) => (
                  <div key={market.id} className="p-4 border border-border rounded-xl bg-muted/10 space-y-4 relative">
                    {markets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMarket(market.id)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className="flex gap-6 items-start">
                      <div className="w-28 flex-shrink-0 space-y-1.5">
                        <LabelUI text="Foto" />
                        <div className="rounded-lg overflow-hidden">
                          <ImageHero
                            imageUrl={market.imageUrl}
                            isUploading={false}
                            className="aspect-square w-full h-full"
                            onClick={() => marketFileInputRefs.current[market.id]?.click()}
                            onClear={market.imageUrl ? () => {
                              if (market.imageUrl.startsWith("blob:")) URL.revokeObjectURL(market.imageUrl);
                              setMarkets(p => p.map(m => m.id === market.id ? { ...m, imageUrl: "", pendingFile: null } : m));
                            } : undefined}
                          />
                        </div>
                        <input
                          type="file"
                          ref={el => { marketFileInputRefs.current[market.id] = el; }}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleMarketFileChange(market.id, e)}
                        />
                      </div>
                      
                      <div className="flex-1 space-y-1.5">
                        <LabelUI text={`Pergunta (Mercado ${index + 1})`} required isError={errors[`market_${market.id}`]} />
                        <Input
                          value={market.statement}
                          onChange={(e) => {
                            setMarkets(p => p.map(m => m.id === market.id ? { ...m, statement: e.target.value } : m));
                            setErrors(p => ({ ...p, [`market_${market.id}`]: false }));
                          }}
                          placeholder="Ex: Candidato X terá mais de 50% dos votos?"
                          className={errors[`market_${market.id}`] ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {errors[`market_${market.id}`] && <p className="text-[11px] font-medium text-destructive mt-1">Mínimo de 5 caracteres</p>}
                        <p className="text-xs text-muted-foreground pt-1.5">A pergunta deve ter uma resolução binária clara, focada num resultado possível (Ex: Vai acontecer X?). Evite perguntas muito abertas.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 3: RULES */}
            {getActualStepIndex(step) === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                <p className="text-sm text-muted-foreground">
                  Descreva as regras exatas para resolver os mercados. Defina a fonte de verdade e qualquer detalhe que evite ambiguidades.
                </p>
                <div className="space-y-1.5 flex-1 flex flex-col min-h-[300px]">
                  <LabelUI text="Regras Gerais de Resolução" required isError={errors.resolveRules} />
                  <Textarea
                    value={resolveRules}
                    onChange={(e) => { setResolveRules(e.target.value); setErrors(p => ({ ...p, resolveRules: false })); }}
                    placeholder="Ex: A resolução será baseada na apuração oficial do TSE divulgada no site oficial..."
                    className={`flex-1 w-full max-w-full resize-none break-all [overflow-wrap:anywhere] [field-sizing:fixed] ${errors.resolveRules ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            )}
            
            {step < totalSteps ? (
              <Button onClick={() => setStep(step + 1)}>
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={loading} className="min-w-[120px]">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {!loading && <CheckCircle2 className="w-4 h-4 mr-2" />}
                {isEditing ? "Salvar Evento" : "Criar Evento"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
