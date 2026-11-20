import { createFileRoute } from "@tanstack/react-router";

import { SalesPage } from "@/components/mestrra/sales-page";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/assinar")({
  head: () =>
    routeMeta(
      "Plano mensal completo",
      "Conheça o plano completo da Mestrra por R$ 127/mês: estoque, precificação, marketing, vendas e caixa. Veja o que está incluído e tire suas dúvidas.",
    ),
  component: SalesPage,
});
