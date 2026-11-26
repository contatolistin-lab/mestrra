import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database } from "../../../src/integrations/supabase/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type MpConnection = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
};

type SupabaseClient = ReturnType<typeof createClient<Database>>;

function publicSiteUrl(req: Request) {
  const configured = Deno.env.get("SITE_URL") ?? Deno.env.get("APP_URL");
  if (configured) return new URL(configured).origin;
  const origin = req.headers.get("origin");
  return origin ? new URL(origin).origin : "";
}

async function validAccessToken(
  supabase: SupabaseClient,
  userId: string,
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
    .eq("user_id", userId);
  if (updateError) throw updateError;
  return refreshed.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) throw new Error("Sessão não encontrada.");
    const { orderId } = await req.json();
    if (!orderId) throw new Error("Pedido não informado.");

    const supabase = createClient<Database>(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) throw new Error("Usuário não autenticado.");

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", auth.user.id)
      .single();
    if (orderError || !order) throw new Error("Pedido não encontrado.");
    if (order.status !== "pending") throw new Error("Este pedido já foi pago ou cancelado.");

    const { data: connection, error: connectionError } = await supabase
      .from("payment_connections")
      .select("*")
      .eq("user_id", auth.user.id)
      .single();
    if (connectionError || !connection)
      throw new Error("Conecte sua conta Mercado Pago em Configurações antes de cobrar.");
    const accessToken = await validAccessToken(supabase, auth.user.id, connection);

    const { data: item, error: itemError } = await supabase
      .from("catalog_items")
      .select("name")
      .eq("id", order.catalog_item_id)
      .single();
    if (itemError) throw itemError;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "") ?? "";
    const notificationUrl = `${supabaseUrl}/functions/v1/mp-webhook?user_id=${auth.user.id}`;
    const siteUrl = publicSiteUrl(req);
    const checkoutBackUrl = (status: string) =>
      siteUrl ? `${siteUrl}/vendas?checkout=${status}` : "";

    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        items: [
          {
            title: item?.name || "Produto ou serviço mestrra",
            description: `Pedido mestrra ${order.id}`,
            quantity: order.quantity,
            currency_id: "BRL",
            unit_price: order.unit_price_charged,
          },
        ],
        external_reference: order.id,
        binary_mode: true,
        notification_url: notificationUrl,
        ...(siteUrl
          ? {
              back_urls: {
                success: checkoutBackUrl("aprovado"),
                pending: checkoutBackUrl("pendente"),
                failure: checkoutBackUrl("falhou"),
              },
            }
          : {}),
        metadata: { order_id: order.id, seller_id: auth.user.id },
      }),
    });
    const preference = await preferenceResponse.json();
    if (!preferenceResponse.ok || !preference.init_point) {
      throw new Error(preference.message || "Não foi possível criar a preferência de pagamento.");
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ mp_preference_id: preference.id, checkout_url: preference.init_point })
      .eq("id", order.id)
      .eq("user_id", auth.user.id);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ init_point: preference.init_point, id: preference.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Falha ao criar cobrança.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
