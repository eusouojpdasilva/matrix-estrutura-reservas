import { describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../../functions/api/crm/lead-capture.js";

describe("captura pública no CRM", () => {
  it("grava as respostas na coluna Novo sem alterar o esquema", async () => {
    const run = vi.fn().mockResolvedValue({});
    const bind = vi.fn().mockReturnValue({ run });
    const prepare = vi.fn().mockReturnValue({ bind });
    const request = new Request("https://matrix-estrutura-reservas.pages.dev/api/crm/lead-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://matrix-estrutura-reservas.pages.dev" },
      body: JSON.stringify({
        nome: "Ana Exemplo",
        whatsapp: "5561999999999",
        destino: "Islândia",
        datas: "Entre 6 e 12 meses",
        observacoes: "Experiência desejada: Aurora e inverno\nCompanhia: Em casal",
        origem: "Landing Page Scandia Travel",
      }),
    });

    const response = await onRequestPost({ request, env: { DB: { prepare } } });
    expect(response.status).toBe(201);
    expect(prepare.mock.calls[0][0]).toContain("'novo'");
    expect(bind.mock.calls[0][1]).toBe("Ana Exemplo");
    expect(bind.mock.calls[0][2]).toBe("Islândia");
    expect(bind.mock.calls[0][3]).toBe("5561999999999");
    expect(bind.mock.calls[0][4]).toContain("Aurora e inverno");
    expect(run).toHaveBeenCalledOnce();
  });
});
