import { useCallback, useEffect, useState } from "react";
import type { BusinessData } from "./business.functions";
import { requiredStock } from "./stock";

export type PriceCalculationMode = "margem" | "markup";

export type FiscalSettings = {
  regime: "simples_nacional" | "autonomo" | "lucro_presumido" | "lucro_real";
  defaultTaxPercent: number;
  serviceTaxPercent: number;
  fixedCostPercent: number;
  invoiceLabel: string;
  updatedAt: string;
};

export type PriceBand = {
  id: string;
  catalogItemId: string;
  label: string;
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
};

export type ProductionBatch = {
  id: string;
  catalogItemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes: string;
  createdAt: string;
};

export type QuoteStatus = "orcamento" | "confirmado" | "recorrente" | "cancelado";
export type QuoteRecurrence = "unica" | "semanal" | "mensal";

export type QuoteLine = {
  catalogItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Quote = {
  id: string;
  customer: string;
  phone: string;
  lines: QuoteLine[];
  total: number;
  status: QuoteStatus;
  recurrence: QuoteRecurrence;
  notes: string;
  createdAt: string;
  validUntil: string;
};

export type RetailMeta = {
  sku: string;
  size: string;
  color: string;
  salePrice: number | null;
};

export type ManagementState = {
  calculationMode: PriceCalculationMode;
  fiscal: FiscalSettings;
  bands: PriceBand[];
  batches: ProductionBatch[];
  quotes: Quote[];
  retail: Record<string, RetailMeta>;
};

export type BackupPayload = {
  format: "mestrra-backup";
  version: 1;
  exportedAt: string;
  business: BusinessData;
  management: ManagementState;
};

const STORAGE_PREFIX = "mestrra.management.v1";
export const MANAGEMENT_EVENT = "mestrra:management";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value : fallback;

const numeric = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;

const nullableAmount = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;

export function defaultFiscalSettings(): FiscalSettings {
  return {
    regime: "simples_nacional",
    defaultTaxPercent: 4.99,
    serviceTaxPercent: 4.99,
    fixedCostPercent: 10,
    invoiceLabel: "Mestrra",
    updatedAt: new Date().toISOString(),
  };
}

export function defaultManagementState(): ManagementState {
  return {
    calculationMode: "margem",
    fiscal: defaultFiscalSettings(),
    bands: [],
    batches: [],
    quotes: [],
    retail: {},
  };
}

function normalizeFiscal(value: unknown): FiscalSettings {
  const record = isRecord(value) ? value : {};
  const regimes = ["simples_nacional", "autonomo", "lucro_presumido", "lucro_real"];
  const regime = text(record["regime"], "simples_nacional");
  return {
    regime: regimes.includes(regime) ? (regime as FiscalSettings["regime"]) : "simples_nacional",
    defaultTaxPercent: numeric(record["defaultTaxPercent"], 4.99),
    serviceTaxPercent: numeric(record["serviceTaxPercent"], 4.99),
    fixedCostPercent: numeric(record["fixedCostPercent"], 10),
    invoiceLabel: text(record["invoiceLabel"], "Mestrra"),
    updatedAt: text(record["updatedAt"], new Date().toISOString()),
  };
}

export function normalizeManagementState(value: unknown): ManagementState {
  const record = isRecord(value) ? value : {};
  const mode = text(record["calculationMode"], "margem");
  const bands = Array.isArray(record["bands"]) ? record["bands"] : [];
  const batches = Array.isArray(record["batches"]) ? record["batches"] : [];
  const quotes = Array.isArray(record["quotes"]) ? record["quotes"] : [];
  const retail = isRecord(record["retail"]) ? record["retail"] : {};
  const retailEntries = Object.entries(retail).map(([itemId, value]) => {
    const meta = isRecord(value) ? value : {};
    return [
      itemId,
      {
        sku: text(meta["sku"], ""),
        size: text(meta["size"], ""),
        color: text(meta["color"], ""),
        salePrice: nullableAmount(meta["salePrice"]),
      },
    ] as const;
  });
  return {
    calculationMode: mode === "markup" ? "markup" : "margem",
    fiscal: normalizeFiscal(record["fiscal"]),
    bands: bands.filter(isRecord).map((band) => ({
      id: text(band["id"], Math.random().toString(36).slice(2)),
      catalogItemId: text(band["catalogItemId"], ""),
      label: text(band["label"], "Faixa"),
      minQuantity: numeric(band["minQuantity"], 1),
      maxQuantity:
        typeof band["maxQuantity"] === "number" && Number.isFinite(band["maxQuantity"])
          ? band["maxQuantity"]
          : null,
      price: numeric(band["price"], 0),
    })),
    batches: batches.filter(isRecord).map((batch) => ({
      id: text(batch["id"], Math.random().toString(36).slice(2)),
      catalogItemId: text(batch["catalogItemId"], ""),
      itemName: text(batch["itemName"], "Item"),
      quantity: numeric(batch["quantity"], 1),
      unitCost: numeric(batch["unitCost"], 0),
      totalCost: numeric(batch["totalCost"], 0),
      notes: text(batch["notes"], ""),
      createdAt: text(batch["createdAt"], new Date().toISOString()),
    })),
    quotes: quotes.filter(isRecord).map((quote) => {
      const statuses: string[] = ["orcamento", "confirmado", "recorrente", "cancelado"];
      const recurrences: string[] = ["unica", "semanal", "mensal"];
      const status = text(quote["status"], "orcamento");
      const recurrence = text(quote["recurrence"], "unica");
      const lines = Array.isArray(quote["lines"]) ? quote["lines"] : [];
      return {
        id: text(quote["id"], Math.random().toString(36).slice(2)),
        customer: text(quote["customer"], "Cliente"),
        phone: text(quote["phone"], ""),
        lines: lines.filter(isRecord).map((line) => ({
          catalogItemId: text(line["catalogItemId"], ""),
          name: text(line["name"], "Item"),
          quantity: numeric(line["quantity"], 1),
          unitPrice: numeric(line["unitPrice"], 0),
        })),
        total: numeric(quote["total"], 0),
        status: statuses.includes(status) ? (status as QuoteStatus) : "orcamento",
        recurrence: recurrences.includes(recurrence) ? (recurrence as QuoteRecurrence) : "unica",
        notes: text(quote["notes"], ""),
        createdAt: text(quote["createdAt"], new Date().toISOString()),
        validUntil: text(quote["validUntil"], new Date().toISOString()),
      };
    }),
    retail: Object.fromEntries(retailEntries),
  };
}

const storageKey = (userId: string) => `${STORAGE_PREFIX}.${userId}`;

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MANAGEMENT_EVENT));
}

export function loadManagementState(userId: string): ManagementState {
  if (typeof window === "undefined") return defaultManagementState();
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return defaultManagementState();
    return normalizeManagementState(JSON.parse(raw) as unknown);
  } catch {
    return defaultManagementState();
  }
}

export function saveManagementState(userId: string, state: ManagementState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } finally {
    notify();
  }
}

export function clearManagementState(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(userId));
  notify();
}

export function useManagementState(userId: string) {
  const [state, setState] = useState<ManagementState>(() => loadManagementState(userId));

  useEffect(() => {
    setState(loadManagementState(userId));
    const reload = () => setState(loadManagementState(userId));
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey(userId)) reload();
    };
    window.addEventListener(MANAGEMENT_EVENT, reload);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MANAGEMENT_EVENT, reload);
      window.removeEventListener("storage", onStorage);
    };
  }, [userId]);

  const update = useCallback(
    (next: ManagementState | ((current: ManagementState) => ManagementState)) => {
      setState((current) => {
        const resolved = typeof next === "function" ? next(current) : next;
        saveManagementState(userId, resolved);
        return resolved;
      });
    },
    [userId],
  );

  return { state, update };
}

export type AdvancedPriceInput = {
  mode: PriceCalculationMode;
  cost: number;
  taxPercent: number;
  marginPercent: number;
  markupPercent: number;
};

export function advancedPrice(input: AdvancedPriceInput) {
  const { mode, cost, taxPercent, marginPercent, markupPercent } = input;
  const taxRate = taxPercent / 100;
  const denominator = mode === "markup" ? 1 - taxRate : 1 - taxRate - marginPercent / 100;
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(taxPercent) ||
    !Number.isFinite(marginPercent) ||
    !Number.isFinite(markupPercent) ||
    cost < 0 ||
    denominator <= 0
  ) {
    return { price: 0, tax: 0, profit: 0, effectiveMargin: 0, valid: false };
  }
  const price =
    mode === "markup" ? (cost * (1 + markupPercent / 100)) / denominator : cost / denominator;
  const tax = price * taxRate;
  const profit = price - cost - tax;
  return {
    price,
    tax,
    profit,
    effectiveMargin: price > 0 ? (profit / price) * 100 : 0,
    valid: Number.isFinite(price) && price > 0,
  };
}

export function keystoneRule(cost: number) {
  return {
    price: cost * 2,
    markupPercent: 100,
    marginPercent: 50,
    description: "Preço 2x o custo equivale a 50% de margem sobre a venda.",
  };
}

export function priceBandError(
  input: Pick<PriceBand, "catalogItemId" | "label" | "minQuantity" | "maxQuantity" | "price">,
  bands: PriceBand[],
  ignoreId?: string,
) {
  if (!input.label.trim()) return "Informe o nome da faixa.";
  if (!Number.isFinite(input.minQuantity) || input.minQuantity < 1) {
    return "A quantidade inicial deve ser pelo menos 1.";
  }
  if (
    input.maxQuantity !== null &&
    (!Number.isFinite(input.maxQuantity) || input.maxQuantity < input.minQuantity)
  ) {
    return "A quantidade final deve ser maior ou igual à inicial.";
  }
  if (!Number.isFinite(input.price) || input.price <= 0) {
    return "Informe um preço maior que zero.";
  }
  const overlaps = bands.some((band) => {
    if (band.catalogItemId !== input.catalogItemId || band.id === ignoreId) return false;
    const start = Math.max(band.minQuantity, input.minQuantity);
    const end = Math.min(
      band.maxQuantity ?? Number.POSITIVE_INFINITY,
      input.maxQuantity ?? Number.POSITIVE_INFINITY,
    );
    return start <= end;
  });
  if (overlaps) return "Essa faixa sobrepõe outra faixa do mesmo item.";
  return null;
}

export function resolvePriceBand(
  bands: PriceBand[],
  catalogItemId: string,
  quantity: number,
  basePrice: number,
) {
  const matching = bands
    .filter((band) => band.catalogItemId === catalogItemId)
    .filter((band) => quantity >= band.minQuantity)
    .filter((band) => band.maxQuantity === null || quantity <= band.maxQuantity)
    .filter((band) => Number.isFinite(band.price) && band.price > 0)
    .sort((a, b) => a.minQuantity - b.minQuantity)[0];
  if (!matching)
    return { price: basePrice, label: null as string | null, band: null as PriceBand | null };
  return { price: matching.price, label: matching.label, band: matching };
}

export function productionShortage(
  data: Pick<BusinessData, "recipes" | "inventory">,
  catalogItemId: string,
  quantity: number,
) {
  return requiredStock(data, catalogItemId, quantity).filter((row) => row.available < row.needed);
}

export function quoteTotal(lines: QuoteLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export function retailLabel(meta: RetailMeta | undefined | null) {
  return [meta?.sku, meta?.size, meta?.color].filter(Boolean).join(" · ");
}

export function resaleMargin(cost: number, salePrice: number, taxPercent: number) {
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(salePrice) ||
    !Number.isFinite(taxPercent) ||
    cost < 0 ||
    salePrice <= 0 ||
    taxPercent >= 100
  ) {
    return null;
  }
  const margin = 100 * (1 - cost / salePrice - taxPercent / 100);
  if (!Number.isFinite(margin) || margin < 0 || margin >= 100) return null;
  return margin;
}

export function withRetailMeta(state: ManagementState, itemId: string, meta: RetailMeta) {
  return { ...state, retail: { ...state.retail, [itemId]: meta } };
}

export function createQuote(
  input: Omit<Quote, "id" | "createdAt" | "validUntil" | "total">,
): Quote {
  const createdAt = new Date().toISOString();
  const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    ...input,
    id: `orc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    total: quoteTotal(input.lines),
    createdAt,
    validUntil,
  };
}

export function createBackup(business: BusinessData, management: ManagementState): BackupPayload {
  return {
    format: "mestrra-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    business,
    management,
  };
}

export function parseBackup(content: string): BackupPayload {
  const parsed: unknown = JSON.parse(content);
  if (!isRecord(parsed)) throw new Error("Arquivo de backup inválido.");
  if (parsed["format"] !== "mestrra-backup" || parsed["version"] !== 1) {
    throw new Error("Esse arquivo não é um backup compatível com a mestrra.");
  }
  if (!isRecord(parsed["management"])) throw new Error("Backup sem configurações locais.");
  if (!isRecord(parsed["business"])) throw new Error("Backup sem dados do negócio.");
  return {
    format: "mestrra-backup",
    version: 1,
    exportedAt: text(parsed["exportedAt"], new Date().toISOString()),
    business: parsed["business"] as unknown as BusinessData,
    management: normalizeManagementState(parsed["management"]),
  };
}

export const fiscalLabels = {
  regime: {
    simples_nacional: "Simples Nacional",
    autonomo: "Autônomo / MEI",
    lucro_presumido: "Lucro presumido",
    lucro_real: "Lucro real",
  },
  status: {
    orcamento: "Orçamento",
    confirmado: "Confirmado",
    recorrente: "Recorrente",
    cancelado: "Cancelado",
  },
  recurrence: {
    unica: "Única",
    semanal: "Semanal",
    mensal: "Mensal",
  },
};
