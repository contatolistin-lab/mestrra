import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildPlatformOverview,
  normalizePlatformAdminInputs,
  type PlatformAdminInputs,
} from "@/lib/platform-admin";

async function requirePlatformAdmin(context: { userId: string }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as SupabaseClient;
  const { data, error } = await admin.auth.admin.getUserById(context.userId);
  if (error || !data.user?.email) throw new Error("Acesso administrativo negado.");

  const email = data.user.email.trim().toLowerCase();
  const { data: allowed, error: allowedError } = await admin
    .from("admin_allowlist")
    .select("email")
    .eq("active", true)
    .ilike("email", email)
    .maybeSingle();
  if (allowedError || !allowed) throw new Error("Acesso administrativo negado.");

  return { admin, email };
}

export const checkPlatformAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePlatformAdmin(context);
    return true;
  });

export const getPlatformOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await requirePlatformAdmin(context);
    const [subscriptions, inputs, profiles] = await Promise.all([
      admin.from("platform_subscriptions").select("*").order("created_at", { ascending: false }),
      admin.from("platform_admin_inputs").select("*").eq("id", 1).maybeSingle(),
      admin.from("profiles").select("id,created_at,business_name").order("created_at"),
    ]);
    if (subscriptions.error) throw new Error(subscriptions.error.message);
    if (inputs.error) throw new Error(inputs.error.message);
    if (profiles.error) throw new Error(profiles.error.message);

    return buildPlatformOverview(subscriptions.data ?? [], inputs.data ?? {}, profiles.data ?? []);
  });

export const savePlatformAdminInputs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown): PlatformAdminInputs => normalizePlatformAdminInputs(input))
  .handler(async ({ context, data }) => {
    const { admin } = await requirePlatformAdmin(context);
    const { error } = await admin.from("platform_admin_inputs").upsert({
      id: 1,
      period_label: data.periodLabel,
      period_start: data.periodStart,
      period_end: data.periodEnd,
      expansion_mrr: data.expansionMrr,
      contraction_mrr: data.contractionMrr,
      acquisition_spend: data.acquisitionSpend,
      visitors: data.visitors,
      trials: data.trials,
      converted_trials: data.convertedTrials,
      gross_margin_percent: data.grossMarginPercent,
      cash_balance: data.cashBalance,
      monthly_revenue: data.monthlyRevenue,
      monthly_expenses: data.monthlyExpenses,
      dau: data.dau,
      mau: data.mau,
      ttv_days: data.ttvDays,
      nps_promoters: data.npsPromoters,
      nps_passives: data.npsPassives,
      nps_detractors: data.npsDetractors,
      csat_average: data.csatAverage,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return data;
  });
