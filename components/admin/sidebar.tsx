"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  Wallet,
  Shield,
  FileText,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/contexts/admin-auth-context";
import { Logo } from "@/components/ui/logo";
import { AnimatePresence, motion } from "framer-motion";

// ── Menu structure ────────────────────────────────────────────────
interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { title: string; href: string }[];
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "Menu Principal",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Usuários",
        icon: Users,
        children: [
          { title: "Lista de Usuários", href: "/admin/usuarios" },
          { title: "Verificação KYC", href: "/admin/kyc" },
        ],
      },
      {
        title: "Catálogo",
        icon: Calendar,
        children: [
          { title: "Eventos", href: "/admin/eventos" },
          { title: "Mercados", href: "/admin/mercados" },
        ],
      },
      {
        title: "Posições",
        href: "/admin/posicoes",
        icon: TrendingUp,
      },
      {
        title: "Financeiro",
        icon: Wallet,
        children: [
          { title: "Carteiras", href: "/admin/carteiras" },
          { title: "Depósitos", href: "/admin/depositos" },
          { title: "Saques", href: "/admin/saques" },
        ],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Administradores",
        href: "/admin/administradores",
        icon: Shield,
      },
      {
        title: "Auditoria",
        href: "/admin/auditoria",
        icon: FileText,
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────
export function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto‑expand the parent menu that contains the current route
  useEffect(() => {
    if (!isMounted) return;
    for (const section of menuSections) {
      for (const item of section.items) {
        if (
          item.children?.some((c) => pathname.startsWith(c.href)) &&
          !openMenus.includes(item.title)
        ) {
          setOpenMenus((prev) => [...prev, item.title]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isMounted]);

  const toggleMenu = (title: string) =>
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  if (!isMounted) return null;

  return (
    <aside className="admin-sidebar group/sidebar relative flex w-[260px] flex-col bg-white select-none">
      {/* ── Right border ──────────────────────────────── */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-slate-200/60 via-slate-200 to-slate-200/60" />

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <Logo width={110} height={34} />
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 ring-1 ring-inset ring-slate-200">
          Admin
        </span>
      </div>

      {/* ── Divider ──────────────────────────────────── */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 admin-scrollbar-light">
        {menuSections.map((section, sIdx) => (
          <div key={section.label} className={cn(sIdx > 0 && "mt-6")}>
            {/* Section label */}
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {section.label}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) =>
                item.children ? (
                  <CollapsibleMenuItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    isOpen={openMenus.includes(item.title)}
                    onToggle={() => toggleMenu(item.title)}
                  />
                ) : (
                  <SimpleMenuItem
                    key={item.href}
                    item={item as MenuItem & { href: string }}
                    pathname={pathname}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User card ────────────────────────────────── */}
      <div className="mt-auto border-t border-slate-100 p-3">
        <div className="rounded-xl bg-slate-50/80 p-3 transition-colors hover:bg-slate-100/80">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white ring-2 ring-slate-200">
              {getInitials(admin?.fullName || admin?.name || "AD")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {admin?.fullName || admin?.name || "Admin"}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {admin?.email}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair da conta
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Simple nav item (no children) ─────────────────────────────────
function SimpleMenuItem({
  item,
  pathname,
}: {
  item: MenuItem & { href: string };
  pathname: string;
}) {
  const isActive = pathname.startsWith(item.href);

  return (
    <Link href={item.href} className="block">
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer",
          isActive
            ? "bg-slate-100 text-slate-900"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        )}
      >
        {/* Active accent bar */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-slate-800"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            isActive ? "text-slate-700" : "text-slate-400 group-hover:text-slate-500"
          )}
        />
        <span>{item.title}</span>
      </div>
    </Link>
  );
}

// ── Collapsible nav item (with children) ──────────────────────────
function CollapsibleMenuItem({
  item,
  pathname,
  isOpen,
  onToggle,
}: {
  item: MenuItem;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isActiveParent = item.children?.some((c) =>
    pathname.startsWith(c.href)
  );

  return (
    <div>
      {/* Parent button */}
      <button
        onClick={onToggle}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer",
          isActiveParent
            ? "text-slate-900"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        )}
      >
        {isActiveParent && (
          <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-slate-800" />
        )}
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            isActiveParent
              ? "text-slate-700"
              : "text-slate-400 group-hover:text-slate-500"
          )}
        />
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="relative ml-[21px] border-l border-slate-200 pl-4 py-1">
              {item.children?.map((child) => {
                const isActiveChild = pathname === child.href;
                return (
                  <Link key={child.href} href={child.href} className="block">
                    <div
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] transition-all duration-150 cursor-pointer",
                        isActiveChild
                          ? "bg-slate-100 font-medium text-slate-900"
                          : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      )}
                    >
                      {/* Dot indicator */}
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                          isActiveChild
                            ? "bg-slate-700"
                            : "bg-slate-300"
                        )}
                      />
                      {child.title}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
