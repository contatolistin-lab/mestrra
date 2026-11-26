import { describe, expect, it } from "vitest";
import {
  calculateAdminMetrics,
  defaultAdminInputs,
  mapMercadoPagoSales,
  normalizeAdminInputs,
  summarizeMercadoPagoSales,
} from "@/lib/admin-metrics";
import { resetDemoData } from "@/lib/demo-store";

describe("admin metrics", () => {
  it("calcula MRR, ARR, ARPA e NRR", () => {
    const metrics = calculateAdminMetrics({
      ...defaultAdminInputs(),
      activeCustomers: 10,
      mrr: 5000,
      previousMrr: 4500,
      startingMrr: 4000,
      expansionMrr: 500,
      contractionMrr: 100,
      churnedMrr: 200,
    });

    expect(metrics.arr).toBe(60000);
    expect(metrics.arpa).toBe(500);
    expect(metrics.nrr).toBeCloseTo(105);
    expect(metrics.mrrGrowth).toBeCloseTo(11.11, 1);
  });

  it("calcula CAC, payback, LTV e relação LTV/CAC", () => {
    const metrics = calculateAdminMetrics({
      ...defaultAdminInputs(),
      activeCustomers: 100,
      previousActiveCustomers: 100,
      churnedCustomers: 5,
      mrr: 10000,
      startingMrr: 10000,
      churnedMrr: 500,
      acquisitionSpend: 3000,
      newCustomers: 10,
      grossMarginPercent: 80,
    });

    expect(metrics.cac).toBe(300);
    expect(metrics.arpa).toBe(100);
    expect(metrics.customerChurn).toBeCloseTo(5);
    expect(metrics.cacPaybackMonths).toBeCloseTo(3.75);
    expect(metrics.ltv).toBeCloseTo(1600);
    expect(metrics.ltvCac).toBeCloseTo(5.33, 1);
  });

  it("calcula funil, burn, runway, DAU/MAU, TTV e NPS", () => {
    const metrics = calculateAdminMetrics({
      ...defaultAdminInputs(),
      visitors: 1000,
      trials: 200,
      convertedTrials: 40,
      newCustomers: 40,
      cashBalance: 24000,
      monthlyRevenue: 6000,
      monthlyExpenses: 14000,
      dau: 300,
      mau: 1000,
      ttvDays: 3,
      npsPromoters: 60,
      npsPassives: 25,
      npsDetractors: 15,
      csatAverage: 4.4,
    });

    expect(metrics.visitorToTrial).toBeCloseTo(20);
    expect(metrics.trialToCustomer).toBeCloseTo(20);
    expect(metrics.visitorToCustomer).toBeCloseTo(4);
    expect(metrics.burnRate).toBe(8000);
    expect(metrics.runwayMonths).toBeCloseTo(3);
    expect(metrics.dauMau).toBeCloseTo(30);
    expect(metrics.ttvDays).toBe(3);
    expect(metrics.nps).toBeCloseTo(45);
    expect(metrics.csat).toBe(4.4);
  });

  it("normaliza valores inválidos e limita percentuais", () => {
    const normalized = normalizeAdminInputs({
      mrr: -10,
      visitors: "abc",
      grossMarginPercent: 140,
      csatAverage: 9,
    });

    expect(normalized.mrr).toBe(0);
    expect(normalized.visitors).toBe(0);
    expect(normalized.grossMarginPercent).toBe(100);
    expect(normalized.csatAverage).toBe(5);
  });

  it("mapeia e resume vendas feitas via Mercado Pago", () => {
    const data = resetDemoData();
    const sales = mapMercadoPagoSales(data);
    const summary = summarizeMercadoPagoSales(sales);

    expect(sales.length).toBeGreaterThan(0);
    expect(sales.every((sale) => !!sale.customer && !!sale.item && sale.amount > 0)).toBe(true);
    expect(summary.total).toBe(sales.length);
    expect(summary.paid + summary.pending + summary.cancelled).toBe(sales.length);
  });
});
