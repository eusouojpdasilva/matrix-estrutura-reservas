// -----------------------------------------------------------------------------
// Kapso WhatsApp webhook adapter.
//
// URL shape: /webhook/kapso/<KAPSO_WEBHOOK_SLUG>
// Mesmo padrão dos outros adapters: o UUID em env.KAPSO_WEBHOOK_SLUG fecha o
// endereço, e quem bate em /webhook/kapso sem o slug certo leva 404.
//
// O que protege de verdade é a assinatura: o Kapso manda um HMAC SHA256 do
// corpo cru em X-Webhook-Signature. Sem conferir isso, qualquer um que
// descobrisse a URL poderia injetar conversa falsa no CRM.
//
// Eventos tratados (os cinco que o painel do Kapso oferece):
//   whatsapp.message.received   → grava a mensagem que chegou
//   whatsapp.message.sent       → grava (ou confirma) a que saiu
//   whatsapp.message.delivered  ┐
//   whatsapp.message.read       ├→ só atualizam o status da mensagem existente
//   whatsapp.message.failed     ┘
// Qualquer outro evento leva 200 e é ignorado, para o Kapso não ficar tentando.
// -----------------------------------------------------------------------------

import { guardSlug, timingSafeEqual } from '../_utils.js';
import { soDigitos, acharLeadPorTelefone } from '../../api/crm/_telefone.js';
import { syncTarefaFollowup } from '../../api/crm/_followup.js';

const RECEBIDA  = 'whatsapp.message.received';
const ENVIADA   = 'whatsapp.message.sent';
const STATUS    = {
  'whatsapp.message.delivered': 'delivered',
  'whatsapp.message.read':      'read',
  'whatsapp.message.failed':    'failed',
};

export async function onRequestPost(context) {
  const { request, env, params } = context;

  const slugFailure = guardSlug(params.slug, env.KAPSO_WEBHOOK_SLUG);
  if (slugFailure) return slugFailure;

  // O corpo cru é o que foi assinado. Qualquer parse antes disso muda os bytes
  // (espaço, ordem de chave) e a assinatura deixa de bater.
  const raw = await request.text();

  const assinaturaOk = await conferirAssinatura(raw, request.headers.get('X-Webhook-Signature'), env.KAPSO_WEBHOOK_SECRET);
  if (!assinaturaOk) return json({ error: 'invalid signature' }, 401);

  const evento = request.headers.get('X-Webhook-Event') || '';
  if (evento !== RECEBIDA && evento !== ENVIADA && !STATUS[evento]) {
    return json({ ok: true, ignored: evento }, 200);
  }

  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: 'invalid JSON' }, 400); }

  // Entrega em lote: o Kapso agrupa quando o buffering está ligado. Vem pelo
  // cabeçalho ou pelo envelope — a doc aceita os dois, então checo os dois.
  const emLote = request.headers.get('X-Webhook-Batch') === 'true' || body.batch === true;
  const itens  = emLote ? (body.data || []) : [body];

  const idempotencia = request.headers.get('X-Idempotency-Key') || '';

  try {
    let gravadas = 0, atualizadas = 0, repetidas = 0;
    for (const item of itens) {
      const r = STATUS[evento]
        ? await atualizarStatus(env, item, STATUS[evento])
        : await gravarMensagem(env, item, evento === RECEBIDA ? 'entrada' : 'saida', idempotencia);
      if (r === 'gravada')   gravadas++;
      if (r === 'atualizada') atualizadas++;
      if (r === 'repetida')  repetidas++;
    }
    return json({ ok: true, gravadas, atualizadas, repetidas }, 200);
  } catch (err) {
    // 500 para o Kapso reenviar. A idempotência pelo wamid segura a repetição.
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

// ── assinatura ───────────────────────────────────────────────────────────────

// HMAC SHA256 do corpo cru, em hex, comparado em tempo constante — igual ao
// exemplo da documentação do Kapso.
async function conferirAssinatura(raw, assinatura, secret) {
  if (!secret) return false;
  if (typeof assinatura !== 'string' || !assinatura) return false;

  const enc = new TextEncoder();
  const chave = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const bytes = await crypto.subtle.sign('HMAC', chave, enc.encode(raw));
  const esperada = [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');

  return timingSafeEqual(esperada, assinatura.trim().toLowerCase());
}

// ── gravação ─────────────────────────────────────────────────────────────────

// Tipos sem texto entram com um rótulo legível, senão a conversa na tela fica
// com buracos onde houve áudio ou foto.
const ROTULO = {
  image: '[imagem]', audio: '[áudio]', voice: '[áudio]', video: '[vídeo]',
  document: '[documento]', sticker: '[figurinha]', location: '[localização]',
  contacts: '[contato]',
};

async function gravarMensagem(env, item, direcao, idempotencia) {
  const msg     = item.message || {};
  const conversa = item.conversation || {};

  const wamid = msg.id || null;
  if (wamid) {
    const existe = await env.DB.prepare('SELECT id FROM crm_mensagens WHERE kapso_message_id = ?').bind(wamid).first();
    // Já gravada: ou o Kapso reenviou por falta de 200, ou a mensagem saiu pelo
    // nosso endpoint de envio e o evento sent chegou depois. Não duplica.
    if (existe) return 'repetida';
  }

  // Recebida traz quem mandou; enviada traz para quem foi.
  const telefone = soDigitos(
    direcao === 'entrada' ? (msg.from || conversa.phone_number) : (msg.to || conversa.phone_number),
  );

  let lead = telefone ? await acharLeadPorTelefone(env, telefone) : null;

  // Mensagem de alguém que ainda não está no CRM vira lead, como faz a captura
  // da landing. Só na entrada: uma mensagem que nós enviamos pressupõe lead.
  if (!lead && telefone && direcao === 'entrada') {
    lead = await criarLead(env, telefone, conversa.contact_name);
  }

  const tipo  = msg.type || 'text';
  const texto = msg.text?.body || ROTULO[tipo] || `[${tipo}]`;

  await env.DB.prepare(`
    INSERT INTO crm_mensagens
      (id, lead_id, kapso_message_id, kapso_conversation_id, direcao, tipo,
       texto, telefone, contato_nome, status, enviado_em, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    crypto.randomUUID(),
    lead?.id || null,                       // nulo quando o evento não traz telefone
    wamid || idempotencia || null,
    conversa.id || null,
    direcao,
    tipo,
    texto,
    telefone || null,
    conversa.contact_name || null,
    direcao === 'entrada' ? 'received' : 'sent',
    Number(msg.timestamp) || Math.floor(Date.now() / 1000),
    Math.floor(Date.now() / 1000),
  ).run();

  return 'gravada';
}

// delivered, read e failed chegam depois, referindo a mensagem já gravada.
// Se ela não existe ainda, não inventa linha: o evento sent vem logo atrás.
async function atualizarStatus(env, item, status) {
  const wamid = item.message?.id;
  if (!wamid) return 'repetida';

  const r = await env.DB.prepare(
    'UPDATE crm_mensagens SET status = ? WHERE kapso_message_id = ?'
  ).bind(status, wamid).run();

  return r.meta.changes ? 'atualizada' : 'repetida';
}

async function criarLead(env, telefone, nome) {
  const agora = Math.floor(Date.now() / 1000);
  const id    = crypto.randomUUID();

  // followup em 3 dias, mesmo prazo da captura da landing
  const followup = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  await env.DB.prepare(`
    INSERT INTO crm_leads
      (id, nome, telefone, obs, status, followup, contato_data, created_at, updated_at)
    VALUES (?,?,?,?,'novo',?,?,?,?)
  `).bind(id, nome || telefone, telefone, '🔗 Origem: WhatsApp', followup, agora, agora, agora).run();

  const lead = { id, nome: nome || telefone, telefone, status: 'novo', followup };

  // reaproveita o mesmo helper do pipeline, para a tarefa de follow-up nascer
  // junto como nasceria se o lead tivesse entrado pela tela
  try { await syncTarefaFollowup(env, lead, 'Responder no WhatsApp'); } catch { /* tarefa é acessório */ }

  return lead;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
