import { createFileRoute } from "@tanstack/react-router";
import { Copiloto } from "@/components/mestrra/copiloto";
import { useBusinessData } from "@/lib/use-business";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/copiloto")({
  validateSearch: (search: Record<string, unknown>) => ({
    itemId: typeof search["itemId"] === "string" ? search["itemId"] : undefined,
  }),
  head: () =>
    routeMeta(
      "Copiloto de marketing",
      "Crie conteúdos e scripts de venda a partir do seu catálogo.",
    ),
  component: CopilotoPage,
});

function CopilotoPage() {
  const { itemId } = Route.useSearch();
  return <Copiloto data={useBusinessData()} initialItemId={itemId} />;
}
