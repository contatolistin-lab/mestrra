export type AdminInputs = {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  activeCustomers: number;
  previousActiveCustomers: number;
  churnedCustomers: number;
  mrr: number;
  previousMrr: number;
  startingMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  acquisitionSpend: number;
  newCustomers: number;
  visitors: number;
  trials: number;
  convertedTrials: number;
  grossMarginPercent: number;
  cashBalance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  dau: number;
  mau: number;
  ttvDays: number;
  npsPromoters: number;
  npsPassives: number;
  npsDetractors: number;
  csatAverage: number;
};

export type PlatformAdminInputs = {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  expansionMrr: number;
  contractionMrr: number;
  acquisitionSpend: number;
  visitors: number;
  trials: number;
  convertedTrials: number;
  grossMarginPercent: number;
  cashBalance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  dau: number;
  mau: number;
  ttvDays: number;
  npsPromoters: number;
  npsPassives: number;
  npsDetractors: number;
  csatAverage: number;
};

export type AdminMetrics = {
  arr: number;
  arpa: number | null;
  nrr: number | null;
  mrrGrowth: number | null;
  cac: number | null;
  cacPaybackMonths: number | null;
  visitorToTrial: number | null;
  trialToCustomer: number | null;
  visitorToCustomer: number | null;
  customerChurn: number | null;
  revenueChurn: number | null;
  ltv: number | null;
  ltvCac: number | null;
  burnRate: number;
  runwayMonths: number | null;
  dauMau: number | null;
  ttvDays: number | null;
  nps: number | null;
  csat: number | null;
};

export type PlatformSubscription = {
  id: string;
  email: string;
  payerName: string | null;
  status: string;
  amount: number;
  currency: string;
  createdAt: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  lastPaymentAt: string | null;
  preapprovalId: string | null;
  externalReference: string;
  checkoutUrl: string | null;
};

export type PlatformSubscriber = PlatformSubscription;

export type PlatformOverview = {
  manualInputs: PlatformAdminInputs;
  inputs: AdminInputs;
  metrics: AdminMetrics;
  subscribers: PlatformSubscriber[];
  totals: {
    total: number;
    active: number;
    pending: number;
    cancelled: number;
    expired: number;
    mrr: number;
    arr: number;
    signups: number;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const text = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value : fallback;

const nullableText = (value: unknown) => (typeof value === "string" && value.trim() ? value : null);

const num = (value: unknown, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const percent = (value: number, total: number) => (total > 0 ? (value / total) * 100 : null);

const clamp = (value: number, max: number) => Math.min(max, value);

function currentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthText = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${monthText}-01`,
    end: `${year}-${monthText}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function defaultPlatformAdminInputs(): PlatformAdminInputs {
  const period = currentPeriod();
  return {
    periodLabel: "Mês atual",
    periodStart: period.start,
    periodEnd: period.end,
    expansionMrr: 0,
    contractionMrr: 0,
    acquisitionSpend: 0,
    visitors: 0,
    trials: 0,
    convertedTrials: 0,
    grossMarginPercent: 80,
    cashBalance: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    dau: 0,
    mau: 0,
    ttvDays: 0,
    npsPromoters: 0,
    npsPassives: 0,
    npsDetractors: 0,
    csatAverage: 0,
  };
}

export function normalizePlatformAdminInputs(value: unknown): PlatformAdminInputs {
  const record = isRecord(value) ? value : {};
  const fallback = defaultPlatformAdminInputs();
  return {
    periodLabel: text(record["periodLabel"] ?? record["period_label"], fallback.periodLabel),
    periodStart: text(record["periodStart"] ?? record["period_start"], fallback.periodStart),
    periodEnd: text(record["periodEnd"] ?? record["period_end"], fallback.periodEnd),
    expansionMrr: num(record["expansionMrr"] ?? record["expansion_mrr"]),
    contractionMrr: num(record["contractionMrr"] ?? record["contraction_mrr"]),
    acquisitionSpend: num(record["acquisitionSpend"] ?? record["acquisition_spend"]),
    visitors: num(record["visitors"]),
    trials: num(record["trials"]),
    convertedTrials: num(record["convertedTrials"] ?? record["converted_trials"]),
    grossMarginPercent: clamp(
      num(record["grossMarginPercent"] ?? record["gross_margin_percent"], 80),
      100,
    ),
    cashBalance: num(record["cashBalance"] ?? record["cash_balance"]),
    monthlyRevenue: num(record["monthlyRevenue"] ?? record["monthly_revenue"]),
    monthlyExpenses: num(record["monthlyExpenses"] ?? record["monthly_expenses"]),
    dau: num(record["dau"]),
    mau: num(record["mau"]),
    ttvDays: num(record["ttvDays"] ?? record["ttv_days"]),
    npsPromoters: num(record["npsPromoters"] ?? record["nps_promoters"]),
    npsPassives: num(record["npsPassives"] ?? record["nps_passives"]),
    npsDetractors: num(record["npsDetractors"] ?? record["nps_detractors"]),
    csatAverage: clamp(num(record["csatAverage"] ?? record["csat_average"]), 5),
  };
}

export function normalizePlatformSubscription(value: unknown): PlatformSubscription | null {
  if (!isRecord(value)) return null;
  const email = text(value["email"]).trim().toLowerCase();
  if (!email) return null;
  return {
    id: text(value["id"]),
    email,
    payerName: nullableText(value["payer_name"] ?? value["payerName"]),
    status: text(value["status"], "pending").toLowerCase(),
    amount: num(value["amount"] ?? value["transaction_amount"]),
    currency: text(value["currency"], "BRL"),
    createdAt: nullableText(value["created_at"] ?? value["createdAt"]),
    activatedAt: nullableText(value["activated_at"] ?? value["activatedAt"]),
    cancelledAt: nullableText(value["cancelled_at"] ?? value["cancelledAt"]),
    lastPaymentAt: nullableText(value["last_payment_at"] ?? value["lastPaymentAt"]),
    preapprovalId: nullableText(value["preapproval_id"] ?? value["preapprovalId"]),
    externalReference: text(value["external_reference"] ?? value["externalReference"]),
    checkoutUrl: nullableText(value["checkout_url"] ?? value["checkoutUrl"]),
  };
}

const activeStatuses = new Set(["active", "authorized", "confirmed", "paid"]);

function isActive(subscription: PlatformSubscription) {
  return activeStatuses.has(subscription.status) && !subscription.cancelledAt;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function periodBounds(start: string, end: string) {
  const startDate = parseDate(`${start}T00:00:00Z`) ?? new Date(Date.UTC(1970, 0, 1));
  const endDate = parseDate(`${end}T00:00:00Z`) ?? new Date();
  const endExclusive = new Date(endDate.getTime());
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { startDate, endExclusive };
}

function withinPeriod(value: string | null, start: Date, end: Date) {
  const date = parseDate(value);
  return !!date && date >= start && date < end;
}

function wasActiveAt(subscription: PlatformSubscription, at: Date) {
  const created = parseDate(subscription.activatedAt ?? subscription.createdAt);
  if (!created || created > at) return false;
  const cancelled = parseDate(subscription.cancelledAt);
  if (cancelled && cancelled <= at) return false;
  return !["pending", "rejected", "expired"].includes(subscription.status);
}

export function derivePlatformInputs(
  subscriptions: PlatformSubscription[],
  manual: PlatformAdminInputs,
): AdminInputs {
  const { startDate, endExclusive } = periodBounds(manual.periodStart, manual.periodEnd);
  const active = subscriptions.filter(isActive);
  const mrr = active.reduce((sum, subscription) => sum + subscription.amount, 0);
  const starting = subscriptions.filter((subscription) => wasActiveAt(subscription, startDate));
  const startingMrr = starting.reduce((sum, subscription) => sum + subscription.amount, 0);
  const createdInPeriod = subscriptions.filter((subscription) =>
    withinPeriod(subscription.activatedAt, startDate, endExclusive),
  );
  const cancelledInPeriod = subscriptions.filter((subscription) =>
    withinPeriod(subscription.cancelledAt, startDate, endExclusive),
  );
  const newMrr = createdInPeriod.reduce((sum, subscription) => sum + subscription.amount, 0);
  const churnedMrr = cancelledInPeriod.reduce((sum, subscription) => sum + subscription.amount, 0);
  const newCustomers = createdInPeriod.length;
  const churnedCustomers = cancelledInPeriod.length;
  const previousActiveCustomers = Math.max(0, active.length - newCustomers + churnedCustomers);
  const previousMrr = Math.max(
    0,
    mrr - newMrr + churnedMrr - manual.expansionMrr + manual.contractionMrr,
  );

  return {
    periodLabel: manual.periodLabel,
    periodStart: manual.periodStart,
    periodEnd: manual.periodEnd,
    activeCustomers: active.length,
    previousActiveCustomers,
    churnedCustomers,
    mrr,
    previousMrr,
    startingMrr,
    expansionMrr: manual.expansionMrr,
    contractionMrr: manual.contractionMrr,
    churnedMrr,
    acquisitionSpend: manual.acquisitionSpend,
    newCustomers,
    visitors: manual.visitors,
    trials: manual.trials,
    convertedTrials: manual.convertedTrials,
    grossMarginPercent: manual.grossMarginPercent,
    cashBalance: manual.cashBalance,
    monthlyRevenue: mrr,
    monthlyExpenses: manual.monthlyExpenses,
    dau: manual.dau,
    mau: manual.mau,
    ttvDays: manual.ttvDays,
    npsPromoters: manual.npsPromoters,
    npsPassives: manual.npsPassives,
    npsDetractors: manual.npsDetractors,
    csatAverage: manual.csatAverage,
  };
}

export function calculateAdminMetrics(input: AdminInputs): AdminMetrics {
  const arpa = input.activeCustomers > 0 ? input.mrr / input.activeCustomers : null;
  const nrr =
    input.startingMrr > 0
      ? ((input.startingMrr + input.expansionMrr - input.contractionMrr - input.churnedMrr) /
          input.startingMrr) *
        100
      : null;
  const mrrGrowth =
    input.previousMrr > 0 ? ((input.mrr - input.previousMrr) / input.previousMrr) * 100 : null;
  const cac = input.newCustomers > 0 ? input.acquisitionSpend / input.newCustomers : null;
  const grossMargin = input.grossMarginPercent / 100;
  const cacPaybackMonths =
    cac !== null && arpa !== null && arpa > 0 && grossMargin > 0
      ? cac / (arpa * grossMargin)
      : null;
  const visitorToTrial = percent(input.trials, input.visitors);
  const trialToCustomer = percent(input.convertedTrials, input.trials);
  const visitorToCustomer = percent(input.newCustomers, input.visitors);
  const customerChurn = percent(input.churnedCustomers, input.previousActiveCustomers);
  const revenueChurn = percent(input.churnedMrr, input.startingMrr);
  const churnForLtv = customerChurn !== null && customerChurn > 0 ? customerChurn : revenueChurn;
  const ltv =
    arpa !== null && churnForLtv !== null && churnForLtv > 0
      ? (arpa * grossMargin) / (churnForLtv / 100)
      : null;
  const ltvCac = ltv !== null && cac !== null && cac > 0 ? ltv / cac : null;
  const burnRate = Math.max(0, input.monthlyExpenses - input.monthlyRevenue);
  const runwayMonths = burnRate > 0 ? input.cashBalance / burnRate : null;
  const dauMau = percent(input.dau, input.mau);
  const npsResponses = input.npsPromoters + input.npsPassives + input.npsDetractors;
  const nps =
    npsResponses > 0 ? ((input.npsPromoters - input.npsDetractors) / npsResponses) * 100 : null;

  return {
    arr: input.mrr * 12,
    arpa,
    nrr,
    mrrGrowth,
    cac,
    cacPaybackMonths,
    visitorToTrial,
    trialToCustomer,
    visitorToCustomer,
    customerChurn,
    revenueChurn,
    ltv,
    ltvCac,
    burnRate,
    runwayMonths,
    dauMau,
    ttvDays: input.ttvDays > 0 ? input.ttvDays : null,
    nps,
    csat: input.csatAverage > 0 ? input.csatAverage : null,
  };
}

export function buildPlatformOverview(
  subscriptionRows: unknown[],
  inputRow: unknown,
  profileRows: unknown[],
): PlatformOverview {
  const subscriptions = subscriptionRows
    .map(normalizePlatformSubscription)
    .filter((row): row is PlatformSubscription => row !== null);
  const manual = normalizePlatformAdminInputs(inputRow);
  const inputs = derivePlatformInputs(subscriptions, manual);
  const active = subscriptions.filter(isActive);
  const mrr = active.reduce((sum, subscription) => sum + subscription.amount, 0);

  return {
    manualInputs: manual,
    inputs,
    metrics: calculateAdminMetrics(inputs),
    subscribers: subscriptions,
    totals: {
      total: subscriptions.length,
      active: active.length,
      pending: subscriptions.filter((subscription) => subscription.status === "pending").length,
      cancelled: subscriptions.filter((subscription) => subscription.status === "cancelled").length,
      expired: subscriptions.filter((subscription) => subscription.status === "expired").length,
      mrr,
      arr: mrr * 12,
      signups: profileRows.length,
    },
  };
}
