// POST /api/crm/whatsapp/enviar?key=...   body: { lead_id, texto }
//
// Manda a mensagem pelo Kapso e grava como 'saida' na conversa do lead.
//
// A chave do Kapso fica no servidor: o CRM chama esta rota, nunca a API do
// Kapso direto. Se o front falasse com o Kapso, a chave estaria no HTML.
//
// O evento whatsapp.message.sent chega pelo webhook logo depois, com o mesmo
// wamid. Como gravamos o wamid aqui, lá ele encontra a linha e não duplica.

import { soDigitos } from '../_telefone.js';

const BASE = 'https://api.kapso.ai/meta/whatsapp/v24.0';

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  if (!env.KAPSO_API_KEY || !env.KAPSO_PHONE_NUMBER_ID) {
    return json({ error: 'WhatsApp não configurado nesta instalação' }, 503);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  // `modelo` reabre conversa fora da janela de 24h: fora dela o WhatsApp só
  // aceita template aprovado pela Meta. `texto` continua sendo o caminho
  // normal, dentro da janela.
  const { lead_id, texto, modelo, parametros } = body;
  if (!lead_id) return json({ error: 'lead_id é obrigatório' }, 400);
  if (!modelo && (!texto || !String(texto).trim()))
    return json({ error: 'texto é obrigatório' }, 400);

  const lead = await env.DB.prepare('SELECT id, nome, telefone FROM crm_leads WHERE id = ?').bind(lead_id).first();
  if (!lead) return json({ error: 'Lead não encontrado' }, 404);

  const telefone = soDigitos(lead.telefone);
  if (!telefone) return json({ error: 'Este lead não tem telefone cadastrado' }, 422);

  // ── manda pro Kapso ────────────────────────────────────────────────────────
  let resposta, dados;
  try {
    resposta = await fetch(`${BASE}/${env.KAPSO_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { 'X-API-Key': env.KAPSO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(modelo
        ? {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: telefone,
            type: 'template',
            template: {
              name: String(modelo),
              language: { code: body.idioma || 'pt_BR' },
              // só manda components quando há parâmetro: modelo sem variável
              // é recusado se vier com components vazio
              ...((parametros || []).length
                ? { components: [{ type: 'body', parameters: parametros.map(p => ({ type: 'text', text: String(p) })) }] }
                : {}),
            },
          }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: telefone,
            type: 'text',
            text: { preview_url: false, body: String(texto) },
          }),
    });
    dados = await resposta.json();
  } catch (err) {
    return json({ error: 'Não consegui falar com o Kapso: ' + err.message }, 502);
  }

  if (!resposta.ok) {
    console.log('[kapso] envio recusado', resposta.status, JSON.stringify(dados));
    // O Kapso devolve o erro de duas formas: como texto solto em `error`, e
    // como objeto no formato da Meta (`error.message` + `error.code`). Os
    // exemplos do OpenAPI só mostram o segundo, mas a API usa o primeiro.
    const err    = dados?.error;
    const texto  = typeof err === 'string' ? err
                 : (err?.message || dados?.message || `HTTP ${resposta.status}`);
    const codigo = (err && typeof err === 'object') ? err.code : null;
    const passos = dados?.next_steps || null;

    // Janela de 24h fechada. Reconhecida pelo código da Meta ou pelo texto do
    // Kapso, que não traz código. Fora dela só vale modelo aprovado, então
    // não adianta reenviar — e não gravamos como enviada, porque não foi.
    if (codigo === 131047 || /24-hour window|24h window/i.test(texto)) {
      return json({
        error: 'Faz mais de 24 horas desde a última mensagem desta pessoa. '
             + 'O WhatsApp só deixa reabrir a conversa com um modelo aprovado pela Meta. '
             + 'Peça para ela escrever primeiro, ou use um modelo.',
        codigo: codigo ?? null,
        janela_fechada: true,
      }, 409);
    }

    // O texto vai em `error` porque é dele que o CRM tira o que mostrar.
    return json({
      error: 'O WhatsApp recusou: ' + texto
           + (codigo ? ` (código ${codigo})` : '')
           + (passos ? ' — ' + passos : ''),
      codigo: codigo ?? null,    }, 502);
  }

  // ── grava na conversa ──────────────────────────────────────────────────────
  const wamid = dados?.messages?.[0]?.id || null;
  const agora = Math.floor(Date.now() / 1000);
  const id    = crypto.randomUUID();

  // O histórico guarda o que a pessoa vai ler. Sem o texto montado, a conversa
  // mostraria só o nome do modelo, que não diz nada a quem atende.
  const registrado = modelo
    ? ((parametros || []).length ? `[modelo ${modelo}] ${parametros.join(' · ')}` : `[modelo ${modelo}]`)
    : String(texto);

  await env.DB.prepare(`
    INSERT INTO crm_mensagens
      (id, lead_id, kapso_message_id, kapso_conversation_id, direcao, tipo,
       texto, telefone, contato_nome, status, enviado_em, created_at)
    VALUES (?,?,?,NULL,'saida',?,?,?,?,'sent',?,?)
  `).bind(id, lead.id, wamid, modelo ? 'template' : 'text', registrado, telefone, lead.nome || null, agora, agora).run();

  return json({
    ok: true,
    mensagem: { id, lead_id: lead.id, kapso_message_id: wamid, direcao: 'saida',
                tipo: modelo ? 'template' : 'text', texto: registrado, status: 'sent', enviado_em: agora },
  }, 201);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

function auth(url, env) {
  return env.DASH_KEY && url.searchParams.get('key') === env.DASH_KEY;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', ...cors() },
  });
}

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
}
