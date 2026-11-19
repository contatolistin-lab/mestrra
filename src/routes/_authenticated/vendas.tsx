import { createFileRoute } from "@tanstack/react-router";
import { AuthenticatedShell } from "@/components/mestrra/authenticated-shell";
import { Sales } from "@/components/mestrra/sales";
import { useBusinessData } from "@/lib/use-business";
import { requireAuth } from "@/lib/require-auth";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/vendas")({
  ssr: false,
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => ({
    itemId: typeof search["itemId"] === "string" ? search["itemId"] : undefined,
  }),
  head: () =>
    routeMeta("Vendas & cobranças", "Gere cobranças, acompanhe pedidos e receba em tempo real."),
  component: () => (
    <AuthenticatedShell>
      <SalesPage />
    </AuthenticatedShell>
  ),
});

function SalesPage() {
  const { itemId } = Route.useSearch();
  return <Sales data={useBusinessData()} initialItemId={itemId} />;
}
