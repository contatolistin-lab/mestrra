import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clipboard, Copy, Megaphone, MessageCircle, Store, Sparkles, WandSparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { BusinessData } from "@/lib/business.functions";
import { generateCopy, money } from "@/lib/mestrra";
import { toast } from "sonner";
import { MarketingTools } from "@/components/mestrra/marketing-tools";

const tones = [
  { value: "urgente", label: "Direto e Urgente", hint: "Oferta relâmpago" },
  { value: "educativo", label: "Educativo e Autoridade", hint: "Ensine e convença" },
  { value: "acolhedor", label: "Acolhedor e Próximo", hint: "Crie conexão" },
  { value: "objecao", label: "Quebra de Objeção", hint: "Derrube dúvidas" },
];

export function Copiloto({
  data,
  initialItemId,
}: {
  data: BusinessData;
  initialItemId: string | undefined;
}) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(
    initialItemId && data.catalog.some((item) => item.id === initialItemId)
      ? initialItemId
      : "free",
  );
  const [tone, setTone] = useState("acolhedor");
  const [freeName, setFreeName] = useState("");
  const [freePrice, setFreePrice] = useState(0);
  const [freeAudience, setFreeAudience] = useState("");
  const [freeBenefit, setFreeBenefit] = useState("");
  const [freePain, setFreePain] = useState("");

  const item = data.catalog.find((entry) => entry.id === selected);
  const content = useMemo(
    () =>
      item || {
        name: freeName || "seu produto ou serviço",
        target_audience: freeAudience || null,
        main_benefit: freeBenefit || null,
        pain_point_solved: freePain || null,
        suggested_price: freePrice || 0,
        promo_sale_price: null,
        is_promo_sale_active: false,
      },
    [item, freeName, freePrice, freeAudience, freeBenefit, freePain],
  );
  const instagram = useMemo(() => generateCopy(content, tone, "instagram"), [content, tone]);
  const whatsapp = useMemo(() => generateCopy(content, tone, "whatsapp"), [content, tone]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Texto copiado. Cole onde quiser!");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  async function refine(text: string) {
    const prompt = `Você é um copywriter brasileiro sênior especializado em Instagram e WhatsApp para pequenos negócios. Reescreva o texto abaixo mantendo a proposta, o tom e a chamada para ação, mas deixando-o mais humano, específico e persuasivo. Use português do Brasil, frases curtas e sem promessas irreais.\n\nTOM DE VOZ: ${tones.find((entry) => entry.value === tone)?.label}\nPRODUTO OU SERVIÇO: ${content.name}\nPÚBLICO: ${content.target_audience || "não informado"}\nBENEFÍCIO: ${content.main_benefit || "não informado"}\nDOR: ${content.pain_point_solved || "não informado"}\nPREÇO: ${money(content.suggested_price)}\n\nTEXTO ORIGINAL:\n${text}\n\nEntregue apenas a versão final, pronta para publicar.`;
    await copy(prompt);
    window.open("https://chatgpt.com", "_blank", "noopener,noreferrer");
  }

  function cards(
    list: { title: string; tag: string; text: string }[],
    channel: "instagram" | "whatsapp",
  ) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((card) => (
          <article key={card.title} className="surface flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`status ${channel === "whatsapp" ? "" : "info"}`}>{card.tag}</span>
                <h3 className="mt-3 text-sm font-bold">{card.title}</h3>
              </div>
              <WandSparkles size={17} className="text-info" />
            </div>
            <pre className="mt-4 flex-1 whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-muted-foreground">
              {card.text}
            </pre>
            <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
              <Button size="sm" variant="outline" onClick={() => void copy(card.text)}>
                <Copy size={13} /> Copiar texto
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(card.text)}`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                <MessageCircle size={13} /> Abrir no WhatsApp
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-info"
                onClick={() => void refine(card.text)}
              >
                <Sparkles size={13} /> Refinar com IA
              </Button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">
          Copiloto de marketing<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Sua divulgação, seus pedidos e o relacionamento com seus clientes.
        </p>
      </div>

      <section className="border-y py-5 space-y-5">
        <div className="flex items-center gap-2">
          <Clipboard size={17} className="text-info" />
          <h2 className="section-heading">O que vamos vender hoje?</h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <label className="field">
            Produto ou serviço da sua esteira
            <select value={selected} onChange={(event) => setSelected(event.target.value)}>
              {data.catalog.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} · {money(entry.suggested_price)}
                </option>
              ))}
              <option value="free">Tema livre (preencher abaixo)</option>
            </select>
          </label>
          <div>
            <p className="text-xs font-medium mb-2">Tom de voz e objetivo</p>
            <div className="flex flex-wrap gap-2">
              {tones.map((entry) => (
                <Button
                  key={entry.value}
                  size="sm"
                  variant={tone === entry.value ? "default" : "outline"}
                  title={entry.hint}
                  onClick={() => setTone(entry.value)}
                >
                  {entry.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        {selected === "free" && (
          <div className="grid sm:grid-cols-2 gap-4 rounded-xl bg-background p-4">
            <label className="field">
              Nome do tema
              <input
                value={freeName}
                onChange={(event) => setFreeName(event.target.value)}
                placeholder="Ex.: Brownies de fim de semana"
              />
            </label>
            <label className="field">
              Preço (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                value={freePrice || ""}
                onChange={(event) => setFreePrice(Number(event.target.value))}
              />
            </label>
            <label className="field">
              Público-alvo
              <input
                value={freeAudience}
                onChange={(event) => setFreeAudience(event.target.value)}
              />
            </label>
            <label className="field">
              Principal benefício
              <input value={freeBenefit} onChange={(event) => setFreeBenefit(event.target.value)} />
            </label>
            <label className="field sm:col-span-2">
              Dor que resolve
              <input value={freePain} onChange={(event) => setFreePain(event.target.value)} />
            </label>
          </div>
        )}
        <div className="rounded-xl bg-info-soft p-4 text-[11px] text-brand">
          <strong>{item?.name || freeName || "Seu item"}</strong> ·{" "}
          {money(
            item?.is_promo_sale_active && item.promo_sale_price
              ? item.promo_sale_price
              : content.suggested_price,
          )}
          {(item?.target_audience || freeAudience) && (
            <> · Para {item?.target_audience || freeAudience}</>
          )}
        </div>
      </section>

      <Tabs defaultValue="instagram">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3">
          <TabsTrigger className="min-h-10 gap-2 text-xs" value="instagram"><WandSparkles size={15} />Instagram</TabsTrigger>
          <TabsTrigger className="min-h-10 gap-2 text-xs" value="whatsapp"><MessageCircle size={15} />WhatsApp</TabsTrigger>
          <TabsTrigger className="min-h-10 gap-2 text-xs" value="campaign"><Megaphone size={15} />Campanhas</TabsTrigger>
          <TabsTrigger className="min-h-10 gap-2 text-xs" value="calendar"><CalendarDays size={15} />Calendário</TabsTrigger>
          <TabsTrigger className="min-h-10 gap-2 text-xs" value="reply"><MessageCircle size={15} />Atendimento</TabsTrigger>
          <TabsTrigger className="min-h-10 gap-2 text-xs" value="profile"><Store size={15} />Perfil comercial</TabsTrigger>
        </TabsList>
        <TabsContent value="instagram" className="mt-4">
          {cards(instagram, "instagram")}
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-4">
          {cards(whatsapp, "whatsapp")}
        </TabsContent>
        {(["campaign", "calendar", "reply", "profile"] as const).map((tool) => (
          <TabsContent key={tool} value={tool} className="mt-5">
            <MarketingTools tool={tool} content={content} onCopy={copy} />
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button className="h-auto min-h-9 whitespace-normal text-left" onClick={() => void navigate({ to: "/vendas", search: { itemId: item?.id } })}>
          Gerar link de cobrança para este item <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
