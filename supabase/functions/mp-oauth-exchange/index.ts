import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) throw new Error("Sessão não encontrada.");

    const { code, state } = await req.json();
    if (!code) throw new Error("Código de autorização ausente.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) throw new Error("Usuário não autenticado.");

    const { data: savedState, error: stateError } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", state || "")
      .eq("user_id", auth.user.id)
      .single();
    if (stateError || !savedState || new Date(savedState.expires_at) < new Date()) {
      throw new Error("Solicitação de conexão inválida ou expirada. Tente novamente.");
    }

    const clientId = Deno.env.get("MP_CLIENT_ID");
    const clientSecret = Deno.env.get("MP_CLIENT_SECRET");
    const redirectUri = Deno.env.get("MP_REDIRECT_URI");
    if (!clientId || !clientSecret || !redirectUri)
      throw new Error("Secrets do Mercado Pago não configuradas.");

    const response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const credentials = await response.json();
    if (!response.ok || !credentials.access_token) {
      throw new Error(credentials.message || "Não foi possível trocar o código pelos tokens.");
    }

    let publicKey: string | null =
      typeof credentials.public_key === "string" ? credentials.public_key : null;
    const settingsResponse = await fetch("https://api.mercadopago.com/v1/account/settings", {
      headers: { Authorization: `Bearer ${credentials.access_token}` },
    });
    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      publicKey = publicKey || settings.public_key || null;
    }

    const { error: stateDeleteError } = await supabase
      .from("oauth_states")
      .delete()
      .eq("state", savedState.state);
    if (stateDeleteError) throw stateDeleteError;

    const { error: connectionError } = await supabase.from("payment_connections").upsert({
      user_id: auth.user.id,
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token ?? null,
      mp_user_id: credentials.user_id ? String(credentials.user_id) : null,
      public_key: publicKey,
      expires_at: new Date(
        Date.now() + Number(credentials.expires_in || 3600) * 1000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (connectionError) throw connectionError;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ mp_connected: true })
      .eq("id", auth.user.id);
    if (profileError) throw profileError;

    return new Response(JSON.stringify({ connected: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Falha ao conectar." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
