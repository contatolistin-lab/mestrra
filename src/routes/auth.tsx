import { createFileRoute } from "@tanstack/react-router";
import { Auth } from "@/components/mestrra/auth";
import { routeMeta } from "@/lib/mestrra";
export const Route = createFileRoute("/auth")({
  head: () =>
    routeMeta(
      "Entre no seu negócio",
      "Acesse ou crie sua conta na Mestrra para conectar estoque, preços, vendas e caixa.",
    ),
  component: Auth,
});
