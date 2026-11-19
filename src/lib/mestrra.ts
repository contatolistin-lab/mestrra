export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
export const shortDate = (value: string) =>
  new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString("pt-BR");
export const phoneMask = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
export function priceCalculation(
  materials: number,
  minutes: number,
  hourly: number,
  fixedPercent: number,
  taxPercent: number,
  margin: number,
) {
  const labor = (minutes / 60) * hourly;
  const fixed = ((materials + labor) * fixedPercent) / 100;
  const cost = materials + labor + fixed;
  const denominator = 1 - (taxPercent + margin) / 100;
  if (denominator <= 0) return { labor, fixed, cost, price: 0, tax: 0, profit: 0, valid: false };
  const price = cost / denominator;
  return {
    labor,
    fixed,
    cost,
    price,
    tax: (price * taxPercent) / 100,
    profit: (price * margin) / 100,
    valid: true,
  };
}
export function unitCost(regular: number, promo: number | null, quantity: number, active: boolean) {
  if (quantity <= 0) return 0;
  return (active && promo && promo > 0 ? promo : regular) / quantity;
}
export const routeMeta = (title: string, description: string) => ({
  meta: [
    { title: `${title} · Mestrra` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · Mestrra` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
export type ContentInput = {
  name: string;
  target_audience?: string | null;
  main_benefit?: string | null;
  pain_point_solved?: string | null;
  suggested_price: number;
  promo_sale_price?: number | null;
  is_promo_sale_active?: boolean;
};
export function generateCopy(item: ContentInput, tone: string, channel: string, link = "") {
  const price = money(
    item.is_promo_sale_active && item.promo_sale_price
      ? item.promo_sale_price
      : item.suggested_price,
  );
  const audience = item.target_audience || "quem busca qualidade e cuidado";
  const benefit = item.main_benefit || "qualidade e atenção em cada detalhe";
  const pain = item.pain_point_solved || "a dificuldade de encontrar a solução certa";
  const opening =
    tone === "urgente"
      ? `Hoje é o dia de conhecer ${item.name}!`
      : tone === "educativo"
        ? `O que você precisa saber antes de escolher ${item.name}?`
        : tone === "objecao"
          ? `Vale a pena investir em ${item.name}?`
          : `Um cuidado especial para você: ${item.name}.`;
  const cta = `Quer saber mais? Me chame e vamos conversar!${link ? `\n${link}` : ""}`;
  if (channel === "whatsapp")
    return [
      {
        title: "Apresentação irresistível",
        tag: "PRIMEIRO CONTATO",
        text: `Olá! Que bom receber seu contato. 😊\n\n${opening}\nFoi pensado para ${audience}, com foco em ${benefit}.\n\nO investimento é de ${price}. Posso te explicar como funciona?${link ? `\n${link}` : ""}`,
      },
      {
        title: "Quebra de objeção",
        tag: "VALOR, NÃO SÓ PREÇO",
        text: `Entendo que você queira avaliar com calma. ${item.name} não é só uma compra: é uma forma de lidar com ${pain} e ter ${benefit}.\n\nO valor é ${price}. Qual ponto você gostaria de entender melhor antes de decidir?`,
      },
      {
        title: "Follow-up educado",
        tag: "RETOMAR A CONVERSA",
        text: `Oi! Passando para saber se ficou alguma dúvida sobre ${item.name}. 😊\n\nEstou por aqui para ajudar na sua escolha, sem pressa. Faz sentido para o que você precisa hoje?\n\n${cta}`,
      },
      {
        title: "Reativação e pós-venda",
        tag: "CULTIVAR RELACIONAMENTOS",
        text: `Olá! Como foi sua experiência com a gente? Sua opinião importa muito.\n\nLembrei de você porque ${item.name} pode ser uma ótima escolha para ter ${benefit} de novo.\n\nSe quiser, te conto os detalhes. ${price}. ${cta}`,
      },
    ];
  return [
    {
      title: "Roteiro de Reels",
      tag: "30–45 SEGUNDOS · AIDA",
      text: `[0–3s · GANCHO]\n${opening}\n\n[3–18s · DESENVOLVIMENTO]\nMostre como ${item.name} ajuda a resolver ${pain}. Apresente o processo com imagens reais.\n\n[18–30s · DIFERENCIAL]\nDestaque ${benefit} e mostre um detalhe concreto do produto ou atendimento.\n\n[30–45s · CHAMADA]\nPara ${audience}. A partir de ${price}. ${cta}`,
    },
    {
      title: "Sequência de Stories",
      tag: "4 STORIES · PAS",
      text: `STORY 1 · CONVERSA\nVocê também sente ${pain}? Enquete: “Sim” / “Quero saber mais”.\n\nSTORY 2 · BASTIDORES\nMostre como ${item.name} é preparado, com cuidado em cada detalhe.\n\nSTORY 3 · BENEFÍCIO\n${benefit}. Responda uma dúvida real que você costuma receber.\n\nSTORY 4 · OFERTA\n${item.name} por ${price}. ${cta}`,
    },
    {
      title: "Legenda para Feed",
      tag: "FEED & CARROSSEL · ANTES–DEPOIS–PONTE",
      text: `${opening}\n\nAntes: ${pain}.\nDepois: ${benefit}.\nA ponte entre os dois? ${item.name}, pensado para ${audience}.\n\nCada detalhe importa. Conheça o processo e escolha o que faz sentido para você.\n\n${price}\n${cta}\n\n#${item.name.replace(/[^a-zA-ZÀ-ÿ0-9]/g, "")} #PequenosNegócios #FeitoComCuidado #Empreendedorismo`,
    },
  ];
}
