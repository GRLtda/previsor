"use client";

import { useState } from "react";
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
import { Shield, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAdminAuth } from "@/contexts/admin-auth-context";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      toast.success("Login realizado com sucesso!");

      if (!result.mfa_enabled) {
        router.push("/admin/mfa/setup");
      } else if (result.mfa_required) {
        router.push("/admin/mfa");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card rounded-2xl shadow-none">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Previzor</CardTitle>
          <CardDescription className="text-[13px] font-medium text-muted-foreground/80">
            Acesse o painel administrativo para gerenciar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-semibold">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4 opacity-70" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@previzor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-10 bg-black/5 dark:bg-[#12121a] border-border/50 placeholder:text-muted-foreground/50 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-semibold">Senha</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4 opacity-70" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pl-10 pr-20 bg-black/5 dark:bg-[#12121a] border-border/50 placeholder:text-muted-foreground/50 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {showPassword ? "Esconder" : "Mostrar"}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full h-12 font-bold text-[15px] shadow-sm tracking-wide rounded-xl bg-primary text-primary-foreground hover:brightness-110" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "ENTRAR"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
