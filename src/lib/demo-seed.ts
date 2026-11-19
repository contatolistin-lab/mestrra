import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export async function seedDemoData(userId: string) {
  const now = new Date().toISOString();
  const inventory: TablesInsert<"inventory_items">[] = [
    {
      user_id: userId,
      name: "Chocolate meio amargo",
      category: "materia_prima",
      unit_type: "g",
      package_quantity: 1000,
      regular_price: 42,
      promo_price: 34.9,
      is_promo_active: true,
      current_stock: 2800,
      min_stock_alert: 1000,
      supplier_name: "Distribuidora Cacau",
    },
    {
      user_id: userId,
      name: "Caixa kraft · 6 unidades",
      category: "embalagem",
      unit_type: "un",
      package_quantity: 50,
      regular_price: 85,
      current_stock: 18,
      min_stock_alert: 20,
      supplier_name: "Embalagens & Cia",
    },
    {
      user_id: userId,
      name: "Leite condensado",
      category: "materia_prima",
      unit_type: "g",
      package_quantity: 395,
      regular_price: 7.9,
      promo_price: 6.49,
      is_promo_active: true,
      current_stock: 3160,
      min_stock_alert: 800,
      supplier_name: "Atacadão",
    },
    {
      user_id: userId,
      name: "Luvas descartáveis",
      category: "material_servico",
      unit_type: "un",
      package_quantity: 100,
      regular_price: 35,
      current_stock: 12,
      min_stock_alert: 20,
      supplier_name: "Central de Materiais",
    },
    {
      user_id: userId,
      name: "Creme de leite",
      category: "materia_prima",
      unit_type: "g",
      package_quantity: 200,
      regular_price: 3.9,
      current_stock: 1800,
      min_stock_alert: 400,
      supplier_name: "Atacadão",
    },
  ];
  const insertedInventory = await supabase.from("inventory_items").insert(inventory).select();
  if (insertedInventory.error) throw insertedInventory.error;
  const stock = insertedInventory.data || [];

  const catalog: TablesInsert<"catalog_items">[] = [
    {
      user_id: userId,
      item_type: "produto",
      name: "Caixa de brownies",
      description: "6 brownies artesanais de chocolate",
      target_audience: "amantes de chocolate e presentes especiais",
      main_benefit: "um momento de pausa delicioso",
      pain_point_solved: "presentes sem personalidade",
      execution_minutes: 30,
      labor_cost: 10,
      materials_cost: 9,
      fixed_cost_allocation: 0.7,
      total_unit_cost: 19.7,
      desired_margin_percent: 50,
      platform_tax_percent: 4.99,
      suggested_price: 48,
      promo_sale_price: 39.9,
      is_promo_sale_active: true,
    },
    {
      user_id: userId,
      item_type: "produto",
      name: "Brigadeiros gourmet",
      description: "Caixa com 9 brigadeiros",
      target_audience: "pessoas que amam doces artesanais",
      main_benefit: "adoçar momentos especiais",
      pain_point_solved: "doces sem qualidade",
      execution_minutes: 25,
      labor_cost: 8,
      materials_cost: 4.4,
      fixed_cost_allocation: 0.6,
      total_unit_cost: 12.4,
      desired_margin_percent: 50,
      platform_tax_percent: 4.99,
      suggested_price: 32,
    },
    {
      user_id: userId,
      item_type: "servico",
      name: "Consultoria express",
      description: "Uma hora para organizar seu negócio",
      target_audience: "empreendedores que estão começando",
      main_benefit: "clareza para dar o próximo passo",
      pain_point_solved: "falta de direção",
      execution_minutes: 60,
      labor_cost: 62.5,
      materials_cost: 0,
      fixed_cost_allocation: 3.1,
      total_unit_cost: 65.6,
      desired_margin_percent: 50,
      platform_tax_percent: 4.99,
      suggested_price: 150,
    },
  ];
  const insertedCatalog = await supabase.from("catalog_items").insert(catalog).select();
  if (insertedCatalog.error) throw insertedCatalog.error;
  const items = insertedCatalog.data || [];

  const firstItem = items[0];
  const firstStock = stock[0];
  if (firstItem && firstStock) {
    const recipe = await supabase.from("catalog_recipes").insert({
      catalog_item_id: firstItem.id,
      inventory_item_id: firstStock.id,
      quantity_used: 150,
    });
    if (recipe.error) throw recipe.error;
  }

  const names = [
    "Mariana Silva",
    "Pedro Santos",
    "Juliana Costa",
    "Ana Oliveira",
    "Rafael Lima",
    "Camila Souza",
  ];
  const orders: TablesInsert<"orders">[] = Array.from({ length: 9 }, (_, index) => {
    const item = items[index % Math.max(items.length, 1)] || firstItem;
    const price = item?.suggested_price || 48;
    const quantity = (index % 3) + 1;
    return {
      user_id: userId,
      catalog_item_id: item?.id || "",
      customer_name: names[index % names.length] || "Cliente",
      quantity,
      unit_price_charged: price,
      total_amount: price * quantity,
      total_cost_snapshot: (item?.total_unit_cost || 19.7) * quantity,
      payment_method:
        index % 3 === 0 ? "mp_checkout_pro" : index % 3 === 1 ? "manual_pix" : "manual_dinheiro",
      status: index === 0 ? "pending" : "paid",
    };
  });
  const insertedOrders = await supabase.from("orders").insert(orders);
  if (insertedOrders.error) throw insertedOrders.error;

  const expenses: TablesInsert<"cashflow_transactions">[] = [
    {
      user_id: userId,
      type: "saida",
      category: "custo_fixo",
      description: "Aluguel do espaço",
      amount: 450,
      transaction_date: now.slice(0, 10),
    },
    {
      user_id: userId,
      type: "saida",
      category: "custo_fixo",
      description: "Energia elétrica",
      amount: 180,
      transaction_date: now.slice(0, 10),
    },
    {
      user_id: userId,
      type: "saida",
      category: "marketing",
      description: "Impulsionamento de posts",
      amount: 120,
      transaction_date: now.slice(0, 10),
    },
  ];
  const insertedExpenses = await supabase.from("cashflow_transactions").insert(expenses);
  if (insertedExpenses.error) throw insertedExpenses.error;

  const profile = await supabase
    .from("profiles")
    .update({
      business_name: "Doce Atelier",
      business_type: "hibrido",
      monthly_income_goal: 10000,
      monthly_work_hours: 160,
      monthly_fixed_costs: 850,
      hourly_rate: 62.5,
    })
    .eq("id", userId);
  if (profile.error) throw profile.error;
}
