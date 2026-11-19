import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { demoBusiness } from "@/lib/demo";
import { routeMeta } from "@/lib/mestrra";
import { Shell } from "@/components/mestrra/shell";
import { Dashboard } from "@/components/mestrra/dashboard";
import { supabase } from "@/integrations/supabase/resolved-client";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () =>
    routeMeta(
      "Seu negócio, por inteiro",
      "Acompanhe estoque, precificação, marketing, vendas e caixa em uma única esteira na Mestrra.",
    ),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
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
      />
    </Shell>
  );
}
