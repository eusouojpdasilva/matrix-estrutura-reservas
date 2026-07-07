// GET    /api/crm/leads/:id?key=...
// PUT    /api/crm/leads/:id?key=...  body: partial lead fields
// DELETE /api/crm/leads/:id?key=...

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
  if (!updates.length) return json({ error: 'No valid fields to update' }, 400);

  const now = Math.floor(Date.now() / 1000);
  updates.push(['updated_at', now]);

  const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
  const values    = updates.map(([, v]) => v);

  try {
    const result = await env.DB.prepare(
      `UPDATE crm_leads SET ${setClause} WHERE id = ?`
    ).bind(...values, params.id).run();

    if (!result.meta.changes) return json({ error: 'Not found' }, 404);
    const lead = await env.DB.prepare('SELECT * FROM crm_leads WHERE id = ?').bind(params.id).first();
    return json({ lead });
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
