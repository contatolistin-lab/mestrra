import { describe, expect, it } from "vitest";
import { deriveMpStatus } from "@/lib/mp-status";

describe("status da conexão Mercado Pago", () => {
  const now = new Date("2026-11-26T12:00:00Z").getTime();

  it("não considera conectado sem payment_connections", () => {
    expect(deriveMpStatus(true, null, now).connected).toBe(false);
    expect(deriveMpStatus(true, null, now).flagOutOfSync).toBe(true);
  });

  it("considera conectado quando há access_token", () => {
    const status = deriveMpStatus(
      true,
      {
        access_token: "token",
        expires_at: new Date(now + 3_600_000).toISOString(),
        refresh_token: "refresh",
        mp_user_id: "mp-1",
      },
      now,
    );
    expect(status.connected).toBe(true);
    expect(status.flagOutOfSync).toBe(false);
    expect(status.needsAttention).toBe(false);
    expect(status.accountId).toBe("mp-1");
  });

  it("sinaliza atenção quando o token venceu sem refresh", () => {
    const status = deriveMpStatus(
      true,
      {
        access_token: "token",
        expires_at: new Date(now - 1_000).toISOString(),
        refresh_token: null,
      },
      now,
    );
    expect(status.needsAttention).toBe(true);
  });
});
