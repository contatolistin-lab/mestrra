import { describe, expect, it } from "vitest";
import { generateCopy, phoneMask, priceCalculation, unitCost } from "@/lib/mestrra";

describe("Mestrra business rules", () => {
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
});
