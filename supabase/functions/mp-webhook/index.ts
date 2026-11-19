import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const sellerId = new URL(req.url).searchParams.get("user_id");
    const body = await req.json();
    const paymentId = body?.data?.id || body?.data?.payment_id;
    const eventType = body?.type || body?.action || "";
    if (!sellerId || !paymentId || !String(eventType).includes("payment")) {
      return new Response(JSON.stringify({ received: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: connection } = await supabase
      .from("payment_connections")
      .select("*")
      .eq("user_id", sellerId)
      .single();
    if (!connection)
      return new Response(JSON.stringify({ received: false, reason: "seller not connected" }), {
        headers: { "Content-Type": "application/json" },
      });

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${connection.access_token}` },
    });
    if (!paymentResponse.ok) {
      return new Response(JSON.stringify({ received: false, reason: "payment not found" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const payment = await paymentResponse.json();
    const orderId = payment.external_reference;
    if (!orderId)
      return new Response(JSON.stringify({ received: false }), {
        headers: { "Content-Type": "application/json" },
      });

    const { data: order } = await supabase
      .from("orders")
      .select("id,user_id,status")
      .eq("id", orderId)
      .eq("user_id", sellerId)
      .single();
    if (!order)
      return new Response(JSON.stringify({ received: false, reason: "order not found" }), {
        headers: { "Content-Type": "application/json" },
      });

    if (payment.status === "approved" && order.status === "pending") {
      const { error: processError } = await supabase.rpc("process_paid_order", {
        p_order_id: order.id,
      });
      if (processError) throw processError;
      await supabase
        .from("orders")
        .update({ mp_payment_id: String(payment.id) })
        .eq("id", order.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        received: false,
        error: error instanceof Error ? error.message : "webhook error",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
