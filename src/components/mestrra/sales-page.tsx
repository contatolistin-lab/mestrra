import { useEffect, useState, type FormEvent, type PointerEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  LineChart,
  LoaderCircle,
  LockKeyhole,
  Menu,
  MessageCircle,
  Package,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Brand } from "@/components/mestrra/brand";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/mestrra";
import { SUBSCRIPTION_BENEFITS, SUBSCRIPTION_PRICE } from "@/lib/subscription";
import { createSubscriptionCheckout } from "@/lib/subscription.functions";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
};

const features: Feature[] = [
  {
    icon: Package,
    title: "Estoque que se atualiza sozinho",
    description:
      "Cada venda baixa o estoque e avisa quando é hora de repor. Sem planilha, sem esquecimento.",
    accent: "from-info/25 to-transparent",
  },
  {
    icon: LineChart,
    title: "Preço com margem real",
    description:
      "Insumo, mão de obra, taxas e margem viram um preço que fecha a conta — em segundos.",
    accent: "from-primary/25 to-transparent",
  },
  {
    icon: Bot,
    title: "Copiloto de conteúdo",
    description: "Posts e mensagens prontos para Instagram e WhatsApp, no tom do seu negócio.",
    accent: "from-success/25 to-transparent",
  },
  {
    icon: CreditCard,
    title: "Cobrança conectada",
    description: "Gere links e QR Codes com Mercado Pago e acompanhe o pagamento chegar ao caixa.",
    accent: "from-info/25 to-transparent",
  },
  {
    icon: Wallet,
    title: "Caixa 360º",
    description: "Entradas, saídas e resultado do mês em um painel que qualquer pessoa entende.",
    accent: "from-primary/25 to-transparent",
  },
  {
    icon: Zap,
    title: "Esteira em movimento",
    description: "Do primeiro insumo à próxima venda, tudo conectado em uma sequência simples.",
    accent: "from-success/25 to-transparent",
  },
];

const steps: { number: string; icon: LucideIcon; title: string; description: string }[] = [
  {
    number: "01",
    icon: Boxes,
    title: "Organize",
    description: "Cadastre insumos, produtos e serviços. A Mestrra monta sua base em minutos.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Decida",
    description: "Calcule preços, crie conteúdo e veja o que faz sentido para o seu momento.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Venda",
    description: "Cobre, acompanha e reinveste com os números do seu negócio sempre à mão.",
  },
];

const problems: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: BarChart3,
    title: "Preço no achismo",
    description: "Você calcula rápido, mas nunca tem certeza se a margem realmente fechou.",
  },
  {
    icon: Package,
    title: "Estoque na cabeça",
    description: "O que vendeu, o que falta e o que parou de movimentar ficam espalhados.",
  },
  {
    icon: MessageCircle,
    title: "Conteúdo travado",
    description: "Você sabe que precisa postar, mas a inspiração nunca chega na hora.",
  },
  {
    icon: Wallet,
    title: "Caixa no escuro",
    description: "Dinheiro entrou, mas você não sabe ao certo de onde veio ou para onde foi.",
  },
];

const audiences: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Sparkles,
    title: "Produtores e artesãos",
    description: "Do insumo ao pedido, com preço justo e estoque sob controle.",
  },
  {
    icon: Bot,
    title: "Estúdios e serviços",
    description: "Precificação de horas, cobrança e conteúdo sem perder a virada do dia.",
  },
  {
    icon: TrendingUp,
    title: "Marcas em crescimento",
    description: "Números, vendas e caixa conectados para decidir com mais confiança.",
  },
];

const beforeAfter = [
  {
    before: "Planilha de preço que ninguém atualiza",
    after: "Simulador com custo, taxa e margem em segundos",
  },
  {
    before: "Estoque conferido na mão",
    after: "Baixa automática a cada venda realizada",
  },
  {
    before: "Cobrança e caixa em lugares diferentes",
    after: "Mercado Pago e caixa atualizados juntos",
  },
  {
    before: "Post adiado porque não sabia o que escrever",
    after: "Copiloto sugere conteúdo para Instagram e WhatsApp",
  },
];

const testimonials = [
  {
    quote:
      "Eu precificava no achismo. Hoje fecho o preço em minutos e sei exatamente quanto sobra.",
    name: "Ana Beatriz",
    role: "Doces artesanais · SP",
    initials: "AB",
  },
  {
    quote:
      "O que mais mudou foi a rotina: estoque, cobrança e caixa pararam de viver em lugares diferentes.",
    name: "Rafael Costa",
    role: "Estúdio de design · MG",
    initials: "RC",
  },
  {
    quote:
      "Consigo postar e vender no mesmo dia. Parece que finalmente tenho um time cuidando do meu negócio.",
    name: "Camila Rocha",
    role: "Cosméticos naturais · PR",
    initials: "CR",
  },
];

const faqs = [
  {
    question: "Como funciona a cobrança?",
    answer:
      "A assinatura é mensal, no valor de R$ 127,00, processada pelo Mercado Pago. Você informa seu e-mail, é levado ao checkout e escolhe como quer pagar. As próximas cobranças seguem a recorrência mensal.",
  },
  {
    question: "Preciso ter uma conta no Mercado Pago?",
    answer:
      "Sim. O checkout é do Mercado Pago, então você usa sua conta para concluir a assinatura e gerenciar o meio de pagamento.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Pode. Você gerencia a assinatura direto no Mercado Pago, sem contrato de fidelidade com a Mestrra.",
  },
  {
    question: "O que está incluído no plano?",
    answer:
      "Toda a esteira da Mestrra: estoque, precificação, copiloto de marketing, vendas, cobranças e caixa, com atualizações incluídas.",
  },
  {
    question: "Posso conhecer antes de assinar?",
    answer:
      "Pode. Abra a demonstração com dados de exemplo e veja estoque, precificação, conteúdo, cobranças e caixa funcionando antes de escolher o plano.",
  },
];

const marqueeItems = [
  "5 etapas conectadas",
  "1 plano único",
  "R$ 127 por mês",
  "Checkout Mercado Pago",
  "Cancele quando quiser",
  "Acesso imediato",
];

function useReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function handleHeroPointer(event: PointerEvent<HTMLElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mouse-x", `${event.clientX - bounds.left}px`);
  event.currentTarget.style.setProperty("--mouse-y", `${event.clientY - bounds.top}px`);
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="inline-flex items-center gap-2 rounded-full border border-info/25 bg-info-soft/70 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-info uppercase">
        <span className="size-1.5 rounded-full bg-info sales-pulse-dot" />
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}

function CheckoutForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const { checkoutUrl } = await createSubscriptionCheckout({ data: { email } });
      window.location.assign(checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível abrir o checkout.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <label htmlFor="checkout-email" className="block text-sm font-bold text-foreground">
        E-mail para vincular sua assinatura
      </label>
      <div className="mt-2 flex flex-col gap-3">
        <input
          id="checkout-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@seuemail.com"
          className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none transition focus:border-info focus:ring-2 focus:ring-info/20"
        />
        <Button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] hover:bg-primary/90 disabled:hover:scale-100"
        >
          {busy ? <LoaderCircle className="animate-spin" size={17} /> : <LockKeyhole size={17} />}
          {busy ? "Abrindo checkout..." : "Assinar com Mercado Pago"}
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" />
        Pagamento seguro no Mercado Pago. Seus dados de cartão não passam por este site.
      </p>
    </form>
  );
}

export function SalesPage() {
  useReveal();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-brand/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#inicio" aria-label="Mestrra, voltar ao início" className="text-white">
            <Brand />
          </a>
          <nav className="hidden items-center gap-7 text-sm text-white/70 lg:flex">
            <a href="#problema" className="transition hover:text-white">
              O problema
            </a>
            <a href="#recursos" className="transition hover:text-white">
              Recursos
            </a>
            <a href="#como-funciona" className="transition hover:text-white">
              Como funciona
            </a>
            <a href="#precos" className="transition hover:text-white">
              Preços
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="rounded-full px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Entrar
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-full border border-white/25 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
            >
              Cadastro
            </Link>
            <a
              href="#precos"
              className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.03]"
            >
              Assinar agora <ArrowUpRight size={14} />
            </a>
          </div>
          <button
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-9 place-items-center rounded-lg border border-white/15 text-white md:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-white/10 bg-brand px-5 py-4 text-sm text-white/80 md:hidden">
            {[
              ["O problema", "#problema"],
              ["Recursos", "#recursos"],
              ["Como funciona", "#como-funciona"],
              ["Preços", "#precos"],
              ["Depoimentos", "#depoimentos"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2 transition hover:bg-white/10"
              >
                {label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/auth"
                search={{ mode: "login" }}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg border border-white/20 px-3 py-2 text-center text-xs font-bold"
              >
                Entrar
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg bg-white/10 px-3 py-2 text-center text-xs font-bold"
              >
                Cadastro
              </Link>
            </div>
            <a
              href="#precos"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-lg bg-primary px-3 py-2 text-center text-xs font-bold text-primary-foreground"
            >
              Assinar por {money(SUBSCRIPTION_PRICE)}/mês
            </a>
          </nav>
        )}
      </header>

      <main>
        <section
          id="inicio"
          onPointerMove={handleHeroPointer}
          className="sales-hero relative overflow-hidden pt-32 pb-24 text-white sm:pt-40 sm:pb-32"
        >
          <div className="sales-grid-bg pointer-events-none absolute inset-0 opacity-60" />
          <div className="sales-orb sales-orb-one pointer-events-none absolute top-10 -left-24 size-80 rounded-full bg-info/20 blur-3xl" />
          <div className="sales-orb sales-orb-two pointer-events-none absolute right-0 bottom-0 size-96 rounded-full bg-primary/15 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] uppercase backdrop-blur">
                <Sparkles size={13} className="text-primary" /> A esteira completa do seu negócio
              </span>
              <h1 className="mt-6 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                Seu negócio em
                <span className="sales-shimmer block bg-gradient-to-r from-primary via-orange-200 to-info bg-clip-text text-transparent">
                  modo avançado.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                Estoque, precificação, marketing, vendas e caixa trabalhando juntos. Menos planilha,
                menos achismo e mais tempo para fazer o que você faz melhor.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#precos"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/25 transition hover:scale-[1.03]"
                >
                  Quero começar por {money(SUBSCRIPTION_PRICE)}/mês <ArrowRight size={17} />
                </a>
                <Link
                  to="/demo"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Ver demonstração <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/50">
                {[
                  "Sem contrato de fidelidade",
                  "Cancele quando quiser",
                  "Cobrança segura Mercado Pago",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-success" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[540px]">
              <div className="absolute -inset-6 rounded-[40px] bg-info/15 blur-3xl" />
              <div className="sales-float relative rounded-[28px] border border-white/15 bg-white/5 p-3 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[22px] bg-card p-5 text-foreground shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                        Visão geral
                      </p>
                      <p className="mt-1 text-lg font-extrabold">Seu negócio hoje</p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success">
                      <span className="size-1.5 rounded-full bg-success" />
                      Tudo conectado
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      { label: "Vendas do mês", value: "R$ 8.420", icon: TrendingUp },
                      { label: "Margem média", value: "42,8%", icon: BarChart3 },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-2xl border bg-secondary/50 p-3">
                        <metric.icon size={15} className="text-info" />
                        <p className="mt-3 text-[10px] text-muted-foreground">{metric.label}</p>
                        <p className="text-lg font-extrabold">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        Ritmo de vendas
                      </p>
                      <span className="text-[10px] font-bold text-success">+18,4%</span>
                    </div>
                    <div className="mt-4 flex h-24 items-end gap-2">
                      {[38, 52, 44, 70, 58, 84, 68, 92, 76, 100].map((height, index) => (
                        <div
                          key={index}
                          className="sales-bar flex-1 rounded-t-md bg-gradient-to-t from-info/30 to-info"
                          style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="sales-float absolute -left-4 top-24 w-52 rounded-2xl border border-white/15 bg-brand/90 p-4 shadow-2xl backdrop-blur-xl sm:-left-12"
                style={{ animationDelay: "-2.5s" }}
              >
                <div className="flex items-center gap-2 text-primary">
                  <Package size={16} />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Estoque</span>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-white">12 itens</p>
                <p className="mt-1 text-[11px] text-white/50">3 precisam de reposição</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-info to-primary" />
                </div>
              </div>

              <div
                className="sales-float absolute -right-3 -bottom-4 w-56 rounded-2xl border border-white/15 bg-card p-4 text-foreground shadow-2xl sm:-right-8"
                style={{ animationDelay: "-5s" }}
              >
                <div className="flex items-center gap-2 text-info">
                  <Bot size={16} />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Copiloto</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed font-semibold">
                  &ldquo;Post sugerido para hoje: bastidores da produção + oferta da semana.&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-success">
                  <Sparkles size={12} /> Pronto para publicar
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/60 py-5">
          <div className="sales-marquee overflow-hidden">
            <div className="sales-marquee-track flex w-max items-center gap-10">
              {[...marqueeItems, ...marqueeItems].map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="flex shrink-0 items-center gap-10 text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase"
                >
                  {item}
                  <Sparkles size={14} className="text-primary" />
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="problema" className="scroll-mt-20 bg-background py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div data-reveal className="sales-reveal">
                <SectionHeading
                  eyebrow="O problema"
                  title={
                    <>
                      Você não está desorganizado<span className="text-info">.</span> Você está
                      desconectado.
                    </>
                  }
                  description="O preço está na planilha, o estoque na memória, a cobrança no aplicativo e o caixa em outro lugar. O problema não é esforço: é falta de conexão."
                  align="left"
                />
                <a
                  href="#como-funciona"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-info transition hover:gap-3"
                >
                  Veja como a esteira funciona <ArrowRight size={16} />
                </a>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {problems.map((problem, index) => (
                  <div
                    key={problem.title}
                    data-reveal
                    className="sales-reveal sales-card-hover rounded-2xl border bg-card p-5 shadow-sm"
                    style={{ transitionDelay: `${index * 70}ms` }}
                  >
                    <div className="grid size-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
                      <problem.icon size={18} />
                    </div>
                    <h3 className="mt-4 text-sm font-extrabold">{problem.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {problem.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="recursos"
          className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 sm:px-8 sm:py-28"
        >
          <div data-reveal className="sales-reveal">
            <SectionHeading
              eyebrow="Tudo no mesmo lugar"
              title={
                <>
                  Uma esteira. <span className="text-info">Todas as peças.</span>
                </>
              }
              description="Você não precisa de cinco ferramentas para gerir um negócio. A Mestrra conecta o que importa e tira o peso da operação do seu dia."
            />
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                data-reveal
                className="sales-reveal sales-card-hover group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm"
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                />
                <div className="relative">
                  <div className="grid size-11 place-items-center rounded-2xl bg-secondary text-info transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                    <feature.icon size={20} />
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="para-quem" className="scroll-mt-20 bg-secondary/40 py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div data-reveal className="sales-reveal">
              <SectionHeading
                eyebrow="Feita para o seu tipo de negócio"
                title={
                  <>
                    Se o seu dia tem produção, preço e venda,{" "}
                    <span className="text-info">esta página é sua.</span>
                  </>
                }
                description="Você não precisa mudar o jeito que trabalha. A Mestrra entra na rotina para dar clareza ao que já existe."
              />
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {audiences.map((audience, index) => (
                <div
                  key={audience.title}
                  data-reveal
                  className="sales-reveal sales-card-hover rounded-3xl border bg-card p-6 shadow-sm"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className="grid size-11 place-items-center rounded-2xl bg-info-soft text-info">
                    <audience.icon size={20} />
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold">{audience.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {audience.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="relative scroll-mt-20 overflow-hidden bg-brand py-24 text-white sm:py-28"
        >
          <div className="sales-grid-bg pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div data-reveal className="sales-reveal">
              <SectionHeading
                eyebrow="Como funciona"
                title={
                  <>
                    <span className="text-primary">Do caos ao clique.</span>
                  </>
                }
                description="Três passos para transformar a forma como você Decide, produz e vende."
              />
            </div>
            <div className="relative mt-16 grid gap-8 md:grid-cols-3">
              <div className="absolute top-8 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-white/20 to-transparent md:block" />
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  data-reveal
                  className="sales-reveal relative text-center"
                  style={{ transitionDelay: `${index * 120}ms` }}
                >
                  <div className="relative mx-auto grid size-16 place-items-center rounded-2xl border border-white/15 bg-white/5 text-primary backdrop-blur">
                    <step.icon size={24} />
                    <span className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold text-primary-foreground">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-extrabold">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/55">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-3 text-xs text-white/55">
              {["Configuração em minutos", "Sem planilha", "Acesso imediato"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="antes-depois" className="scroll-mt-20 bg-background py-24 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div data-reveal className="sales-reveal">
              <SectionHeading
                eyebrow="Antes e depois"
                title={
                  <>
                    A mesma rotina. <span className="text-info">Outro ritmo.</span>
                  </>
                }
                description="Veja o que muda quando estoque, preço, conteúdo, cobrança e caixa deixam de trabalhar separados."
              />
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border bg-card p-7 shadow-sm">
                <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.16em] text-muted-foreground uppercase">
                  <X size={15} className="text-destructive" /> Antes
                </p>
                <div className="mt-6 space-y-4">
                  {beforeAfter.map((row) => (
                    <p
                      key={row.before}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                      {row.before}
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-success/30 bg-success-soft/40 p-7 shadow-sm">
                <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.16em] text-success uppercase">
                  <Check size={15} /> Com Mestrra
                </p>
                <div className="mt-6 space-y-4">
                  {beforeAfter.map((row) => (
                    <p
                      key={row.after}
                      className="flex items-start gap-3 text-sm font-medium text-foreground"
                    >
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
                        <Check size={11} strokeWidth={3} />
                      </span>
                      {row.after}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="precos" className="scroll-mt-20 bg-secondary/40 py-24 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div data-reveal className="sales-reveal">
              <SectionHeading
                eyebrow="Plano único, sem complicação"
                title={
                  <>
                    Um preço. <span className="text-info">A esteira inteira.</span>
                  </>
                }
                description="Sem planos escondidos, sem surpresa na fatura. Você paga apenas a mensalidade e usa tudo o que a Mestrra oferece."
              />
            </div>

            <div data-reveal className="sales-reveal relative mx-auto mt-14 max-w-6xl">
              <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-br from-primary/50 via-info/30 to-transparent blur-md" />
              <div className="relative overflow-hidden rounded-[34px] border bg-card shadow-2xl shadow-info/10">
                <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative overflow-hidden bg-brand p-8 text-white sm:p-10">
                    <div className="sales-grid-bg pointer-events-none absolute inset-0 opacity-40" />
                    <div className="relative">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold tracking-[0.16em] text-white/80 uppercase">
                          <span className="size-1.5 rounded-full bg-primary sales-pulse-dot" />
                          Plano mensal
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-extrabold text-primary-foreground shadow-lg shadow-primary/25">
                          <Sparkles size={12} /> Mais escolhido
                        </span>
                      </div>
                      <h3 className="mt-10 text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Mestrra completa
                      </h3>
                      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
                        A esteira inteira para organizar, decidir, produzir e vender em um só lugar.
                      </p>
                      <div className="mt-9 flex items-end gap-2">
                        <span className="text-5xl font-extrabold tracking-tight sm:text-6xl">
                          {money(SUBSCRIPTION_PRICE)}
                        </span>
                        <span className="pb-2 text-lg font-semibold text-white/50">/mês</span>
                      </div>
                      <p className="mt-2 text-sm text-white/60">
                        Recorrência mensal via Mercado Pago. Cancele quando quiser.
                      </p>
                      <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
                        {[
                          { icon: Clock3, label: "Acesso imediato" },
                          { icon: RefreshCcw, label: "Sem fidelidade" },
                          { icon: ShieldCheck, label: "Checkout seguro" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-2 text-[11px] font-semibold text-white/70"
                          >
                            <item.icon size={14} className="shrink-0 text-primary" />
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-8 sm:p-10">
                    <CheckoutForm />
                    <div className="mt-9 border-t pt-7">
                      <p className="text-xs font-extrabold tracking-[0.16em] text-muted-foreground uppercase">
                        Incluído no seu plano
                      </p>
                      <div className="mt-5 grid gap-3.5">
                        {SUBSCRIPTION_BENEFITS.map((benefit) => (
                          <div key={benefit} className="flex items-start gap-3 text-sm">
                            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span className="leading-relaxed text-foreground/80">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="depoimentos" className="scroll-mt-20 bg-background py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div data-reveal className="sales-reveal">
              <SectionHeading
                eyebrow="Quem já usa"
                title={
                  <>
                    Histórias de quem colocou <span className="text-info">em movimento.</span>
                  </>
                }
                description="Negócios diferentes, mesma sensação: mais clareza para decidir e mais confiança para vender."
              />
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <figure
                  key={testimonial.name}
                  data-reveal
                  className="sales-reveal sales-card-hover flex flex-col rounded-3xl border bg-card p-6 shadow-sm"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star key={star} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-foreground/80">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t pt-5">
                    <span className="grid size-10 place-items-center rounded-full bg-info-soft text-xs font-extrabold text-info">
                      {testimonial.initials}
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{testimonial.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {testimonial.role}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card/60 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div
              data-reveal
              className="sales-reveal flex flex-col items-start gap-6 rounded-[28px] border bg-background p-8 shadow-sm sm:flex-row sm:items-center sm:p-10"
            >
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-success-soft text-success">
                <ShieldCheck size={26} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Sem contrato. Sem fidelidade. Sem letra miúda.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  A assinatura é mensal e o pagamento é processado pelo Mercado Pago. Você gerencia
                  ou cancela quando quiser, direto no checkout, sem precisar falar com ninguém.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                  <LockKeyhole size={13} className="text-info" /> Pagamento seguro
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                  <RefreshCcw size={13} className="text-info" /> Recorrência mensal
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 bg-secondary/40 py-24 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div data-reveal className="sales-reveal">
              <SectionHeading
                eyebrow="Perguntas frequentes"
                title={
                  <>
                    Tudo esclarecido<span className="text-info">.</span>
                  </>
                }
                description="Se ficou alguma dúvida sobre a assinatura ou o funcionamento, a resposta está aqui."
                align="left"
              />
            </div>
            <div className="space-y-3" data-reveal>
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="sales-reveal group rounded-2xl border bg-card p-5 shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold">
                    {faq.question}
                    <ChevronDown
                      size={17}
                      className="shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-brand py-20 text-white">
          <div className="sales-orb sales-orb-two pointer-events-none absolute -top-24 left-1/4 size-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h2 className="text-3xl leading-tight font-extrabold sm:text-5xl">
              Seu próximo passo começa <span className="text-primary">agora.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Entre para a esteira que conecta o seu dia a dia e transforma decisão em movimento.
            </p>
            <a
              href="#precos"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/25 transition hover:scale-[1.03]"
            >
              Assinar por {money(SUBSCRIPTION_PRICE)}/mês <ArrowRight size={17} />
            </a>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40">
              <MessageCircle size={14} /> Sem contrato · Cancele quando quiser
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <Brand />
          <p>Mestrra · Seu negócio em movimento.</p>
          <p>Assinatura mensal processada pelo Mercado Pago.</p>
        </div>
      </footer>
    </div>
  );
}
