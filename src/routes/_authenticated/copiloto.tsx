import { createFileRoute } from "@tanstack/react-router";
import { AuthenticatedShell } from "@/components/mestrra/authenticated-shell";
import { Copiloto } from "@/components/mestrra/copiloto";
import { useBusinessData } from "@/lib/use-business";
import { requireAuth } from "@/lib/require-auth";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/copiloto")({
  ssr: false,
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => ({
    itemId: typeof search["itemId"] === "string" ? search["itemId"] : undefined,
  }),
  head: () =>
    routeMeta(
      "Copiloto de marketing",
      "Organize campanhas, uma semana de conteúdo, respostas a clientes e seu perfil comercial com os dados do seu catálogo Mestrra.",
    ),
  component: () => (
    <AuthenticatedShell>
      <CopilotoPage />
    </AuthenticatedShell>
  ),
});

function CopilotoPage() {
  const { itemId } = Route.useSearch();
  return <Copiloto data={useBusinessData()} initialItemId={itemId} />;
}
