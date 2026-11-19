import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/lib/use-business";
import { Shell } from "@/components/mestrra/shell";
import { Onboarding } from "@/components/mestrra/onboarding";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data, isPending, isError, refetch } = useBusiness();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-2 border-info border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Conectando sua esteira...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="surface max-w-md p-8 text-center">
          <h1 className="text-lg font-bold">Não foi possível carregar seu negócio</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Verifique sua conexão e tente novamente.
          </p>
          <Button className="mt-5" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Shell data={data}>
        <Outlet />
      </Shell>
      <Onboarding data={data} />
    </>
  );
}
