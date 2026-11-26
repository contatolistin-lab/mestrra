import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { deriveMpStatus } from "./mp-status";

export const getMpStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profile, connection] = await Promise.all([
      supabaseAdmin.from("profiles").select("mp_connected").eq("id", context.userId).maybeSingle(),
      supabaseAdmin
        .from("payment_connections")
        .select("access_token,refresh_token,expires_at,mp_user_id")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    if (connection.error) throw new Error(connection.error.message);
    return deriveMpStatus(!!profile.data?.mp_connected, connection.data);
  });

export const disconnectMpAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: deleteError } = await supabaseAdmin
      .from("payment_connections")
      .delete()
      .eq("user_id", context.userId);
    if (deleteError) throw new Error(deleteError.message);

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ mp_connected: false })
      .eq("id", context.userId);
    if (updateError) throw new Error(updateError.message);

    return { disconnected: true };
  });
