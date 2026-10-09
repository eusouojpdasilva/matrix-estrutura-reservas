import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import StepForm from "@/components/StepForm";

describe("formulário de captação", () => {
  beforeEach(() => {
    window.SCANDIA_CONFIG = {
      agencyName: "Scandia Travel",
      whatsapp: "5561981784728",
      whatsappMessage: "Olá, Scandia Travel!",
      metaPixelId: "",
      ga4MeasurementId: "",
      trackingEnabled: false,
    };
  });

  afterEach(() => vi.unstubAllGlobals());

  it("pede quatro escolhas antes dos dados pessoais e monta o lead para a coluna Novo", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);
    render(<StepForm />);

    expect(screen.queryByLabelText("Seu nome")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Islândia" }));
    expect(screen.getByRole("heading", { name: "O que mais deseja viver?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("button", { name: "Islândia" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Noruega" }));

    for (const option of ["Aurora e inverno", "Entre 6 e 12 meses", "Em casal"]) {
      fireEvent.click(screen.getByRole("button", { name: option }));
    }

    expect(screen.getByRole("heading", { name: "Agora vamos conversar." })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Seu nome"), { target: { value: "Ana Exemplo" } });
    fireEvent.change(screen.getByLabelText("Seu WhatsApp com DDD"), { target: { value: "(61) 99999-9999" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar no whatsapp/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/crm/lead-capture");
    expect(JSON.parse(request.body)).toMatchObject({
      nome: "Ana Exemplo",
      whatsapp: "5561999999999",
      destino: "Noruega",
      datas: "Entre 6 e 12 meses",
      observacoes: "Experiência desejada: Aurora e inverno\nCompanhia: Em casal",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível registrar");
  });
});
