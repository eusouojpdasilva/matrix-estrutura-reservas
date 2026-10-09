// GET    /api/crm/leads/:id?key=...
// PUT    /api/crm/leads/:id?key=...  body: partial lead fields
// DELETE /api/crm/leads/:id?key=...
//
// followup_tarefa (PUT): descrição do follow-up. Junto com followup, cria ou
// atualiza a tarefa correspondente na mesma requisição — ver _followup.js

import { syncTarefaFollowup } from '../_followup.js';

const UPDATABLE = [
  'nome', 'nicho', 'proj', 'status', 'valor_estimado', 'moeda',
  'tipo', 'destino', 'data_viagem', 'followup', 'obs', 'telefone', 'cliente_id',
];

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const lead = await env.DB.prepare('SELECT * FROM crm_leads WHERE id = ?').bind(params.id).first();
    if (!lead) return json({ error: 'Not found' }, 404);
    return json({ lead });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const updates = Object.entries(body).filter(([k]) => UPDATABLE.includes(k));
  // followup_tarefa não é coluna de crm_leads: vira tarefa, não update de lead.
  // Mas sozinha ela é um PUT válido — mudar só a descrição do follow-up.
  const temTarefa = Object.prototype.hasOwnProperty.call(body, 'followup_tarefa');
  if (!updates.length && !temTarefa) return json({ error: 'No valid fields to update' }, 400);

  const now = Math.floor(Date.now() / 1000);
  updates.push(['updated_at', now]);

  try {
    if (updates.length > 1) {   // > 1 porque updated_at sempre entra
      const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
      const values    = updates.map(([, v]) => v);
      const result = await env.DB.prepare(
        `UPDATE crm_leads SET ${setClause} WHERE id = ?`
      ).bind(...values, params.id).run();
      if (!result.meta.changes) return json({ error: 'Not found' }, 404);
    }

    const lead = await env.DB.prepare('SELECT * FROM crm_leads WHERE id = ?').bind(params.id).first();
    if (!lead) return json({ error: 'Not found' }, 404);

    const followupTarefa = temTarefa
      ? await syncTarefaFollowup(env, lead, body.followup_tarefa)
      : null;

    return json({ lead, followup_tarefa: followupTarefa });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const result = await env.DB.prepare('DELETE FROM crm_leads WHERE id = ?').bind(params.id).run();
    if (!result.meta.changes) return json({ error: 'Not found' }, 404);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── helpers ──────────────────────────────────────────────────────────────────

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
