import { useCallback, useEffect, useState } from "react";
import type { BusinessData } from "@/lib/business.functions";

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

export type AdminMpSale = {
  id: string;
  createdAt: string;
  customer: string;
  item: string;
  quantity: number;
  amount: number;
  status: string;
  paymentId: string | null;
  preferenceId: string | null;
  checkoutUrl: string | null;
};

export type AdminMpSummary = {
  total: number;
  paid: number;
  pending: number;
  cancelled: number;
  grossPaid: number;
};

const STORAGE_PREFIX = "mestrra.admin.v1";
export const ADMIN_EVENT = "mestrra:admin";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value : fallback;

const num = (value: unknown, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const percent = (value: number, total: number) => (total > 0 ? (value / total) * 100 : null);

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

export function defaultAdminInputs(): AdminInputs {
  const period = currentPeriod();
  return {
    periodLabel: "Período atual",
    periodStart: period.start,
    periodEnd: period.end,
    activeCustomers: 0,
    previousActiveCustomers: 0,
    churnedCustomers: 0,
    mrr: 0,
    previousMrr: 0,
    startingMrr: 0,
    expansionMrr: 0,
    contractionMrr: 0,
    churnedMrr: 0,
    acquisitionSpend: 0,
    newCustomers: 0,
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

export function normalizeAdminInputs(value: unknown): AdminInputs {
  const record = isRecord(value) ? value : {};
  const fallback = defaultAdminInputs();
  return {
    periodLabel: text(record["periodLabel"], fallback.periodLabel),
    periodStart: text(record["periodStart"], fallback.periodStart),
    periodEnd: text(record["periodEnd"], fallback.periodEnd),
    activeCustomers: num(record["activeCustomers"]),
    previousActiveCustomers: num(record["previousActiveCustomers"]),
    churnedCustomers: num(record["churnedCustomers"]),
    mrr: num(record["mrr"]),
    previousMrr: num(record["previousMrr"]),
    startingMrr: num(record["startingMrr"]),
    expansionMrr: num(record["expansionMrr"]),
    contractionMrr: num(record["contractionMrr"]),
    churnedMrr: num(record["churnedMrr"]),
    acquisitionSpend: num(record["acquisitionSpend"]),
    newCustomers: num(record["newCustomers"]),
    visitors: num(record["visitors"]),
    trials: num(record["trials"]),
    convertedTrials: num(record["convertedTrials"]),
    grossMarginPercent: Math.min(100, num(record["grossMarginPercent"], 80)),
    cashBalance: num(record["cashBalance"]),
    monthlyRevenue: num(record["monthlyRevenue"]),
    monthlyExpenses: num(record["monthlyExpenses"]),
    dau: num(record["dau"]),
    mau: num(record["mau"]),
    ttvDays: num(record["ttvDays"]),
    npsPromoters: num(record["npsPromoters"]),
    npsPassives: num(record["npsPassives"]),
    npsDetractors: num(record["npsDetractors"]),
    csatAverage: Math.min(5, num(record["csatAverage"])),
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

export function mapMercadoPagoSales(data: BusinessData): AdminMpSale[] {
  const names = new Map(data.catalog.map((item) => [item.id, item.name]));
  return data.orders
    .filter(
      (order) =>
        order.payment_method === "mp_checkout_pro" ||
        !!order.mp_payment_id ||
        !!order.mp_preference_id ||
        !!order.checkout_url,
    )
    .map((order) => ({
      id: String(order.id),
      createdAt: String(order.created_at),
      customer: String(order.customer_name),
      item: names.get(String(order.catalog_item_id)) || "Item do catálogo",
      quantity: Number(order.quantity),
      amount: Number(order.total_amount),
      status: String(order.status),
      paymentId: order.mp_payment_id ? String(order.mp_payment_id) : null,
      preferenceId: order.mp_preference_id ? String(order.mp_preference_id) : null,
      checkoutUrl: order.checkout_url ? String(order.checkout_url) : null,
    }));
}

export function summarizeMercadoPagoSales(sales: AdminMpSale[]): AdminMpSummary {
  return {
    total: sales.length,
    paid: sales.filter((sale) => sale.status === "paid").length,
    pending: sales.filter((sale) => sale.status === "pending").length,
    cancelled: sales.filter((sale) => sale.status === "cancelled").length,
    grossPaid: sales
      .filter((sale) => sale.status === "paid")
      .reduce((sum, sale) => sum + sale.amount, 0),
  };
}

const storageKey = (userId: string) => `${STORAGE_PREFIX}.${userId}`;

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_EVENT));
}

export function loadAdminInputs(userId: string): AdminInputs {
  if (typeof window === "undefined") return defaultAdminInputs();
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return defaultAdminInputs();
    return normalizeAdminInputs(JSON.parse(raw) as unknown);
  } catch {
    return defaultAdminInputs();
  }
}

export function saveAdminInputs(userId: string, value: AdminInputs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(normalizeAdminInputs(value)));
  } finally {
    notify();
  }
}

export function clearAdminInputs(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(userId));
  notify();
}

export function useAdminInputs(userId: string) {
  const [state, setState] = useState<AdminInputs>(() => loadAdminInputs(userId));

  useEffect(() => {
    setState(loadAdminInputs(userId));
    const reload = () => setState(loadAdminInputs(userId));
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey(userId)) reload();
    };
    window.addEventListener(ADMIN_EVENT, reload);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ADMIN_EVENT, reload);
      window.removeEventListener("storage", onStorage);
    };
  }, [userId]);

  const update = useCallback(
    (next: AdminInputs | ((current: AdminInputs) => AdminInputs)) => {
      setState((current) => {
        const resolved = typeof next === "function" ? next(current) : next;
        saveAdminInputs(userId, resolved);
        return resolved;
      });
    },
    [userId],
  );

  return { state, update };
}
