import { createFileRoute } from "@tanstack/react-router";
import { AuthenticatedShell } from "@/components/mestrra/authenticated-shell";
import { SettingsPanel } from "@/components/mestrra/settings";
import { useBusinessData } from "@/lib/use-business";
import { requireAuth } from "@/lib/require-auth";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  ssr: false,
  beforeLoad: requireAuth,
  head: () => routeMeta("Configurações", "Configure seu negócio e conecte sua conta Mercado Pago."),
  component: () => (
    <AuthenticatedShell>
      <SettingsPage />
    </AuthenticatedShell>
  ),
});

function SettingsPage() {
  return <SettingsPanel data={useBusinessData()} />;
}
