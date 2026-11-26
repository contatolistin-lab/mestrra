import { useState } from "react";
import { CalendarDays, Check, Copy, Download, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContentInput } from "@/lib/mestrra";
import {
  contentDates,
  generateMarketingDrafts,
  type MarketingDraft,
  type MarketingOptions,
  type MarketingTool,
} from "@/lib/marketing-tools";

const headings: Record<MarketingTool, string> = {
  campaign: "Campanha de divulgação",
  calendar: "Sua semana de conteúdo",
  reply: "Respostas para clientes",
  profile: "Perfil comercial",
};

export function MarketingTools({
  tool,
  content,
  onCopy,
}: {
  tool: MarketingTool;
  content: ContentInput;
  onCopy: (text: string) => Promise<void>;
}) {
  const [options, setOptions] = useState<MarketingOptions>({
    goal: "sell",
    detail: "",
    contact: "",
    startDate: "",
    situation: "price",
    customer: "",
    business: "",
    city: "",
  });
  const [drafts, setDrafts] = useState<MarketingDraft[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const set = (key: keyof MarketingOptions, value: string) =>
    setOptions((old) => ({ ...old, [key]: value }));
  const valid =
    content.name.trim() &&
    content.name !== "seu produto ou serviço" &&
    (tool !== "calendar" || contentDates(options.startDate).length === 7);
  const changed = source !== JSON.stringify({ content, options });
  const allText = drafts.map((draft) => `${draft.title}\n${draft.text}`).join("\n\n──────────\n\n");

  function generate() {
    setDrafts(generateMarketingDrafts(tool, content, options));
    setCompleted([]);
    setSource(JSON.stringify({ content, options }));
  }

  function download() {
    const url = URL.createObjectURL(new Blob([allText], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mestrra-${tool}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4 border-b pb-5">
        <h2 className="section-heading">{headings[tool]}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {tool === "campaign" && (
            <label className="field">
              Objetivo da campanha
              <select value={options.goal} onChange={(e) => set("goal", e.target.value)}>
                <option value="sell">Receber mais pedidos</option>
                <option value="launch">Apresentar uma novidade</option>
                <option value="return">Trazer clientes de volta</option>
              </select>
            </label>
          )}
          {tool === "calendar" && (
            <label className="field">
              Primeiro dia da semana
              <input
                type="date"
                value={options.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </label>
          )}
          {tool === "reply" && (
            <>
              <label className="field">
                Situação do atendimento
                <select
                  value={options.situation}
                  onChange={(e) => set("situation", e.target.value)}
                >
                  <option value="price">Cliente perguntou o preço</option>
                  <option value="expensive">Cliente achou caro</option>
                  <option value="discount">Cliente pediu desconto</option>
                  <option value="delivery">Cliente perguntou prazo ou entrega</option>
                  <option value="followup">Cliente parou de responder</option>
                  <option value="review">Pedir avaliação após a compra</option>
                </select>
              </label>
              <label className="field">
                Nome do cliente (opcional)
                <input
                  value={options.customer}
                  onChange={(e) => set("customer", e.target.value)}
                  placeholder="Ex.: Ana"
                />
              </label>
            </>
          )}
          {tool === "profile" && (
            <>
              <label className="field">
                Nome do negócio
                <input
                  value={options.business}
                  onChange={(e) => set("business", e.target.value)}
                  placeholder="Ex.: Ateliê da Ana"
                />
              </label>
              <label className="field">
                Cidade ou região (opcional)
                <input
                  value={options.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Ex.: Campinas e região"
                />
              </label>
            </>
          )}
          {tool !== "reply" && (
            <label className="field">
              Contato ou link para pedidos (opcional)
              <input
                value={options.contact}
                onChange={(e) => set("contact", e.target.value)}
                placeholder="Ex.: seu link do WhatsApp"
              />
            </label>
          )}
          <label className="field sm:col-span-2">
            {tool === "reply"
              ? "Complemento da resposta (opcional)"
              : "Condições reais da oferta ou atendimento (opcional)"}
            <textarea
              rows={2}
              value={options.detail}
              onChange={(e) => set("detail", e.target.value)}
              placeholder={
                tool === "reply"
                  ? "Ex.: Retirada na loja após a confirmação do pedido."
                  : "Ex.: Encomendas até sexta. Retirada no sábado, das 9h às 12h."
              }
            />
          </label>
        </div>
        <Button disabled={!valid} onClick={generate}>
          <Sparkles />
          {drafts.length ? "Atualizar textos" : "Gerar textos"}
        </Button>
      </section>
      {drafts.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm">
                {tool === "calendar" ? "Agenda da semana" : "Textos da sua divulgação"}
              </h3>
              {tool === "calendar" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {completed.length} de 7 publicações concluídas
                </p>
              )}
              {changed && (
                <p role="status" className="mt-1 text-xs text-primary">
                  Dados alterados. Os textos abaixo são da versão anterior.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void onCopy(allText)}>
                <Copy />
                Copiar tudo
              </Button>
              <Button variant="outline" size="sm" onClick={download}>
                <Download />
                Baixar textos
              </Button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {drafts.map((draft) => (
              <article key={draft.id} className="surface min-w-0 p-5">
                <div className="flex items-center gap-2 text-info">
                  {tool === "calendar" ? <CalendarDays size={16} /> : <Sparkles size={16} />}
                  <span className="text-[11px] font-semibold">{draft.tag}</span>
                </div>
                <h4 className="my-3 text-sm font-bold">{draft.title}</h4>
                <label className="field">
                  <span className="sr-only">Editar {draft.title}</span>
                  <textarea
                    rows={tool === "reply" ? 8 : 10}
                    value={draft.text}
                    onChange={(e) =>
                      setDrafts((old) =>
                        old.map((entry) =>
                          entry.id === draft.id ? { ...entry, text: e.target.value } : entry,
                        ),
                      )
                    }
                  />
                </label>
                {tool === "profile" && draft.id === "bio" && (
                  <p
                    className={`mt-2 text-xs ${draft.text.length > 150 ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {draft.text.length}/150 caracteres
                    {draft.text.length > 150 ? " · Encurte antes de publicar no Instagram." : ""}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                  <Button variant="outline" size="sm" onClick={() => void onCopy(draft.text)}>
                    <Copy />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(draft.text)}`,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    <MessageCircle />
                    WhatsApp
                  </Button>
                  {tool === "calendar" && (
                    <Button
                      variant={completed.includes(draft.id) ? "info" : "ghost"}
                      size="sm"
                      aria-pressed={completed.includes(draft.id)}
                      onClick={() =>
                        setCompleted((old) =>
                          old.includes(draft.id)
                            ? old.filter((id) => id !== draft.id)
                            : [...old, draft.id],
                        )
                      }
                    >
                      <Check />
                      {completed.includes(draft.id) ? "Concluído" : "Marcar concluído"}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
