import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Calculator,
  Check,
  Package,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/resolved-client";
import type { BusinessData } from "@/lib/business.functions";
import {
  advancedPrice,
  keystoneRule,
  useManagementState,
  type PriceCalculationMode,
} from "@/lib/management";
import { money, priceCalculation, pricingError } from "@/lib/mestrra";
import { toast } from "sonner";
import { PriceBandsPanel, ProductionPanel } from "./management";

type RecipeRow = { key: string; inventory_item_id: string; quantity_used: number };
const emptyRecipe = (): RecipeRow => ({
  key: Math.random().toString(36).slice(2),
  inventory_item_id: "",
  quantity_used: 0,
});
const round2 = (value: number) => Math.round(value * 100) / 100;

export function Pricing({ data }: { data: BusinessData }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { state: management, update: updateManagement } = useManagementState(data.userId);
  const [mode, setMode] = useState<"produto" | "servico">("produto");
  const [calculationMode, setCalculationMode] = useState<PriceCalculationMode>(
    management.calculationMode,
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [benefit, setBenefit] = useState("");
  const [pain, setPain] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [hourly, setHourly] = useState(data.profile?.hourly_rate || 31.25);
  const [fixed, setFixed] = useState(management.fiscal.fixedCostPercent);
  const [tax, setTax] = useState(management.fiscal.defaultTaxPercent);
  const [margin, setMargin] = useState(50);
  const [markup, setMarkup] = useState(100);
  const [promo, setPromo] = useState(0);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [picker, setPicker] = useState(emptyRecipe());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCalculationMode(management.calculationMode);
  }, [management.calculationMode]);

  const totalMinutes = hours * 60 + minutes;
  const materials = useMemo(
    () =>
      recipes.reduce((sum, row) => {
        const item = data.inventory.find((entry) => entry.id === row.inventory_item_id);
        const cost = item
          ? (item.unit_cost_active ?? item.regular_price / (item.package_quantity || 1))
          : 0;
        return sum + cost * row.quantity_used;
      }, 0),
    [recipes, data.inventory],
  );
  const base = priceCalculation(
    materials,
    totalMinutes,
    hourly,
    fixed,
    tax,
    calculationMode === "margem" ? margin : 0,
  );
  const advanced = advancedPrice({
    mode: calculationMode,
    cost: base.cost,
    taxPercent: tax,
    marginPercent: margin,
    markupPercent: markup,
  });
  const calc = {
    ...base,
    price: advanced.price,
    tax: advanced.tax,
    profit: advanced.profit,
    valid: base.valid && advanced.valid,
  };
  const promoRisks = recipes.filter((row) => {
    const item = data.inventory.find((entry) => entry.id === row.inventory_item_id);
    return !!item?.is_promo_active && (item.unit_cost_regular ?? 0) > (item.unit_cost_active ?? 0);
  });
  const riskValue = promoRisks.reduce((sum, row) => {
    const item = data.inventory.find((entry) => entry.id === row.inventory_item_id);
    return (
      sum + row.quantity_used * ((item?.unit_cost_regular ?? 0) - (item?.unit_cost_active ?? 0))
    );
  }, 0);
  const insufficient = recipes.filter((row) => {
    const item = data.inventory.find((entry) => entry.id === row.inventory_item_id);
    return item && row.quantity_used > item.current_stock;
  });

  function reset(nextMode: "produto" | "servico" = mode) {
    setMode(nextMode);
    setEditing(null);
    setName("");
    setDescription("");
    setAudience("");
    setBenefit("");
    setPain("");
    setHours(0);
    setMinutes(30);
    setFixed(management.fiscal.fixedCostPercent);
    setTax(
      nextMode === "servico"
        ? management.fiscal.serviceTaxPercent
        : management.fiscal.defaultTaxPercent,
    );
    setMargin(50);
    setPromo(0);
    setRecipes([]);
    setPicker(emptyRecipe());
  }

  function changeCalculationMode(next: PriceCalculationMode) {
    setCalculationMode(next);
    updateManagement((current) => ({ ...current, calculationMode: next }));
  }

  function applyKeystone() {
    changeCalculationMode("markup");
    setMarkup(100);
    setTax(0);
    toast.success(keystoneRule(calc.cost).description);
  }

  function editItem(item: BusinessData["catalog"][number]) {
    setMode(item.item_type === "servico" ? "servico" : "produto");
    setEditing(item.id);
    setName(item.name);
    setDescription(item.description || "");
    setAudience(item.target_audience || "");
    setBenefit(item.main_benefit || "");
    setPain(item.pain_point_solved || "");
    setHours(Math.floor(item.execution_minutes / 60));
    setMinutes(item.execution_minutes % 60);
    setHourly(
      item.labor_cost && item.execution_minutes
        ? (item.labor_cost / item.execution_minutes) * 60
        : data.profile?.hourly_rate || 31.25,
    );
    const savedCost = item.total_unit_cost || item.materials_cost + item.labor_cost;
    setFixed(
      item.fixed_cost_allocation && savedCost > 0
        ? (item.fixed_cost_allocation / savedCost) * 100
        : 10,
    );
    setTax(item.platform_tax_percent);
    setMargin(item.desired_margin_percent);
    setPromo(item.promo_sale_price || 0);
    setRecipes(
      data.recipes
        .filter((recipe) => recipe.catalog_item_id === item.id)
        .map((recipe) => ({
          key: recipe.id,
          inventory_item_id: recipe.inventory_item_id,
          quantity_used: recipe.quantity_used,
        })),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addRecipe() {
    if (!picker.inventory_item_id || picker.quantity_used <= 0) {
      toast.error("Escolha um insumo e informe a quantidade consumida.");
      return;
    }
    setRecipes((current) => [
      ...current.filter((row) => row.inventory_item_id !== picker.inventory_item_id),
      picker,
    ]);
    setPicker(emptyRecipe());
  }

  async function save(goToCopiloto: boolean) {
    const error = pricingError({
      name,
      totalMinutes,
      hourly,
      fixedPercent: fixed,
      taxPercent: tax,
      margin: calculationMode === "markup" ? advanced.effectiveMargin : margin,
      promo,
      cost: calc.cost,
      price: calc.price,
      priceValid: calc.valid,
      recipes,
    });
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    const payload = {
      user_id: data.userId,
      item_type: mode,
      name: name.trim(),
      description: description.trim() || null,
      target_audience: audience.trim() || null,
      main_benefit: benefit.trim() || null,
      pain_point_solved: pain.trim() || null,
      execution_minutes: totalMinutes,
      labor_cost: round2(calc.labor),
      materials_cost: round2(materials),
      fixed_cost_allocation: round2(calc.fixed),
      total_unit_cost: round2(calc.cost),
      desired_margin_percent: round2(
        calculationMode === "markup" ? advanced.effectiveMargin : margin,
      ),
      platform_tax_percent: tax,
      suggested_price: round2(calc.price),
      promo_sale_price: promo > 0 ? round2(promo) : null,
      is_promo_sale_active: promo > 0,
    };
    const result = editing
      ? await supabase.from("catalog_items").update(payload).eq("id", editing).select().single()
      : await supabase.from("catalog_items").insert(payload).select().single();
    if (result.error || !result.data) {
      toast.error(result.error?.message || "Não foi possível salvar o item.");
      setSaving(false);
      return;
    }
    const itemId = result.data.id;
    if (editing) {
      const removed = await supabase.from("catalog_recipes").delete().eq("catalog_item_id", itemId);
      if (removed.error) toast.error(removed.error.message);
    }
    if (recipes.length) {
      const inserted = await supabase.from("catalog_recipes").insert(
        recipes.map((row) => ({
          catalog_item_id: itemId,
          inventory_item_id: row.inventory_item_id,
          quantity_used: row.quantity_used,
        })),
      );
      if (inserted.error) toast.error(inserted.error.message);
    }
    await client.invalidateQueries({ queryKey: ["business"] });
    toast.success(
      editing
        ? "Item atualizado com seu novo preço."
        : "Item precificado! A esteira já pode vender e divulgar.",
    );
    setSaving(false);
    if (goToCopiloto) {
      void navigate({ to: "/copiloto", search: { itemId } });
    } else {
      reset(mode);
    }
  }

  async function remove(item: BusinessData["catalog"][number]) {
    if (!window.confirm(`Remover ${item.name} do catálogo?`)) return;
    const { error } = await supabase.from("catalog_items").delete().eq("id", item.id);
    if (error) toast.error(error.message);
    else {
      await client.invalidateQueries({ queryKey: ["business"] });
      toast.success("Item removido do catálogo.");
    }
  }

  async function toggleActive(item: BusinessData["catalog"][number], active: boolean) {
    const { error } = await supabase.from("catalog_items").update({ active }).eq("id", item.id);
    if (error) toast.error(error.message);
    else await client.invalidateQueries({ queryKey: ["business"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div>
          <h1 className="text-2xl font-extrabold">
            Precificação inteligente<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Cada insumo, minuto e taxa transformados em um preço que faz sentido.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border bg-card p-1">
          <Button
            variant={mode === "produto" ? "default" : "ghost"}
            size="sm"
            onClick={() => reset("produto")}
          >
            <Package size={14} /> Criar produto
          </Button>
          <Button
            variant={mode === "servico" ? "default" : "ghost"}
            size="sm"
            onClick={() => reset("servico")}
          >
            <Sparkles size={14} /> Criar serviço
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="surface p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Calculator size={17} className="text-info" />
            <h2 className="section-heading">
              {editing
                ? "Editando item"
                : mode === "produto"
                  ? "Construtor de produto físico"
                  : "Construtor de serviço"}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="field">
              Nome
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  mode === "produto" ? "Ex.: Caixa de brownies" : "Ex.: Limpeza de pele profunda"
                }
                required
              />
            </label>
            <label className="field">
              Descrição curta
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="O que o cliente recebe"
              />
            </label>
            <label className="field">
              Público-alvo
              <input
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                placeholder="Para quem é ideal"
              />
            </label>
            <label className="field">
              Principal benefício
              <input
                value={benefit}
                onChange={(event) => setBenefit(event.target.value)}
                placeholder="O que muda na vida do cliente"
              />
            </label>
            <label className="field sm:col-span-2">
              Dor que resolve
              <input
                value={pain}
                onChange={(event) => setPain(event.target.value)}
                placeholder="Qual problema esse item elimina"
              />
            </label>
          </div>

          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold">
                  {mode === "produto"
                    ? "Ficha técnica · insumos por unidade"
                    : "Materiais consumidos no atendimento"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  O custo usa o preço promocional ativo de cada insumo.
                </p>
              </div>
              <span className="status info">{money(materials)} em materiais</span>
            </div>
            <div className="mt-4 grid sm:grid-cols-[minmax(0,1fr)_130px_auto] gap-3 items-end">
              <label className="field">
                Insumo
                <select
                  value={picker.inventory_item_id}
                  onChange={(event) =>
                    setPicker({ ...picker, inventory_item_id: event.target.value })
                  }
                >
                  <option value="">Selecione um insumo</option>
                  {data.inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.unit_type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Quantidade
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={picker.quantity_used || ""}
                  onChange={(event) =>
                    setPicker({ ...picker, quantity_used: Number(event.target.value) })
                  }
                />
              </label>
              <Button variant="outline" onClick={addRecipe}>
                <Plus size={15} /> Adicionar
              </Button>
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>INSUMO</th>
                    <th>CONSUMO</th>
                    <th>CUSTO UNITÁRIO</th>
                    <th>CUSTO TOTAL</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recipes.map((row) => {
                    const item = data.inventory.find((entry) => entry.id === row.inventory_item_id);
                    const unit = item
                      ? (item.unit_cost_active ?? item.regular_price / (item.package_quantity || 1))
                      : 0;
                    return (
                      <tr key={row.key}>
                        <td className="text-[11px] font-medium whitespace-nowrap">
                          {item?.name || "Insumo"}
                          {item?.is_promo_active && (
                            <span className="status warning ml-2">Promo</span>
                          )}
                        </td>
                        <td className="text-[11px]">
                          {row.quantity_used} {item?.unit_type}
                        </td>
                        <td className="text-[11px]">{money(unit)}</td>
                        <td className="text-[11px] font-semibold">
                          {money(unit * row.quantity_used)}
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setRecipes((current) =>
                                current.filter((entry) => entry.key !== row.key),
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {!recipes.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground text-[11px]"
                      >
                        Nenhum insumo na ficha técnica ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {promoRisks.length > 0 && (
              <div className="mt-4 flex gap-2 rounded-lg bg-warning-soft p-3 text-[11px] text-primary">
                <TriangleAlert size={15} className="shrink-0" />
                <span>
                  Atenção: se{" "}
                  {promoRisks
                    .map(
                      (row) =>
                        data.inventory.find((item) => item.id === row.inventory_item_id)?.name,
                    )
                    .join(", ")}{" "}
                  voltar ao preço normal, seu custo sobe {money(riskValue)}.
                </span>
              </div>
            )}
            {insufficient.length > 0 && (
              <div className="mt-3 flex gap-2 rounded-lg bg-destructive/10 p-3 text-[11px] text-destructive">
                <TriangleAlert size={15} className="shrink-0" />
                <span>
                  Estoque insuficiente para{" "}
                  {insufficient
                    .map(
                      (row) =>
                        data.inventory.find((item) => item.id === row.inventory_item_id)?.name,
                    )
                    .join(", ")}
                  . Reponha antes de vender.
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-background p-4">
            <p className="text-sm font-semibold">Tempo e hora técnica</p>
            <div className="mt-4 grid sm:grid-cols-3 gap-4">
              <label className="field">
                Horas
                <input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(event) => setHours(Number(event.target.value))}
                />
              </label>
              <label className="field">
                Minutos
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(event) => setMinutes(Number(event.target.value))}
                />
              </label>
              <label className="field">
                Valor da hora (R$)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourly}
                  onChange={(event) => setHourly(Number(event.target.value))}
                />
              </label>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Mão de obra: {money(calc.labor)} · {totalMinutes} minutos por unidade
            </p>
          </div>

          <div className="rounded-xl border bg-background p-4 space-y-5">
            <p className="text-sm font-semibold">Simulador financeiro</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="field max-w-xs">
                Regra de cálculo
                <select
                  value={calculationMode}
                  onChange={(event) =>
                    changeCalculationMode(event.target.value as PriceCalculationMode)
                  }
                >
                  <option value="margem">Margem sobre a venda</option>
                  <option value="markup">Markup sobre o custo</option>
                </select>
              </label>
              <Button variant="outline" onClick={applyKeystone}>
                Aplicar regra 2x
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {keystoneRule(calc.cost).description}
            </p>
            {[
              {
                label: "Rateio de custos fixos",
                value: fixed,
                set: setFixed,
                hint: "Parte dos custos fixos alocada neste item",
              },
              {
                label: "Taxas e impostos",
                value: tax,
                set: setTax,
                hint: "Checkout Pro e impostos do negócio",
              },
              ...(calculationMode === "margem"
                ? [
                    {
                      label: "Margem líquida desejada",
                      value: margin,
                      set: setMargin,
                      hint: "Lucro real que você quer por venda",
                    },
                  ]
                : [
                    {
                      label: "Markup sobre o custo",
                      value: markup,
                      set: setMarkup,
                      hint: "Percentual aplicado sobre o custo total",
                    },
                  ]),
            ].map((slider) => (
              <div key={slider.label}>
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium">{slider.label}</span>
                  <span className="text-info font-bold">
                    {slider.value.toFixed(2).replace(".", ",")}%
                  </span>
                </div>
                <Slider
                  className="mt-2"
                  min={0}
                  max={200}
                  step={0.5}
                  value={[slider.value]}
                  onValueChange={([value]) => slider.set(value ?? 0)}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">{slider.hint}</p>
              </div>
            ))}
            <label className="field max-w-xs">
              Preço promocional de oferta (opcional)
              <input
                type="number"
                min="0"
                step="0.01"
                value={promo || ""}
                onChange={(event) => setPromo(Number(event.target.value))}
                placeholder="Ex.: 39,90"
              />
            </label>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl bg-brand p-6 text-brand-foreground">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-info">
                Resultado da conta
              </p>
              <Check size={16} className="text-info" />
            </div>
            <p className="mt-6 text-2xl font-extrabold">{money(calc.price)}</p>
            <p className="text-[11px] text-brand-foreground/60">preço de venda sugerido</p>
            <div className="mt-6 space-y-3 text-[11px]">
              {[
                ["Materiais", materials],
                ["Mão de obra", calc.labor],
                ["Custos fixos", calc.fixed],
                ["Custo direto total", calc.cost],
                ["Taxas e impostos", calc.tax],
                ["Lucro líquido real", calc.profit],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex justify-between gap-3 border-b border-brand-foreground/10 pb-2"
                >
                  <span className="text-brand-foreground/65">{label}</span>
                  <strong className={label === "Lucro líquido real" ? "text-primary" : ""}>
                    {money(Number(value))}
                  </strong>
                </div>
              ))}
              {calculationMode === "markup" && (
                <div className="flex justify-between gap-3 border-b border-brand-foreground/10 pb-2">
                  <span className="text-brand-foreground/65">Margem efetiva</span>
                  <strong>{advanced.effectiveMargin.toFixed(2).replace(".", ",")}%</strong>
                </div>
              )}
              {promo > 0 && (
                <div className="flex justify-between gap-3 text-primary">
                  <span>Preço promocional</span>
                  <strong>{money(promo)}</strong>
                </div>
              )}
            </div>
            {!calc.valid && (
              <p className="mt-4 text-[11px] text-primary">
                Ajuste taxas, margem ou markup para obter um preço válido.
              </p>
            )}
            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                disabled={saving || !calc.valid}
                onClick={() => void save(true)}
              >
                {saving ? "Salvando..." : "Salvar e ir para o Copiloto"} <ArrowRight size={15} />
              </Button>
              <Button
                variant="ghost"
                className="w-full text-brand-foreground"
                disabled={saving || !calc.valid}
                onClick={() => void save(false)}
              >
                Salvar e continuar aqui
              </Button>
            </div>
          </section>
          <section className="surface p-5">
            <h3 className="section-heading">Já precificado</h3>
            <div className="mt-4 space-y-3">
              {data.catalog.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold">{item.name}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {item.item_type === "produto" ? "Produto" : "Serviço"} · custo{" "}
                        {money(item.total_unit_cost)}
                      </p>
                    </div>
                    <strong className="text-[11px] whitespace-nowrap text-info">
                      {money(
                        item.is_promo_sale_active && item.promo_sale_price
                          ? item.promo_sale_price
                          : item.suggested_price,
                      )}
                    </strong>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Switch
                      aria-label={`Ativar ${item.name}`}
                      checked={item.active}
                      onCheckedChange={(value) => void toggleActive(item, value)}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {item.active ? "Ativo" : "Inativo"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto"
                      onClick={() => editItem(item)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => void remove(item)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
              {!data.catalog.length && (
                <p className="text-[11px] text-muted-foreground">Seu catálogo aparecerá aqui.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
      <ProductionPanel data={data} />
      <PriceBandsPanel data={data} />
    </div>
  );
}
