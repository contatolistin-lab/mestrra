import { money, type ContentInput } from "@/lib/mestrra";

export type MarketingTool = "campaign" | "calendar" | "reply" | "profile";
export type MarketingOptions = {
  goal: string;
  detail: string;
  contact: string;
  startDate: string;
  situation: string;
  customer: string;
  business: string;
  city: string;
};
export type MarketingDraft = { id: string; title: string; tag: string; text: string };

export function marketingPrice(item: ContentInput): number {
  return item.is_promo_sale_active && item.promo_sale_price != null && item.promo_sale_price > 0
    ? item.promo_sale_price
    : item.suggested_price;
}

export function contentDates(start: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return [];
  const date = new Date(`${start}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return [];
  const normalized = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (normalized !== start) return [];
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date);
    day.setDate(date.getDate() + index);
    return day.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  });
}

export function generateMarketingDrafts(
  tool: MarketingTool,
  item: ContentInput,
  options: MarketingOptions,
): MarketingDraft[] {
  const price = marketingPrice(item);
  const offer = `${item.name}${price > 0 ? ` por ${money(price)}` : ""}`;
  const benefit = item.main_benefit || "uma opção feita com atenção aos detalhes";
  const audience = item.target_audience || "você";
  const cta = options.contact.trim()
    ? `Fale comigo: ${options.contact.trim()}`
    : "Me chame para consultar os detalhes e fazer seu pedido.";
  const details = options.detail.trim() ? `\n${options.detail.trim()}` : "";
  const draft = (id: string, title: string, tag: string, text: string) => ({
    id,
    title,
    tag,
    text,
  });

  if (tool === "campaign") {
    const opening =
      options.goal === "launch"
        ? `Novidade por aqui: ${item.name}!`
        : options.goal === "return"
          ? `Que tal conhecer ${item.name} de novo?`
          : `Seu próximo pedido pode ser ${item.name}.`;
    return [
      draft(
        "feed",
        "Publicação da campanha",
        "INSTAGRAM · FEED",
        `${opening}\n\nPara ${audience}, com foco em ${benefit}.\n\n${offer}.${details}\n\n${cta}`,
      ),
      draft(
        "status",
        "Status e Stories",
        "3 PUBLICAÇÕES",
        `1 · APRESENTAÇÃO\n${opening}\nMostre uma foto real do produto ou serviço.\n\n2 · DETALHE\n${benefit}.\nMostre um detalhe do preparo ou atendimento.\n\n3 · PEDIDO\n${offer}.${details}\n${cta}`,
      ),
      draft(
        "message",
        "Mensagem de divulgação",
        "WHATSAPP",
        `Olá! Tudo bem? ${opening}\n\n${benefit}.\n${offer}.${details}\n\nSe fizer sentido para você, posso te contar mais. ${cta}`,
      ),
    ];
  }
  if (tool === "calendar") {
    const dates = contentDates(options.startDate);
    const days = [
      [
        "Apresentar",
        "Foto · Feed",
        `Conheça ${item.name}: ${benefit}.\n\nPensado para ${audience}. ${cta}`,
      ],
      [
        "Mostrar o processo",
        "Bastidores · Stories",
        `Hoje tem bastidores de ${item.name}.\n\nMostre uma etapa real do preparo ou atendimento e conte por que ela importa.`,
      ],
      [
        "Conversar",
        "Enquete · Stories",
        `O que mais importa para você ao escolher ${item.name}?\n\nEnquete: “Qualidade” / “Praticidade”.\nDepois, responda as dúvidas que chegarem.`,
      ],
      [
        "Explicar o valor",
        "Vídeo · Reels",
        `GANCHO: O que considerar antes de escolher ${item.name}?\nCENA: Mostre um detalhe real e explique o cuidado envolvido.\nFECHAMENTO: ${benefit}. ${cta}`,
      ],
      ["Convidar para comprar", "Oferta · Feed", `${offer}.\n\n${benefit}.${details}\n\n${cta}`],
      [
        "Ouvir clientes",
        "Conversa · WhatsApp",
        `Olá! Como foi sua experiência com ${item.name}?\n\nO que você mais gostou e o que podemos melhorar? Obrigado por compartilhar!`,
      ],
      [
        "Retomar o interesse",
        "Lembrete · Stories",
        `Ficou alguma dúvida sobre ${item.name}?\n\n${offer}.\n${cta}`,
      ],
    ];
    return dates.flatMap((date, index) => {
      const day = days[index];
      if (!day) return [];
      return [draft(`day-${index}`, `${date} · ${day[0]}`, day[1] || "", day[2] || "")];
    });
  }
  if (tool === "reply") {
    const hello = options.customer.trim() ? `Olá, ${options.customer.trim()}!` : "Olá!";
    const answers: Record<string, string> = {
      price: `O valor de ${item.name} é ${price > 0 ? money(price) : "definido conforme o pedido"}. O foco é ${benefit}. Qual detalhe você gostaria de saber antes de decidir?`,
      expensive: `Entendo que o valor precisa fazer sentido para você. Em ${item.name}, o foco é ${benefit}. O que você está buscando? Assim consigo te explicar melhor a proposta, sem compromisso.`,
      discount: `Obrigado pelo interesse em ${item.name}! Vou conferir as condições disponíveis para o seu pedido antes de confirmar qualquer desconto. Qual quantidade ou serviço você precisa?`,
      delivery: `Vou verificar a disponibilidade de ${item.name} e confirmar o prazo antes de fechar seu pedido. Para qual data você precisa e em qual região?`,
      followup: `Passando para saber se ficou alguma dúvida sobre ${item.name}. Se ainda estiver procurando, posso te ajudar a avaliar os detalhes. Se não for o momento, tudo bem!`,
      review: `Como foi sua experiência com ${item.name}? Se puder, conte o que gostou e o que podemos melhorar. Posso compartilhar seu comentário na nossa página? Só publicarei com sua autorização.`,
    };
    return [
      draft(
        "reply",
        "Resposta ao cliente",
        "WHATSAPP · ATENDIMENTO",
        `${hello}\n\n${answers[options.situation] || answers["price"]}${details}`,
      ),
    ];
  }
  const business = options.business.trim() || item.name;
  const location = options.city.trim() ? `\n📍 ${options.city.trim()}` : "";
  return [
    draft(
      "bio",
      "Bio do Instagram",
      "PERFIL COMERCIAL",
      `${business}\n${item.name} · ${benefit}${location}\n${cta}`,
    ),
    draft(
      "description",
      "Descrição do WhatsApp Business",
      "PERFIL COMERCIAL",
      `${business}: ${item.name} para ${audience}. Nosso foco é ${benefit}.${location}${details}\n${cta}`,
    ),
    draft(
      "greeting",
      "Mensagem de boas-vindas",
      "WHATSAPP BUSINESS",
      `Olá! Bem-vindo à ${business}.\n\nObrigado pelo contato! Você quer saber mais sobre ${item.name} ou fazer um pedido? Conte o que precisa e retornaremos assim que possível.${details}`,
    ),
  ];
}
