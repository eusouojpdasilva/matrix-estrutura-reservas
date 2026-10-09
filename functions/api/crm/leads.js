// GET  /api/crm/leads?key=...&status=novo&limit=200
// POST /api/crm/leads?key=...  body: lead fields
//
// Filtros GET: status (optional), limit (1-500, default 200)
// Campos extras de agência: destino, data_viagem, tipo (Pacote|Seguro|Hotel)
//
// followup_tarefa (POST): descrição do follow-up. Junto com followup, cria a
// tarefa correspondente na mesma requisição — ver _followup.js

import { syncTarefaFollowup } from './_followup.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const status = url.searchParams.get('status') || '';
  const limit  = clamp(url.searchParams.get('limit'), 200, 1, 500);
  // janela de entrada do lead (created_at), para o filtro de período do pipeline
  const from   = isYmd(url.searchParams.get('from')) ? url.searchParams.get('from') : null;
  const to     = isYmd(url.searchParams.get('to'))   ? url.searchParams.get('to')   : null;

  // Traz a descrição do follow-up junto para o modal do lead já abrir com o
  // campo preenchido, em vez de uma busca extra por tarefa a cada abertura.
  const SELECT = `
    SELECT l.*, (
      SELECT t.titulo FROM crm_tarefas t
      WHERE t.lead_id = l.id AND t.origem = 'followup' AND t.status != 'concluído'
      ORDER BY t.created_at DESC LIMIT 1
    ) AS followup_tarefa
    FROM crm_leads l`;

  const cond = [], binds = [];
  if (status) { cond.push('l.status = ?');      binds.push(status); }
  if (from)   { cond.push('l.created_at >= ?'); binds.push(startOfDay(from)); }
  if (to)     { cond.push('l.created_at <= ?'); binds.push(endOfDay(to)); }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

  try {
    const rows = await env.DB.prepare(
      `${SELECT} ${where} ORDER BY l.created_at DESC LIMIT ?`
    ).bind(...binds, limit).all();

    return json({ leads: rows.results || [], from, to });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const {
    nome, nicho, proj,
    status        = 'novo',
    valor_estimado, moeda = 'BRL',
    tipo, destino, data_viagem,
    followup, obs, telefone,
    session_id, event_log_id,
  } = body;

  if (!nome?.trim()) return json({ error: 'nome is required' }, 400);

  const id  = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  try {
    await env.DB.prepare(`
      INSERT INTO crm_leads
        (id, nome, nicho, proj, status, valor_estimado, moeda, tipo,
         destino, data_viagem, followup, obs, telefone, contato_data,
         session_id, event_log_id, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id, nome.trim(), nicho || null, proj || null,
      status, valor_estimado ?? null, moeda,
      tipo || null, destino || null, data_viagem || null,
      followup || null, obs || null, telefone || null, now,
      session_id || null, event_log_id || null,
      now, now,
    ).run();

    const lead = await env.DB.prepare('SELECT * FROM crm_leads WHERE id = ?').bind(id).first();
    // data de follow-up + descrição criam a tarefa junto, sem passo manual
    const followupTarefa = await syncTarefaFollowup(env, lead, body.followup_tarefa);
    return json({ lead, followup_tarefa: followupTarefa }, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── helpers ──────────────────────────────────────────────────────────────────

function isYmd(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

// crm_leads.created_at é unix em segundos, então os limites da janela são
// calculados aqui em vez de depender das funções de data do SQLite.
function startOfDay(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 1000);
}

function endOfDay(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d, 23, 59, 59) / 1000);
}

function auth(url, env) {
  return env.DASH_KEY && url.searchParams.get('key') === env.DASH_KEY;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
}

function clamp(raw, fallback, min, max) {
  const n = parseInt(raw || '', 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
