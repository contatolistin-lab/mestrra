import type { BusinessData } from "./business.functions";
import { demoBusiness } from "./demo";

let state: BusinessData = demoBusiness();

export function getDemoData(): BusinessData {
  return state;
}

export function resetDemoData(): BusinessData {
  state = demoBusiness();
  return state;
}

export function applyDemoSale(input: { itemId: string; quantity: number }): string {
  const recipes = state.recipes.filter((row) => row.catalog_item_id === input.itemId);
  for (const recipe of recipes) {
    const item = state.inventory.find((entry) => entry.id === recipe.inventory_item_id);
    if (!item || item.current_stock < recipe.quantity_used * input.quantity) {
      throw new Error("Estoque insuficiente no modo demo.");
    }
  }
  for (const recipe of recipes) {
    const item = state.inventory.find((entry) => entry.id === recipe.inventory_item_id);
    if (item) item.current_stock -= recipe.quantity_used * input.quantity;
  }
  return `demo-${Date.now()}`;
}

export function applyDemoRestock(input: { id: string; quantity: number; promo: boolean }) {
  const item = state.inventory.find((entry) => entry.id === input.id);
  if (!item) return;
  item.current_stock += input.quantity;
  item.is_promo_active = input.promo;
}
