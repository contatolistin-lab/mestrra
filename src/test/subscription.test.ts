import { describe, expect, it } from "vitest";

import { money } from "@/lib/mestrra";
import { SUBSCRIPTION_BENEFITS, SUBSCRIPTION_PRICE, SUBSCRIPTION_REASON } from "@/lib/subscription";

describe("mestrra subscription", () => {
  it("keeps the monthly price at R$ 127,00", () => {
    expect(SUBSCRIPTION_PRICE).toBe(127);
    expect(money(SUBSCRIPTION_PRICE).replace(/\u00a0/g, " ")).toBe("R$ 127,00");
  });

  it("describes the recurring plan for Mercado Pago", () => {
    expect(SUBSCRIPTION_REASON).toContain("mestrra");
    expect(SUBSCRIPTION_BENEFITS.length).toBeGreaterThan(0);
  });
});
