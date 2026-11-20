import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { SalesPage } from "@/components/mestrra/sales-page";
import { routeMeta } from "@/lib/mestrra";
import { supabase } from "@/integrations/supabase/resolved-client";

export const Route = createFileRoute("/")({
  head: () =>
    routeMeta(
      "Gestão e precificação para pequenos negócios",
      "Seu custo vira preço. Sua venda vira resultado. Conheça a mestrra: estoque, precificação, conteúdo, cobranças e caixa por R$ 127/mês.",
    ),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return <SalesPage />;
}
