import { createFileRoute } from "@tanstack/react-router";
import { Pricing } from "@/components/mestrra/pricing";
import { useBusinessData } from "@/lib/use-business";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/precificacao")({
  head: () =>
    routeMeta("Precificação inteligente", "Calcule o preço certo para produtos e serviços."),
  component: PricingPage,
});

function PricingPage() {
  return <Pricing data={useBusinessData()} />;
}
