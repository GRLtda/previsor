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
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { useAdminAuth } from "@/contexts/admin-auth-context";

export default function AdminMFAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const { verifyMfa, verifyMfaBackup, isAuthenticated, isMfaVerified, isLoading } = useAdminAuth();

  // Se não estiver autenticado, redireciona para login
  // Se MFA já estiver verificado, redireciona para dashboard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/admin/login");
      } else if (isMfaVerified) {
        router.push("/admin/dashboard");
      }
    }
  }, [isAuthenticated, isMfaVerified, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (useBackupCode) {
        await verifyMfaBackup(code);
      } else {
        await verifyMfa(code);
      }
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Codigo invalido");
    } finally {
      setLoading(false);
    }
  };

  // Mostra loading enquanto verifica auth
  if (isLoading || !isAuthenticated || isMfaVerified) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verificacao MFA</CardTitle>
          <CardDescription>
            {useBackupCode 
              ? "Digite um dos seus codigos de backup"
              : "Digite o codigo do seu aplicativo autenticador"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">
                {useBackupCode ? "Codigo de Backup" : "Codigo MFA"}
              </Label>
              <Input
                id="code"
                type="text"
                placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
                value={code}
                onChange={(e) => {
                  if (useBackupCode) {
                    setCode(e.target.value.toUpperCase().slice(0, 8));
                  } else {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }
                }}
                maxLength={useBackupCode ? 8 : 6}
                className="text-center text-2xl tracking-widest"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (useBackupCode ? code.length < 6 : code.length !== 6)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode("");
                setError("");
              }}
            >
              {useBackupCode 
                ? "Usar codigo do autenticador" 
                : "Usar codigo de backup"
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
