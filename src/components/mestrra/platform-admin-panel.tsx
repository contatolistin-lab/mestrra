import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Clock,
  CreditCard,
  Gauge,
  Heart,
  LogOut,
  RefreshCw,
  Save,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { money, shortDate } from "@/lib/mestrra";
import {
  defaultPlatformAdminInputs,
  type PlatformAdminInputs,
  type PlatformOverview,
} from "@/lib/platform-admin";
import { savePlatformAdminInputs } from "@/lib/platform-admin.functions";

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
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: string;
  step?: string;
}) {
  return (
    <label className="field">
      {label}
      <input
        name={name}
        type={type}
        value={value}
        step={type === "number" ? step : undefined}
        min={type === "number" ? "0" : undefined}
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

function statusClass(status: string) {
  if (["active", "authorized", "confirmed", "paid"].includes(status)) return "status success";
  if (["pending", "trialing"].includes(status)) return "status warning";
  return "status";
}

export function PlatformAdminPanel({
  overview,
  onSaved,
  onSignOut,
}: {
  overview: PlatformOverview;
  onSaved: () => Promise<void> | void;
  onSignOut: () => void;
}) {
  const [draft, setDraft] = useState<PlatformAdminInputs>(overview.manualInputs);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(overview.manualInputs);
  }, [overview.manualInputs]);

  function setField<K extends keyof PlatformAdminInputs>(key: K, value: PlatformAdminInputs[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await savePlatformAdminInputs({ data: draft });
      await onSaved();
      toast.success("Cadastro salvo no banco da plataforma.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm("Restaurar os valores manuais do período?")) return;
    const initial = defaultPlatformAdminInputs();
    setDraft(initial);
    setBusy(true);
    try {
      await savePlatformAdminInputs({ data: initial });
      await onSaved();
      toast.success("Valores restaurados.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível restaurar.");
    } finally {
      setBusy(false);
    }
  }

  const { metrics, inputs, totals, subscribers } = overview;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div>
          <div className="flex gap-2 items-center mb-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="text-primary" /> Acesso restrito da plataforma
          </div>
          <h1 className="text-[28px] font-extrabold sm:text-[32px]">
            Gestão da plataforma<span className="text-primary">.</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
            Clientes assinantes do Mercado Pago, receita recorrente e indicadores de crescimento em
            tempo real.
          </p>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={onSignOut}>
          <LogOut size={14} /> Sair
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Assinantes ativos"
          value={fmtNumber(totals.active)}
          detail={`${fmtNumber(totals.total)} assinaturas registradas`}
          icon={Users}
          highlight
        />
        <MetricCard
          label="MRR"
          value={fmtMoney(totals.mrr)}
          detail="Receita mensal recorrente ativa"
          icon={Wallet}
          highlight
        />
        <MetricCard
          label="ARR"
          value={fmtMoney(totals.arr)}
          detail="MRR projetado em 12 meses"
          icon={TrendingUp}
        />
        <MetricCard
          label="Cadastros"
          value={fmtNumber(totals.signups)}
          detail="Perfis criados na plataforma"
          icon={Gauge}
        />
      </div>

      <div className="mt-6 space-y-6">
        <MetricSection
          title="Receita e retenção"
          description="Calculado a partir das assinaturas ativas e do período selecionado."
        >
          <MetricCard
            label="ARPA"
            value={fmtMoney(metrics.arpa)}
            detail="Por assinante ativo"
            icon={CreditCard}
          />
          <MetricCard
            label="NRR"
            value={fmtPercent(metrics.nrr)}
            detail="Receita líquida retida"
            icon={RefreshCw}
          />
          <MetricCard
            label="Crescimento do MRR"
            value={fmtPercent(metrics.mrrGrowth)}
            detail="Vs. período anterior"
            icon={ArrowUpRight}
          />
          <MetricCard
            label="Churn de clientes"
            value={fmtPercent(metrics.customerChurn)}
            detail="Cancelamentos no período"
            icon={Activity}
          />
          <MetricCard
            label="Churn de receita"
            value={fmtPercent(metrics.revenueChurn)}
            detail="MRR cancelado no período"
            icon={Activity}
          />
          <MetricCard
            label="Burn rate"
            value={fmtMoney(metrics.burnRate)}
            detail="Despesas menos receita"
            icon={Wallet}
          />
          <MetricCard
            label="Runway"
            value={metrics.runwayMonths === null ? "—" : `${fmtNumber(metrics.runwayMonths)} meses`}
            detail="Caixa dividido pelo burn"
            icon={Gauge}
          />
        </MetricSection>

        <MetricSection
          title="Aquisição e eficiência"
          description="CAC, payback e LTV usam os valores manuais cadastrados abaixo."
        >
          <MetricCard
            label="CAC"
            value={fmtMoney(metrics.cac)}
            detail="Por novo assinante"
            icon={Target}
          />
          <MetricCard
            label="Payback"
            value={
              metrics.cacPaybackMonths === null
                ? "—"
                : `${fmtNumber(metrics.cacPaybackMonths)} meses`
            }
            detail="Recuperação do CAC"
            icon={Clock}
          />
          <MetricCard
            label="LTV"
            value={fmtMoney(metrics.ltv)}
            detail="Valor por assinante"
            icon={TrendingUp}
          />
          <MetricCard
            label="LTV/CAC"
            value={fmtRatio(metrics.ltvCac)}
            detail="Eficiência de aquisição"
            icon={Gauge}
          />
          <MetricCard
            label="Visitante → trial"
            value={fmtPercent(metrics.visitorToTrial)}
            detail="Conversão de funil"
            icon={Users}
          />
          <MetricCard
            label="Trial → assinante"
            value={fmtPercent(metrics.trialToCustomer)}
            detail="Conversão de funil"
            icon={Target}
          />
          <MetricCard
            label="Visitante → assinante"
            value={fmtPercent(metrics.visitorToCustomer)}
            detail="Conversão total"
            icon={ArrowUpRight}
          />
        </MetricSection>

        <MetricSection
          title="Engajamento e satisfação"
          description="Indicadores manuais de uso do produto e pesquisa de satisfação."
        >
          <MetricCard
            label="DAU/MAU"
            value={fmtPercent(metrics.dauMau)}
            detail="Engajamento"
            icon={Activity}
          />
          <MetricCard
            label="TTV"
            value={metrics.ttvDays === null ? "—" : `${fmtNumber(metrics.ttvDays)} dias`}
            detail="Tempo até valor"
            icon={Clock}
          />
          <MetricCard
            label="NPS"
            value={fmtPercent(metrics.nps)}
            detail="Promotores menos detratores"
            icon={Heart}
          />
          <MetricCard
            label="CSAT"
            value={fmtNumber(metrics.csat)}
            detail="Satisfação média"
            icon={Heart}
          />
        </MetricSection>

        <section className="surface p-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div>
              <h2 className="section-heading">Cadastro de métricas manuais</h2>
              <p className="text-[11px] mt-1 text-muted-foreground">
                Esses valores ficam no banco e complementam os dados automáticos das assinaturas.
              </p>
            </div>
            <Button variant="outline" size="sm" type="button" onClick={reset} disabled={busy}>
              <RefreshCw size={14} /> Restaurar
            </Button>
          </div>
          <form onSubmit={save} className="mt-5">
            <FormSection
              title="Período"
              description="Intervalo usado nos cálculos de crescimento, churn e retenção."
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
            </FormSection>
            <FormSection
              title="Receita e custos"
              description="Receita recorrente vem das assinaturas; estes valores complementam o cálculo."
              icon={Wallet}
            >
              <AdminField
                label="Expansão do MRR (R$)"
                name="expansionMrr"
                value={draft.expansionMrr}
                onChange={(value) => setField("expansionMrr", Number(value))}
              />
              <AdminField
                label="Contração do MRR (R$)"
                name="contractionMrr"
                value={draft.contractionMrr}
                onChange={(value) => setField("contractionMrr", Number(value))}
              />
              <AdminField
                label="Margem bruta (%)"
                name="grossMarginPercent"
                value={draft.grossMarginPercent}
                onChange={(value) => setField("grossMarginPercent", Number(value))}
              />
              <AdminField
                label="Caixa (R$)"
                name="cashBalance"
                value={draft.cashBalance}
                onChange={(value) => setField("cashBalance", Number(value))}
              />
              <AdminField
                label="Despesas mensais (R$)"
                name="monthlyExpenses"
                value={draft.monthlyExpenses}
                onChange={(value) => setField("monthlyExpenses", Number(value))}
              />
            </FormSection>
            <FormSection
              title="Aquisição"
              description="Base para CAC, payback e conversão do funil."
              icon={Target}
            >
              <AdminField
                label="Investimento em aquisição (R$)"
                name="acquisitionSpend"
                value={draft.acquisitionSpend}
                onChange={(value) => setField("acquisitionSpend", Number(value))}
              />
              <AdminField
                label="Visitantes"
                name="visitors"
                value={draft.visitors}
                onChange={(value) => setField("visitors", Number(value))}
              />
              <AdminField
                label="Trials"
                name="trials"
                value={draft.trials}
                onChange={(value) => setField("trials", Number(value))}
              />
              <AdminField
                label="Trials convertidos"
                name="convertedTrials"
                value={draft.convertedTrials}
                onChange={(value) => setField("convertedTrials", Number(value))}
              />
            </FormSection>
            <FormSection
              title="Engajamento e satisfação"
              description="Métricas de uso e pesquisa preenchidas manualmente."
              icon={Activity}
            >
              <AdminField
                label="Usuários ativos diários"
                name="dau"
                value={draft.dau}
                onChange={(value) => setField("dau", Number(value))}
              />
              <AdminField
                label="Usuários ativos mensais"
                name="mau"
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
                value={draft.npsPromoters}
                onChange={(value) => setField("npsPromoters", Number(value))}
              />
              <AdminField
                label="NPS neutros"
                name="npsPassives"
                value={draft.npsPassives}
                onChange={(value) => setField("npsPassives", Number(value))}
              />
              <AdminField
                label="NPS detratores"
                name="npsDetractors"
                value={draft.npsDetractors}
                onChange={(value) => setField("npsDetractors", Number(value))}
              />
              <AdminField
                label="CSAT médio"
                name="csatAverage"
                value={draft.csatAverage}
                onChange={(value) => setField("csatAverage", Number(value))}
              />
            </FormSection>
            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={busy}>
                <Save size={14} /> {busy ? "Salvando…" : "Salvar no banco"}
              </Button>
            </div>
          </form>
        </section>

        <section className="surface p-6 overflow-x-auto">
          <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
            <div>
              <h2 className="section-heading">Clientes assinantes</h2>
              <p className="text-[11px] mt-1 text-muted-foreground">
                Pessoas que assinaram a plataforma via Mercado Pago.
              </p>
            </div>
            <span className="status info">
              <Users size={12} /> {fmtNumber(inputs.activeCustomers)} ativos
            </span>
          </div>
          {subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma assinatura registrada ainda.
            </p>
          ) : (
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">Cliente</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Valor</th>
                  <th className="py-2 pr-4 font-medium">Criada em</th>
                  <th className="py-2 pr-4 font-medium">Ativada em</th>
                  <th className="py-2 pr-4 font-medium">Assinatura MP</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id || subscriber.externalReference}
                    className="border-t border-border"
                  >
                    <td className="py-3 pr-4">
                      <div className="font-medium">{subscriber.payerName || subscriber.email}</div>
                      {subscriber.payerName && (
                        <div className="text-muted-foreground">{subscriber.email}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={statusClass(subscriber.status)}>{subscriber.status}</span>
                    </td>
                    <td className="py-3 pr-4">{fmtMoney(subscriber.amount)}</td>
                    <td className="py-3 pr-4">
                      {subscriber.createdAt ? shortDate(subscriber.createdAt) : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {subscriber.activatedAt ? shortDate(subscriber.activatedAt) : "—"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[10px]">
                      {subscriber.preapprovalId || subscriber.externalReference || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
