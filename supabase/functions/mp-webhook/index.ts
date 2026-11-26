import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database } from "../../../src/integrations/supabase/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type OrderRow = {
  id: string;
  user_id: string;
  status: string;
  stock_deducted: boolean;
  total_amount: number;
  catalog_item_id: string;
  quantity: number;
};

type MpConnection = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
};

type SupabaseClient = ReturnType<typeof createClient<Database>>;

async function validAccessToken(
  supabase: SupabaseClient,
  sellerId: string,
  connection: MpConnection,
): Promise<string> {
  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  if (expiresAt > Date.now() + 60_000) return connection.access_token;
  if (!connection.refresh_token) return connection.access_token;

  const clientId = Deno.env.get("MP_CLIENT_ID");
  const clientSecret = Deno.env.get("MP_CLIENT_SECRET");
  if (!clientId || !clientSecret)
    throw new Error("A renovação automática do Mercado Pago não está configurada.");

  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token,
    }),
  });
  const refreshed = await response.json();
  if (!response.ok || !refreshed.access_token)
    throw new Error(refreshed.message || "Não foi possível renovar o token do Mercado Pago.");

  const { error: updateError } = await supabase
    .from("payment_connections")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? connection.refresh_token,
      expires_at: new Date(Date.now() + Number(refreshed.expires_in || 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", sellerId);
  if (updateError) throw updateError;
  return refreshed.access_token;
}

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
  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
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
  if (!ts || !v1 || !dataId) {
    return { ok: false, status: 401, reason: "Assinatura ausente" };
  }

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

async function stockIsAvailable(supabase: SupabaseClient, order: OrderRow) {
  const { data: item } = await supabase
    .from("catalog_items")
    .select("item_type")
    .eq("id", order.catalog_item_id)
    .single();
  const { data: recipes } = await supabase
    .from("catalog_recipes")
    .select("inventory_item_id,quantity_used")
    .eq("catalog_item_id", order.catalog_item_id);
  if (!recipes?.length) {
    return { ok: item?.item_type !== "produto", reason: "Produto sem vínculo com o estoque" };
  }

  const ids = recipes.map((row) => String(row.inventory_item_id));
  const { data: inventory } = await supabase
    .from("inventory_items")
    .select("id,name,current_stock")
    .eq("user_id", order.user_id)
    .in("id", ids);
  const shortage = recipes
    .map((row) => {
      const entry = (inventory || []).find(
        (candidate) => String(candidate.id) === String(row.inventory_item_id),
      );
      return {
        name: String(entry?.name ?? "Item do estoque"),
        available: Number(entry?.current_stock ?? 0),
        needed: Number(row.quantity_used) * order.quantity,
      };
    })
    .filter((row) => row.available < row.needed);
  if (!shortage.length) return { ok: true, reason: "" };
  return {
    ok: false,
    reason: `Estoque insuficiente: ${shortage
      .map((row) => `${row.name} (${row.available} disponíveis; ${row.needed} necessários)`)
      .join(", ")}`,
  };
}

async function reversePaidOrder(supabase: SupabaseClient, order: OrderRow) {
  const { data: recipes } = await supabase
    .from("catalog_recipes")
    .select("inventory_item_id,quantity_used")
    .eq("catalog_item_id", order.catalog_item_id);
  for (const recipe of recipes || []) {
    const { data: stock } = await supabase
      .from("inventory_items")
      .select("current_stock")
      .eq("id", recipe.inventory_item_id)
      .eq("user_id", order.user_id)
      .single();
    if (!stock) continue;
    await supabase
      .from("inventory_items")
      .update({
        current_stock: Number(stock.current_stock) + Number(recipe.quantity_used) * order.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recipe.inventory_item_id)
      .eq("user_id", order.user_id);
  }
  await supabase.from("cashflow_transactions").insert({
    user_id: order.user_id,
    type: "saida",
    category: "outros",
    description: `Estorno do pedido ${String(order.id).slice(0, 8)}`,
    amount: Number(order.total_amount),
    transaction_date: new Date().toISOString().slice(0, 10),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const sellerId = url.searchParams.get("user_id");
    const body = await req.json();
    const dataId = url.searchParams.get("data.id") || String(body?.data?.id || "");
    const eventType = String(body?.type || body?.action || "");
    if (!sellerId || !dataId || !eventType.includes("payment")) {
      return response({ received: false, reason: "Notificação ignorada" });
    }

    const signature = await validSignature(req, dataId);
    if (!signature.ok) {
      return response({ received: false, reason: signature.reason }, signature.status);
    }

    const supabase = createClient<Database>(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: connection, error: connectionError } = await supabase
      .from("payment_connections")
      .select("*")
      .eq("user_id", sellerId)
      .single();
    if (connectionError) throw connectionError;
    if (!connection) {
      return response({ received: false, reason: "Vendedor não conectado" });
    }

    const accessToken = await validAccessToken(supabase, sellerId, connection as MpConnection);
    const paymentId = dataId;
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!paymentResponse.ok) {
      return response({ received: false, reason: "Pagamento não encontrado" }, 502);
    }
    const payment = await paymentResponse.json();
    const orderId = String(payment.external_reference || "");
    if (!orderId) return response({ received: true });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,user_id,status,stock_deducted,total_amount,catalog_item_id,quantity")
      .eq("id", orderId)
      .eq("user_id", sellerId)
      .single();
    if (orderError) throw orderError;
    if (!order) return response({ received: false, reason: "Pedido não encontrado" });

    const status = String(payment.status || "").toLowerCase();
    const paidAmount = Number(
      payment.transaction_amount ?? payment.transaction_details?.total_paid_amount ?? 0,
    );

    if (status === "approved" && order.status === "pending" && !order.stock_deducted) {
      if (
        !Number.isFinite(paidAmount) ||
        Math.abs(paidAmount - Number(order.total_amount)) > 0.01
      ) {
        return response({ received: false, reason: "Valor pago diverge do pedido" }, 400);
      }
      const stock = await stockIsAvailable(supabase, order as OrderRow);
      if (!stock.ok) return response({ received: false, reason: stock.reason }, 500);
      const { error: processError } = await supabase.rpc("process_paid_order", {
        p_order_id: order.id,
      });
      if (processError) throw processError;
      const { error: updateError } = await supabase
        .from("orders")
        .update({ mp_payment_id: String(payment.id) })
        .eq("id", order.id);
      if (updateError) throw updateError;
      return response({ received: true });
    }

    if (["rejected", "cancelled"].includes(status) && order.status === "pending") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "cancelled", mp_payment_id: String(payment.id) })
        .eq("id", order.id);
      if (updateError) throw updateError;
      return response({ received: true });
    }

    if (["charged_back", "refunded"].includes(status) && order.status === "paid") {
      await reversePaidOrder(supabase, order as OrderRow);
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "cancelled", mp_payment_id: String(payment.id) })
        .eq("id", order.id);
      if (updateError) throw updateError;
      return response({ received: true });
    }

    return response({ received: true });
  } catch (error) {
    return response(
      {
        received: false,
        error: error instanceof Error ? error.message : "Falha ao processar notificação",
      },
      500,
    );
  }
});
