import { beforeEach, describe, expect, it } from "vitest";
import { getDemoData, resetDemoData } from "@/lib/demo-store";
import {
  advancedPrice,
  createBackup,
  createQuote,
  defaultManagementState,
  keystoneRule,
  parseBackup,
  priceBandError,
  productionShortage,
  quoteTotal,
  resolvePriceBand,
  type PriceBand,
  type QuoteLine,
} from "@/lib/management";

describe("management rules", () => {
  beforeEach(() => {
    resetDemoData();
  });

  it("calculates price by margin and by markup", () => {
    const margin = advancedPrice({
      mode: "margem",
      cost: 100,
      taxPercent: 0,
      marginPercent: 50,
      markupPercent: 100,
    });
    expect(margin.price).toBeCloseTo(200);
    expect(margin.profit).toBeCloseTo(100);
    expect(margin.effectiveMargin).toBeCloseTo(50);

    const markup = advancedPrice({
      mode: "markup",
      cost: 100,
      taxPercent: 10,
      marginPercent: 50,
      markupPercent: 100,
    });
    expect(markup.price).toBeCloseTo(222.2222, 3);
    expect(markup.tax).toBeCloseTo(22.2222, 3);
    expect(markup.profit).toBeCloseTo(100);
    expect(markup.effectiveMargin).toBeCloseTo(45, 1);
  });

  it("treats keystone 2x as a 50% margin", () => {
    const rule = keystoneRule(48);
    expect(rule.price).toBe(96);
    expect(rule.marginPercent).toBe(50);
    expect(rule.markupPercent).toBe(100);
  });

  it("rejects impossible price rules", () => {
    expect(
      advancedPrice({
        mode: "margem",
        cost: 100,
        taxPercent: 60,
        marginPercent: 50,
        markupPercent: 100,
      }).valid,
    ).toBe(false);
  });

  it("resolves quantity price bands and rejects overlaps", () => {
    const bands: PriceBand[] = [
      {
        id: "band-6",
        catalogItemId: "demo-brownie",
        label: "6 a 11",
        minQuantity: 6,
        maxQuantity: 11,
        price: 44,
      },
      {
        id: "band-12",
        catalogItemId: "demo-brownie",
        label: "12+",
        minQuantity: 12,
        maxQuantity: null,
        price: 40,
      },
    ];
    expect(resolvePriceBand(bands, "demo-brownie", 1, 48).price).toBe(48);
    expect(resolvePriceBand(bands, "demo-brownie", 6, 48).price).toBe(44);
    expect(resolvePriceBand(bands, "demo-brownie", 12, 48).label).toBe("12+");
    expect(
      priceBandError(
        {
          catalogItemId: "demo-brownie",
          label: "Sobrepõe",
          minQuantity: 10,
          maxQuantity: 13,
          price: 42,
        },
        bands,
      ),
    ).toContain("sobrepõe");
  });

  it("creates quotes with line totals and detects production shortages", () => {
    const lines: QuoteLine[] = [
      { catalogItemId: "demo-brownie", name: "Brownie", quantity: 2, unitPrice: 48 },
    ];
    expect(quoteTotal(lines)).toBe(96);
    const quote = createQuote({
      customer: "Maria",
      phone: "(11) 99999-0000",
      lines,
      status: "orcamento",
      recurrence: "mensal",
      notes: "",
    });
    expect(quote.total).toBe(96);
    expect(quote.status).toBe("orcamento");
    expect(productionShortage(getDemoData(), "demo-brownie", 2)).toHaveLength(0);
    expect(productionShortage(getDemoData(), "demo-brownie", 100).length).toBeGreaterThan(0);
  });

  it("round-trips a complete backup", () => {
    const state = defaultManagementState();
    state.fiscal.defaultTaxPercent = 6;
    state.bands.push({
      id: "band-1",
      catalogItemId: "demo-brownie",
      label: "Atacado",
      minQuantity: 6,
      maxQuantity: null,
      price: 40,
    });
    const backup = createBackup(getDemoData(), state);
    const restored = parseBackup(JSON.stringify(backup));
    expect(restored.management.fiscal.defaultTaxPercent).toBe(6);
    expect(restored.management.bands[0]?.price).toBe(40);
    expect(restored.business.inventory.length).toBe(getDemoData().inventory.length);
  });
});
