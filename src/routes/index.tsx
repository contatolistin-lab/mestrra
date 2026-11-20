import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { SalesPage } from "@/components/mestrra/sales-page";
import { routeMeta } from "@/lib/mestrra";
import { supabase } from "@/integrations/supabase/resolved-client";

export const Route = createFileRoute("/")({
  head: () =>
    routeMeta(
      "Seu negócio em movimento",
      "Assine a Mestrra por R$ 127/mês e conecte estoque, precificação, marketing, vendas e caixa em uma só esteira.",
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
