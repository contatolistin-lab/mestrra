import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  Calculator,
  Sparkles,
  ShoppingBag,
  Settings,
  ChevronRight,
  ArrowUpRight,
  Bell,
  Menu,
  LogOut,
  Check,
  CircleHelp,
  X,
  Wallet,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/resolved-client";
import type { BusinessData } from "@/lib/business.functions";
import { isDemoMode } from "@/lib/demo-mode";
import { Brand } from "./brand";
const navigation = [
  { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/estoque", label: "Estoque & recursos", icon: Package },
  { to: "/precificacao", label: "Precificação inteligente", icon: Calculator },
  { to: "/copiloto", label: "Copiloto de marketing", icon: Sparkles },
  { to: "/vendas", label: "Vendas & cobranças", icon: ShoppingBag },
] as const;
const steps = [
  { to: "/estoque", label: "Estoque & recursos" },
  { to: "/precificacao", label: "Precificar" },
  { to: "/copiloto", label: "Copiloto MKT" },
  { to: "/vendas", label: "Cobrar" },
  { to: "/dashboard", label: "Caixa 360º" },
] as const;
export function Shell({
  children,
  data,
  demo = false,
}: {
  children: ReactNode;
  data: BusinessData;
  demo?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [notifications, setNotifications] = useState(false);
  useEffect(() => {
    if (demo) return;
    const channel = supabase
      .channel(`business-${data.userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${data.userId}` },
        () => void client.invalidateQueries({ queryKey: ["business"] }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_items",
          filter: `user_id=eq.${data.userId}`,
        },
        () => void client.invalidateQueries({ queryKey: ["business"] }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cashflow_transactions",
          filter: `user_id=eq.${data.userId}`,
        },
        () => void client.invalidateQueries({ queryKey: ["business"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [data.userId, demo, client]);
  const name = data.profile?.business_name || "Meu negócio";
  async function logout() {
    await client.cancelQueries();
    client.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  }
  const nav = (
    <>
      <div className="mestrra-logo text-brand-foreground">
        <Brand />
      </div>
      <div className="mt-8 rounded-lg border border-brand-foreground/10 p-3 flex gap-3 items-center">
        <div className="size-9 rounded-lg bg-info/15 text-info flex items-center justify-center text-sm font-bold">
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{name}</p>
          <p className="text-[10px] text-brand-foreground/45 mt-1">
            {isDemoMode ? "Modo demo · dados de exemplo" : "Seu espaço de trabalho"}
          </p>
        </div>
        <ChevronsUpDown size={14} className="text-brand-foreground/45" />
      </div>
      <p className="sidebar-caption">Seu negócio</p>
      <nav>
        {navigation.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={`nav-item ${location.pathname === n.to || (demo && n.to === "/dashboard") ? "active" : ""}`}
          >
            <n.icon size={18} />
            {n.label}
            {n.to === "/copiloto" && (
              <span className="ml-auto text-[8px] bg-info/15 text-info px-1.5 py-0.5 rounded">
                NOVO
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-5 border-t border-brand-foreground/10 pt-4">
        <Link className="nav-item" to="/configuracoes">
          <Settings size={18} />
          Configurações
        </Link>
      </div>
      <div className="mt-auto">
        <div className="rounded-lg bg-brand-foreground/5 p-4 mb-5">
          <div className="flex gap-2 text-info">
            <Sparkles size={16} />
            <span className="text-xs font-semibold">Seu próximo movimento</span>
          </div>
          <p className="text-[11px] text-brand-foreground/55 leading-relaxed mt-2">
            Uma boa venda começa com um preço bem calculado.
          </p>
          <Button variant="ghost" className="text-info p-0 h-7 mt-2 text-[11px]" asChild>
            <Link to="/precificacao">
              Vamos precificar <ArrowUpRight size={13} />
            </Link>
          </Button>
        </div>
        <div className="border-t border-brand-foreground/10 pt-4 flex gap-3 items-center">
          <div className="size-9 rounded-full bg-info-soft text-brand grid place-items-center text-xs font-bold">
            {name.slice(0, 1)}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold">{demo ? "Conta de demonstração" : name}</p>
            <p className="text-[10px] text-brand-foreground/45 mt-1">Empreendedor</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            title={demo ? "Entrar na minha conta" : "Sair da conta"}
            onClick={() =>
              demo ? void navigate({ to: "/auth", search: { mode: "login" } }) : void logout()
            }
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </>
  );
  return (
    <>
      <aside className="app-sidebar">{nav}</aside>
      <main className="app-main">
        <header className="app-topbar">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-brand text-brand-foreground w-[280px] p-6 flex flex-col"
              >
                <SheetTitle className="sr-only">Menu Mestrra</SheetTitle>
                {nav}
              </SheetContent>
            </Sheet>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Meu negócio <ChevronRight size={13} className="inline mx-3" />
              <span className="text-foreground font-medium">
                {demo
                  ? "Visão geral"
                  : navigation.find((n) => n.to === location.pathname)?.label || "Configurações"}
              </span>
            </p>
            <div className="md:hidden text-brand">
              <Brand />
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <span className="status info hidden sm:inline-flex">
              <span className="size-1.5 bg-info rounded-full" />
              Esteira conectada
            </span>
            {demo && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth" search={{ mode: "login" }}>
                  Entrar
                </Link>
              </Button>
            )}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notificações"
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
              </Button>
              {notifications && (
                <div className="surface absolute right-0 top-12 w-72 p-4 z-50">
                  <p className="font-semibold text-sm mb-3">Notificações</p>
                  {data.inventory
                    .filter((i) => i.current_stock <= i.min_stock_alert)
                    .map((i) => (
                      <p key={i.id} className="text-xs py-2 border-t">
                        {i.name}: estoque baixo
                      </p>
                    ))}
                  {data.inventory.every((i) => i.current_stock > i.min_stock_alert) && (
                    <p className="text-xs text-muted-foreground">Tudo em dia por aqui.</p>
                  )}
                </div>
              )}
            </div>
            <div className="size-8 rounded-full bg-info-soft text-brand grid place-items-center text-xs font-bold hidden sm:grid">
              {name.slice(0, 1)}
            </div>
          </div>
        </header>
        <div className="page-content rise-in">
          <div className="surface mb-7">
            <div className="px-5 pt-4 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[1px] text-muted-foreground font-bold">
                Sua esteira de crescimento
              </p>
              <span className="text-[10px] text-info font-medium flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-info" />
                Tudo conectado
              </span>
            </div>
            <div className="step-bar">
              {steps.map((s, i) => {
                const done =
                  i === 0
                    ? data.inventory.length > 0
                    : i === 1
                      ? data.catalog.length > 0
                      : i === 2
                        ? data.catalog.some((c) => !!c.target_audience)
                        : i === 3
                          ? data.orders.length > 0
                          : i === 4
                            ? data.cash.length > 0
                            : false;
                return (
                  <Link
                    to={s.to}
                    key={s.to}
                    className={`step-link ${location.pathname === s.to ? "active" : done ? "done" : ""}`}
                  >
                    <span className="step-number">{done ? <Check size={13} /> : i + 1}</span>
                    <span>{s.label}</span>
                    {i < 4 && (
                      <ChevronRight className="ml-auto text-muted-foreground/40" size={13} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          {demo && (
            <div className="mb-5 flex flex-wrap gap-2 justify-between text-xs text-muted-foreground">
              <span>Prévia com dados de demonstração · Doce Atelier</span>
              <Link to="/auth" search={{ mode: "signup" }} className="text-info font-semibold">
                Criar meu espaço <ArrowUpRight className="inline" size={12} />
              </Link>
            </div>
          )}
          {children}
          <footer className="mt-7 flex justify-between text-[10px] text-muted-foreground/70">
            <span>Mestrra · Seu negócio em movimento.</span>
            <span className="flex gap-1 items-center">
              <span className="size-1 rounded-full bg-success" />{" "}
              {demo ? "Demonstração" : "Dados sincronizados"}
            </span>
          </footer>
        </div>
      </main>
      <nav className="bottom-nav">
        {navigation.map((n) => (
          <Link
            to={n.to}
            key={n.to}
            className={
              location.pathname === n.to || (demo && n.to === "/dashboard") ? "active" : ""
            }
          >
            <n.icon size={20} />
            {n.to === "/dashboard"
              ? "Início"
              : n.to === "/estoque"
                ? "Estoque"
                : n.to === "/precificacao"
                  ? "Preços"
                  : n.to === "/copiloto"
                    ? "Copiloto"
                    : "Vendas"}
          </Link>
        ))}
      </nav>
    </>
  );
}
