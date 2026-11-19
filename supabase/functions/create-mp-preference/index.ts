import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function validAccessToken(connection: MpConnection): Promise<string> {
  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  if (expiresAt > Date.now() + 60_000) return connection.access_token;
  if (!connection.refresh_token) return connection.access_token;
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: Deno.env.get("MP_CLIENT_ID"),
      client_secret: Deno.env.get("MP_CLIENT_SECRET"),
      refresh_token: connection.refresh_token,
    }),
  });
  const refreshed = await response.json();
  if (!response.ok || !refreshed.access_token)
    throw new Error(refreshed.message || "Não foi possível renovar o token do Mercado Pago.");
  return refreshed.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) throw new Error("Sessão não encontrada.");
    const { orderId } = await req.json();
    if (!orderId) throw new Error("Pedido não informado.");

    const supabase = createClient(
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
    const accessToken = await validAccessToken(connection);

    const { data: item } = await supabase
      .from("catalog_items")
      .select("name")
      .eq("id", order.catalog_item_id)
      .single();
    const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook?user_id=${auth.user.id}`;
    const backUrl = Deno.env.get("MP_REDIRECT_URI") || "";

    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        items: [
          {
            title: item?.name || "Produto ou serviço Mestrra",
            description: `Pedido Mestrra ${order.id}`,
            quantity: order.quantity,
            currency_id: "BRL",
            unit_price: order.unit_price_charged,
          },
        ],
        external_reference: order.id,
        binary_mode: true,
        notification_url: notificationUrl,
        back_urls: { success: backUrl, pending: backUrl, failure: backUrl },
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
      .eq("id", order.id);
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
