import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { SUBSCRIPTION_PRICE, SUBSCRIPTION_REASON } from "@/lib/subscription";

const checkoutInput = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});

type MercadoPagoSubscription = {
  init_point?: unknown;
  id?: unknown;
};

function resolveSiteUrl() {
  const configured = process.env["SITE_URL"] ?? process.env["APP_URL"];
  if (configured) return new URL(configured).origin;

  const request = getRequest();
  if (request) return new URL(request.url).origin;

  return "http://localhost:3000";
}

function normalizeCheckoutUrl(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("O Mercado Pago não retornou o link de checkout da assinatura.");
  }
  const withProtocol = value.startsWith("http") ? value : `https://${value}`;
  const url = new URL(withProtocol);
  const allowedHosts = new Set([
    "mercadopago.com",
    "www.mercadopago.com",
    "mercadopago.com.br",
    "www.mercadopago.com.br",
    "sandbox.mercadopago.com.br",
  ]);
  if (!allowedHosts.has(url.hostname)) {
    throw new Error("Link de checkout inválido retornado pelo Mercado Pago.");
  }
  return url.toString();
}

export const createSubscriptionCheckout = createServerFn({ method: "POST" })
  .validator((input: unknown) => checkoutInput.parse(input))
  .handler(async ({ data }) => {
    const accessToken = process.env["MP_ACCESS_TOKEN"] ?? process.env["MP_PLATFORM_ACCESS_TOKEN"];

    if (!accessToken) {
      throw new Error(
        "Checkout Mercado Pago não configurado. Defina MP_ACCESS_TOKEN no ambiente do servidor.",
      );
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const externalReference = crypto.randomUUID();
    const { error: createError } = await admin.from("platform_subscriptions").insert({
      email: data.email,
      external_reference: externalReference,
      status: "pending",
      amount: SUBSCRIPTION_PRICE,
      currency: "BRL",
    });
    if (createError) throw new Error(createError.message);

    const siteUrl = resolveSiteUrl();
    const supabaseUrl = process.env["SUPABASE_URL"];
    const notificationUrl = supabaseUrl
      ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/subscription-webhook`
      : undefined;
    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: SUBSCRIPTION_REASON,
        external_reference: externalReference,
        payer_email: data.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: SUBSCRIPTION_PRICE,
          currency_id: "BRL",
        },
        back_url: new URL("/assinar?checkout=concluido", siteUrl).toString(),
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      }),
    });

    const payload = (await response.json().catch(() => null)) as MercadoPagoSubscription | null;

    if (!response.ok) {
      await admin
        .from("platform_subscriptions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("external_reference", externalReference);
      const message =
        payload && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : `Não foi possível abrir o checkout do Mercado Pago (${response.status}).`;
      throw new Error(message);
    }

    let checkoutUrl: string;
    try {
      checkoutUrl = normalizeCheckoutUrl(payload?.init_point);
    } catch (error) {
      await admin
        .from("platform_subscriptions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("external_reference", externalReference);
      throw error;
    }
    const subscriptionId = typeof payload?.id === "string" ? payload.id : null;
    const { error: updateError } = await admin
      .from("platform_subscriptions")
      .update({
        preapproval_id: subscriptionId,
        checkout_url: checkoutUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("external_reference", externalReference);
    if (updateError) throw new Error(updateError.message);

    return { checkoutUrl, subscriptionId, externalReference };
  });
