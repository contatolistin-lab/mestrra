import { createFileRoute } from "@tanstack/react-router";
import { AuthenticatedShell } from "@/components/mestrra/authenticated-shell";
import { Pricing } from "@/components/mestrra/pricing";
import { useBusinessData } from "@/lib/use-business";
import { requireAuth } from "@/lib/require-auth";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/precificacao")({
  ssr: false,
  beforeLoad: requireAuth,
  head: () =>
    routeMeta("Precificação inteligente", "Calcule o preço certo para produtos e serviços."),
  component: () => (
    <AuthenticatedShell>
      <PricingPage />
    </AuthenticatedShell>
  ),
});

function PricingPage() {
  return <Pricing data={useBusinessData()} />;
}
