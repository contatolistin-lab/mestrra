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
  if (error || !data.user?.email) {
    throw new Error("Não foi possível identificar o usuário autenticado no Supabase.");
  }

  const email = data.user.email.trim().toLowerCase();
  const { data: allowed, error: allowedError } = await admin
    .from("admin_allowlist")
    .select("email")
    .eq("active", true)
    .ilike("email", email)
    .maybeSingle();
  if (allowedError) throw new Error(`Erro ao consultar a allowlist: ${allowedError.message}`);
  if (!allowed) throw new Error(`O e-mail ${email} não está liberado na allowlist administrativa.`);

  return { admin, email };
}

type AdminEmailInput = { email: string };
type AdminCredentialsInput = { email: string; password: string };

export const isPlatformAdminEmailAllowed = createServerFn({ method: "POST" })
  .validator((input: unknown): AdminEmailInput => {
    const email =
      typeof input === "object" &&
      input !== null &&
      "email" in input &&
      typeof input.email === "string"
        ? input.email.trim().toLowerCase()
        : "";
    return { email };
  })
  .handler(async ({ data }) => {
    if (!data.email) return false;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const { data: allowed, error } = await admin
      .from("admin_allowlist")
      .select("email")
      .eq("active", true)
      .ilike("email", data.email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(allowed);
  });

export const ensurePlatformAdminUser = createServerFn({ method: "POST" })
  .validator((input: unknown): AdminCredentialsInput => {
    if (
      typeof input !== "object" ||
      input === null ||
      !("email" in input) ||
      !("password" in input) ||
      typeof input.email !== "string" ||
      typeof input.password !== "string"
    ) {
      throw new Error("E-mail e senha são obrigatórios.");
    }
    return {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    };
  })
  .handler(async ({ data }) => {
    if (!data.email || data.password.length < 8) {
      throw new Error("Informe um e-mail válido e uma senha com pelo menos 8 caracteres.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const { data: allowed, error: allowedError } = await admin
      .from("admin_allowlist")
      .select("email")
      .eq("active", true)
      .ilike("email", data.email)
      .maybeSingle();
    if (allowedError) throw new Error(allowedError.message);
    if (!allowed) throw new Error("Este e-mail não está liberado para a gestão da plataforma.");

    const created = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (!created.error && created.data.user) return true;

    if (!/already registered|already been registered/i.test(created.error?.message ?? "")) {
      throw created.error ?? new Error("Não foi possível criar o acesso administrativo.");
    }

    let existingId: string | null = null;
    let page = 1;
    while (!existingId) {
      const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (usersError) throw usersError;
      const found = usersData.users.find((user) => user.email?.trim().toLowerCase() === data.email);
      if (found) {
        existingId = found.id;
        break;
      }
      if (usersData.users.length < 200) break;
      page += 1;
    }
    if (!existingId) throw new Error("Este e-mail já está cadastrado. Use Entrar.");

    const { error: updateError } = await admin.auth.admin.updateUserById(existingId, {
      password: data.password,
      email_confirm: true,
    });
    if (updateError) throw updateError;
    return true;
  });

export const getPlatformAdminDiagnostics = createServerFn({ method: "GET" }).handler(async () => {
  const hasEnv = Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]);
  if (!hasEnv) {
    return {
      env: false,
      allowlist: "variáveis ausentes",
      subscriptions: "variáveis ausentes",
      inputs: "variáveis ausentes",
      profiles: "variáveis ausentes",
    };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as SupabaseClient;
  const check = async (table: string) => {
    const { error } = await admin.from(table).select("*").limit(1);
    return error ? `ERRO: ${error.message}` : "OK";
  };

  return {
    env: true,
    allowlist: await check("admin_allowlist"),
    subscriptions: await check("platform_subscriptions"),
    inputs: await check("platform_admin_inputs"),
    profiles: await check("profiles"),
  };
});

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
