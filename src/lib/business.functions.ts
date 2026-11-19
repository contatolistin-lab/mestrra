import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const results = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("inventory_items").select("*").eq("user_id", userId).order("name"),
      supabase
        .from("catalog_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("catalog_recipes").select("*"),
      supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("cashflow_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false }),
    ]);
    for (const result of results) if (result.error) throw new Error(result.error.message);
    return {
      profile: results[0].data,
      inventory: results[1].data || [],
      catalog: results[2].data || [],
      recipes: results[3].data || [],
      orders: results[4].data || [],
      cash: results[5].data || [],
      userId,
    };
  });
export type BusinessData = Awaited<ReturnType<typeof getBusiness>>;
