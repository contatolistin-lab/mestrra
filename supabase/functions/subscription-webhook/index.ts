import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const response = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function constantTimeEquals(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

async function validSignature(req: Request, dataId: string) {
  const secret = Deno.env.get("MP_SUBSCRIPTION_WEBHOOK_SECRET") ?? Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secret) return { ok: false, status: 500, reason: "Segredo do webhook não configurado" };

  const parts = Object.fromEntries(
    (req.headers.get("x-signature") || "")
      .split(",")
      .map((part) => part.split("=").map((value) => value.trim()))
      .filter((pair) => pair.length === 2),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  const requestId = req.headers.get("x-request-id") || "";
  if (!ts || !v1 || !dataId) return { ok: false, status: 401, reason: "Assinatura ausente" };

  const rawTimestamp = Number(ts);
  const timestampMs = rawTimestamp < 1_000_000_000_000 ? rawTimestamp * 1000 : rawTimestamp;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 15 * 60 * 1000) {
    return { ok: false, status: 401, reason: "Assinatura expirada" };
  }

  const manifest = `id:${dataId.toLowerCase()};${
    requestId ? `request-id:${requestId};` : ""
  }ts:${ts};`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const expected = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  if (!constantTimeEquals(expected, v1.toLowerCase())) {
    return { ok: false, status: 401, reason: "Assinatura inválida" };
  }
  return { ok: true, status: 200, reason: "" };
}

function normalizeStatus(value: unknown) {
  const status = String(value || "").toLowerCase();
  if (["authorized", "active", "approved", "confirmed", "paid"].includes(status)) return "active";
  if (["cancelled", "canceled"].includes(status)) return "cancelled";
  if (status === "expired") return "expired";
  if (status === "failed" || status === "rejected") return "failed";
  return "pending";
}

function payerName(payload: Record<string, unknown>) {
  const payer = payload["payer"];
  if (!payer || typeof payer !== "object") return null;
  const record = payer as Record<string, unknown>;
  const firstName = String(record["first_name"] || "").trim();
  const lastName = String(record["last_name"] || "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const body = await req.json();
    const dataId = url.searchParams.get("data.id") || String(body?.data?.id || "");
    const eventType = String(body?.type || body?.action || "");
    const isPreapproval = eventType.includes("preapproval");
    const isAuthorizedPayment = eventType.includes("authorized_payment");
    if (!dataId || (!isPreapproval && !isAuthorizedPayment)) {
      return response({ received: false, reason: "Notificação ignorada" });
    }

    const signature = await validSignature(req, dataId);
    if (!signature.ok) {
      return response({ received: false, reason: signature.reason }, signature.status);
    }

    const accessToken = Deno.env.get("MP_PLATFORM_ACCESS_TOKEN") ?? Deno.env.get("MP_ACCESS_TOKEN");
    if (!accessToken) {
      return response({ received: false, reason: "Token da plataforma não configurado" }, 500);
    }

    const endpoint = isPreapproval
      ? `https://api.mercadopago.com/preapproval/${dataId}`
      : `https://api.mercadopago.com/authorized_payment/${dataId}`;
    const mpResponse = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mpResponse.ok) {
      return response({ received: false, reason: "Assinatura não encontrada" }, 502);
    }
    const payload = (await mpResponse.json()) as Record<string, unknown>;
    const externalReference = String(payload["external_reference"] || "");
    const preapprovalId = isPreapproval
      ? String(payload["id"] || dataId)
      : String(payload["preapproval_id"] || "");
    const status = normalizeStatus(payload["status"]);
    const autoRecurring = payload["auto_recurring"];
    const amountSource =
      autoRecurring && typeof autoRecurring === "object"
        ? (autoRecurring as Record<string, unknown>)["transaction_amount"]
        : payload["transaction_amount"];
    const amount = Number(amountSource || 0);
    const email = String(payload["payer_email"] || "")
      .trim()
      .toLowerCase();
    const name = payerName(payload);
    const now = new Date().toISOString();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: byPreapproval, error: preapprovalError } = preapprovalId
      ? await supabase
          .from("platform_subscriptions")
          .select("id")
          .eq("preapproval_id", preapprovalId)
          .maybeSingle()
      : { data: null, error: null };
    if (preapprovalError) throw preapprovalError;

    const { data: byReference, error: referenceError } = externalReference
      ? await supabase
          .from("platform_subscriptions")
          .select("id")
          .eq("external_reference", externalReference)
          .maybeSingle()
      : { data: null, error: null };
    if (referenceError) throw referenceError;

    const update = {
      status,
      ...(preapprovalId ? { preapproval_id: preapprovalId } : {}),
      payer_name: name,
      ...(amount > 0 ? { amount } : {}),
      ...(email ? { email } : {}),
      last_webhook_at: now,
      updated_at: now,
      ...(status === "active" ? { activated_at: now, cancelled_at: null } : {}),
      ...(status === "cancelled" || status === "expired" ? { cancelled_at: now } : {}),
      ...(isAuthorizedPayment ? { last_payment_at: now } : {}),
    };

    if (byPreapproval || byReference) {
      const id = String((byPreapproval ?? byReference)?.id);
      const { error } = await supabase.from("platform_subscriptions").update(update).eq("id", id);
      if (error) throw error;
      return response({ received: true });
    }

    const { error } = await supabase.from("platform_subscriptions").insert({
      external_reference: externalReference || `mp-${preapprovalId || dataId}-${Date.now()}`,
      preapproval_id: preapprovalId || null,
      email: email || "desconhecido@mercadopago.local",
      payer_name: name,
      status,
      amount: amount > 0 ? amount : 0,
      currency: "BRL",
      last_webhook_at: now,
      updated_at: now,
      ...(status === "active" ? { activated_at: now } : {}),
      ...(status === "cancelled" || status === "expired" ? { cancelled_at: now } : {}),
      ...(isAuthorizedPayment ? { last_payment_at: now } : {}),
    });
    if (error) throw error;
    return response({ received: true });
  } catch (error) {
    return response(
      {
        received: false,
        error: error instanceof Error ? error.message : "Falha ao processar assinatura",
      },
      500,
    );
  }
});
