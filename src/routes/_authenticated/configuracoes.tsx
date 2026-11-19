import { createFileRoute } from "@tanstack/react-router";
import { SettingsPanel } from "@/components/mestrra/settings";
import { useBusinessData } from "@/lib/use-business";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => routeMeta("Configurações", "Configure seu negócio e conecte sua conta Mercado Pago."),
  component: SettingsPage,
});

function SettingsPage() {
  return <SettingsPanel data={useBusinessData()} />;
}
