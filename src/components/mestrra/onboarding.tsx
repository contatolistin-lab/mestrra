import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import type { BusinessData } from "@/lib/business.functions";
import { seedDemoData } from "@/lib/demo-seed";
import { ProfileForm } from "./forms";

export function Onboarding({ data }: { data: BusinessData }) {
  const client = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const open = !data.profile?.business_name;

  async function seed() {
    setSeeding(true);
    try {
      await seedDemoData(data.userId);
      await client.invalidateQueries({ queryKey: ["business"] });
      toast.success("Esteira pronta! Você já pode testar todas as etapas com dados de exemplo.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados de demonstração.",
      );
    } finally {
      setSeeding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center gap-2 text-info text-xs font-bold uppercase tracking-wide">
          <Sparkles size={15} /> Primeiro acesso
        </div>
        <DialogTitle>Bem-vindo à mestrra</DialogTitle>
        <DialogDescription>
          Conte um pouco sobre o seu negócio para calibrarmos sua esteira, sua hora técnica e suas
          sugestões de preço.
        </DialogDescription>
        <ProfileForm data={data} />
        <div className="rounded-xl border border-dashed border-info/40 bg-info-soft/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand">
            <WandSparkles size={16} /> Quer testar primeiro?
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Preencha estoque, catálogo, pedidos e caixa com dados de demonstração e percorra a
            esteira em 30 segundos.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void seed()}
            disabled={seeding}
          >
            {seeding ? "Preparando..." : "Preencher dados de demonstração"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
