import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database } from "../../../src/integrations/supabase/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type OrderBody = {
  itemId: string;
  customer: string;
  whatsapp: string;
  quantity: number;
  unitPrice: number;
  promo: boolean;
  method: "manual_pix" | "manual_dinheiro" | "manual_cartao" | "mp_checkout_pro";
};

type Requirement = { id: string; name: string; available: number; needed: number };

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const response = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const applied: Requirement[] = [];
  let userId = "";

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return response({ error: "Sessão não encontrada." }, 401);

    const body = (await req.json()) as OrderBody;
    const quantity = Number(body.quantity);
    const unitPrice = round2(Number(body.unitPrice));
    const methods = ["manual_pix", "manual_dinheiro", "manual_cartao", "mp_checkout_pro"];
    if (
      !body.itemId ||
      !body.customer?.trim() ||
      body.customer.trim().length > 200 ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100000 ||
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0 ||
      !methods.includes(body.method)
    ) {
      return response({ error: "Dados da venda inválidos." }, 400);
    }

    const supabase = createClient<Database>(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return response({ error: "Usuário não autenticado." }, 401);
    userId = auth.user.id;

    const { data: item, error: itemError } = await supabase
      .from("catalog_items")
      .select("id,name,item_type,active,suggested_price,promo_sale_price,total_unit_cost")
      .eq("id", body.itemId)
      .eq("user_id", userId)
      .eq("active", true)
      .single();
    if (itemError || !item) return response({ error: "Produto não encontrado ou inativo." }, 404);

    const displayedPrice =
      body.promo && Number(item.promo_sale_price) > 0
        ? Number(item.promo_sale_price)
        : Number(item.suggested_price);
    if (unitPrice > displayedPrice + 0.01) {
      return response({ error: "O preço da venda não pode ser maior que o preço exibido." }, 400);
    }

    const { data: recipes, error: recipesError } = await supabase
      .from("catalog_recipes")
      .select("inventory_item_id,quantity_used")
      .eq("catalog_item_id", item.id);
    if (recipesError) throw recipesError;
    if (item.item_type === "produto" && !recipes?.length) {
      return response(
        { error: "Este produto ainda não está vinculado ao estoque. Precifique-o novamente." },
        400,
      );
    }

    const requirements: Requirement[] = [];
    if (recipes?.length) {
      const ids = recipes.map((row) => String(row.inventory_item_id));
      const { data: inventory, error: inventoryError } = await supabase
        .from("inventory_items")
        .select("id,name,current_stock")
        .eq("user_id", userId)
        .in("id", ids);
      if (inventoryError) throw inventoryError;
      requirements.push(
        ...recipes.map((row) => {
          const stock = (inventory || []).find(
            (entry) => String(entry.id) === String(row.inventory_item_id),
          );
          return {
            id: String(row.inventory_item_id),
            name: String(stock?.name ?? "Item do estoque"),
            available: Number(stock?.current_stock ?? 0),
            needed: Number(row.quantity_used) * quantity,
          };
        }),
      );
      const shortage = requirements.filter((row) => row.available < row.needed);
      if (shortage.length) {
        return response(
          {
            error: `Estoque insuficiente: ${shortage
              .map((row) => `${row.name} (${row.available} disponíveis; ${row.needed} necessários)`)
              .join(", ")}`,
          },
          400,
        );
      }
    }

    const isPaid = body.method !== "mp_checkout_pro";
    if (isPaid) {
      for (const row of requirements) {
        const { data: updated, error: updateError } = await supabase
          .from("inventory_items")
          .update({
            current_stock: row.available - row.needed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("user_id", userId)
          .gte("current_stock", row.needed)
          .select("id");
        if (updateError || !updated?.length) {
          await rollbackStock(supabase, userId, applied);
          return response({ error: `Estoque insuficiente para ${row.name}.` }, 400);
        }
        applied.push(row);
      }
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        catalog_item_id: item.id,
        customer_name: body.customer.trim(),
        customer_whatsapp: body.whatsapp?.trim() || null,
        quantity,
        unit_price_charged: unitPrice,
        total_amount: round2(unitPrice * quantity),
        total_cost_snapshot: round2(Number(item.total_unit_cost || 0) * quantity),
        payment_method: body.method,
        status: isPaid ? "paid" : "pending",
        stock_deducted: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (orderError || !order) {
      await rollbackStock(supabase, userId, applied);
      throw orderError || new Error("Não foi possível criar o pedido.");
    }

    if (isPaid) {
      const { error: cashError } = await supabase.from("cashflow_transactions").insert({
        user_id: userId,
        order_id: order.id,
        type: "entrada",
        category: item.item_type === "produto" ? "venda_produto" : "venda_servico",
        description: `${String(item.name)} · ${body.customer.trim()}`,
        amount: round2(unitPrice * quantity),
        transaction_date: new Date().toISOString().slice(0, 10),
      });
      if (cashError) {
        await supabase.from("orders").delete().eq("id", order.id).eq("user_id", userId);
        await rollbackStock(supabase, userId, applied);
        throw cashError;
      }
    }

    return response({ orderId: String(order.id) });
  } catch (error) {
    if (userId && applied.length) {
      const supabase = createClient<Database>(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await rollbackStock(supabase, userId, applied);
    }
    return response(
      { error: error instanceof Error ? error.message : "Não foi possível registrar a venda." },
      500,
    );
  }
});

async function rollbackStock(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  rows: Requirement[],
) {
  for (const row of rows) {
    await supabase
      .from("inventory_items")
      .update({ current_stock: row.available })
      .eq("id", row.id)
      .eq("user_id", userId);
  }
  rows.length = 0;
}
