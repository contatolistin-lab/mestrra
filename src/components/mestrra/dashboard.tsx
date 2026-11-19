import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  ShoppingBag,
  ArrowRight,
  Plus,
  CalendarDays,
  Package,
  Calculator,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Receipt,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BusinessData } from "@/lib/business.functions";
import { money, shortDate } from "@/lib/mestrra";
export function Dashboard({ data, onExpense }: { data: BusinessData; onExpense: () => void }) {
  const [period, setPeriod] = useState("month");
  const [chartMode, setChartMode] = useState("week");
  const today = useMemo(() => new Date(), []);
  const month = today.toISOString().slice(0, 7);
  const orders = data.orders.filter(
    (o) => o.status === "paid" && (period === "all" || o.created_at.startsWith(month)),
  );
  const cash = data.cash.filter((c) => period === "all" || c.transaction_date.startsWith(month));
  const gross = orders.reduce((s, o) => s + o.total_amount, 0);
  const expenses = cash.filter((c) => c.type === "saida").reduce((s, c) => s + c.amount, 0);
  const cost = orders.reduce((s, o) => s + o.total_cost_snapshot, 0);
  const profit = gross - cost - expenses;
  const goal = data.profile?.monthly_income_goal || 5000;
  const alerts = data.inventory.filter((i) => i.current_stock <= i.min_stock_alert);
  const chart = useMemo(
    () =>
      Array.from(
        { length: chartMode === "week" ? 4 : Math.max(7, today.getDate()) },
        (_, index) => {
          const day = index + 1;
          const entries = cash.filter((c) =>
            chartMode === "week"
              ? Math.ceil(Number(c.transaction_date.slice(-2)) / 7) === day
              : Number(c.transaction_date.slice(-2)) === day,
          );
          return {
            name: chartMode === "week" ? `Semana ${day}` : `${day}`,
            entrada: entries.filter((c) => c.type === "entrada").reduce((s, c) => s + c.amount, 0),
            saida: entries.filter((c) => c.type === "saida").reduce((s, c) => s + c.amount, 0),
          };
        },
      ),
    [cash, chartMode, today],
  );
  const rankings = data.catalog
    .map((c) => ({
      ...c,
      count: orders.filter((o) => o.catalog_item_id === c.id).reduce((s, o) => s + o.quantity, 0),
      revenue: orders
        .filter((o) => o.catalog_item_id === c.id)
        .reduce((s, o) => s + o.total_amount, 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 items-start mb-6">
        <div>
          <div className="flex gap-2 items-center mb-2 text-xs text-muted-foreground">
            <span className="text-primary">✦</span> Um novo dia para fazer acontecer
          </div>
          <h1 className="text-[26px] sm:text-[28px] font-extrabold">
            Seu negócio, por inteiro<span className="text-primary">.</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Veja seus resultados e encontre o próximo passo para crescer.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex gap-2 items-center bg-card border rounded-md px-3 py-2 text-xs">
            <CalendarDays size={14} />
            <select
              aria-label="Período do painel"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent outline-none"
            >
              <option value="month">Este mês</option>
              <option value="all">Todo o período</option>
            </select>
          </label>
          <Button onClick={onExpense} variant="outline" size="sm">
            <Plus size={14} />
            Lançar despesa
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Faturamento bruto",
            value: gross,
            icon: Wallet,
            detail: `${orders.length} vendas confirmadas`,
            hint: "Recebido no período",
          },
          {
            label: "Custos & saídas",
            value: cost + expenses,
            icon: Receipt,
            detail: "Insumos + despesas do negócio",
            hint: "Custos sob controle",
          },
          {
            label: "Lucro líquido real",
            value: profit,
            icon: TrendingUp,
            detail: `${gross ? ((profit / gross) * 100).toFixed(1).replace(".", ",") : 0}% de margem líquida`,
            hint: "O que fica para você",
            highlight: true,
          },
          {
            label: "Ticket médio",
            value: orders.length ? gross / orders.length : 0,
            icon: ShoppingBag,
            detail: `${orders.length} vendas no período`,
            hint: "Valor médio por pedido",
          },
        ].map((m) => (
          <div key={m.label} className={`surface metric-card ${m.highlight ? "highlight" : ""}`}>
            <div className="flex justify-between items-center">
              <p
                className={`text-[11px] font-medium ${m.highlight ? "text-brand-foreground/65" : "text-muted-foreground"}`}
              >
                {m.label}
              </p>
              <m.icon size={17} className={m.highlight ? "text-primary" : "text-info"} />
            </div>
            <div className="metric-value">{money(m.value)}</div>
            <div
              className={`text-[10px] ${m.highlight ? "text-brand-foreground/60" : "text-muted-foreground"}`}
            >
              {m.detail}
            </div>
            <div
              className={`border-t mt-4 pt-3 text-[10px] flex gap-1.5 items-center ${m.highlight ? "border-brand-foreground/10 text-primary" : "text-success"}`}
            >
              <ArrowUpRight size={12} />
              {m.hint}
            </div>
          </div>
        ))}
      </div>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-5">
        <div className="min-w-0 space-y-5">
          <section className="surface">
            <div className="p-5 flex flex-wrap gap-3 items-center justify-between">
              <div>
                <h2 className="section-heading">O movimento do seu caixa</h2>
                <p className="text-[11px] mt-1 text-muted-foreground">
                  Entradas e saídas, lado a lado.
                </p>
              </div>
              <div className="flex gap-1 bg-background rounded-md p-1">
                <Button
                  size="sm"
                  variant={chartMode === "week" ? "outline" : "ghost"}
                  className="h-7 text-[10px]"
                  onClick={() => setChartMode("week")}
                >
                  Semanal
                </Button>
                <Button
                  size="sm"
                  variant={chartMode === "day" ? "outline" : "ghost"}
                  className="h-7 text-[10px]"
                  onClick={() => setChartMode("day")}
                >
                  Diário
                </Button>
              </div>
            </div>
            <div className="px-5 flex gap-5 text-[10px] mb-3">
              <span className="flex items-center gap-1.5">
                <i className="size-2 bg-info rounded-full" />
                Entradas
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 bg-primary rounded-full" />
                Saídas
              </span>
            </div>
            <div className="h-[230px] px-3 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chart}
                  margin={{ top: 15, right: 15, bottom: 0, left: 0 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000} mil` : `${v}`)}
                  />
                  <Tooltip
                    formatter={(v: number) => money(v)}
                    contentStyle={{ borderRadius: 8, borderColor: "var(--border)", fontSize: 11 }}
                  />
                  <Bar dataKey="entrada" name="Entradas" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saida" name="Saídas" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="border-t px-5 py-3 flex justify-between text-[10px] text-muted-foreground">
              <span>Saldo do caixa no período</span>
              <span className="text-foreground font-bold">{money(gross - expenses)}</span>
            </div>
          </section>
          <section className="surface overflow-hidden">
            <div className="p-5 flex justify-between items-center">
              <div>
                <h2 className="section-heading">Últimas vendas</h2>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Cada venda, um passo à frente.
                </p>
              </div>
              <Button variant="link" className="text-info text-[11px] h-7 p-0" asChild>
                <Link to="/vendas" search={{ itemId: undefined }}>
                  Ver todas <ArrowRight size={12} />
                </Link>
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PRODUTO / SERVIÇO</th>
                    <th>CLIENTE</th>
                    <th>VALOR</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.slice(0, 5).map((o) => (
                    <tr key={o.id}>
                      <td>
                        <div className="flex gap-2.5 items-center">
                          <div className="size-8 rounded-md bg-info-soft text-info grid place-items-center">
                            <ShoppingBag size={14} />
                          </div>
                          <div className="whitespace-nowrap">
                            <p className="font-semibold text-[11px]">
                              {data.catalog.find((c) => c.id === o.catalog_item_id)?.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-1">
                              {shortDate(o.created_at)} · {o.quantity} un.
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap text-[11px]">
                        {o.customer_name}
                      </td>
                      <td className="font-semibold whitespace-nowrap">{money(o.total_amount)}</td>
                      <td>
                        <span className={`status ${o.status === "pending" ? "warning" : ""}`}>
                          ●{" "}
                          {o.status === "paid"
                            ? "Pago"
                            : o.status === "pending"
                              ? "Aguardando"
                              : "Cancelado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!data.orders.length && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma venda ainda. Seu primeiro pedido começa em Vendas & cobranças.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="space-y-5">
          <section className="surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="section-heading">Sua meta, mais perto</h2>
              <TrendingUp size={16} className="text-info" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Meta de ganho mensal</p>
            <div className="flex justify-between items-end mt-5">
              <strong className="text-2xl">
                {Math.max(0, Math.min(100, (profit / goal) * 100)).toFixed(0)}
                <span className="text-sm">%</span>
              </strong>
              <span className="text-[10px] text-muted-foreground">de {money(goal)}</span>
            </div>
            <div className="h-2 bg-info-soft rounded-full overflow-hidden mt-3">
              <progress className="w-full h-2 accent-info" value={Math.max(0, profit)} max={goal} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              {profit >= goal
                ? "Meta alcançada. Hora de comemorar!"
                : `Faltam ${money(Math.max(0, goal - profit))} para sua meta.`}
            </p>
          </section>
          <section className="surface p-5">
            <div className="flex justify-between items-center">
              <h2 className="section-heading">De olho no estoque</h2>
              <span className="status warning">{alerts.length} alertas</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Um cuidado hoje evita uma pausa amanhã.
            </p>
            <div className="mt-4 space-y-4">
              {alerts.slice(0, 3).map((i) => (
                <Link key={i.id} to="/estoque" className="flex items-center gap-3">
                  <div className="size-8 rounded-md bg-warning-soft text-primary grid place-items-center">
                    <Package size={15} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold">{i.name}</p>
                    <p className="text-[10px] text-primary mt-1">
                      Restam {i.current_stock} {i.unit_type}
                    </p>
                  </div>
                  <ChevronRight size={13} className="text-muted-foreground" />
                </Link>
              ))}
              {!alerts.length && (
                <p className="text-xs text-success">Estoque saudável. Tudo pronto para vender.</p>
              )}
            </div>
            <Button variant="outline" className="w-full text-[11px] mt-5" asChild>
              <Link to="/estoque">
                Gerenciar estoque <ArrowRight size={13} />
              </Link>
            </Button>
          </section>
          <section className="surface p-5">
            <h2 className="section-heading">Destaques do negócio</h2>
            <p className="text-[11px] text-muted-foreground mt-1">
              Quem está puxando seu crescimento.
            </p>
            <div className="mt-4 space-y-4">
              {rankings.slice(0, 3).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground w-4">0{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold">{c.name}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {c.count} unidades vendidas
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold">{money(c.revenue)}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary">
            <Sparkles size={15} />
          </span>
          <h2 className="text-sm font-semibold">Qual é o seu próximo movimento?</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              to: "/estoque",
              icon: Package,
              title: "Cadastrar insumo",
              text: "Seu estoque em dia",
            },
            {
              to: "/precificacao",
              icon: Calculator,
              title: "Precificar com confiança",
              text: "Lucro em cada venda",
            },
            {
              to: "/copiloto",
              icon: Sparkles,
              title: "Criar conteúdo",
              text: "Sua próxima boa conversa",
            },
            {
              to: "/vendas",
              icon: CircleDollarSign,
              title: "Gerar cobrança",
              text: "Transforme interesse em venda",
            },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="surface p-4 flex items-center gap-3 hover:border-info/40 transition-colors"
            >
              <span className="icon-tile">
                <a.icon size={18} />
              </span>
              <div className="flex-1">
                <p className="text-[11px] font-semibold">{a.title}</p>
                <p className="text-[9px] text-muted-foreground mt-1">{a.text}</p>
              </div>
              <ArrowUpRight size={13} className="hidden sm:block text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
