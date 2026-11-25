import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Download,
  FileJson,
  PackagePlus,
  ReceiptText,
  RotateCcw,
  Save,
  ShoppingBag,
  Tags,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/resolved-client";
import type { BusinessData } from "@/lib/business.functions";
import {
  clearManagementState,
  createBackup,
  createQuote,
  defaultFiscalSettings,
  fiscalLabels,
  parseBackup,
  priceBandError,
  productionShortage,
  quoteTotal,
  retailLabel,
  resolvePriceBand,
  useManagementState,
  type FiscalSettings,
  type Quote,
  type QuoteRecurrence,
  type RetailMeta,
} from "@/lib/management";
import { money, shortDate } from "@/lib/mestrra";
import { requiredStock } from "@/lib/stock";
import { Field } from "./forms";
import { toast } from "sonner";

type InventoryRow = BusinessData["inventory"][number];
type CatalogRow = BusinessData["catalog"][number];

export function RetailPanel({
  data,
  onPrepare,
}: {
  data: BusinessData;
  onPrepare: (
    item: InventoryRow,
    meta: RetailMeta | undefined,
    catalogItem: CatalogRow | undefined,
  ) => void;
}) {
  const { state } = useManagementState(data.userId);
  const items = data.inventory.filter((item) => item.category === "revenda");

  return (
    <section className="surface p-6">
      <div className="flex items-center gap-2">
        <ShoppingBag size={17} className="text-info" />
        <h2 className="section-heading">Produtos da loja</h2>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Roupas, acessórios e itens prontos: a precificação consome 1 unidade por venda.
      </p>
      <div className="mt-5 overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>PRODUTO</th>
              <th>ESTOQUE</th>
              <th>CUSTO</th>
              <th>PREÇO DE VENDA</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const meta = state.retail[item.id];
              const catalogItem = data.catalog.find((entry) =>
                data.recipes.some(
                  (recipe) =>
                    recipe.catalog_item_id === entry.id && recipe.inventory_item_id === item.id,
                ),
              );
              return (
                <tr key={item.id}>
                  <td>
                    <p className="text-[11px] font-semibold">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {retailLabel(meta) || "Sem variação cadastrada"}
                    </p>
                  </td>
                  <td className="text-[11px]">{item.current_stock} un</td>
                  <td className="text-[11px]">{money(item.unit_cost_active ?? 0)}</td>
                  <td className="text-[11px] font-semibold">
                    {meta?.salePrice ? money(meta.salePrice) : "A definir"}
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPrepare(item, meta, catalogItem)}
                    >
                      {catalogItem ? "Editar preço" : "Precificar"}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {!items.length && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[11px] text-muted-foreground">
                  Cadastre produtos em Estoque da loja para vender sem ficha técnica.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ProductionPanel({ data }: { data: BusinessData }) {
  const client = useQueryClient();
  const { state, update } = useManagementState(data.userId);
  const [itemId, setItemId] = useState(data.catalog[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const item = data.catalog.find((entry) => entry.id === itemId);
  const requirements = useMemo(
    () => requiredStock(data, itemId, quantity),
    [data, itemId, quantity],
  );
  const shortage = productionShortage(data, itemId, quantity);
  const unitCost = item?.total_unit_cost ?? 0;

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || !Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Escolha um item e informe uma quantidade válida.");
      return;
    }
    if (shortage.length) {
      toast.error("Reponha os insumos em falta antes de registrar a produção.");
      return;
    }
    setBusy(true);
    try {
      for (const row of requirements) {
        const { error } = await supabase
          .from("inventory_items")
          .update({ current_stock: row.available - row.needed })
          .eq("id", row.id);
        if (error) throw error;
      }
      update((current) => ({
        ...current,
        batches: [
          {
            id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            catalogItemId: item.id,
            itemName: item.name,
            quantity,
            unitCost,
            totalCost: unitCost * quantity,
            notes: notes.trim(),
            createdAt: new Date().toISOString(),
          },
          ...current.batches,
        ],
      }));
      await client.invalidateQueries({ queryKey: ["business"] });
      toast.success(`${quantity} unidade(s) produzidas e insumos baixados do estoque.`);
      setNotes("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível registrar a produção.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface p-6">
      <div className="flex items-center gap-2">
        <PackagePlus size={17} className="text-info" />
        <h2 className="section-heading">Produção do dia</h2>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Baixa insumos da ficha técnica e registra o custo de cada lote.
      </p>
      <form onSubmit={(event) => void register(event)} className="mt-5 grid gap-4 lg:grid-cols-4">
        <label className="field">
          Item produzido
          <select value={itemId} onChange={(event) => setItemId(event.target.value)} required>
            <option value="">Selecione um item</option>
            {data.catalog.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Quantidade produzida"
          name="productionQuantity"
          type="number"
          min="0.01"
          value={quantity}
        >
          <input
            name="productionQuantity"
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            required
          />
        </Field>
        <Field label="Custo unitário (R$)" name="productionCost" type="number" value={unitCost}>
          <input
            name="productionCost"
            type="number"
            value={unitCost}
            readOnly
            className="opacity-70"
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Registrando..." : "Registrar lote"}
          </Button>
        </div>
        <label className="field lg:col-span-4">
          Observações
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex.: lote da manhã, fornada especial"
          />
        </label>
      </form>
      {requirements.length > 0 && (
        <div className="mt-4 rounded-lg bg-info-soft p-3 text-[11px] text-muted-foreground">
          Consumo previsto:{" "}
          {requirements.map((row) => `${row.needed} ${row.unit} de ${row.name}`).join(" · ")}
        </div>
      )}
      {shortage.length > 0 && (
        <div className="mt-3 flex gap-2 rounded-lg bg-destructive/10 p-3 text-[11px] text-destructive">
          <TriangleAlert size={15} className="shrink-0" />
          <span>
            {shortage
              .map((row) => `${row.name}: faltam ${row.needed - row.available} ${row.unit}`)
              .join(" · ")}
          </span>
        </div>
      )}
      <div className="mt-5 overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>LOTE</th>
              <th>ITEM</th>
              <th>QTD.</th>
              <th>CUSTO TOTAL</th>
              <th>DATA</th>
            </tr>
          </thead>
          <tbody>
            {state.batches.slice(0, 12).map((batch) => (
              <tr key={batch.id}>
                <td className="text-[11px] font-semibold">{batch.id.slice(-7)}</td>
                <td className="text-[11px]">{batch.itemName}</td>
                <td className="text-[11px]">{batch.quantity}</td>
                <td className="text-[11px] font-semibold">{money(batch.totalCost)}</td>
                <td className="text-[11px] text-muted-foreground">{shortDate(batch.createdAt)}</td>
              </tr>
            ))}
            {!state.batches.length && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground text-[11px]">
                  Nenhum lote registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PriceBandsPanel({ data }: { data: BusinessData }) {
  const { state, update } = useManagementState(data.userId);
  const [itemId, setItemId] = useState(data.catalog[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [minQuantity, setMinQuantity] = useState(2);
  const [maxQuantity, setMaxQuantity] = useState("");
  const [price, setPrice] = useState(0);
  const bands = state.bands.filter((band) => band.catalogItemId === itemId);
  const item = data.catalog.find((entry) => entry.id === itemId);
  const preview = [1, 6, 12].map((quantity) => ({
    quantity,
    ...resolvePriceBand(state.bands, itemId, quantity, item?.suggested_price ?? 0),
  }));

  function addBand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const band = {
      id: `band-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      catalogItemId: itemId,
      label: label.trim(),
      minQuantity,
      maxQuantity: maxQuantity.trim() === "" ? null : Number(maxQuantity),
      price,
    };
    const error = priceBandError(band, state.bands);
    if (error) {
      toast.error(error);
      return;
    }
    update((current) => ({ ...current, bands: [...current.bands, band] }));
    setLabel("");
    setMinQuantity(2);
    setMaxQuantity("");
    setPrice(0);
    toast.success("Faixa de preço adicionada.");
  }

  return (
    <section className="surface p-6">
      <div className="flex items-center gap-2">
        <Tags size={17} className="text-info" />
        <h2 className="section-heading">Tabela de preços por quantidade</h2>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Vendas e orçamentos usam automaticamente a faixa compatível.
      </p>
      <form onSubmit={addBand} className="mt-5 grid gap-4 lg:grid-cols-5">
        <label className="field lg:col-span-2">
          Item
          <select value={itemId} onChange={(event) => setItemId(event.target.value)} required>
            <option value="">Selecione um item</option>
            {data.catalog.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Nome da faixa" name="bandLabel" value={label}>
          <input
            name="bandLabel"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Ex.: 6 a 11 unidades"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="De" name="bandMin" type="number" value={minQuantity}>
            <input
              name="bandMin"
              type="number"
              min="1"
              value={minQuantity}
              onChange={(event) => setMinQuantity(Number(event.target.value))}
              required
            />
          </Field>
          <Field label="Até" name="bandMax" type="number" value={maxQuantity}>
            <input
              name="bandMax"
              type="number"
              min="1"
              value={maxQuantity}
              onChange={(event) => setMaxQuantity(event.target.value)}
              placeholder="∞"
            />
          </Field>
        </div>
        <div className="flex items-end gap-2">
          <Field label="Preço (R$)" name="bandPrice" type="number" value={price}>
            <input
              name="bandPrice"
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
              required
            />
          </Field>
          <Button type="submit">
            <Save size={15} /> Salvar
          </Button>
        </div>
      </form>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>FAIXA</th>
                <th>QUANTIDADE</th>
                <th>PREÇO</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bands.map((band) => (
                <tr key={band.id}>
                  <td className="text-[11px] font-semibold">{band.label}</td>
                  <td className="text-[11px]">
                    {band.minQuantity}
                    {band.maxQuantity !== null ? ` a ${band.maxQuantity}` : " ou mais"}
                  </td>
                  <td className="text-[11px] font-semibold">{money(band.price)}</td>
                  <td>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remover faixa"
                      onClick={() =>
                        update((current) => ({
                          ...current,
                          bands: current.bands.filter((entry) => entry.id !== band.id),
                        }))
                      }
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
              {!bands.length && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground text-[11px]">
                    Nenhuma faixa cadastrada para este item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl bg-info-soft p-4">
          <p className="text-xs font-bold">Prévia rápida</p>
          <div className="mt-3 space-y-2 text-[11px]">
            {preview.map((entry) => (
              <div key={entry.quantity} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {entry.quantity} unidade(s) {entry.label ? `· ${entry.label}` : "· preço padrão"}
                </span>
                <strong>{money(entry.price)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type QuotePanelProps = {
  data: BusinessData;
  onLoadQuote?: (quote: Quote) => void;
};

export function QuotePanel({ data, onLoadQuote }: QuotePanelProps) {
  const { state, update } = useManagementState(data.userId);
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [itemId, setItemId] = useState(data.catalog[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [recurrence, setRecurrence] = useState<QuoteRecurrence>("unica");
  const [notes, setNotes] = useState("");
  const item = data.catalog.find((entry) => entry.id === itemId);
  const price = resolvePriceBand(state.bands, itemId, quantity, item?.suggested_price ?? 0).price;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || !customer.trim() || !Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Informe cliente, item e quantidade para criar o orçamento.");
      return;
    }
    const quote = createQuote({
      customer: customer.trim(),
      phone: phone.trim(),
      lines: [{ catalogItemId: item.id, name: item.name, quantity, unitPrice: price }],
      status: recurrence === "unica" ? "orcamento" : "recorrente",
      recurrence,
      notes: notes.trim(),
    });
    update((current) => ({ ...current, quotes: [quote, ...current.quotes] }));
    setCustomer("");
    setPhone("");
    setNotes("");
    toast.success("Orçamento salvo. Ele fica disponível mesmo depois de sair da tela.");
  }

  function setStatus(id: string, status: Quote["status"]) {
    update((current) => ({
      ...current,
      quotes: current.quotes.map((quote) => (quote.id === id ? { ...quote, status } : quote)),
    }));
    toast.success("Status do orçamento atualizado.");
  }

  return (
    <section className="surface p-6">
      <div className="flex items-center gap-2">
        <ClipboardList size={17} className="text-info" />
        <h2 className="section-heading">Pedidos e orçamentos</h2>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Registre intenções de compra, recorrência e propostas antes da cobrança.
      </p>
      <form onSubmit={save} className="mt-5 grid gap-4 lg:grid-cols-4">
        <Field label="Cliente" name="quoteCustomer" value={customer}>
          <input
            name="quoteCustomer"
            value={customer}
            onChange={(event) => setCustomer(event.target.value)}
            required
          />
        </Field>
        <Field label="WhatsApp" name="quotePhone" value={phone}>
          <input
            name="quotePhone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(11) 99999-0000"
          />
        </Field>
        <label className="field">
          Item
          <select value={itemId} onChange={(event) => setItemId(event.target.value)} required>
            <option value="">Selecione um item</option>
            {data.catalog.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantidade" name="quoteQuantity" type="number" value={quantity}>
            <input
              name="quoteQuantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              required
            />
          </Field>
          <Field label="Preço unitário (R$)" name="quotePrice" type="number" value={price}>
            <input name="quotePrice" type="number" value={price} readOnly className="opacity-70" />
          </Field>
        </div>
        <Field label="Recorrência" name="quoteRecurrence">
          <select
            name="quoteRecurrence"
            value={recurrence}
            onChange={(event) => setRecurrence(event.target.value as QuoteRecurrence)}
          >
            <option value="unica">Pedido único</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
          </select>
        </Field>
        <label className="field lg:col-span-2">
          Observações
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex.: entrega sexta, sem personalização"
          />
        </label>
        <div className="flex items-end lg:col-span-2">
          <Button type="submit" className="w-full">
            <Save size={15} /> Salvar orçamento
          </Button>
        </div>
      </form>
      <div className="mt-5 overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>CLIENTE</th>
              <th>ITEM</th>
              <th>VALOR</th>
              <th>STATUS</th>
              <th>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {state.quotes.slice(0, 12).map((quote) => (
              <tr key={quote.id}>
                <td>
                  <p className="text-[11px] font-semibold">{quote.customer}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {shortDate(quote.createdAt)} · {fiscalLabels.recurrence[quote.recurrence]}
                  </p>
                </td>
                <td className="text-[11px]">
                  {quote.lines.map((line) => `${line.quantity}× ${line.name}`).join(", ")}
                </td>
                <td className="text-[11px] font-semibold">{money(quoteTotal(quote.lines))}</td>
                <td>
                  <span className={`status ${quote.status === "orcamento" ? "warning" : ""}`}>
                    {fiscalLabels.status[quote.status]}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    {onLoadQuote && (
                      <Button variant="ghost" size="sm" onClick={() => onLoadQuote(quote)}>
                        Carregar
                      </Button>
                    )}
                    {quote.status === "orcamento" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStatus(quote.id, "confirmado")}
                      >
                        Confirmar
                      </Button>
                    )}
                    {quote.status !== "cancelado" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Cancelar orçamento"
                        onClick={() => setStatus(quote.id, "cancelado")}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!state.quotes.length && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground text-[11px]">
                  Nenhum orçamento salvo ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FiscalBackupPanel({ data }: { data: BusinessData }) {
  const { state, update } = useManagementState(data.userId);
  const [fiscal, setFiscal] = useState<FiscalSettings>(state.fiscal);

  useEffect(() => {
    setFiscal(state.fiscal);
  }, [state.fiscal]);

  function saveFiscal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update((current) => ({
      ...current,
      fiscal: { ...fiscal, updatedAt: new Date().toISOString() },
    }));
    toast.success("Regras fiscais salvas para novas precificações.");
  }

  function exportBackup() {
    const payload = createBackup(data, state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mestrra-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Backup baixado com sucesso.");
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !window.confirm(
        "Isso substitui as regras locais atuais por faixas, lotes, orçamentos e metadados do arquivo. Continuar?",
      )
    ) {
      event.target.value = "";
      return;
    }
    try {
      const backup = parseBackup(await file.text());
      update(() => backup.management);
      toast.success("Regras locais restauradas. Estoque, catálogo e pedidos não são alterados.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ler o backup.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="surface p-6">
        <div className="flex items-center gap-2">
          <ReceiptText size={17} className="text-info" />
          <h2 className="section-heading">Regras fiscais padrão</h2>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Usadas como ponto de partida nas próximas precificações.
        </p>
        <form onSubmit={saveFiscal} className="mt-5 space-y-4">
          <Field label="Regime tributário" name="regime">
            <select
              name="regime"
              value={fiscal.regime}
              onChange={(event) =>
                setFiscal({ ...fiscal, regime: event.target.value as FiscalSettings["regime"] })
              }
            >
              {Object.entries(fiscalLabels.regime).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Taxa padrão de produtos (%)" name="defaultTax" type="number">
              <input
                name="defaultTax"
                type="number"
                min="0"
                step="0.01"
                value={fiscal.defaultTaxPercent}
                onChange={(event) =>
                  setFiscal({ ...fiscal, defaultTaxPercent: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Taxa padrão de serviços (%)" name="serviceTax" type="number">
              <input
                name="serviceTax"
                type="number"
                min="0"
                step="0.01"
                value={fiscal.serviceTaxPercent}
                onChange={(event) =>
                  setFiscal({ ...fiscal, serviceTaxPercent: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Rateio de custos fixos (%)" name="fixedCost" type="number">
              <input
                name="fixedCost"
                type="number"
                min="0"
                step="0.01"
                value={fiscal.fixedCostPercent}
                onChange={(event) =>
                  setFiscal({ ...fiscal, fixedCostPercent: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Nome no documento" name="invoiceLabel" value={fiscal.invoiceLabel}>
              <input
                name="invoiceLabel"
                value={fiscal.invoiceLabel}
                onChange={(event) => setFiscal({ ...fiscal, invoiceLabel: event.target.value })}
              />
            </Field>
          </div>
          <Button type="submit" className="w-full">
            <Save size={15} /> Salvar regras
          </Button>
        </form>
      </section>
      <section className="surface p-6">
        <div className="flex items-center gap-2">
          <FileJson size={17} className="text-info" />
          <h2 className="section-heading">Backup e restauração</h2>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Exporta um retrato do negócio para conferência e todas as regras locais para restaurar.
        </p>
        <div className="mt-5 grid gap-3 text-[11px] text-muted-foreground">
          <p>{state.bands.length} faixa(s) de preço</p>
          <p>{state.batches.length} lote(s) de produção</p>
          <p>{state.quotes.length} orçamento(s)</p>
          <p>
            Estoque, catálogo, pedidos e caixa seguem apenas como consulta; a restauração reaplica
            regras e metadados locais.
          </p>
        </div>
        <div className="mt-5 grid gap-2">
          <Button onClick={exportBackup}>
            <Download size={15} /> Baixar arquivo do negócio
          </Button>
          <label className="native-select flex items-center justify-center gap-2 cursor-pointer">
            <Upload size={15} /> Restaurar configurações de um backup
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(event) => void importBackup(event)}
            />
          </label>
          <Button
            variant="outline"
            onClick={() => {
              if (
                !window.confirm("Apagar regras, faixas, lotes e orçamentos salvos neste navegador?")
              ) {
                return;
              }
              clearManagementState(data.userId);
              setFiscal(defaultFiscalSettings());
              toast.success("Dados locais removidos.");
            }}
          >
            <RotateCcw size={15} /> Limpar dados locais
          </Button>
        </div>
      </section>
    </div>
  );
}
