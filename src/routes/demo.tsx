import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

import { Dashboard } from "@/components/mestrra/dashboard";
import { Shell } from "@/components/mestrra/shell";
import { demoBusiness } from "@/lib/demo";
import { routeMeta } from "@/lib/mestrra";
import { supabase } from "@/integrations/supabase/resolved-client";

export const Route = createFileRoute("/demo")({
  head: () =>
    routeMeta(
      "Conheça a demonstração",
      "Explore a mestrra com dados de exemplo: estoque, precificação, marketing, vendas e caixa em uma única esteira.",
    ),
  component: DemoPage,
});

function DemoPage() {
  const data = useMemo(() => demoBusiness(), []);
  const navigate = useNavigate();

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <Shell data={data} demo>
      <Dashboard
        data={data}
        onExpense={() => void navigate({ to: "/auth", search: { mode: "signup" } })}
        onLogout={() => void navigate({ to: "/" })}
      />
    </Shell>
  );
}
