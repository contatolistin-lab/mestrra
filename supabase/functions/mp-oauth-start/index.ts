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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) throw new Error("Usuário não autenticado.");

    const clientId = Deno.env.get("MP_CLIENT_ID");
    const redirectUri = Deno.env.get("MP_REDIRECT_URI");
    if (!clientId || !redirectUri)
      throw new Error("Configure MP_CLIENT_ID e MP_REDIRECT_URI nas secrets do Supabase.");

    let redirectUrl: URL;
    try {
      redirectUrl = new URL(redirectUri);
    } catch {
      throw new Error("MP_REDIRECT_URI deve ser uma URL válida.");
    }
    const localHosts = ["localhost", "127.0.0.1"];
    if (
      !["https:", "http:"].includes(redirectUrl.protocol) ||
      (redirectUrl.protocol === "http:" && !localHosts.includes(redirectUrl.hostname))
    ) {
      throw new Error("MP_REDIRECT_URI deve usar HTTPS, exceto em localhost.");
    }

    const { error: cleanupError } = await supabase
      .from("oauth_states")
      .delete()
      .eq("user_id", auth.user.id);
    if (cleanupError) throw cleanupError;

    const state = crypto.randomUUID();
    const verifier = crypto.randomUUID();
    const { error } = await supabase.from("oauth_states").insert({
      state,
      user_id: auth.user.id,
      verifier,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (error) throw error;

    const authorize = new URL("https://auth.mercadopago.com.br/authorization");
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("platform_id", "mp");
    authorize.searchParams.set("redirect_uri", redirectUrl.toString());
    authorize.searchParams.set("state", state);

    return new Response(JSON.stringify({ url: authorize.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Falha ao iniciar OAuth." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
