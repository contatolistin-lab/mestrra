import { beforeEach, describe, expect, it } from "vitest";
import { demoSupabase } from "@/integrations/supabase/demo-client";
import { generateCopy, phoneMask, priceCalculation, pricingError, unitCost } from "@/lib/mestrra";
import { getDemoData, resetDemoData } from "@/lib/demo-store";
import { requiredStock } from "@/lib/stock";

describe("mestrra business rules", () => {
  beforeEach(() => {
    resetDemoData();
  });

  it("calculates cost, tax and suggested price", () => {
    const result = priceCalculation(100, 60, 50, 10, 0, 50);
    expect(result.labor).toBe(50);
    expect(result.fixed).toBe(15);
    expect(result.cost).toBe(165);
    expect(result.price).toBe(330);
    expect(result.profit).toBe(165);
    expect(result.valid).toBe(true);
  });

  it("invalidates impossible margins", () => {
    const result = priceCalculation(100, 0, 0, 0, 60, 50);
    expect(result.valid).toBe(false);
    expect(result.price).toBe(0);
  });

  it("uses the promo unit cost only when active", () => {
    expect(unitCost(42, 34.9, 1000, true)).toBeCloseTo(0.0349);
    expect(unitCost(42, 34.9, 1000, false)).toBeCloseTo(0.042);
  });

  it("generates Instagram and WhatsApp copy from the catalog item", () => {
    const item = {
      name: "Brownie artesanal",
      target_audience: "amantes de chocolate",
      main_benefit: "um momento de pausa",
      pain_point_solved: "presentes sem graça",
      suggested_price: 48,
      promo_sale_price: 39.9,
      is_promo_sale_active: true,
    };
    expect(generateCopy(item, "urgente", "instagram")).toHaveLength(3);
    expect(generateCopy(item, "urgente", "whatsapp")).toHaveLength(4);
    expect(generateCopy(item, "urgente", "whatsapp")[0]?.text).toContain("39,90");
  });

  it("masks Brazilian phone numbers", () => {
    expect(phoneMask("11999990000")).toBe("(11) 99999-0000");
  });

  it("validates pricing inputs and rejects promo below cost", () => {
    const base = {
      name: "Brownie",
      totalMinutes: 30,
      hourly: 50,
      fixedPercent: 10,
      taxPercent: 4.99,
      margin: 50,
      promo: 0,
      cost: 100,
      price: 222,
      priceValid: true,
      recipes: [{ inventory_item_id: "demo-choc", quantity_used: 150 }],
    };
    expect(pricingError(base)).toBeNull();
    expect(pricingError({ ...base, promo: 90 })).toContain("abaixo do custo");
    expect(pricingError({ ...base, hourly: -1 })).toContain("negativos");
    expect(pricingError({ ...base, totalMinutes: 0, recipes: [] })).toContain("tempo de execução");
  });

  it("multiplies recipe quantity by the sold quantity", () => {
    const rows = requiredStock(getDemoData(), "demo-brownie", 2);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "demo-choc", needed: 300, available: 2800, unit: "g" });
  });

  it("deducts demo stock when a sale is registered", async () => {
    await demoSupabase.rpc("create_sale", { p_item: "demo-brownie", p_quantity: 2 });
    const chocolate = getDemoData().inventory.find((item) => item.id === "demo-choc");
    expect(chocolate?.current_stock).toBe(2500);
  });

  it("blocks demo sales without enough stock", async () => {
    await expect(
      demoSupabase.rpc("create_sale", { p_item: "demo-brownie", p_quantity: 100 }),
    ).rejects.toThrow("Estoque insuficiente");
  });

  it("blocks demo product sales without a stock link", async () => {
    await expect(
      demoSupabase.rpc("create_sale", { p_item: "demo-brigadeiro", p_quantity: 1 }),
    ).rejects.toThrow("vinculado ao estoque");
  });
});
