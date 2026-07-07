// GET    /api/crm/tarefas/:id?key=...
// PUT    /api/crm/tarefas/:id?key=...  body: partial fields or { checklist: [...] }
// DELETE /api/crm/tarefas/:id?key=...

const UPDATABLE = ['titulo', 'cliente_id', 'obs', 'status', 'data_inicio', 'data_entrega'];

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const row = await env.DB.prepare('SELECT * FROM crm_tarefas WHERE id = ?').bind(params.id).first();
    if (!row) return json({ error: 'Not found' }, 404);
    return json({ tarefa: parseChecklist(row) });
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

  // checklist handled separately (needs JSON.stringify)
  if (body.checklist !== undefined) {
    updates.push(['checklist', JSON.stringify(body.checklist)]);
  }

  if (!updates.length) return json({ error: 'No valid fields to update' }, 400);

  const now = Math.floor(Date.now() / 1000);
  updates.push(['updated_at', now]);

  const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
  const values    = updates.map(([, v]) => v);

  try {
    const result = await env.DB.prepare(
      `UPDATE crm_tarefas SET ${setClause} WHERE id = ?`
    ).bind(...values, params.id).run();

    if (!result.meta.changes) return json({ error: 'Not found' }, 404);
    const row = await env.DB.prepare('SELECT * FROM crm_tarefas WHERE id = ?').bind(params.id).first();
    return json({ tarefa: parseChecklist(row) });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const result = await env.DB.prepare('DELETE FROM crm_tarefas WHERE id = ?').bind(params.id).run();
    if (!result.meta.changes) return json({ error: 'Not found' }, 404);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── helpers ───────────────────────────────────────────────────────────────────

function parseChecklist(row) {
  if (!row) return row;
  try { row.checklist = row.checklist ? JSON.parse(row.checklist) : []; } catch { row.checklist = []; }
  return row;
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
