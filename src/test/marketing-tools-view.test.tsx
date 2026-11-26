import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarketingTools } from "@/components/mestrra/marketing-tools";
import type { ContentInput } from "@/lib/mestrra";

const content: ContentInput = {
  name: "Brownie",
  suggested_price: 48,
  promo_sale_price: 39.9,
  is_promo_sale_active: true,
  main_benefit: "chocolate artesanal",
  target_audience: "amantes de chocolate",
  pain_point_solved: "vontade de doce",
};

describe("Ferramentas práticas do Copiloto", () => {
  it("gera, edita e copia rascunhos de campanha", async () => {
    const onCopy = vi.fn(async () => {});
    render(<MarketingTools tool="campaign" content={content} onCopy={onCopy} />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar textos" }));

    expect(screen.getByText("Publicação da campanha")).toBeInTheDocument();
    expect(screen.getByText("Status e Stories")).toBeInTheDocument();
    expect(screen.getByText("Mensagem de divulgação")).toBeInTheDocument();

    const editor = screen.getByRole("textbox", { name: "Editar Publicação da campanha" });
    fireEvent.change(editor, { target: { value: "Texto revisado pelo usuário" } });
    fireEvent.click(screen.getByRole("button", { name: "Copiar tudo" }));

    expect(onCopy).toHaveBeenCalledWith(expect.stringContaining("Texto revisado pelo usuário"));
  });

  it("gera sete publicações quando o calendário recebe uma data válida", () => {
    render(<MarketingTools tool="calendar" content={content} onCopy={vi.fn(async () => {})} />);

    const generate = screen.getByRole("button", { name: "Gerar textos" });
    expect(generate).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Primeiro dia da semana"), {
      target: { value: "2026-11-30" },
    });
    fireEvent.click(generate);

    expect(screen.getByRole("heading", { name: /Apresentar/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Retomar o interesse/ })).toBeInTheDocument();
    expect(screen.getByText("0 de 7 publicações concluídas")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Marcar concluído" })[0]!);
    expect(screen.getByText("1 de 7 publicações concluídas")).toBeInTheDocument();
  });

  it("adapta respostas e perfil comercial ao item escolhido", () => {
    const { unmount } = render(
      <MarketingTools tool="reply" content={content} onCopy={vi.fn(async () => {})} />,
    );

    fireEvent.change(screen.getByLabelText("Nome do cliente (opcional)"), {
      target: { value: "Ana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gerar textos" }));
    expect(
      (screen.getByRole("textbox", { name: "Editar Resposta ao cliente" }) as HTMLTextAreaElement)
        .value,
    ).toContain("Olá, Ana!");

    unmount();

    render(<MarketingTools tool="profile" content={content} onCopy={vi.fn(async () => {})} />);
    fireEvent.click(screen.getByRole("button", { name: "Gerar textos" }));
    expect(
      (screen.getByRole("textbox", { name: "Editar Bio do Instagram" }) as HTMLTextAreaElement)
        .value,
    ).toContain("chocolate artesanal");
  });
});
