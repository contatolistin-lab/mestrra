import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Clock,
  CreditCard,
  Gauge,
  Heart,
  RefreshCw,
  Save,
  Target,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { BusinessData } from "@/lib/business.functions";
import {
  calculateAdminMetrics,
  clearAdminInputs,
  defaultAdminInputs,
  mapMercadoPagoSales,
  summarizeMercadoPagoSales,
  useAdminInputs,
  type AdminInputs,
} from "@/lib/admin-metrics";
import { money, shortDate } from "@/lib/mestrra";

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const fmtPercent = (value: number | null) =>
  value === null ? "—" : `${decimal.format(Number(value.toFixed(1)))}%`;

const fmtMoney = (value: number | null) => (value === null ? "—" : money(value));

const fmtRatio = (value: number | null) =>
  value === null ? "—" : `${decimal.format(Number(value.toFixed(2)))}x`;

const fmtNumber = (value: number | null) =>
  value === null ? "—" : decimal.format(Number(value.toFixed(1)));

function AdminField({
  label,
  name,
  value,
  onChange,
  type = "number",
  step = "0.01",
  min = "0",
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: string;
  step?: string;
  min?: string;
}) {
  return (
    <label className="field">
      {label}
      <input
        name={name}
        type={type}
        value={value}
        step={step}
        min={min}
        onChange={(event) =>
          onChange(type === "number" ? Number(event.target.value) : event.target.value)
        }
      />
    </label>
  );
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-border pt-5 mt-5 first:border-0 first:mt-0 first:pt-0">
      <div className="flex gap-2 items-center mb-1">
        <Icon size={16} className="text-info" />
        <h3 className="text-[13px] font-semibold">{title}</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">{description}</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div className={`surface metric-card ${highlight ? "highlight" : ""}`}>
      <div className="flex justify-between items-center gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <Icon size={17} className={highlight ? "text-brand-foreground" : "text-info"} />
      </div>
      <div className="metric-value">{value}</div>
      <div className="text-[10px] text-muted-foreground">{detail}</div>
    </div>
  );
}

function MetricSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="surface p-6">
      <div className="flex gap-2 items-center">
        <BarChart3 size={17} className="text-info" />
        <h2 className="section-heading">{title}</h2>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
      <div className="mt-5 grid grid-cols-2 xl:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}

export function AdminPanel({ data }: { data: BusinessData }) {
  const { state, update } = useAdminInputs(data.userId);
  const [draft, setDraft] = useState<AdminInputs>(state);
  const metrics = useMemo(() => calculateAdminMetrics(draft), [draft]);
  const mpSales = useMemo(() => mapMercadoPagoSales(data), [data]);
  const mpSummary = useMemo(() => summarizeMercadoPagoSales(mpSales), [mpSales]);

  useEffect(() => {
    setDraft(state);
  }, [state]);

  function setField<K extends keyof AdminInputs>(key: K, value: AdminInputs[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update(draft);
    toast.success("Métricas salvas neste navegador.");
  }

  function reset() {
    if (!window.confirm("Limpar os valores cadastrados e voltar ao modelo inicial?")) return;
    const initial = defaultAdminInputs();
    setDraft(initial);
    clearAdminInputs(data.userId);
    update(initial);
    toast.success("Cadastro limpo.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div>
          <div className="flex gap-2 items-center mb-2 text-xs text-muted-foreground">
            <span className="text-primary">✦</span> Visão administrativa da plataforma
          </div>
          <h1 className="text-[26px] sm:text-[28px] font-extrabold">
            Centro de métricas<span className="text-primary">.</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Cadastre os números do período e acompanhe receita, aquisição, retenção e engajamento.
          </p>
        </div>
        <span className="status info">
          <Gauge size={12} /> {draft.periodLabel || "Período"}
        </span>
      </div>

      <section className="surface p-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h2 className="section-heading">Cadastro de métricas</h2>
            <p className="text-[11px] mt-1 text-muted-foreground">
              Os valores ficam salvos neste navegador e alimentam os cálculos abaixo.
            </p>
          </div>
          <Button variant="outline" size="sm" type="button" onClick={reset}>
            <RefreshCw size={14} /> Limpar
          </Button>
        </div>
        <form onSubmit={save} className="mt-5">
          <FormSection
            title="Período"
            description="Identifique o intervalo usado nos cálculos de conversão e retenção."
            icon={Clock}
          >
            <AdminField
              label="Nome do período"
              name="periodLabel"
              type="text"
              value={draft.periodLabel}
              onChange={(value) => setField("periodLabel", String(value))}
            />
            <AdminField
              label="Início"
              name="periodStart"
              type="date"
              value={draft.periodStart}
              onChange={(value) => setField("periodStart", String(value))}
            />
            <AdminField
              label="Fim"
              name="periodEnd"
              type="date"
              value={draft.periodEnd}
              onChange={(value) => setField("periodEnd", String(value))}
            />
            <AdminField
              label="Margem bruta (%)"
              name="grossMarginPercent"
              value={draft.grossMarginPercent}
              onChange={(value) => setField("grossMarginPercent", Number(value))}
            />
          </FormSection>

          <FormSection
            title="Receita e base de clientes"
            description="Assinaturas ativas e receita recorrente no início e no fim do período."
            icon={Wallet}
          >
            <AdminField
              label="Clientes ativos"
              name="activeCustomers"
              step="1"
              value={draft.activeCustomers}
              onChange={(value) => setField("activeCustomers", Number(value))}
            />
            <AdminField
              label="Clientes no início"
              name="previousActiveCustomers"
              step="1"
              value={draft.previousActiveCustomers}
              onChange={(value) => setField("previousActiveCustomers", Number(value))}
            />
            <AdminField
              label="Clientes perdidos"
              name="churnedCustomers"
              step="1"
              value={draft.churnedCustomers}
              onChange={(value) => setField("churnedCustomers", Number(value))}
            />
            <AdminField
              label="MRR atual (R$)"
              name="mrr"
              value={draft.mrr}
              onChange={(value) => setField("mrr", Number(value))}
            />
            <AdminField
              label="MRR anterior (R$)"
              name="previousMrr"
              value={draft.previousMrr}
              onChange={(value) => setField("previousMrr", Number(value))}
            />
            <AdminField
              label="MRR no início (R$)"
              name="startingMrr"
              value={draft.startingMrr}
              onChange={(value) => setField("startingMrr", Number(value))}
            />
            <AdminField
              label="Expansão (R$)"
              name="expansionMrr"
              value={draft.expansionMrr}
              onChange={(value) => setField("expansionMrr", Number(value))}
            />
            <AdminField
              label="Redução (R$)"
              name="contractionMrr"
              value={draft.contractionMrr}
              onChange={(value) => setField("contractionMrr", Number(value))}
            />
            <AdminField
              label="MRR cancelado (R$)"
              name="churnedMrr"
              value={draft.churnedMrr}
              onChange={(value) => setField("churnedMrr", Number(value))}
            />
          </FormSection>

          <FormSection
            title="Aquisição e funil"
            description="Investimento, novos clientes e volume de visitantes, trials e conversões."
            icon={Target}
          >
            <AdminField
              label="Marketing e vendas (R$)"
              name="acquisitionSpend"
              value={draft.acquisitionSpend}
              onChange={(value) => setField("acquisitionSpend", Number(value))}
            />
            <AdminField
              label="Novos clientes"
              name="newCustomers"
              step="1"
              value={draft.newCustomers}
              onChange={(value) => setField("newCustomers", Number(value))}
            />
            <AdminField
              label="Visitantes"
              name="visitors"
              step="1"
              value={draft.visitors}
              onChange={(value) => setField("visitors", Number(value))}
            />
            <AdminField
              label="Trials iniciados"
              name="trials"
              step="1"
              value={draft.trials}
              onChange={(value) => setField("trials", Number(value))}
            />
            <AdminField
              label="Trials convertidos"
              name="convertedTrials"
              step="1"
              value={draft.convertedTrials}
              onChange={(value) => setField("convertedTrials", Number(value))}
            />
          </FormSection>

          <FormSection
            title="Caixa e eficiência"
            description="Saldo disponível, receita e despesas mensais para burn rate e runway."
            icon={TrendingUp}
          >
            <AdminField
              label="Saldo em caixa (R$)"
              name="cashBalance"
              value={draft.cashBalance}
              onChange={(value) => setField("cashBalance", Number(value))}
            />
            <AdminField
              label="Receita mensal (R$)"
              name="monthlyRevenue"
              value={draft.monthlyRevenue}
              onChange={(value) => setField("monthlyRevenue", Number(value))}
            />
            <AdminField
              label="Despesas mensais (R$)"
              name="monthlyExpenses"
              value={draft.monthlyExpenses}
              onChange={(value) => setField("monthlyExpenses", Number(value))}
            />
          </FormSection>

          <FormSection
            title="Produto e satisfação"
            description="Uso diário/mensal, tempo até o primeiro valor e respostas de NPS/CSAT."
            icon={Users}
          >
            <AdminField
              label="DAU"
              name="dau"
              step="1"
              value={draft.dau}
              onChange={(value) => setField("dau", Number(value))}
            />
            <AdminField
              label="MAU"
              name="mau"
              step="1"
              value={draft.mau}
              onChange={(value) => setField("mau", Number(value))}
            />
            <AdminField
              label="TTV (dias)"
              name="ttvDays"
              value={draft.ttvDays}
              onChange={(value) => setField("ttvDays", Number(value))}
            />
            <AdminField
              label="NPS promotores"
              name="npsPromoters"
              step="1"
              value={draft.npsPromoters}
              onChange={(value) => setField("npsPromoters", Number(value))}
            />
            <AdminField
              label="NPS neutros"
              name="npsPassives"
              step="1"
              value={draft.npsPassives}
              onChange={(value) => setField("npsPassives", Number(value))}
            />
            <AdminField
              label="NPS detratores"
              name="npsDetractors"
              step="1"
              value={draft.npsDetractors}
              onChange={(value) => setField("npsDetractors", Number(value))}
            />
            <AdminField
              label="CSAT médio (1 a 5)"
              name="csatAverage"
              value={draft.csatAverage}
              onChange={(value) => setField("csatAverage", Number(value))}
            />
          </FormSection>

          <div className="mt-6 flex justify-end">
            <Button type="submit">
              <Save size={15} /> Salvar métricas
            </Button>
          </div>
        </form>
      </section>

      <MetricSection
        title="Receita e crescimento"
        description="Previsibilidade de faturamento e valor médio por cliente no período."
      >
        <MetricCard
          label="MRR"
          value={fmtMoney(draft.mrr)}
          detail="Receita recorrente mensal"
          icon={Wallet}
        />
        <MetricCard
          label="ARR"
          value={fmtMoney(metrics.arr)}
          detail="MRR projetado em 12 meses"
          icon={TrendingUp}
        />
        <MetricCard
          label="ARPA / ticket médio"
          value={fmtMoney(metrics.arpa)}
          detail="MRR ÷ clientes ativos"
          icon={Users}
        />
        <MetricCard
          label="Crescimento do MRR"
          value={fmtPercent(metrics.mrrGrowth)}
          detail="Comparado ao MRR anterior"
          icon={ArrowUpRight}
        />
        <MetricCard
          label="NRR"
          value={fmtPercent(metrics.nrr)}
          detail="Base inicial + expansão − perdas"
          icon={BarChart3}
          highlight
        />
      </MetricSection>

      <MetricSection
        title="Aquisição e conversão"
        description="Custo para conquistar clientes e eficiência das etapas do funil."
      >
        <MetricCard
          label="CAC"
          value={fmtMoney(metrics.cac)}
          detail="Investimento ÷ novos clientes"
          icon={Target}
        />
        <MetricCard
          label="Payback do CAC"
          value={fmtNumber(metrics.cacPaybackMonths)}
          detail="Meses até recuperar o CAC"
          icon={Clock}
        />
        <MetricCard
          label="Visitante → trial"
          value={fmtPercent(metrics.visitorToTrial)}
          detail="Trials ÷ visitantes"
          icon={Users}
        />
        <MetricCard
          label="Trial → cliente"
          value={fmtPercent(metrics.trialToCustomer)}
          detail="Convertidos ÷ trials"
          icon={TrendingUp}
        />
        <MetricCard
          label="Visitante → cliente"
          value={fmtPercent(metrics.visitorToCustomer)}
          detail="Novos clientes ÷ visitantes"
          icon={ArrowUpRight}
        />
      </MetricSection>

      <MetricSection
        title="Retenção e eficiência econômica"
        description="Saídas da base, valor por cliente e sustentabilidade do caixa."
      >
        <MetricCard
          label="Churn de clientes"
          value={fmtPercent(metrics.customerChurn)}
          detail="Perdidos ÷ clientes do início"
          icon={Users}
        />
        <MetricCard
          label="Churn de receita"
          value={fmtPercent(metrics.revenueChurn)}
          detail="MRR cancelado ÷ MRR inicial"
          icon={TrendingUp}
        />
        <MetricCard
          label="LTV"
          value={fmtMoney(metrics.ltv)}
          detail="Margem do ARPA ÷ churn"
          icon={Wallet}
        />
        <MetricCard
          label="LTV/CAC"
          value={fmtRatio(metrics.ltvCac)}
          detail="Referência saudável: acima de 3x"
          icon={Gauge}
          highlight={(metrics.ltvCac ?? 0) >= 3}
        />
        <MetricCard
          label="Burn rate"
          value={fmtMoney(metrics.burnRate)}
          detail="Despesas − receita por mês"
          icon={CreditCard}
        />
        <MetricCard
          label="Runway"
          value={fmtNumber(metrics.runwayMonths)}
          detail="Meses de caixa disponíveis"
          icon={Clock}
        />
      </MetricSection>

      <MetricSection
        title="Produto e engajamento"
        description="Frequência de uso, rapidez de valor e satisfação dos clientes."
      >
        <MetricCard
          label="DAU"
          value={fmtNumber(draft.dau)}
          detail="Usuários ativos por dia"
          icon={Users}
        />
        <MetricCard
          label="MAU"
          value={fmtNumber(draft.mau)}
          detail="Usuários ativos por mês"
          icon={Users}
        />
        <MetricCard
          label="DAU/MAU"
          value={fmtPercent(metrics.dauMau)}
          detail="Frequência de uso da base"
          icon={BarChart3}
        />
        <MetricCard
          label="Time to Value"
          value={fmtNumber(metrics.ttvDays)}
          detail="Dias até o primeiro valor"
          icon={Clock}
        />
        <MetricCard
          label="NPS"
          value={fmtPercent(metrics.nps)}
          detail="Promotores − detratores"
          icon={Target}
        />
        <MetricCard
          label="CSAT"
          value={fmtNumber(metrics.csat)}
          detail="Satisfação média de 1 a 5"
          icon={Heart}
        />
      </MetricSection>

      <section className="surface p-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 items-center">
            <CreditCard size={17} className="text-info" />
            <div>
              <h2 className="section-heading">Vendas via Mercado Pago</h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                Pedidos deste espaço com preferência ou pagamento do Mercado Pago.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="status">{mpSummary.paid} pagos</span>
            <span className="status warning">{mpSummary.pending} aguardando</span>
            <span className="status info">{mpSummary.cancelled} cancelados</span>
            <span className="status">{money(mpSummary.grossPaid)} confirmados</span>
          </div>
        </div>
        <div className="mt-5 overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>DATA</th>
                <th>CLIENTE</th>
                <th>ITEM</th>
                <th>STATUS</th>
                <th>VALOR</th>
                <th>PAGAMENTO</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {mpSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="text-[11px]">{shortDate(sale.createdAt)}</td>
                  <td>
                    <p className="text-[11px] font-semibold">{sale.customer}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {sale.quantity} unidade(s)
                    </p>
                  </td>
                  <td className="text-[11px]">{sale.item}</td>
                  <td>
                    <span
                      className={`status ${sale.status === "paid" ? "" : sale.status === "pending" ? "warning" : "info"}`}
                    >
                      {sale.status === "paid"
                        ? "Pago"
                        : sale.status === "pending"
                          ? "Aguardando"
                          : "Cancelado"}
                    </span>
                  </td>
                  <td className="text-[11px] font-semibold">{money(sale.amount)}</td>
                  <td className="text-[10px] text-muted-foreground">
                    {sale.paymentId
                      ? `ID ${sale.paymentId}`
                      : sale.preferenceId
                        ? `Pref. ${sale.preferenceId}`
                        : "—"}
                  </td>
                  <td>
                    {sale.checkoutUrl && (
                      <a
                        href={sale.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-info font-semibold inline-flex gap-1 items-center"
                      >
                        Abrir <ArrowUpRight size={12} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {!mpSales.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[11px] text-muted-foreground">
                    Nenhuma cobrança do Mercado Pago encontrada neste espaço.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
