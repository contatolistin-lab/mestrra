import { createFileRoute } from "@tanstack/react-router";
import { AuthenticatedShell } from "@/components/mestrra/authenticated-shell";
import { Inventory } from "@/components/mestrra/inventory";
import { useBusinessData } from "@/lib/use-business";
import { requireAuth } from "@/lib/require-auth";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/estoque")({
  ssr: false,
  beforeLoad: requireAuth,
  head: () =>
    routeMeta("Estoque & recursos", "Controle insumos, custos por grama e preços promocionais."),
  component: () => (
    <AuthenticatedShell>
      <InventoryPage />
    </AuthenticatedShell>
  ),
});

function InventoryPage() {
  return <Inventory data={useBusinessData()} />;
}
