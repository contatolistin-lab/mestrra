import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Layers,
  Package,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  ShoppingBag,
  Tags,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/resolved-client";
import type { BusinessData } from "@/lib/business.functions";
import { retailLabel, useManagementState, withRetailMeta, type RetailMeta } from "@/lib/management";
import { money } from "@/lib/mestrra";
import { toast } from "sonner";
import { Field, FormDialog, InventoryForm, formNumber } from "./forms";

type InventoryRow = BusinessData["inventory"][number];
type InventoryView = "revenda" | "insumo";

export function Inventory({ data }: { data: BusinessData }) {
  const client = useQueryClient();
  const { state: management, update: updateManagement } = useManagementState(data.userId);
  const [view, setView] = useState<InventoryView>("revenda");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<InventoryRow | "new" | null>(null);
  const [restocking, setRestocking] = useState<InventoryRow | null>(null);
  const [busy, setBusy] = useState(false);

  const scoped = data.inventory.filter((item) =>
    view === "revenda" ? item.category === "revenda" : item.category !== "revenda",
  );
  const items = scoped.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "critical" && i.current_stock <= i.min_stock_alert) ||
        (filter === "promo" && i.is_promo_active)),
  );
  const retail = view === "revenda";

  async function toggle(id: string, active: boolean) {
    const { error } = await supabase
      .from("inventory_items")
      .update({ is_promo_active: active })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      void client.invalidateQueries({ queryKey: ["business"] });
      toast.success("Preço ativo atualizado para as próximas precificações.");
    }
  }

  async function remove(item: InventoryRow) {
    if (!window.confirm(`Excluir ${item.name}?`)) return;
    const { error } = await supabase.from("inventory_items").delete().eq("id", item.id);
    if (error)
      toast.error(
        retail
          ? "Este produto pode estar vinculado a um item do catálogo. Remova o vínculo antes de excluir."
          : "Este insumo pode estar vinculado a uma ficha técnica. Remova o vínculo antes de excluir.",
      );
    else {
      void client.invalidateQueries({ queryKey: ["business"] });
      toast.success(retail ? "Produto removido." : "Insumo excluído.");
    }
  }

  async function restock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restocking) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.rpc("restock_item", {
      p_id: restocking.id,
      p_quantity: formNumber(form, "quantity"),
      p_promo: form.get("promo") === "on",
      p_expense: form.get("expense") === "on",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await client.invalidateQueries({ queryKey: ["business"] });
    toast.success(
      retail
        ? "Estoque reposto e caixa atualizado."
        : "Compra reposta! Estoque e caixa atualizados.",
    );
    setRestocking(null);
  }

  function changeView(next: InventoryView) {
    setView(next);
    setEditing(null);
    setRestocking(null);
    setFilter("all");
    setSearch("");
  }

  const metrics = retail
    ? [
        {
          label: "Capital em estoque",
          value: money(
            scoped.reduce((sum, i) => sum + i.current_stock * (i.unit_cost_active ?? 0), 0),
          ),
          icon: Package,
        },
        {
          label: "Itens em alerta",
          value: scoped.filter((i) => i.current_stock <= i.min_stock_alert).length,
          icon: AlertTriangle,
        },
        {
          label: "Valor de venda potencial",
          value: money(
            scoped.reduce(
              (sum, i) => sum + i.current_stock * (management.retail[i.id]?.salePrice ?? 0),
              0,
            ),
          ),
          icon: PiggyBank,
        },
        { label: "Produtos cadastrados", value: scoped.length, icon: Layers },
      ]
    : [
        {
          label: "Capital em estoque",
          value: money(
            scoped.reduce((sum, i) => sum + i.current_stock * (i.unit_cost_active ?? 0), 0),
          ),
          icon: Package,
        },
        {
          label: "Itens em alerta",
          value: scoped.filter((i) => i.current_stock <= i.min_stock_alert).length,
          icon: AlertTriangle,
        },
        {
          label: "Economia promocional",
          value: money(
            scoped
              .filter((i) => i.is_promo_active && i.promo_price)
              .reduce(
                (sum, i) =>
                  sum +
                  Math.max(
                    0,
                    i.current_stock * ((i.unit_cost_regular ?? 0) - (i.unit_cost_active ?? 0)),
                  ),
                0,
              ),
          ),
          icon: PiggyBank,
        },
        { label: "Insumos cadastrados", value: scoped.length, icon: Layers },
      ];

  return (
    <>
      <div className="flex justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">
            {retail ? "Estoque da loja" : "Insumos & recursos"}
            <span className="text-primary">.</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            {retail
              ? "Roupas, acessórios e produtos prontos para venda."
              : "Materiais usados na produção e nos serviços."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl border bg-card p-1">
            <Button
              variant={retail ? "default" : "ghost"}
              size="sm"
              onClick={() => changeView("revenda")}
            >
              <ShoppingBag size={14} /> Revenda
            </Button>
            <Button
              variant={!retail ? "default" : "ghost"}
              size="sm"
              onClick={() => changeView("insumo")}
            >
              <Package size={14} /> Insumos
            </Button>
          </div>
          <Button onClick={() => setEditing("new")}>
            <Plus />
            {retail ? "Cadastrar produto" : "Cadastrar insumo"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {metrics.map((k) => (
          <div key={k.label} className="surface metric-card">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              {k.label}
              <k.icon size={16} className="text-info" />
            </div>
            <p className="metric-value">{k.value}</p>
          </div>
        ))}
      </div>
      <section className="surface overflow-hidden">
        <div className="p-5 flex flex-wrap gap-3 justify-between">
          <label className="flex gap-2 items-center text-muted-foreground border rounded-md px-3">
            <Search size={16} />
            <input
              aria-label={retail ? "Buscar produto" : "Buscar insumo"}
              placeholder={retail ? "Buscar produto…" : "Buscar insumo…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none bg-transparent py-2 text-xs w-44"
            />
          </label>
          <select
            aria-label={retail ? "Filtrar produtos" : "Filtrar insumos"}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="native-select text-xs max-w-48"
          >
            <option value="all">{retail ? "Todos os produtos" : "Todos os insumos"}</option>
            <option value="critical">Estoque crítico</option>
            {!retail && <option value="promo">Promoção ativa</option>}
          </select>
        </div>
        <div className="overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{retail ? "PRODUTO" : "INSUMO"}</th>
                <th>ESTOQUE</th>
                <th>CUSTO / UNIDADE</th>
                <th>{retail ? "PREÇO DE VENDA" : "PREÇO PROMO"}</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const meta = management.retail[i.id];
                const margin =
                  retail && meta?.salePrice && meta.salePrice > 0
                    ? ((meta.salePrice - (i.unit_cost_active ?? 0)) / meta.salePrice) * 100
                    : null;
                return (
                  <tr key={i.id}>
                    <td>
                      <p className="font-semibold whitespace-nowrap">{i.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {retail
                          ? retailLabel(meta) || "Sem variação cadastrada"
                          : `${i.supplier_name || "Sem fornecedor"} · ${i.package_quantity} ${i.unit_type}`}
                      </p>
                    </td>
                    <td className="min-w-36">
                      <div className="flex gap-2 justify-between text-[11px]">
                        <span
                          className={
                            i.current_stock < 0
                              ? "text-destructive"
                              : i.current_stock <= i.min_stock_alert
                                ? "text-primary"
                                : "text-foreground"
                          }
                        >
                          {i.current_stock} {i.unit_type}
                        </span>
                        <span className="text-muted-foreground">mín. {i.min_stock_alert}</span>
                      </div>
                      <progress
                        className={`w-full h-1.5 mt-2 ${i.current_stock <= i.min_stock_alert ? "accent-primary" : "accent-info"}`}
                        value={Math.max(0, i.current_stock)}
                        max={Math.max(i.min_stock_alert * 3, i.current_stock, 1)}
                      />
                    </td>
                    <td className="whitespace-nowrap">
                      <p className="font-semibold">
                        R$ {(i.unit_cost_active ?? 0).toFixed(4).replace(".", ",")} / {i.unit_type}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Normal: R$ {(i.unit_cost_regular ?? 0).toFixed(4).replace(".", ",")}
                      </p>
                    </td>
                    <td>
                      {retail ? (
                        meta?.salePrice ? (
                          <div>
                            <p className="font-semibold text-[11px]">{money(meta.salePrice)}</p>
                            {margin !== null && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {margin.toFixed(1).replace(".", ",")}% de margem bruta
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            Definir na precificação
                          </span>
                        )
                      ) : (
                        <div className="flex items-center gap-2">
                          <Switch
                            aria-label={`Promoção de ${i.name}`}
                            checked={i.is_promo_active}
                            disabled={!i.promo_price}
                            onCheckedChange={(v) => void toggle(i.id, v)}
                          />
                          {i.is_promo_active && <span className="status warning">Promo</span>}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => setRestocking(i)}>
                          <Plus size={12} />
                          Repor
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={retail ? "Editar produto" : "Editar insumo"}
                          onClick={() => setEditing(i)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={retail ? "Excluir produto" : "Excluir insumo"}
                          onClick={() => void remove(i)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    {retail
                      ? "Nenhum produto de revenda encontrado. Cadastre roupas, acessórios ou itens prontos para vender."
                      : "Nenhum insumo encontrado. Cadastre o primeiro para começar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <div className="flex justify-end mt-5">
        <Button asChild>
          <Link to="/precificacao">
            {retail ? "Precificar produtos da loja" : "Usar insumos na precificação"} <ArrowRight />
          </Link>
        </Button>
      </div>
      <FormDialog
        title={
          editing === "new"
            ? retail
              ? "Cadastrar produto de revenda"
              : "Cadastrar insumo"
            : retail
              ? "Editar produto de revenda"
              : "Editar insumo"
        }
        open={!!editing}
        onClose={() => setEditing(null)}
      >
        {editing &&
          (retail ? (
            <RetailItemForm
              data={data}
              {...(editing === "new" ? {} : { item: editing })}
              meta={editing === "new" ? undefined : management.retail[editing.id]}
              onClose={() => setEditing(null)}
            />
          ) : (
            <InventoryForm
              data={data}
              {...(editing === "new" ? {} : { item: editing })}
              onClose={() => setEditing(null)}
            />
          ))}
      </FormDialog>
      <FormDialog
        title={`Repor ${restocking?.name || "estoque"}`}
        open={!!restocking}
        onClose={() => setRestocking(null)}
      >
        <form className="space-y-4" onSubmit={restock}>
          <Field
            label={`Quantidade comprada (${restocking?.unit_type})`}
            name="quantity"
            type="number"
            min="0.01"
            required
          />
          <label className="flex gap-2 text-xs">
            <input type="checkbox" name="promo" defaultChecked={restocking?.is_promo_active} />
            Compra com preço promocional
          </label>
          <label className="flex gap-2 text-xs">
            <input type="checkbox" name="expense" defaultChecked />
            Lançar saída automática no fluxo de caixa
          </label>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Repondo…" : "Confirmar reposição"}
          </Button>
        </form>
      </FormDialog>
    </>
  );
}

function RetailItemForm({
  data,
  item,
  meta,
  onClose,
}: {
  data: BusinessData;
  item?: InventoryRow;
  meta: RetailMeta | undefined;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const { update } = useManagementState(data.userId);
  const [name, setName] = useState(item?.name ?? "");
  const [sku, setSku] = useState(meta?.sku ?? "");
  const [size, setSize] = useState(meta?.size ?? "");
  const [color, setColor] = useState(meta?.color ?? "");
  const [supplier, setSupplier] = useState(item?.supplier_name ?? "");
  const [cost, setCost] = useState(item?.regular_price ?? 0);
  const [salePrice, setSalePrice] = useState(meta?.salePrice ?? 0);
  const [stock, setStock] = useState(item?.current_stock ?? 0);
  const [minStock, setMinStock] = useState(item?.min_stock_alert ?? 1);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !Number.isFinite(cost) || cost <= 0) {
      toast.error("Informe o nome e o custo do produto.");
      return;
    }
    setBusy(true);
    const payload = {
      user_id: data.userId,
      name: name.trim(),
      category: "revenda",
      unit_type: "un",
      package_quantity: 1,
      regular_price: cost,
      promo_price: null,
      is_promo_active: false,
      current_stock: stock,
      min_stock_alert: minStock,
      supplier_name: supplier.trim() || null,
    };
    const result = item
      ? await supabase.from("inventory_items").update(payload).eq("id", item.id).select().single()
      : await supabase.from("inventory_items").insert(payload).select().single();
    setBusy(false);
    if (result.error || !result.data) {
      toast.error(result.error?.message || "Não foi possível salvar o produto.");
      return;
    }
    const itemId = String(result.data.id);
    update((current) =>
      withRetailMeta(current, itemId, {
        sku: sku.trim(),
        size: size.trim(),
        color: color.trim(),
        salePrice: salePrice > 0 ? salePrice : null,
      }),
    );
    await client.invalidateQueries({ queryKey: ["business"] });
    toast.success(item ? "Produto atualizado." : "Produto cadastrado! Agora é só precificar.");
    onClose();
  }

  return (
    <form onSubmit={(event) => void save(event)} className="space-y-4">
      <label className="field">
        Nome do produto
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="field">
          Código / SKU
          <input
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            placeholder="Ex.: CAM-BRV-M"
          />
        </label>
        <label className="field">
          Tamanho
          <input
            value={size}
            onChange={(event) => setSize(event.target.value)}
            placeholder="Ex.: M"
          />
        </label>
        <label className="field">
          Cor
          <input
            value={color}
            onChange={(event) => setColor(event.target.value)}
            placeholder="Ex.: Preto"
          />
        </label>
        <Field label="Fornecedor" name="supplier" value={supplier}>
          <input
            name="supplier"
            value={supplier}
            onChange={(event) => setSupplier(event.target.value)}
            placeholder="Ex.: Atacado Moda"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-background p-4">
        <p className="col-span-2 text-xs font-bold flex items-center gap-2">
          <Tags size={14} className="text-info" /> Custos e venda
        </p>
        <label className="field">
          Custo Unitário (R$)
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={cost}
            onChange={(event) => setCost(Number(event.target.value))}
            required
          />
        </label>
        <label className="field">
          Preço de venda desejado (R$)
          <input
            type="number"
            min="0"
            step="0.01"
            value={salePrice || ""}
            onChange={(event) => setSalePrice(Number(event.target.value))}
            placeholder="Ex.: 129,90"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="field">
          Quantidade em estoque
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(event) => setStock(Number(event.target.value))}
            required
          />
        </label>
        <label className="field">
          Estoque mínimo de alerta
          <input
            type="number"
            min="0"
            value={minStock}
            onChange={(event) => setMinStock(Number(event.target.value))}
          />
        </label>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Depois de cadastrar, use Precificação para criar o item de venda. Cada venda consumirá 1
        unidade deste estoque.
      </p>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Salvando…" : item ? "Salvar produto" : "Cadastrar produto"}
      </Button>
    </form>
  );
}
