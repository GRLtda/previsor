"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import {
  Users,
  Calendar,
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    pendingKyc: number;
    activeEvents: number;
    activeMarkets: number;
    totalDeposits: number;
    pendingWithdrawals: number;
    totalVolume: number;
    openPositions: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Carrega dados reais das APIs
      const [usersRes, kycRes, depositsRes, withdrawalsRes] = await Promise.all([
        adminApi.getUsers({ page: 1, per_page: 1 }),
        adminApi.getKycList({ page: 1, per_page: 1, status: 'pending' }),
        adminApi.getDeposits({ page: 1, per_page: 1 }),
        adminApi.getWithdrawals({ page: 1, per_page: 1, status: 'pending' }),
      ]);

      setStats({
        totalUsers: usersRes.meta?.total || 0,
        pendingKyc: kycRes.meta?.total || 0,
        activeEvents: 0, // TODO: Add events endpoint
        activeMarkets: 0, // TODO: Add markets endpoint
        totalDeposits: 0,
        pendingWithdrawals: withdrawalsRes.meta?.total || 0,
        totalVolume: 0,
        openPositions: 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Usuarios"
          value={stats?.totalUsers || 0}
          icon={Users}
          description="Usuarios cadastrados"
        />
        <StatCard
          title="KYC Pendente"
          value={stats?.pendingKyc || 0}
          icon={Clock}
          description="Aguardando verificacao"
          variant="warning"
        />
        <StatCard
          title="Eventos Ativos"
          value={stats?.activeEvents || 0}
          icon={Calendar}
          description="Eventos em andamento"
        />
        <StatCard
          title="Mercados Ativos"
          value={stats?.activeMarkets || 0}
          icon={TrendingUp}
          description="Mercados abertos"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Volume Total"
          value={formatCurrency(stats?.totalVolume || 0)}
          icon={Wallet}
          description="Volume negociado"
        />
        <StatCard
          title="Depositos"
          value={formatCurrency(stats?.totalDeposits || 0)}
          icon={ArrowDownCircle}
          description="Total depositado"
          variant="success"
        />
        <StatCard
          title="Saques Pendentes"
          value={stats?.pendingWithdrawals || 0}
          icon={ArrowUpCircle}
          description="Aguardando aprovacao"
          variant="warning"
        />
        <StatCard
          title="Posicoes Abertas"
          value={stats?.openPositions || 0}
          icon={CheckCircle}
          description="Posicoes ativas"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Novo usuario cadastrado", time: "2 min atras", type: "user" },
                { action: "Deposito de R$ 500,00 confirmado", time: "5 min atras", type: "deposit" },
                { action: "KYC aprovado - Maria Silva", time: "10 min atras", type: "kyc" },
                { action: "Novo evento criado - Eleicoes 2026", time: "15 min atras", type: "event" },
                { action: "Saque de R$ 1.200,00 solicitado", time: "20 min atras", type: "withdrawal" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{item.action}</span>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acoes Rapidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/admin/kyc"
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center"
              >
                <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="font-medium">Verificar KYC</p>
                <p className="text-xs text-muted-foreground">{stats?.pendingKyc} pendentes</p>
              </a>
              <a
                href="/admin/saques"
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center"
              >
                <ArrowUpCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Aprovar Saques</p>
                <p className="text-xs text-muted-foreground">{stats?.pendingWithdrawals} pendentes</p>
              </a>
              <a
                href="/admin/eventos"
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center"
              >
                <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">Criar Evento</p>
                <p className="text-xs text-muted-foreground">Novo evento</p>
              </a>
              <a
                href="/admin/usuarios"
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center"
              >
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="font-medium">Gerenciar Usuarios</p>
                <p className="text-xs text-muted-foreground">{stats?.totalUsers} usuarios</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
