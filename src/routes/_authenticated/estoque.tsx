import { createFileRoute } from "@tanstack/react-router";
import { Inventory } from "@/components/mestrra/inventory";
import { useBusinessData } from "@/lib/use-business";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () =>
    routeMeta("Estoque & recursos", "Controle insumos, custos por grama e preços promocionais."),
  component: InventoryPage,
});

function InventoryPage() {
  return <Inventory data={useBusinessData()} />;
}
