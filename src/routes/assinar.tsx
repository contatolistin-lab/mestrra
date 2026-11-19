import { createFileRoute } from "@tanstack/react-router";

import { SalesPage } from "@/components/mestrra/sales-page";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/assinar")({
  head: () =>
    routeMeta(
      "Assine a Mestrra",
      "Assinatura mensal da Mestrra por R$ 127: estoque, precificação, marketing, vendas e caixa em uma só esteira.",
    ),
  component: SalesPage,
});
