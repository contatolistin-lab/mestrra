import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/resolved-client";
import { toast } from "sonner";
import type { BusinessData } from "@/lib/business.functions";
import { ProfileForm } from "./forms";

export function SettingsPanel({ data }: { data: BusinessData }) {
  const [connecting, setConnecting] = useState(false);
  const connected = !!data.profile?.mp_connected;

  async function connect() {
    setConnecting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("mp-oauth-start");
      if (error) throw error;
      const url = result?.url as string | undefined;
      if (!url)
        throw new Error(
          "Não foi possível iniciar a conexão. Verifique as secrets MP_CLIENT_ID e MP_REDIRECT_URI.",
        );
      window.location.assign(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao iniciar a conexão.");
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">
          Configurações<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Seu negócio, suas integrações, suas regras.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="surface p-6">
          <div className="flex items-center gap-2">
            <Settings2 size={17} className="text-info" />
            <h2 className="section-heading">Perfil do negócio</h2>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Esses dados alimentam a hora técnica e o copiloto de marketing.
          </p>
          <div className="mt-6 max-w-xl">
            <ProfileForm data={data} />
          </div>
        </section>

        <section className="surface overflow-hidden border-info/30">
          <div className="bg-brand p-6 text-brand-foreground">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-info">
                  Integração de cobrança
                </p>
                <h2 className="mt-2 text-lg font-bold">Conectar conta Mercado Pago</h2>
              </div>
              <CreditCard className="text-info" size={22} />
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-brand-foreground/70">
              O dinheiro das vendas cai direto na sua conta Mercado Pago. A Mestrra apenas
              automatiza a cobrança, a baixa de estoque e o lançamento no caixa.
            </p>
            <div className="mt-5 flex items-center gap-2 text-[11px]">
              {connected ? (
                <CheckCircle2 size={16} className="text-success" />
              ) : (
                <LockKeyhole size={16} className="text-info" />
              )}
              {connected ? "Conta conectada e pronta para cobrar" : "Nenhuma conta conectada"}
            </div>
            <Button
              className="mt-5 w-full"
              onClick={() => void connect()}
              disabled={connecting || connected}
            >
              {connecting
                ? "Abrindo Mercado Pago..."
                : connected
                  ? "Conta conectada"
                  : "Conectar Mercado Pago"}
            </Button>
          </div>
          <div className="p-5 space-y-3 text-[11px] text-muted-foreground">
            <div className="flex gap-2 items-start">
              <ShieldCheck size={15} className="shrink-0 text-info" />
              <span>Tokens guardados apenas no banco, com acesso restrito às Edge Functions.</span>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle2 size={15} className="shrink-0 text-info" />
              <span>
                Pagamentos aprovados baixam estoque e lançam a entrada no caixa automaticamente.
              </span>
            </div>
            <p>
              Configure as secrets <code className="text-foreground">MP_CLIENT_ID</code>,{" "}
              <code className="text-foreground">MP_CLIENT_SECRET</code> e{" "}
              <code className="text-foreground">MP_REDIRECT_URI</code> no Supabase para ativar o
              OAuth.
            </p>
            <Button variant="link" className="h-auto p-0 text-info text-[11px]" asChild>
              <Link to="/vendas" search={{ itemId: undefined }}>
                Ir para vendas <ArrowUpRight size={12} />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
