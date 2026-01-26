"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, AlertCircle, Copy, Check, KeyRound } from "lucide-react";
import { adminApi, setMfaVerified, setTokens, getTokens } from "@/lib/api/client";
import { useAdminAuth } from "@/contexts/admin-auth-context";

export default function AdminMFASetupPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading, refreshAdmin } = useAdminAuth();

    const [step, setStep] = useState<"loading" | "setup" | "confirm" | "backup">("loading");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [code, setCode] = useState("");

    // Setup data
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [secret, setSecret] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [copiedBackup, setCopiedBackup] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push("/admin/login");
            } else {
                // Iniciar setup
                handleSetup();
            }
        }
    }, [authLoading, isAuthenticated, router]);

    const handleSetup = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await adminApi.setupMfa();
            setQrCodeUrl(response.data.qr_code_url);
            setSecret(response.data.secret);
            setBackupCodes(response.data.backup_codes);
            setStep("setup");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao iniciar configuração MFA");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await adminApi.confirmMfa(code);
            if (response.data.enabled) {
                // MFA habilitado com sucesso, mostrar códigos de backup
                setStep("backup");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Código inválido");
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        // Fazer login novamente para pegar novo token com mfa_required
        setMfaVerified(false);
        router.push("/admin/login");
    };

    const copyToClipboard = async (text: string, type: "secret" | "backup") => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === "secret") {
                setCopiedSecret(true);
                setTimeout(() => setCopiedSecret(false), 2000);
            } else {
                setCopiedBackup(true);
                setTimeout(() => setCopiedBackup(false), 2000);
            }
        } catch (err) {
            console.error("Erro ao copiar:", err);
        }
    };

    if (authLoading || step === "loading") {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">
                        {step === "backup" ? "MFA Configurado!" : "Configurar MFA"}
                    </CardTitle>
                    <CardDescription>
                        {step === "setup" && "Escaneie o QR code com seu aplicativo autenticador"}
                        {step === "confirm" && "Digite o código gerado pelo aplicativo"}
                        {step === "backup" && "Guarde seus códigos de backup em local seguro"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {step === "setup" && (
                        <div className="space-y-6">
                            {/* QR Code */}
                            <div className="flex justify-center">
                                <div className="bg-white p-4 rounded-lg">
                                    {qrCodeUrl ? (
                                        <img src={qrCodeUrl} alt="QR Code MFA" className="w-48 h-48" />
                                    ) : (
                                        <div className="w-48 h-48 flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Secret manual */}
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">
                                    Ou digite manualmente:
                                </Label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                                        {secret}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(secret, "secret")}
                                    >
                                        {copiedSecret ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-2">
                                <p><strong>Apps recomendados:</strong></p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Google Authenticator</li>
                                    <li>Microsoft Authenticator</li>
                                    <li>Authy</li>
                                </ul>
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => setStep("confirm")}
                            >
                                Continuar
                            </Button>
                        </div>
                    )}

                    {step === "confirm" && (
                        <form onSubmit={handleConfirm} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Código do Autenticador</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="000000"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    maxLength={6}
                                    className="text-center text-2xl tracking-widest"
                                    required
                                />
                                <p className="text-sm text-muted-foreground">
                                    Digite o código de 6 dígitos do seu aplicativo autenticador
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setStep("setup")}
                                >
                                    Voltar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={loading || code.length !== 6}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verificando...
                                        </>
                                    ) : (
                                        "Confirmar"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === "backup" && (
                        <div className="space-y-6">
                            <Alert>
                                <KeyRound className="h-4 w-4" />
                                <AlertDescription>
                                    Guarde estes códigos em local seguro. Cada código só pode ser usado uma vez.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Códigos de Backup</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(backupCodes.join("\n"), "backup")}
                                    >
                                        {copiedBackup ? (
                                            <>
                                                <Check className="mr-1 h-3 w-3 text-green-500" />
                                                Copiado!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="mr-1 h-3 w-3" />
                                                Copiar todos
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {backupCodes.map((code, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="font-mono text-sm py-2 justify-center"
                                        >
                                            {code}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <Button className="w-full" onClick={handleFinish}>
                                Concluir e Fazer Login
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
