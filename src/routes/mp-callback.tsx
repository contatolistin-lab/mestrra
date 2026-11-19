import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/resolved-client";
import { Brand } from "@/components/mestrra/brand";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/mp-callback")({
  ssr: false,
  head: () => routeMeta("Conectando Mercado Pago", "Finalizando a conexão com o Mercado Pago."),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const started = useRef(false);
  const [message, setMessage] = useState("Conectando sua conta Mercado Pago...");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code") || "";
    const state = params.get("state") || "";
    if (!code) {
      setMessage("Não recebemos o código de autorização do Mercado Pago.");
      setFailed(true);
      return;
    }
    void supabase.functions
      .invoke("mp-oauth-exchange", { body: { code, state } })
      .then(({ error }) => {
        if (error) throw error;
        setMessage("Conta conectada! O dinheiro das vendas cai direto na sua conta Mercado Pago.");
        setTimeout(() => void navigate({ to: "/configuracoes" }), 1200);
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "Não foi possível concluir a conexão.");
        setFailed(true);
      });
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface max-w-md p-8 text-center">
        <div className="mestrra-logo mx-auto mb-5 flex justify-center text-brand">
          <Brand />
        </div>
        <h1 className="text-xl font-extrabold">Mercado Pago</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        {failed && (
          <Button className="mt-6" onClick={() => void navigate({ to: "/configuracoes" })}>
            Voltar às configurações
          </Button>
        )}
      </div>
    </main>
  );
}
