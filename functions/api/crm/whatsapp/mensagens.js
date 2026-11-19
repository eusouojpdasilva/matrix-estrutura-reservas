// GET /api/crm/whatsapp/mensagens?key=...&lead_id=...
//
// A conversa do lead em ordem cronológica, que é como a tela desenha as bolhas.
//
// Ordena por enviado_em e desempata por created_at: quando duas mensagens caem
// no mesmo segundo — acontece com envio e confirmação — é a ordem de chegada
// que resolve.

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const leadId = url.searchParams.get('lead_id');
  if (!leadId) return json({ error: 'lead_id é obrigatório' }, 400);

  const limite = clamp(url.searchParams.get('limit'), 200, 1, 500);

  try {
    const { results } = await env.DB.prepare(`
      SELECT id, lead_id, kapso_message_id, direcao, tipo, texto,
             telefone, contato_nome, status, enviado_em, created_at
        FROM crm_mensagens
       WHERE lead_id = ?
       ORDER BY enviado_em ASC, created_at ASC
       LIMIT ?
    `).bind(leadId, limite).all();

    return json({ mensagens: results || [] });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

function clamp(valor, padrao, min, max) {
  const n = parseInt(valor, 10);
  if (!Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, n));
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
