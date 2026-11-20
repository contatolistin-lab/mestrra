import { createFileRoute } from "@tanstack/react-router";
import { Auth, type AuthMode } from "@/components/mestrra/auth";
import { routeMeta } from "@/lib/mestrra";
export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: AuthMode } => {
    const mode = search["mode"];
    return { mode: mode === "signup" || mode === "forgot" ? mode : "login" };
  },
  head: () =>
    routeMeta(
      "Entre no seu negócio",
      "Acesse ou crie sua conta na mestrra para conectar estoque, preços, vendas e caixa.",
    ),
  component: AuthPage,
});

function AuthPage() {
  return <Auth initialMode={Route.useSearch().mode} />;
}
