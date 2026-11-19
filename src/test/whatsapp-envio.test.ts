import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../../functions/api/crm/whatsapp/enviar.js";

const env = {
  DASH_KEY: "k",
  KAPSO_API_KEY: "chave",
  KAPSO_PHONE_NUMBER_ID: "123",
  DB: {
    prepare: () => ({
      bind: () => ({
        first: async () => ({ id: "l1", nome: "Teste", telefone: "+55 61 98142 5201" }),
        run: async () => ({ meta: { changes: 1 } }),
      }),
    }),
  },
} as never;

const chamar = async (corpo: unknown = { lead_id: "l1", texto: "oi" }) => {
  const request = new Request("https://x/api/crm/whatsapp/enviar?key=k", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const response = await onRequestPost({ request, env });
  return { response, body: await response.json() };
};

const respondeKapso = (status: number, corpo: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(corpo), { status }) as never,
  );

afterEach(() => vi.restoreAllMocks());

describe("envio pelo WhatsApp", () => {
  it("manda para o Kapso na URL com a versão e grava como saída", async () => {
    const f = respondeKapso(200, { messages: [{ id: "wamid.NOVA" }] });
    const { response, body } = await chamar();

    const url = f.mock.calls[0][0] as string;
    expect(url).toContain("/meta/whatsapp/v24.0/123/messages");
    const enviado = JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
    expect(enviado.to).toBe("5561981425201");          // só dígitos
    expect(enviado.text.body).toBe("oi");

    expect(response.status).toBe(201);
    expect(body.mensagem.direcao).toBe("saida");
    expect(body.mensagem.status).toBe("sent");
    expect(body.mensagem.kapso_message_id).toBe("wamid.NOVA");
  });

  it("não vaza a chave do Kapso para a resposta", async () => {
    respondeKapso(200, { messages: [{ id: "wamid.X" }] });
    const { body } = await chamar();
    expect(JSON.stringify(body)).not.toContain("chave");
  });

  // O Kapso devolve o erro como texto solto; os exemplos do OpenAPI mostram o
  // formato aninhado da Meta. Os dois precisam virar a mesma explicação.
  it("reconhece a janela de 24h no formato do Kapso (texto solto)", async () => {
    respondeKapso(422, {
      error: "Cannot send non-template messages outside the 24-hour window.",
      next_steps: "Send a WhatsApp template message to reopen the session.",
    });
    const { response, body } = await chamar();
    expect(response.status).toBe(409);
    expect(body.janela_fechada).toBe(true);
    expect(body.error).toContain("24 horas");
    expect(body.error).toContain("modelo aprovado");
  });

  it("reconhece a janela de 24h no formato da Meta (código 131047)", async () => {
    respondeKapso(400, { error: { message: "outside the 24-hour window", code: 131047 } });
    const { response, body } = await chamar();
    expect(response.status).toBe(409);
    expect(body.janela_fechada).toBe(true);
  });

  it("explica qualquer outra recusa em vez de mostrar rótulo interno", async () => {
    respondeKapso(400, { error: { message: "Invalid phone number", code: 1006 } });
    const { response, body } = await chamar();
    expect(response.status).toBe(502);
    expect(body.error).toContain("Invalid phone number");
    expect(body.error).toContain("1006");
    expect(body.error).not.toBe("kapso");
  });

  it("recusa sem texto e sem lead", async () => {
    expect((await chamar({ lead_id: "l1", texto: "   " })).response.status).toBe(400);
    expect((await chamar({ texto: "oi" })).response.status).toBe(400);
  });
});

// Fora da janela de 24h o WhatsApp só aceita modelo aprovado. É o caso da
// cobrança de parcela: o cliente não escreveu naquele dia.
describe("envio por modelo", () => {
  it("monta o corpo de template com os parâmetros na ordem", async () => {
    const f = respondeKapso(200, { messages: [{ id: "wamid.T" }] });
    const { response, body } = await chamar({
      lead_id: "l1",
      modelo: "lembrete_parcela",
      parametros: ["Ana Beatriz", "Scandia Travel", "R$ 3.333,34", "15/12/2026"],
    });

    const enviado = JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
    expect(enviado.type).toBe("template");
    expect(enviado.template.name).toBe("lembrete_parcela");
    expect(enviado.template.language.code).toBe("pt_BR");
    expect(enviado.template.components[0].parameters.map((p: { text: string }) => p.text))
      .toEqual(["Ana Beatriz", "Scandia Travel", "R$ 3.333,34", "15/12/2026"]);

    expect(response.status).toBe(201);
    expect(body.mensagem.tipo).toBe("template");
    // o histórico mostra o conteúdo, não só o nome do modelo
    expect(body.mensagem.texto).toContain("Ana Beatriz");
    expect(body.mensagem.texto).toContain("R$ 3.333,34");
  });

  it("modelo sem variável não manda components vazio", async () => {
    const f = respondeKapso(200, { messages: [{ id: "wamid.U" }] });
    await chamar({ lead_id: "l1", modelo: "ola_simples" });
    const enviado = JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
    expect(enviado.template.components).toBeUndefined();
  });

  it("com modelo, texto deixa de ser obrigatório", async () => {
    respondeKapso(200, { messages: [{ id: "wamid.V" }] });
    const { response } = await chamar({ lead_id: "l1", modelo: "ola_simples" });
    expect(response.status).toBe(201);
  });
});
