import { describe, expect, it } from "vitest";
import { contentDates, generateMarketingDrafts, marketingPrice, type MarketingOptions } from "@/lib/marketing-tools";

const item = { name: "Brownie", suggested_price: 48, promo_sale_price: 39.9, is_promo_sale_active: true, main_benefit: "chocolate artesanal" };
const options: MarketingOptions = { goal: "sell", detail: "", contact: "", startDate: "2026-11-30", situation: "price", customer: "", business: "", city: "" };

describe("practical marketing data", () => {
  it("uses the catalog's active promotional price without calculating a new discount", () => {
    expect(marketingPrice(item)).toBe(39.9);
    expect(marketingPrice({ ...item, is_promo_sale_active: false })).toBe(48);
    expect(marketingPrice({ ...item, promo_sale_price: 0 })).toBe(48);
  });
  it("does not substitute a fictitious price for an unpriced free topic", () => {
    expect(marketingPrice({ name: "Consultoria", suggested_price: 0 })).toBe(0);
  });
  it("creates seven consecutive dates across month boundaries", () => {
    const dates = contentDates("2026-11-30");
    expect(dates).toHaveLength(7);
    expect(dates[0]).toContain("30/11");
    expect(dates[6]).toContain("06/12");
    expect(generateMarketingDrafts("calendar", item, options).map((draft) => draft.id)).toEqual(["day-0", "day-1", "day-2", "day-3", "day-4", "day-5", "day-6"]);
  });
  it("rejects missing and impossible calendar dates", () => {
    expect(contentDates("")).toEqual([]);
    expect(contentDates("2026-02-30")).toEqual([]);
    expect(generateMarketingDrafts("calendar", item, { ...options, startDate: "" })).toEqual([]);
  });
});