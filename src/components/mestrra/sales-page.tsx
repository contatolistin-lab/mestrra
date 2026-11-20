import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Check,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Package,
  RefreshCcw,
  ShieldCheck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import { Brand } from "@/components/mestrra/brand";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { money } from "@/lib/mestrra";
import { SUBSCRIPTION_PRICE } from "@/lib/subscription";
import { createSubscriptionCheckout } from "@/lib/subscription.functions";
import workspace from "@/assets/mestrra-workspace.webp.asset.json";

type Feature = { icon: LucideIcon; title: string; description: string; detail: string };
const features: Feature[] = [
  {
    icon: Package,
    title: "Saiba o que tem. E o que falta.",
    description:
      "Controle insumos e recursos, acompanhe o custo por unidade e identifique o que precisa de reposição.",
    detail: "Estoque & recursos",
  },
  {
    icon: BarChart3,
    title: "Cobre com custo e margem na conta.",
    description:
      "Combine materiais, tempo de trabalho, despesas fixas e taxas para calcular o preço de produtos e serviços.",
    detail: "Precificação inteligente",
  },
  {
    icon: Bot,
    title: "Pare de começar cada post do zero.",
    description:
      "Transforme os benefícios da sua oferta em roteiros, legendas e mensagens para Instagram e WhatsApp.",
    detail: "Copiloto de marketing",
  },
  {
    icon: CreditCard,
    title: "Do pedido ao pagamento.",
    description:
      "Registre vendas manuais ou conecte sua conta Mercado Pago para gerar cobranças e acompanhar os pagamentos.",
    detail: "Vendas & cobranças",
  },
  {
    icon: Wallet,
    title: "Veja o que realmente fica para você.",
    description:
      "Acompanhe faturamento, custos, despesas e resultado do período sem juntar números de várias ferramentas.",
    detail: "Caixa 360º",
  },
];
const faqs = [
  {
    group: "Seu negócio",
    question: "Vendo serviços, não produtos. A mestrra também serve para mim?",
    answer:
      "Sim. Na precificação, você pode trabalhar com o tempo de execução e o valor da sua hora, além de incluir os materiais usados no atendimento. Depois, use a mesma oferta para criar conteúdo, registrar vendas e acompanhar o caixa. O estoque é útil quando seu serviço consome insumos; não é necessário inventar um produto físico para começar.",
  },
  {
    group: "Precificação",
    question: "Como o preço calculado considera minha mão de obra e meu lucro?",
    answer:
      "A mestrra soma o custo dos materiais à mão de obra, calculada pelo tempo de execução e pelo valor da hora. Sobre essa base, considera o percentual de despesas fixas informado. O preço sugerido incorpora taxas e margem de lucro como percentuais do preço de venda. Você define esses valores e pode simular cenários antes de salvar; a sugestão não é uma garantia de lucro nem substitui a revisão dos seus custos.",
  },
  {
    group: "Estoque",
    question: "A venda dá baixa nos insumos ou só no produto final?",
    answer:
      "A baixa usa a ficha técnica do item vendido: os insumos e as quantidades que você cadastrou para produzir uma unidade. Por isso, cadastre a receita e confira as unidades de medida antes de registrar a venda. Nos serviços, a mesma lógica vale para os materiais utilizados no atendimento.",
  },
  {
    group: "Conteúdo",
    question: "O copiloto publica no Instagram e envia mensagens pelo WhatsApp?",
    answer:
      "Não. Ele prepara o texto a partir do item cadastrado, do público, dos benefícios e do tom escolhido. Você recebe sugestões de roteiros de Reels, Stories, legendas ou mensagens de WhatsApp para revisar e copiar. A publicação e o envio continuam com você, nas suas próprias contas.",
  },
  {
    group: "Pagamentos",
    question: "Preciso conectar o Mercado Pago para usar estoque, preços e caixa?",
    answer:
      "Não. Você pode organizar o estoque, precificar, criar conteúdo e registrar vendas manualmente sem conectar sua conta. A conexão é necessária para gerar cobranças pelo Mercado Pago e acompanhar a confirmação dos pagamentos pela integração. O pagamento da assinatura mestrra é separado das cobranças que você faz aos seus clientes.",
  },
  {
    group: "Plano mensal",
    question: "Os R$ 127 por mês incluem as taxas das minhas vendas?",
    answer:
      "A mensalidade inclui o acesso à esteira de estoque, precificação, conteúdo, vendas e caixa da mestrra. As tarifas de processamento das cobranças aos seus clientes são definidas pelo Mercado Pago e não estão incluídas na assinatura. Confira as condições da sua conta e considere essas taxas ao calcular seus preços.",
  },
  {
    group: "Assinatura",
    question: "Como funciona a recorrência e onde cancelo a assinatura?",
    answer:
      "A assinatura custa R$ 127,00 por mês e é processada pelo Mercado Pago. Antes de concluir, confira no checkout o meio de pagamento e as condições da recorrência. Não há fidelidade: você pode gerenciar ou cancelar a assinatura na sua conta do Mercado Pago.",
  },
  {
    group: "Antes de assinar",
    question: "Consigo testar a rotina completa sem cadastrar meu negócio?",
    answer:
      "Sim. A demonstração abre um negócio com dados de exemplo para você explorar o estoque, a precificação, o copiloto e as vendas. Ela não cobra sua assinatura nem representa vendas ou pagamentos reais. Quando decidir usar a mestrra no seu negócio, crie sua própria conta e cadastre suas informações.",
  },
];
const routines = [
  {
    title: "Para quem produz",
    description:
      "Doces, artesanato, cosméticos e outros produtos: leve o custo de cada insumo até o preço e a venda.",
    example: "Material → ficha técnica → preço",
  },
  {
    title: "Para quem presta serviços",
    description:
      "Atendimentos, projetos e trabalhos sob demanda: coloque seu tempo na conta e acompanhe o resultado.",
    example: "Horas → valor do serviço → cobrança",
  },
  {
    title: "Para quem cuida de tudo",
    description:
      "MEIs e pequenos negócios que precisam decidir, divulgar e vender sem perder de vista o caixa.",
    example: "Oferta → conteúdo → venda → caixa",
  },
];

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
    } catch {
      setError("Não foi possível abrir o pagamento agora. Tente novamente em instantes.");
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <label htmlFor="checkout-email" className="text-sm font-semibold">
        Seu e-mail
      </label>
      <input
        id="checkout-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="voce@seunegocio.com.br"
        className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-info focus:ring-2 focus:ring-info/20"
      />
      <Button type="submit" disabled={busy} className="mt-3 h-12 w-full text-sm font-bold">
        {busy ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
        {busy ? "Abrindo pagamento…" : "Assinar mestrra"}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <LockKeyhole size={14} className="mt-0.5 shrink-0" />
        Você será direcionado ao Mercado Pago para concluir a assinatura com segurança.
      </p>
    </form>
  );
}

export function SalesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="sales-page min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="sales-container flex h-[72px] items-center justify-between gap-4">
          <a href="#inicio" aria-label="mestrra, início">
            <Brand />
          </a>
          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex"
          >
            <a href="#recursos" className="hover:text-foreground">
              O que você resolve
            </a>
            <a href="#como-funciona" className="hover:text-foreground">
              Como funciona
            </a>
            <a href="#precos" className="hover:text-foreground">
              Plano mensal
            </a>
            <a href="#faq" className="hover:text-foreground">
              Dúvidas
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild>
              <Link to="/auth" search={{ mode: "login" }}>
                Entrar
              </Link>
            </Button>
            <Button asChild>
              <a href="#precos">
                Conhecer o plano <ArrowUpRight size={15} />
              </a>
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="sales-mobile-menu"
            className="md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
        {menuOpen && (
          <nav
            id="sales-mobile-menu"
            aria-label="Navegação móvel"
            className="sales-container grid gap-1 border-t py-4 md:hidden"
          >
            {[
              ["O que você resolve", "#recursos"],
              ["Como funciona", "#como-funciona"],
              ["Plano mensal", "#precos"],
              ["Dúvidas", "#faq"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="py-2 text-sm">
                {label}
              </a>
            ))}
            <Button variant="outline" asChild>
              <Link to="/auth" search={{ mode: "login" }}>
                Entrar na minha conta
              </Link>
            </Button>
          </nav>
        )}
      </header>
      <main>
        <section id="inicio" className="sales-intro scroll-mt-20 overflow-hidden bg-card">
          <div className="sales-container relative pt-10 text-center sm:pt-12">
            <p className="sales-eyebrow">Para quem faz o negócio acontecer</p>
            <h1 className="mt-3 text-5xl font-extrabold sm:text-6xl">
              mestrra<span className="text-primary">.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-2xl leading-tight font-bold sm:text-3xl">
              Seu custo vira preço. Sua venda vira resultado.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Estoque, precificação, conteúdo, cobrança e caixa conectados para você cuidar do
              negócio — sem decidir tudo no escuro.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild className="h-11 px-6">
                <a href="#precos">
                  Conhecer o plano mensal <ArrowRight size={16} />
                </a>
              </Button>
              <Button asChild variant="outline" className="h-11 px-6">
                <Link to="/demo">
                  Explorar demonstração <ArrowUpRight size={16} />
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {money(SUBSCRIPTION_PRICE)}/mês · Plano completo · Sem fidelidade
            </p>
            <Link
              to="/demo"
              className="sales-product-glimpse mt-8 block"
              aria-label="Explorar o painel da mestrra na demonstração"
            >
              <img
                src={workspace.url}
                alt="Painel real da demonstração mestrra com faturamento, custos, lucro e movimento do caixa do Doce Atelier."
                width={1280}
                height={950}
                className="w-full"
                fetchPriority="high"
              />
            </Link>
          </div>
        </section>

        <section className="border-y bg-brand py-5 text-brand-foreground">
          <div className="sales-container flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold sm:text-sm">
            {["Estoque", "Precificação", "Marketing", "Cobrança", "Caixa"].map((step, index) => (
              <span key={step} className="flex items-center gap-6">
                <span className="flex items-center gap-2">
                  <span className="text-info">0{index + 1}</span>
                  {step}
                </span>
                {index < 4 && (
                  <ArrowRight size={13} className="hidden text-brand-foreground/35 sm:block" />
                )}
              </span>
            ))}
          </div>
        </section>

        <section id="recursos" className="sales-section scroll-mt-24">
          <div className="sales-container">
            <div className="grid gap-5 lg:grid-cols-2 lg:items-end">
              <div>
                <p className="sales-eyebrow">Menos pontas soltas</p>
                <h2 className="sales-heading mt-3">
                  Você já faz muita coisa.
                  <br />
                  Não precisa fazer tudo separado.
                </h2>
              </div>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                O insumo está numa anotação. O preço, numa planilha. A venda, na conversa. A mestrra
                reúne essas informações para que uma etapa alimente a próxima.
              </p>
            </div>
            <div className="mt-12 grid gap-x-10 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <article key={feature.title} className="border-t py-7">
                  <div className="flex items-center justify-between">
                    <feature.icon size={24} className="text-info" />
                    <span className="text-xs text-muted-foreground">0{index + 1}</span>
                  </div>
                  <p className="mt-6 text-xs font-semibold text-muted-foreground">
                    {feature.detail}
                  </p>
                  <h3 className="mt-2 text-lg leading-snug font-bold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              ))}
              <div className="flex flex-col justify-center border-t py-7">
                <p className="text-xl leading-snug font-bold">
                  Conheça a rotina.
                  <br />
                  Antes de escolher o plano.
                </p>
                <Button asChild variant="link" className="mt-4 justify-start px-0 text-info">
                  <Link to="/demo">
                    Abrir demonstração <ArrowUpRight size={16} />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="sales-section scroll-mt-24 border-y bg-card">
          <div className="sales-container">
            <p className="sales-eyebrow">Uma informação leva à próxima</p>
            <h2 className="sales-heading mt-3">
              Da primeira ficha técnica
              <br />
              ao resultado no caixa.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Comece pelo que você faz",
                  text: "Cadastre os insumos e as ofertas do seu negócio. Informe o tempo, os materiais e os custos envolvidos.",
                },
                {
                  title: "Defina preço e prepare a oferta",
                  text: "Simule a margem, salve seu preço e use os benefícios cadastrados para preparar posts e mensagens.",
                },
                {
                  title: "Registre a venda. Veja o resultado.",
                  text: "Acompanhe pedidos, materiais consumidos e movimentações do caixa. Use os números para planejar a próxima venda.",
                },
              ].map((step, index) => (
                <div key={step.title} className="border-t pt-5">
                  <span className="text-sm font-bold text-info">0{index + 1}</span>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex items-center justify-between gap-4 border-t pt-6">
              <p className="text-xs text-muted-foreground">
                Painel mestrra · Negócio de demonstração, com dados de exemplo
              </p>
              <Button variant="link" asChild className="shrink-0 px-0 text-info">
                <Link to="/demo">
                  Explorar <ArrowUpRight size={15} />
                </Link>
              </Button>
            </div>
            <Link
              to="/demo"
              aria-label="Abrir demonstração do painel mestrra"
              className="mt-5 block overflow-hidden rounded-xl border"
            >
              <img
                src={workspace.url}
                alt="Demonstração do painel mestrra: faturamento, despesas, lucro líquido, gráfico de caixa e últimas vendas."
                width={1280}
                height={950}
                loading="lazy"
                className="h-auto w-full"
              />
            </Link>
          </div>
        </section>

        <section className="sales-section">
          <div className="sales-container">
            <p className="sales-eyebrow">Seu jeito de trabalhar, com mais clareza</p>
            <h2 className="sales-heading mt-3">Produto, serviço ou os dois.</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {routines.map((routine) => (
                <article key={routine.title} className="border-t pt-6">
                  <h3 className="text-lg font-bold">{routine.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {routine.description}
                  </p>
                  <p className="mt-5 text-xs font-semibold text-info">{routine.example}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="precos" className="sales-section scroll-mt-24 border-y bg-info-soft/40">
          <div className="sales-container">
            <div className="max-w-2xl">
              <p className="sales-eyebrow">Investimento no seu negócio</p>
              <h2 className="sales-heading mt-3">
                Um plano completo.
                <br />
                Uma mensalidade clara.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Da organização dos insumos ao acompanhamento do caixa, sem precisar escolher quais
                etapas ficam de fora.
              </p>
            </div>
            <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div className="pt-3">
                <h3 className="text-lg font-bold">O que faz parte da sua assinatura</h3>
                <div className="mt-6 divide-y border-y">
                  {features.map((feature) => (
                    <div key={feature.detail} className="flex gap-4 py-4">
                      <Check size={18} className="mt-0.5 shrink-0 text-info" />
                      <div>
                        <p className="text-sm font-bold">{feature.detail}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCcw size={14} className="shrink-0" />
                  Atualizações da plataforma incluídas na assinatura.
                </p>
              </div>
              <article className="self-start overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b bg-brand px-7 py-6 text-brand-foreground">
                  <p className="text-xs font-semibold text-brand-foreground/70">
                    ASSINATURA MENSAL
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">mestrra completa</h3>
                </div>
                <div className="p-7 sm:p-8">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-4xl font-extrabold sm:text-5xl">
                      {money(SUBSCRIPTION_PRICE)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Cobrança recorrente mensal. Sem fidelidade.
                  </p>
                  <div className="my-6 border-t" />
                  <CheckoutForm />
                  <div className="mt-6 border-t pt-5">
                    <p className="flex items-center gap-2 text-xs font-semibold">
                      <ShieldCheck size={16} className="text-info" />
                      Pagamento processado pelo Mercado Pago
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      As tarifas do Mercado Pago sobre cobranças aos seus clientes são separadas da
                      mensalidade mestrra.
                    </p>
                  </div>
                </div>
              </article>
            </div>
            <div className="mt-10 flex flex-col justify-between gap-4 border-t border-info/20 pt-6 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                Quer ver a mestrra por dentro antes de assinar?
              </p>
              <Button asChild variant="outline">
                <Link to="/demo">
                  Conhecer com dados de exemplo <ArrowUpRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="faq" className="sales-section scroll-mt-24 bg-card">
          <div className="sales-container grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:sticky lg:top-28">
              <p className="sales-eyebrow">Antes de decidir</p>
              <h2 className="sales-heading mt-3">
                Dúvidas reais.
                <br />
                Respostas diretas.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Como o preço é calculado, o que acontece com o estoque e quais custos entram na
                assinatura. Sem promessas vagas.
              </p>
              <Button asChild variant="link" className="mt-5 px-0 text-info">
                <Link to="/demo">
                  Tire suas próprias conclusões <ArrowUpRight size={16} />
                </Link>
              </Button>
            </div>
            <Accordion type="single" collapsible defaultValue="faq-0" className="border-t">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`}>
                  <AccordionTrigger className="gap-5 py-6 hover:no-underline">
                    <span>
                      <span className="mb-2 block text-[11px] font-semibold text-info">
                        {faq.group}
                      </span>
                      <span className="block text-base leading-snug font-semibold">
                        {faq.question}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="max-w-xl pr-6 pb-6 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="bg-brand py-16 text-brand-foreground sm:py-20">
          <div className="sales-container flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-semibold text-info">SEU PRÓXIMO PASSO</p>
              <h2 className="mt-3 text-3xl leading-tight font-bold sm:text-4xl">
                O negócio é seu.
                <br />
                Os números também precisam ser.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-brand-foreground/70">
                Conheça a mestrra e encontre uma forma mais conectada de organizar, precificar e
                acompanhar suas vendas.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 lg:w-auto">
              <Button asChild className="h-12 px-7">
                <a href="#precos">
                  Conhecer o plano de {money(SUBSCRIPTION_PRICE)}/mês <ArrowRight size={16} />
                </a>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
              >
                <Link to="/demo">Prefiro explorar a demonstração</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-card py-8">
        <div className="sales-container flex flex-col items-start justify-between gap-5 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <Brand />
          <p>Gestão para quem faz o negócio acontecer.</p>
          <Link to="/auth" search={{ mode: "login" }} className="hover:text-foreground">
            Já sou cliente <ArrowUpRight size={12} className="ml-1 inline" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
