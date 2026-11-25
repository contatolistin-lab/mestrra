import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Link2,
  MessageCircle,
  QrCode,
  ShoppingBag,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/resolved-client";
import type { BusinessData } from "@/lib/business.functions";
import { isDemoMode } from "@/lib/demo-mode";
import { resolvePriceBand, useManagementState, type Quote } from "@/lib/management";
import { money, phoneMask, shortDate } from "@/lib/mestrra";
import { requiredStock, stockShortageMessage } from "@/lib/stock";
import { toast } from "sonner";
import { QuotePanel } from "./management";

export function Sales({
  data,
  initialItemId,
}: {
  data: BusinessData;
  initialItemId: string | undefined;
}) {
  const client = useQueryClient();
  const { state: management } = useManagementState(data.userId);
  const [itemId, setItemId] = useState(
    initialItemId && data.catalog.some((item) => item.id === initialItemId) ? initialItemId : "",
  );
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [promo, setPromo] = useState(false);
  const [method, setMethod] = useState<"manual_pix" | "manual_dinheiro" | "manual_cartao">(
    "manual_pix",
  );
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<{
    url: string;
    orderId: string;
    customer: string;
    phone: string;
  } | null>(null);
  const [qr, setQr] = useState("");
  const [filter, setFilter] = useState("all");

  const item = data.catalog.find((entry) => entry.id === itemId);
  const priceBand = resolvePriceBand(
    management.bands,
    itemId,
    quantity,
    item ? (promo && item.promo_sale_price ? item.promo_sale_price : item.suggested_price) : 0,
  );
  const unitPrice = priceBand.price;
  const total = unitPrice * quantity;
  const shortage = useMemo(
    () =>
      item
        ? requiredStock(data, item.id, quantity).filter((row) => row.available < row.needed)
        : [],
    [data, item, quantity],
  );

  useEffect(() => {
    if (!checkout) {
      setQr("");
      return;
    }
    let active = true;
    void QRCode.toDataURL(checkout.url, {
      width: 260,
      margin: 1,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    })
      .then((url) => {
        if (active) setQr(url);
      })
      .catch(() => {
        if (active) setQr("");
      });
    return () => {
      active = false;
    };
  }, [checkout]);

  function valid() {
    if (!item) {
      toast.error("Escolha um produto ou serviço do catálogo.");
      return false;
    }
    if (
      item.item_type === "produto" &&
      !data.recipes.some((recipe) => recipe.catalog_item_id === item.id)
    ) {
      toast.error(
        "Este produto ainda não está vinculado ao estoque. Volte à Precificação e salve-o com um item do estoque.",
      );
      return false;
    }
    if (!customer.trim()) {
      toast.error("Informe o nome do cliente.");
      return false;
    }
    if (quantity < 1) {
      toast.error("A quantidade deve ser pelo menos 1.");
      return false;
    }
    const message = stockShortageMessage(shortage);
    if (message) {
      toast.error(message);
      return false;
    }
    return true;
  }

  async function assertFreshStock() {
    const requirements = requiredStock(data, itemId, quantity);
    if (!requirements.length) return;
    const { data: current, error } = await supabase
      .from("inventory_items")
      .select("id,current_stock")
      .in(
        "id",
        requirements.map((row) => row.id),
      );
    if (error) throw error;
    const rows = (Array.isArray(current) ? current : []) as {
      id: string;
      current_stock: number;
    }[];
    const fresh = requirements.map((row) => ({
      ...row,
      available: rows.find((entry) => entry.id === row.id)?.current_stock ?? row.available,
    }));
    const message = stockShortageMessage(fresh.filter((row) => row.available < row.needed));
    if (message) throw new Error(message);
  }

  async function createOrder(paymentMethod: string, finalUnitPrice: number) {
    await assertFreshStock();
    if (isDemoMode) {
      const { data: orderId, error } = await supabase.rpc("create_sale", {
        p_item: itemId,
        p_customer: customer.trim(),
        p_whatsapp: phoneMask(whatsapp),
        p_quantity: quantity,
        p_promo: promo,
        p_method: paymentMethod,
      });
      if (error) throw error;
      return String(orderId);
    }
    const { data, error } = await supabase.functions.invoke("create-order", {
      body: {
        itemId,
        customer: customer.trim(),
        whatsapp: phoneMask(whatsapp),
        quantity,
        unitPrice: finalUnitPrice,
        promo,
        method: paymentMethod,
      },
    });
    if (error) throw error;
    const orderId = data?.orderId ?? data?.id;
    if (!orderId) throw new Error("O servidor não retornou o número do pedido.");
    return String(orderId);
  }

  async function manualSale() {
    if (!valid()) return;
    setBusy(true);
    try {
      await createOrder(method, unitPrice);
      await client.invalidateQueries({ queryKey: ["business"] });
      toast.success(
        `Venda confirmada! Estoque abatido automaticamente e ${money(total)} lançados no seu caixa.`,
      );
      setCustomer("");
      setWhatsapp("");
      setQuantity(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar a venda.");
    } finally {
      setBusy(false);
    }
  }

  async function checkoutSale() {
    if (!valid()) return;
    setBusy(true);
    try {
      const orderId = await createOrder("mp_checkout_pro", unitPrice);
      const { data: result, error } = await supabase.functions.invoke("create-mp-preference", {
        body: { orderId },
      });
      if (error) throw error;
      const url = result?.init_point as string | undefined;
      if (!url) throw new Error("O Mercado Pago não retornou o link de cobrança.");
      setCheckout({ url, orderId, customer: customer.trim(), phone: phoneMask(whatsapp) });
      await client.invalidateQueries({ queryKey: ["business"] });
      toast.success("Cobrança criada! Compartilhe o link ou o QR Code com o cliente.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar a cobrança.");
    } finally {
      setBusy(false);
    }
  }

  function whatsappLink(text: string, phone = "") {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }

  function loadQuote(quote: Quote) {
    const line = quote.lines[0];
    if (!line) return;
    setItemId(line.catalogItemId);
    setQuantity(line.quantity);
    setCustomer(quote.customer);
    setWhatsapp(quote.phone);
    setPromo(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Orçamento carregado na cobrança rápida.");
  }

  const orders = data.orders.filter((order) => filter === "all" || order.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">
          Vendas & cobranças<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Do interesse ao pagamento: estoque e caixa se ajustam sozinhos.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="surface p-6 space-y-5">
          <div className="flex items-center gap-2">
            <ShoppingBag size={17} className="text-info" />
            <h2 className="section-heading">Gerador de cobrança rápida</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="field sm:col-span-2">
              Produto ou serviço
              <select
                value={itemId}
                onChange={(event) => {
                  setItemId(event.target.value);
                  setPromo(false);
                }}
              >
                <option value="">Selecione um item</option>
                {data.catalog
                  .filter((entry) => entry.active)
                  .map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Quantidade
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            <label className="field">
              Nome do cliente
              <input
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                placeholder="Ex.: Mariana Silva"
                required
              />
            </label>
            <label className="field">
              WhatsApp do cliente
              <input
                value={whatsapp}
                onChange={(event) => setWhatsapp(phoneMask(event.target.value))}
                placeholder="(11) 99999-0000"
                inputMode="tel"
              />
            </label>
            <div className="flex items-end pb-2 gap-2">
              <Switch
                id="sale-promo"
                checked={promo}
                disabled={!item?.promo_sale_price}
                onCheckedChange={setPromo}
              />
              <label htmlFor="sale-promo" className="text-xs text-muted-foreground">
                Cobrar preço promocional
              </label>
            </div>
          </div>
          {shortage.length > 0 && (
            <div className="flex gap-2 rounded-lg bg-warning-soft p-3 text-[11px] text-primary">
              <TriangleAlert size={15} className="shrink-0" />
              <span>
                {shortage
                  .map(
                    (entry) =>
                      `${entry.name}: faltam ${Math.max(0, entry.needed - entry.available)} ${entry.unit}`,
                  )
                  .join(" · ")}
              </span>
            </div>
          )}
          {item && (
            <div className="rounded-xl bg-info-soft p-4 flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Valor da cobrança</p>
                <p className="text-xl font-extrabold text-brand">{money(total)}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {quantity} × {money(unitPrice)}
                  {promo ? " (promocional)" : ""}
                  {priceBand.label ? ` · faixa ${priceBand.label}` : ""}
                </p>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                <p>Custo estimado: {money((item.total_unit_cost || 0) * quantity)}</p>
                <p>
                  Lucro previsto:{" "}
                  <strong className="text-success">
                    {money(total - (item.total_unit_cost || 0) * quantity)}
                  </strong>
                </p>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <Button className="w-full" disabled={busy || !item} onClick={() => void checkoutSale()}>
              <Link2 size={16} /> Gerar link e QR Code (Mercado Pago Checkout Pro)
            </Button>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                aria-label="Forma de recebimento manual"
                value={method}
                onChange={(event) => setMethod(event.target.value as typeof method)}
                className="native-select text-xs"
              >
                <option value="manual_pix">Pix direto</option>
                <option value="manual_dinheiro">Dinheiro</option>
                <option value="manual_cartao">Cartão</option>
              </select>
              <Button variant="outline" disabled={busy || !item} onClick={() => void manualSale()}>
                <Wallet size={15} /> Registrar venda manual
              </Button>
            </div>
          </div>
        </section>

        <aside className="surface p-5">
          <div className="flex items-center gap-2">
            <Clock3 size={17} className="text-info" />
            <h2 className="section-heading">Pedidos recentes</h2>
          </div>
          <select
            aria-label="Filtrar pedidos"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="native-select text-xs mt-4 w-full"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Aguardando pagamento</option>
            <option value="paid">Pagos</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {orders.slice(0, 20).map((order) => {
              const orderItem = data.catalog.find((entry) => entry.id === order.catalog_item_id);
              return (
                <div key={order.id} className="rounded-lg border p-3">
                  <div className="flex justify-between gap-2">
                    <p className="text-[11px] font-semibold truncate">
                      {orderItem?.name || "Item"}
                    </p>
                    <strong className="text-[11px] whitespace-nowrap">
                      {money(order.total_amount)}
                    </strong>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {order.customer_name} · {shortDate(order.created_at)}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className={`status ${order.status === "paid" ? "" : order.status === "pending" ? "warning" : ""}`}
                    >
                      {order.status === "paid"
                        ? "Pago"
                        : order.status === "pending"
                          ? "Aguardando pagamento"
                          : "Cancelado"}
                    </span>
                    {order.status === "pending" && order.checkout_url && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-[10px] text-info"
                        asChild
                      >
                        <a href={order.checkout_url} target="_blank" rel="noreferrer">
                          Abrir link <ExternalLink size={11} />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {!orders.length && (
              <p className="text-[11px] text-muted-foreground">Nenhum pedido por aqui ainda.</p>
            )}
          </div>
        </aside>
      </div>

      <QuotePanel data={data} onLoadQuote={loadQuote} />

      {checkout && (
        <section className="surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-success" />
                <h2 className="section-heading">Cobrança pronta para o cliente</h2>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Pedido {checkout.orderId.slice(0, 8)} · {checkout.customer}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCheckout(null)}>
              Fechar
            </Button>
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] items-center">
            <div className="text-center">
              {qr ? (
                <img
                  src={qr}
                  alt="QR Code do checkout"
                  className="mx-auto size-48 rounded-lg border bg-white p-2"
                />
              ) : (
                <div className="mx-auto grid size-48 place-items-center rounded-lg bg-background">
                  <QrCode size={40} className="text-muted-foreground" />
                </div>
              )}
              <p className="mt-2 text-[10px] text-muted-foreground">
                Escaneie no balcão ou mostre ao cliente
              </p>
            </div>
            <div className="space-y-3">
              <a
                href={checkout.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 break-all rounded-lg bg-background p-3 text-[11px] text-info"
              >
                <Link2 size={14} className="shrink-0" /> {checkout.url}
              </a>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(checkout.url)
                      .then(() => toast.success("Link copiado!"))
                      .catch(() => toast.error("Não foi possível copiar o link."))
                  }
                >
                  <Link2 size={14} /> Copiar link
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href={whatsappLink(
                      `Olá${checkout.customer ? `, ${checkout.customer}` : ""}! Segue o link para finalizar sua compra na mestrra: ${checkout.url}`,
                      checkout.phone,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={14} /> Enviar no WhatsApp
                  </a>
                </Button>
              </div>
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <ArrowRight size={12} /> Assim que o pagamento for aprovado, o status muda sozinho
                nesta tela.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
