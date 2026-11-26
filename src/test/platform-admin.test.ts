import { describe, expect, it } from "vitest";

import {
  buildPlatformOverview,
  normalizePlatformAdminInputs,
  normalizePlatformSubscription,
} from "@/lib/platform-admin";

const subscriptions = [
  {
    id: "sub-1",
    email: "ana@example.com",
    payer_name: "Ana",
    status: "active",
    amount: 127,
    created_at: "2026-11-05T10:00:00Z",
    activated_at: "2026-11-05T10:00:00Z",
    cancelled_at: null,
    preapproval_id: "MP-1",
    external_reference: "ref-1",
  },
  {
    id: "sub-2",
    email: "bruno@example.com",
    status: "authorized",
    amount: 127,
    created_at: "2026-10-01T10:00:00Z",
    activated_at: "2026-10-01T10:00:00Z",
    cancelled_at: null,
    preapproval_id: "MP-2",
    external_reference: "ref-2",
  },
  {
    id: "sub-3",
    email: "carla@example.com",
    status: "cancelled",
    amount: 127,
    created_at: "2026-08-01T10:00:00Z",
    activated_at: "2026-08-01T10:00:00Z",
    cancelled_at: "2026-11-10T10:00:00Z",
    preapproval_id: "MP-3",
    external_reference: "ref-3",
  },
  {
    id: "sub-4",
    email: "pending@example.com",
    status: "pending",
    amount: 127,
    created_at: "2026-11-20T10:00:00Z",
    activated_at: null,
    cancelled_at: null,
    preapproval_id: null,
    external_reference: "ref-4",
  },
];

describe("platform admin", () => {
  it("deriva assinantes, MRR e ARR das assinaturas ativas", () => {
    const overview = buildPlatformOverview(
      subscriptions,
      {
        periodLabel: "Novembro",
        periodStart: "2026-11-01",
        periodEnd: "2026-11-30",
      },
      [{ id: "user-1" }, { id: "user-2" }],
    );

    expect(overview.totals.active).toBe(2);
    expect(overview.totals.total).toBe(4);
    expect(overview.totals.mrr).toBe(254);
    expect(overview.totals.arr).toBe(3048);
    expect(overview.inputs.activeCustomers).toBe(2);
    expect(overview.inputs.newCustomers).toBe(1);
    expect(overview.inputs.churnedCustomers).toBe(1);
    expect(overview.metrics.arpa).toBe(127);
    expect(overview.metrics.customerChurn).toBeCloseTo(50);
  });

  it("calcula CAC, payback e LTV com os valores manuais do banco", () => {
    const overview = buildPlatformOverview(
      subscriptions,
      {
        periodLabel: "Novembro",
        periodStart: "2026-11-01",
        periodEnd: "2026-11-30",
        acquisitionSpend: 254,
        grossMarginPercent: 80,
      },
      [],
    );

    expect(overview.metrics.cac).toBe(254);
    expect(overview.metrics.cacPaybackMonths).toBeCloseTo(2.5);
    expect(overview.metrics.ltv).toBeCloseTo(203.2, 1);
  });

  it("normaliza entradas inválidas e assinaturas sem e-mail", () => {
    const inputs = normalizePlatformAdminInputs({
      mrr: -10,
      visitors: "abc",
      grossMarginPercent: 140,
      csatAverage: 9,
    });

    expect(inputs.grossMarginPercent).toBe(100);
    expect(inputs.csatAverage).toBe(5);
    expect(inputs.visitors).toBe(0);
    expect(normalizePlatformSubscription({ status: "active" })).toBeNull();
  });
});
