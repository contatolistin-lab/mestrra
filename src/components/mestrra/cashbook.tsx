import { useMemo, useState } from "react";
import { Plus, Receipt, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog, ExpenseForm } from "./forms";
import type { BusinessData } from "@/lib/business.functions";
import { money, shortDate } from "@/lib/mestrra";

const categories: Record<string, string> = {
  venda_produto: "Venda de produto",
  venda_servico: "Venda de serviço",
  compra_insumo: "Compra de insumo",
  custo_fixo: "Custo fixo",
  marketing: "Marketing",
  pro_labore: "Pró-labore",
  outros: "Outros",
};

export function CashBook({ data }: { data: BusinessData }) {
  const [period, setPeriod] = useState("month");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const today = new Date();
    const month = today.toISOString().slice(0, 7);
    const week = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    return data.cash.filter((row) => {
      if (period === "month" && !row.transaction_date.startsWith(month)) return false;
      if (period === "week" && row.transaction_date < week) return false;
      if (category !== "all" && row.category !== category) return false;
      if (search && !row.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data.cash, period, category, search]);

  const entries = rows
    .filter((row) => row.type === "entrada")
    .reduce((sum, row) => sum + row.amount, 0);
  const exits = rows
    .filter((row) => row.type === "saida")
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <section className="surface mt-6 overflow-hidden">
      <div className="p-5 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Receipt size={17} className="text-info" />
            <h2 className="section-heading">Livro caixa 360º</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Entradas e saídas lançadas automaticamente pela esteira.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={14} /> Lançar despesa
        </Button>
      </div>
      <div className="px-5 pb-4 flex flex-wrap gap-3">
        <select
          aria-label="Período do caixa"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="native-select text-xs"
        >
          <option value="month">Este mês</option>
          <option value="week">Últimos 7 dias</option>
          <option value="all">Todo o período</option>
        </select>
        <select
          aria-label="Categoria do caixa"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="native-select text-xs"
        >
          <option value="all">Todas as categorias</option>
          {Object.entries(categories).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="flex gap-2 items-center text-muted-foreground border rounded-md px-3">
          <Search size={15} />
          <input
            aria-label="Buscar lançamento"
            placeholder="Buscar lançamento..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="outline-none bg-transparent py-2 text-xs w-48"
          />
        </label>
        <div className="ml-auto flex gap-4 text-xs">
          <span className="text-success">
            Entradas <strong>{money(entries)}</strong>
          </span>
          <span className="text-primary">
            Saídas <strong>{money(exits)}</strong>
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>DATA</th>
              <th>DESCRIÇÃO</th>
              <th>CATEGORIA</th>
              <th>TIPO</th>
              <th>VALOR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap text-[11px]">{shortDate(row.transaction_date)}</td>
                <td className="whitespace-nowrap text-[11px] font-medium">{row.description}</td>
                <td className="text-[11px] text-muted-foreground">
                  {categories[row.category] || row.category}
                </td>
                <td>
                  <span className={`status ${row.type === "saida" ? "warning" : ""}`}>
                    {row.type === "entrada" ? "Entrada" : "Saída"}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap font-semibold ${row.type === "entrada" ? "text-success" : "text-primary"}`}
                >
                  {row.type === "entrada" ? "+" : "−"} {money(row.amount)}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum lançamento no período selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <FormDialog title="Lançar despesa" open={open} onClose={() => setOpen(false)}>
        <ExpenseForm userId={data.userId} onClose={() => setOpen(false)} />
      </FormDialog>
    </section>
  );
}
