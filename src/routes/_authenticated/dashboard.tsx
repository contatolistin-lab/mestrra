import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AuthenticatedShell } from "@/components/mestrra/authenticated-shell";
import { Dashboard } from "@/components/mestrra/dashboard";
import { CashBook } from "@/components/mestrra/cashbook";
import { FormDialog, ExpenseForm } from "@/components/mestrra/forms";
import { useBusinessData } from "@/lib/use-business";
import { requireAuth } from "@/lib/require-auth";
import { routeMeta } from "@/lib/mestrra";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  beforeLoad: requireAuth,
  head: () =>
    routeMeta("Visão geral", "Acompanhe o movimento do seu negócio em tempo real na mestrra."),
  component: () => (
    <AuthenticatedShell>
      <DashboardPage />
    </AuthenticatedShell>
  ),
});

function DashboardPage() {
  const data = useBusinessData();
  const [expenseOpen, setExpenseOpen] = useState(false);

  return (
    <>
      <Dashboard data={data} onExpense={() => setExpenseOpen(true)} />
      <CashBook data={data} />
      <FormDialog
        title="Lançar despesa"
        description="Registre uma saída para manter seu fluxo de caixa sempre verdadeiro."
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
      >
        <ExpenseForm userId={data.userId} onClose={() => setExpenseOpen(false)} />
      </FormDialog>
    </>
  );
}
