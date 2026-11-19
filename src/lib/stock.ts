import type { BusinessData } from "./business.functions";

type StockSource = Pick<BusinessData, "recipes" | "inventory">;

export function requiredStock(source: StockSource, catalogItemId: string, quantity: number) {
  return source.recipes
    .filter((recipe) => recipe.catalog_item_id === catalogItemId)
    .map((recipe) => {
      const item = source.inventory.find((entry) => entry.id === recipe.inventory_item_id);
      return item
        ? {
            id: item.id,
            name: item.name,
            unit: item.unit_type,
            available: item.current_stock,
            needed: recipe.quantity_used * quantity,
          }
        : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);
}

export function stockShortageMessage(
  rows: { name: string; available: number; needed: number; unit: string }[],
) {
  if (!rows.length) return null;
  return (
    "Estoque insuficiente: " +
    rows
      .map(
        (entry) =>
          `${entry.name} (${entry.available} ${entry.unit} disponíveis; ${entry.needed} ${entry.unit} necessários)`,
      )
      .join(", ")
  );
}
