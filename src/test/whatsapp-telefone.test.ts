import { describe, expect, it } from "vitest";
import {
  chaveTelefone,
  mesmoTelefone,
  acharLeadPorTelefone,
  soDigitos,
} from "../../functions/api/crm/_telefone.js";

describe("normalização de telefone do WhatsApp", () => {
  it("casa o número sem nono dígito com o lead salvo com ele", () => {
    // é o caso real: o WhatsApp manda 556181425201, o lead foi digitado com o 9
    expect(mesmoTelefone("556181425201", "+55 61 98142 5201")).toBe(true);
  });

  it("reduz à mesma chave os formatos que o agente digita", () => {
    const esperada = "556181425201";
    for (const escrito of [
      "+55 61 98142 5201",
      "+55 (61) 98142-5201",
      "55 61 9 8142 5201",
      "5561981425201",
      "556181425201",
      "61981425201",
      "6181425201",
    ]) {
      expect(chaveTelefone(escrito), escrito).toBe(esperada);
    }
  });

  it("não confunde dois números que só diferem no começo", () => {
    expect(mesmoTelefone("+55 61 98142 5201", "+55 11 98142 5201")).toBe(false);
  });

  it("não casa número vazio com número vazio", () => {
    expect(mesmoTelefone("", "")).toBe(false);
    expect(mesmoTelefone(null, undefined)).toBe(false);
  });

  it("preserva número estrangeiro inteiro, sem cortar os 8 finais", () => {
    // +1 415 555 0123 e +351 912 345 678 não seguem a regra do nono dígito
    expect(chaveTelefone("+1 415 555 0123")).toBe("14155550123");
    expect(mesmoTelefone("+1 415 555 0123", "+1 650 555 0123")).toBe(false);
  });

  it("soDigitos tira tudo que não é número", () => {
    expect(soDigitos("+55 (61) 98142-5201")).toBe("5561981425201");
    expect(soDigitos(null)).toBe("");
  });
});

describe("achar o lead dono do telefone", () => {
  const fakeDB = (leads: unknown[]) => ({
    DB: { prepare: () => ({ all: async () => ({ results: leads }) }) },
  }) as never;

  it("acha o lead mesmo com o número escrito de outro jeito", async () => {
    const lead = await acharLeadPorTelefone(
      fakeDB([{ id: "l1", nome: "Ana", telefone: "+55 61 98142 5201", status: "novo", created_at: 2 }]),
      "556181425201",
    );
    expect(lead?.id).toBe("l1");
  });

  it("devolve null quando nenhum lead tem aquele número", async () => {
    const lead = await acharLeadPorTelefone(
      fakeDB([{ id: "l1", nome: "Ana", telefone: "+55 11 90000 0000", status: "novo", created_at: 1 }]),
      "556181425201",
    );
    expect(lead).toBeNull();
  });

  it("entre dois leads com o mesmo número, prefere o que não está perdido", async () => {
    // a consulta já devolve nessa ordem; o teste trava o contrato
    const lead = await acharLeadPorTelefone(
      fakeDB([
        { id: "ativo",   nome: "Ana", telefone: "61981425201",        status: "contato", created_at: 1 },
        { id: "perdido", nome: "Ana", telefone: "+55 61 98142 5201", status: "perdido", created_at: 9 },
      ]),
      "556181425201",
    );
    expect(lead?.id).toBe("ativo");
  });

  it("não quebra quando o telefone não vem no evento", async () => {
    expect(await acharLeadPorTelefone(fakeDB([]), "")).toBeNull();
    expect(await acharLeadPorTelefone(fakeDB([]), null)).toBeNull();
  });
});
