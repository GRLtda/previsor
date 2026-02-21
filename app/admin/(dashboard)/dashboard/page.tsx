"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Calendar,
  BarChart3,
  Activity,
  RefreshCw,
  ExternalLink,
  DollarSign,
  AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/api/client";
import { GaugeChart } from "@/components/admin/dashboard/gauge-chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────

interface DashboardStats {
  period: string;
  users: { total: number; new_period: number };
  kyc: { pending: number };
  deposits: {
    total_count: number;
    total_amount: number;
    amount_period: number;
    count_period: number;
    pending_count: number;
    average_ticket_period: number;
    average_ticket_total: number;
  };
  withdrawals: { pending_count: number; total_amount: number; amount_period: number };
  events: { active: number; total: number };
  markets: { open: number; total: number; total_volume: number };
  positions: { active: number; total_invested: number };
  platform_health: number;
  financial_timeline: Array<{
    day: string;
    deposit_amount: number;
    withdraw_amount: number;
  }>;
  recent_activity: Array<{
    id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    admin_name: string;
    created_at: string;
  }>;
}

// ── Helpers ──────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);

const formatCompactCurrency = (value: number) => {
  const reais = value / 100;
  if (reais >= 1_000_000) return `R$ ${(reais / 1_000_000).toFixed(1)}M`;
  if (reais >= 1_000) return `R$ ${(reais / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
};

const ACTION_LABELS: Record<string, string> = {
  user_status_updated: "Status de usuário alterado",
  kyc_approved: "KYC aprovado",
  kyc_rejected: "KYC rejeitado",
  withdrawal_approved: "Saque aprovado",
  withdrawal_rejected: "Saque rejeitado",
  deposit_viewed: "Depósito visualizado",
  deposit_retry: "Retry de depósito",
  event_created: "Evento criado",
  event_published: "Evento publicado",
  market_created: "Mercado criado",
  market_opened: "Mercado aberto",
  market_closed: "Mercado fechado",
  market_resolved: "Mercado resolvido",
  market_cancelled: "Mercado cancelado",
  wallet_frozen: "Carteira congelada",
  wallet_unfrozen: "Carteira descongelada",
  wallet_credited: "Carteira creditada",
  wallet_debited: "Carteira debitada",
  system_limit_updated: "Limite do sistema alterado",
  feature_flag_updated: "Feature flag alterada",
};

const PERIOD_LABELS: Record<string, string> = {
  "7d": "últimos 7 dias",
  "15d": "últimos 15 dias",
  "30d": "últimos 30 dias",
  "90d": "últimos 90 dias",
  "all": "todo o período",
  "custom": "período personalizado",
};

const getActionLabel = (action: string) =>
  ACTION_LABELS[action] || action.replace(/_/g, " ");

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
};

// ── Custom Tooltip for Chart ─────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const day = label;
  let formattedDay = day;
  try {
    formattedDay = format(parseISO(day), "dd 'de' MMM", { locale: ptBR });
  } catch { }
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-sm">
      <p className="text-xs text-muted-foreground mb-1">{formattedDay}</p>
      {payload.map((item: any) => (
        <p key={item.name} className="text-sm font-medium" style={{ color: item.color }}>
          {item.name === "deposit_amount" ? "Depósitos" : "Saques"}:{" "}
          {formatCurrency(item.value)}
        </p>
      ))}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-24 mb-3" />
              <div className="h-8 bg-muted rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 animate-pulse">
          <CardContent className="p-6">
            <div className="h-[280px] bg-muted rounded" />
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-[280px] bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("30d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadStats = async (isRefresh = false, currentPeriod = period, sDate = startDate, eDate = endDate) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await adminApi.getDashboardStats({
        period: currentPeriod,
        ...(currentPeriod === "custom" && sDate && eDate ? { start_date: sDate, end_date: eDate } : {}),
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Refresh every 60 seconds
    const interval = setInterval(() => loadStats(true), 60000);
    return () => clearInterval(interval);
  }, []);

  // Format timeline data for recharts
  const timelineData = useMemo(() => {
    if (!stats?.financial_timeline) return [];
    return stats.financial_timeline.map((item) => ({
      ...item,
      day_label: (() => {
        try {
          return format(parseISO(item.day), "dd/MM", { locale: ptBR });
        } catch {
          return item.day;
        }
      })(),
    }));
  }, [stats?.financial_timeline]);

  if (loading) return <DashboardSkeleton />;

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";

  const periodLabel = period === "custom" && startDate && endDate
    ? `${format(parseISO(startDate), "dd/MM/yy")} a ${format(parseISO(endDate), "dd/MM/yy")}`
    : PERIOD_LABELS[stats?.period || period] || "no período";

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aqui está o resumo da plataforma •{" "}
            {format(now, "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={period}
            onValueChange={(value) => {
              setPeriod(value);
              if (value !== "custom") {
                loadStats(true, value);
              }
            }}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Selecione um período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="15d">Últimos 15 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span className="text-sm text-muted-foreground">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                onClick={() => loadStats(true, "custom", startDate, endDate)}
                disabled={!startDate || !endDate || refreshing}
                className="h-9 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          )}

          <button
            onClick={() => loadStats(true, period, startDate, endDate)}
            disabled={refreshing || (period === "custom" && (!startDate || !endDate))}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards Row ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Users */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Usuários</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">
              {stats?.users.total.toLocaleString("pt-BR") || 0}
            </p>
            <span className="text-xs font-medium text-emerald-600">
              +{stats?.users.new_period || 0}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{periodLabel}</p>
        </div>

        {/* KYC Pending */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">KYC Pendente</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {stats?.kyc.pending || 0}
          </p>
          <div className="mt-0.5">
            {(stats?.kyc.pending || 0) > 0 ? (
              <Link
                href="/admin/kyc"
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline"
              >
                Verificar agora <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">Tudo em dia ✓</p>
            )}
          </div>
        </div>

        {/* Total Deposits with Period Info inside */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Depósitos</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
              <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {formatCompactCurrency(stats?.deposits.total_amount || 0)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground text-emerald-600 font-medium">
            +{formatCompactCurrency(stats?.deposits.amount_period || 0)}{" "}
            <span className="text-muted-foreground font-normal">{periodLabel}</span>
          </p>
        </div>

        {/* Ticket Medio */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20">
              <DollarSign className="h-4 w-4 text-indigo-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {formatCurrency(stats?.deposits.average_ticket_period || 0)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {periodLabel}
          </p>
        </div>

        {/* Pending Deposits */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Dep. Pendentes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {stats?.deposits.pending_count || 0}
          </p>
          <div className="mt-0.5">
            {(stats?.deposits.pending_count || 0) > 0 ? (
              <Link
                href="/admin/depositos?status=pending"
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
              >
                Ver depósitos <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum pendente ✓</p>
            )}
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Saques Pendentes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20">
              <ArrowUpCircle className="h-4 w-4 text-rose-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {stats?.withdrawals.pending_count || 0}
          </p>
          <div className="mt-0.5">
            {(stats?.withdrawals.pending_count || 0) > 0 ? (
              <Link
                href="/admin/saques"
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
              >
                Aprovar saques <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum pendente ✓</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Chart + Gauge Row ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Timeline Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Volume Financeiro</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Depósitos e saques ({periodLabel})
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Depósitos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-muted-foreground">Saques</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="withdrawGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day_label"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    minTickGap={30}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    tickFormatter={(v) => {
                      if (v >= 100_000_00) return `${(v / 100_000_00).toFixed(0)}M`;
                      if (v >= 100_00) return `${(v / 100_00).toFixed(0)}K`;
                      return `${(v / 100).toFixed(0)}`;
                    }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="deposit_amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#depositGrad)"
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="withdraw_amount"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fill="url(#withdrawGrad)"
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Health Gauge */}
        <Card className="">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Saúde da Plataforma</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Score calculado automaticamente
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2">
            <GaugeChart
              value={stats?.platform_health ?? 0}
              label="Score de Saúde"
              size={220}
            />

            {/* Mini stats below gauge */}
            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold">{stats?.events.active || 0}</p>
                <p className="text-xs text-muted-foreground">Eventos Ativos</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold">{stats?.markets.open || 0}</p>
                <p className="text-xs text-muted-foreground">Mercados Abertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
