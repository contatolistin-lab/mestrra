import { createFileRoute } from "@tanstack/react-router";
import { AuthenticatedShell } from "@/components/mestrra/authenticated-shell";
import { AdminPanel } from "@/components/mestrra/admin-panel";
import { useBusinessData } from "@/lib/use-business";
import { requireAuth } from "@/lib/require-auth";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: requireAuth,
  head: () => routeMeta("Admin", "Cadastre e acompanhe as métricas de crescimento da plataforma."),
  component: () => (
    <AuthenticatedShell>
      <AdminPage />
    </AuthenticatedShell>
  ),
});

function AdminPage() {
  return <AdminPanel data={useBusinessData()} />;
}
