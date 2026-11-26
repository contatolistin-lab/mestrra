import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { Brand } from "@/components/mestrra/brand";
import { PlatformAdminPanel } from "@/components/mestrra/platform-admin-panel";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/resolved-client";
import { routeMeta } from "@/lib/mestrra";
import type { PlatformOverview } from "@/lib/platform-admin";
import {
  checkPlatformAdminAccess,
  getPlatformOverview,
  isPlatformAdminEmailAllowed,
} from "@/lib/platform-admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () =>
    routeMeta(
      "Gestão da plataforma",
      "Acesso restrito para acompanhar assinantes, receita recorrente e indicadores da mestrra.",
    ),
  component: GestaoPlataformaPage,
});

type AccessState = "checking" | "login" | "verifying" | "ready" | "denied";

function GestaoPlataformaPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AccessState>("checking");
  const [overview, setOverview] = useState<PlatformOverview | null>(null);

  const loadOverview = useCallback(async () => {
    setOverview(await getPlatformOverview());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setStatus(data.session ? "verifying" : "login");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setStatus("verifying");
    void (async () => {
      try {
        await checkPlatformAdminAccess();
        const data = await getPlatformOverview();
        if (cancelled) return;
        setOverview(data);
        setStatus("ready");
      } catch {
        await supabase.auth.signOut();
        if (cancelled) return;
        setSession(null);
        setOverview(null);
        setStatus("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setOverview(null);
    setStatus("login");
  }

  if (status === "checking" || status === "verifying") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Validando acesso administrativo…</p>
      </main>
    );
  }

  if (status === "denied") {
    return (
      <main className="auth-layout">
        <section className="auth-brand">
          <Brand />
        </section>
        <section className="auth-form">
          <div className="icon-tile mb-6">
            <LockKeyhole size={20} />
          </div>
          <h2 className="text-2xl font-extrabold">Acesso negado.</h2>
          <p className="text-sm text-muted-foreground mt-3 mb-8">
            Esta conta não tem permissão para a gestão da plataforma.
          </p>
          <Button className="w-full" onClick={() => setStatus("login")}>
            Tentar outro e-mail <ArrowRight size={16} />
          </Button>
        </section>
      </main>
    );
  }

  if (!session || status === "login") {
    return <AdminLogin onSignedIn={setSession} />;
  }

  if (!overview) return null;

  return <PlatformAdminPanel overview={overview} onSaved={loadOverview} onSignOut={signOut} />;
}

function AdminLogin({ onSignedIn }: { onSignedIn: (session: Session | null) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function recover() {
    if (!formRef.current) return;
    const email = String(new FormData(formRef.current).get("email") || "").trim();
    if (!email) {
      toast.error("Informe o e-mail para recuperar a senha.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("Se o e-mail existir, enviaremos o link de recuperação.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível recuperar a senha.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    try {
      if (mode === "signup") {
        let allowed = false;
        try {
          allowed = await isPlatformAdminEmailAllowed({ data: { email } });
        } catch {
          throw new Error(
            "Não foi possível validar a allowlist administrativa. Confira o SQL aplicado.",
          );
        }
        if (!allowed) throw new Error("Este e-mail não está liberado para a gestão da plataforma.");

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (/already registered|already been registered/i.test(error.message)) {
            setNotice("Este e-mail já está cadastrado. Use Entrar ou recupere a senha.");
            setMode("login");
            toast.error("Este e-mail já está cadastrado. Use Entrar.");
            return;
          }
          throw error;
        }
        if (!data.session) {
          setNotice(
            "Se o e-mail ainda não estava cadastrado, confirme o link enviado. Se já estava, use Entrar ou recupere a senha.",
          );
          setMode("login");
          toast.success("Verifique seu e-mail ou entre com a senha já cadastrada.");
          return;
        }
        onSignedIn(data.session);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onSignedIn(data.session);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-brand">
        <Brand />
        <div className="my-12">
          <span className="text-info text-xs font-semibold">ÁREA INTERNA</span>
          <h1 className="text-4xl font-extrabold leading-snug mt-5">
            Gestão da plataforma
            <span className="text-primary">.</span>
          </h1>
          <p className="text-brand-foreground/60 text-sm leading-relaxed mt-5 max-w-sm">
            Acompanhe assinantes, receita recorrente e os indicadores de crescimento da mestrra.
          </p>
        </div>
        <p className="text-[10px] text-brand-foreground/40">mestrra · Acesso restrito.</p>
      </section>
      <section className="auth-form">
        <div className="icon-tile mb-6">
          <LockKeyhole size={20} />
        </div>
        <h2 className="text-2xl font-extrabold">
          {mode === "signup" ? "Cadastrar acesso administrativo" : "Acesso administrativo"}
        </h2>
        <p className="text-sm text-muted-foreground mt-3 mb-8">
          {mode === "signup"
            ? "Cadastre um e-mail liberado e defina a senha para entrar nesta área."
            : "Entre com o e-mail e a senha liberados para esta área."}
        </p>
        {notice ? (
          <p className="mb-6 rounded-md bg-muted p-3 text-sm text-muted-foreground">{notice}</p>
        ) : null}
        <form ref={formRef} onSubmit={submit} className="space-y-5">
          <label className="field">
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="username"
              defaultValue="contato.listin@gmail.com"
              required
            />
          </label>
          <label className="field">
            Senha
            <input
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </label>
          <Button disabled={busy} className="w-full h-11" type="submit">
            {busy ? "Validando…" : mode === "signup" ? "Cadastrar e entrar" : "Entrar na gestão"}{" "}
            <ArrowRight size={16} />
          </Button>
        </form>
        {mode === "login" ? (
          <button
            type="button"
            disabled={busy}
            className="mt-4 text-sm text-muted-foreground hover:underline"
            onClick={recover}
          >
            Esqueci minha senha
          </button>
        ) : null}
        <button
          type="button"
          className="mt-6 text-sm text-primary hover:underline"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setNotice(null);
          }}
        >
          {mode === "login" ? "Cadastrar e-mail administrativo" : "Já tenho acesso, entrar"}
        </button>
      </section>
    </main>
  );
}
