import { describe, expect, it } from "vitest";
import { onRequestPost } from "../../functions/webhook/kapso/[slug].js";

const SLUG = "0c9ed602-3e6e-4847-80de-2fe28175d9fa";
const SECRET = "secret-de-teste";

/** Assina igual ao Kapso: HMAC SHA256 do corpo cru, em hex. */
async function assinar(raw: string, secret = SECRET) {
  const enc = new TextEncoder();
  const chave = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", chave, enc.encode(raw));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** D1 de mentira que guarda as linhas em memória, para conferir o que foi gravado. */
function fakeEnv(leads: Record<string, unknown>[] = []) {
  const mensagens: Record<string, unknown>[] = [];
  const leadsCriados: Record<string, unknown>[] = [];
  const tarefas: Record<string, unknown>[] = [];

  const DB = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first() {
              if (sql.includes("FROM crm_mensagens WHERE kapso_message_id")) {
                return mensagens.find((m) => m.kapso_message_id === args[0]) || null;
              }
              return null;
            },
            async all() {
              if (sql.includes("FROM crm_leads")) return { results: leads };
              return { results: [] };
            },
            async run() {
              if (sql.includes("INSERT INTO crm_mensagens")) {
                mensagens.push({
                  id: args[0], lead_id: args[1], kapso_message_id: args[2],
                  kapso_conversation_id: args[3], direcao: args[4], tipo: args[5],
                  texto: args[6], telefone: args[7], contato_nome: args[8],
                  status: args[9], enviado_em: args[10],
                });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT INTO crm_leads")) {
                const novo = { id: args[0], nome: args[1], telefone: args[2], obs: args[3] };
                leadsCriados.push(novo);
                leads.push({ ...novo, status: "novo", created_at: 1 });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("UPDATE crm_mensagens SET status")) {
                const alvo = mensagens.find((m) => m.kapso_message_id === args[1]);
                if (alvo) { alvo.status = args[0]; return { meta: { changes: 1 } }; }
                return { meta: { changes: 0 } };
              }
              if (sql.includes("crm_tarefas")) { tarefas.push({ sql }); return { meta: { changes: 1 } }; }
              return { meta: { changes: 0 } };
            },
          };
        },
        // a busca de lead por telefone consulta sem bind, direto no prepare
        async all() {
          if (sql.includes("FROM crm_leads")) return { results: leads };
          return { results: [] };
        },
        async first() { return null; },
        async run() { return { meta: { changes: 0 } }; },
      };
    },
  };

  return { env: { DB, KAPSO_WEBHOOK_SLUG: SLUG, KAPSO_WEBHOOK_SECRET: SECRET }, mensagens, leadsCriados };
}

async function chamar(corpo: unknown, opts: {
  evento?: string; assinatura?: string; slug?: string; lote?: boolean;
  env?: ReturnType<typeof fakeEnv>; idem?: string;
} = {}) {
  const ctx = opts.env ?? fakeEnv();
  const raw = JSON.stringify(corpo);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Event": opts.evento ?? "whatsapp.message.received",
    "X-Webhook-Signature": opts.assinatura ?? (await assinar(raw)),
  };
  if (opts.lote) headers["X-Webhook-Batch"] = "true";
  if (opts.idem) headers["X-Idempotency-Key"] = opts.idem;

  const request = new Request("https://exemplo.com/webhook/kapso/" + (opts.slug ?? SLUG), {
    method: "POST", headers, body: raw,
  });
  const response = await onRequestPost({ request, env: ctx.env, params: { slug: opts.slug ?? SLUG } });
  return { response, ...ctx };
}

const recebida = (over: Record<string, unknown> = {}) => ({
  message: { id: "wamid.AAA", timestamp: "1762300000", type: "text", text: { body: "Oi, quero um roteiro" }, from: "556181425201" },
  conversation: { id: "conv-1", contact_name: "Ana Beatriz", phone_number: "556181425201" },
  ...over,
});

describe("assinatura do webhook", () => {
  it("aceita requisição com assinatura válida", async () => {
    const { response } = await chamar(recebida());
    expect(response.status).toBe(200);
  });

  it("recusa com 401 quando a assinatura não bate", async () => {
    const { response, mensagens } = await chamar(recebida(), { assinatura: "f".repeat(64) });
    expect(response.status).toBe(401);
    expect(mensagens).toHaveLength(0);
  });

  it("recusa quando a assinatura não vem", async () => {
    const ctx = fakeEnv();
    const raw = JSON.stringify(recebida());
    const request = new Request("https://exemplo.com/webhook/kapso/" + SLUG, {
      method: "POST", headers: { "X-Webhook-Event": "whatsapp.message.received" }, body: raw,
    });
    const response = await onRequestPost({ request, env: ctx.env, params: { slug: SLUG } });
    expect(response.status).toBe(401);
  });

  it("recusa assinatura gerada com outro secret", async () => {
    const raw = JSON.stringify(recebida());
    const { response } = await chamar(recebida(), { assinatura: await assinar(raw, "outro-secret") });
    expect(response.status).toBe(401);
  });

  it("devolve 404 quando o slug está errado, sem olhar o corpo", async () => {
    const { response } = await chamar(recebida(), { slug: "slug-errado" });
    expect(response.status).toBe(404);
  });
});

describe("gravação da mensagem", () => {
  it("liga a mensagem ao lead existente, mesmo sem o nono dígito", async () => {
    const ctx = fakeEnv([{ id: "lead-ana", nome: "Ana", telefone: "+55 61 98142 5201", status: "contato", created_at: 5 }]);
    const { mensagens } = await chamar(recebida(), { env: ctx });
    expect(mensagens).toHaveLength(1);
    expect(mensagens[0].lead_id).toBe("lead-ana");
    expect(mensagens[0].direcao).toBe("entrada");
    expect(mensagens[0].texto).toBe("Oi, quero um roteiro");
    expect(mensagens[0].status).toBe("received");
  });

  it("cria lead novo quando o número não está no CRM", async () => {
    const { mensagens, leadsCriados } = await chamar(recebida());
    expect(leadsCriados).toHaveLength(1);
    expect(leadsCriados[0].nome).toBe("Ana Beatriz");
    expect(leadsCriados[0].obs).toBe("🔗 Origem: WhatsApp");
    expect(mensagens[0].lead_id).toBe(leadsCriados[0].id);
  });

  it("usa o telefone como nome quando o contato não tem nome", async () => {
    const { leadsCriados } = await chamar(recebida({ conversation: { id: "c", phone_number: "556181425201" } }));
    expect(leadsCriados[0].nome).toBe("556181425201");
  });

  it("não grava a mesma mensagem duas vezes", async () => {
    const ctx = fakeEnv();
    await chamar(recebida(), { env: ctx });
    const { response } = await chamar(recebida(), { env: ctx });
    expect(response.status).toBe(200);
    expect(ctx.mensagens).toHaveLength(1);
  });

  it("grava sem telefone, com lead_id nulo, em vez de perder a mensagem", async () => {
    const { response, mensagens, leadsCriados } = await chamar({
      message: { id: "wamid.SEM", timestamp: "1762300000", type: "text", text: { body: "oi" } },
      conversation: { id: "conv-9" },
    });
    expect(response.status).toBe(200);
    expect(mensagens).toHaveLength(1);
    expect(mensagens[0].lead_id).toBeNull();
    expect(mensagens[0].kapso_conversation_id).toBe("conv-9");
    expect(leadsCriados).toHaveLength(0);
  });

  it("rotula tipo sem texto em vez de gravar vazio", async () => {
    const { mensagens } = await chamar(recebida({
      message: { id: "wamid.AUDIO", timestamp: "1762300000", type: "audio", from: "556181425201" },
    }));
    expect(mensagens[0].tipo).toBe("audio");
    expect(mensagens[0].texto).toBe("[áudio]");
  });

  it("processa cada item da entrega em lote", async () => {
    const corpo = {
      type: "whatsapp.message.received", batch: true,
      data: [
        recebida({ message: { id: "wamid.1", timestamp: "1762300001", type: "text", text: { body: "um" }, from: "556181425201" } }),
        recebida({ message: { id: "wamid.2", timestamp: "1762300002", type: "text", text: { body: "dois" }, from: "556181425201" } }),
      ],
    };
    const { response, mensagens } = await chamar(corpo, { lote: true });
    expect(response.status).toBe(200);
    expect(mensagens.map((m) => m.texto)).toEqual(["um", "dois"]);
  });
});

describe("eventos de status", () => {
  it("delivered e read atualizam a mensagem, sem criar outra", async () => {
    const ctx = fakeEnv();
    await chamar(recebida(), { env: ctx, evento: "whatsapp.message.sent" });
    expect(ctx.mensagens[0].status).toBe("sent");

    await chamar({ message: { id: "wamid.AAA" } }, { env: ctx, evento: "whatsapp.message.delivered" });
    expect(ctx.mensagens).toHaveLength(1);
    expect(ctx.mensagens[0].status).toBe("delivered");

    await chamar({ message: { id: "wamid.AAA" } }, { env: ctx, evento: "whatsapp.message.read" });
    expect(ctx.mensagens[0].status).toBe("read");
  });

  it("status de mensagem desconhecida não cria linha", async () => {
    const { response, mensagens } = await chamar(
      { message: { id: "wamid.FANTASMA" } }, { evento: "whatsapp.message.failed" },
    );
    expect(response.status).toBe(200);
    expect(mensagens).toHaveLength(0);
  });

  it("evento fora da lista devolve 200 e não grava", async () => {
    const { response, mensagens } = await chamar(recebida(), { evento: "whatsapp.conversation.inactive" });
    expect(response.status).toBe(200);
    expect(mensagens).toHaveLength(0);
  });
});
