import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/resolved-client";
import { toast } from "sonner";
import { Brand } from "./brand";
export type AuthMode = "login" | "signup" | "forgot";

export function Auth({
  recovery = false,
  initialMode = "login",
}: {
  recovery?: boolean;
  initialMode?: AuthMode;
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [validRecovery, setValidRecovery] = useState(false);
  useEffect(() => {
    if (recovery) {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const type = hash.get("type");
      if (type === "recovery") setValidRecovery(true);
      void supabase.auth.getUser().then(({ data }) => {
        if (data.user) setValidRecovery(true);
      });
    } else {
      void supabase.auth.getUser().then(({ data }) => {
        if (data.user) void navigate({ to: "/dashboard" });
      });
    }
  }, [recovery, navigate]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    try {
      if (recovery) {
        if (!validRecovery) throw new Error("Abra o link de recuperação enviado ao seu e-mail.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Senha atualizada!");
        await navigate({ to: "/dashboard" });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) await navigate({ to: "/dashboard" });
        else setSent(true);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-brand">
        <Brand />
        <div className="my-12">
          <span className="text-info text-xs font-semibold">
            DO PRIMEIRO INSUMO À PRÓXIMA VENDA
          </span>
          <h1 className="text-4xl font-extrabold leading-snug mt-5">
            Seu negócio.
            <br />
            Sua próxima conquista<span className="text-primary">.</span>
          </h1>
          <p className="text-brand-foreground/60 text-sm leading-relaxed mt-5 max-w-sm">
            Mais clareza para precificar, mais confiança para vender e mais tempo para fazer o que
            você faz melhor.
          </p>
          <div className="mt-8 space-y-4">
            {[
              "Estoque e preços conectados",
              "Conteúdo que vira conversa",
              "Vendas e caixa no mesmo ritmo",
            ].map((t) => (
              <p key={t} className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-info/20 text-info p-1">
                  <Check size={12} />
                </span>
                {t}
              </p>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-brand-foreground/40">mestrra · Seu negócio em movimento.</p>
      </section>
      <section className="auth-form">
        <div className="icon-tile mb-6">
          <LockKeyhole size={20} />
        </div>
        <h2 className="text-2xl font-extrabold">
          {recovery
            ? "Uma nova senha"
            : mode === "login"
              ? "Bom ter você por aqui."
              : mode === "signup"
                ? "Seu próximo passo começa aqui."
                : "Vamos recuperar seu acesso."}
        </h2>
        <p className="text-sm text-muted-foreground mt-3 mb-8">
          {recovery
            ? "Escolha uma senha segura para sua conta."
            : mode === "login"
              ? "Entre e coloque seu negócio em movimento."
              : mode === "signup"
                ? "Crie sua conta e organize seu negócio na mestrra."
                : "Enviaremos um link de recuperação para seu e-mail."}
        </p>
        {sent ? (
          <div className="surface p-6">
            <h3 className="font-semibold">Confira seu e-mail</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "signup"
                ? "Confirme seu cadastro pelo link que enviamos."
                : "Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha."}
            </p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => {
                setSent(false);
                setMode("login");
              }}
            >
              Voltar para entrar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {!recovery && (
              <label className="field">
                E-mail
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@seunegocio.com.br"
                  required
                />
              </label>
            )}
            {(recovery || mode !== "forgot") && (
              <label className="field">
                Senha
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={8}
                  placeholder="Pelo menos 8 caracteres"
                  required
                />
              </label>
            )}
            {mode === "login" && !recovery && (
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-info text-xs"
                onClick={() => setMode("forgot")}
              >
                Esqueci minha senha
              </Button>
            )}
            <Button
              disabled={busy || (recovery && !validRecovery)}
              className="w-full h-11"
              type="submit"
            >
              {busy
                ? "Aguarde…"
                : recovery
                  ? "Salvar nova senha"
                  : mode === "login"
                    ? "Entrar na mestrra"
                    : mode === "signup"
                      ? "Criar minha conta"
                      : "Enviar link de recuperação"}
              <ArrowRight size={16} />
            </Button>
            {recovery && !validRecovery && (
              <p className="text-xs text-destructive">
                Abra o link de recuperação recebido por e-mail.
              </p>
            )}
          </form>
        )}
        {!recovery && !sent && (
          <p className="text-xs text-muted-foreground mt-6 text-center">
            {mode === "signup" ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-info text-xs"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            >
              {mode === "signup" ? "Entrar" : "Cadastre-se"}
            </Button>
          </p>
        )}
        <Button variant="ghost" className="mt-5 text-xs" asChild>
          <Link to="/demo">
            Conhecer a mestrra com dados de exemplo <ArrowRight size={14} />
          </Link>
        </Button>
      </section>
    </div>
  );
}
