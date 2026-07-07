// GET    /api/crm/clientes/:id?key=...
// PUT    /api/crm/clientes/:id?key=...  body: partial cliente fields
// DELETE /api/crm/clientes/:id?key=...

const UPDATABLE = [
  'nome', 'empresa', 'instagram', 'email', 'telefone',
  'proj', 'status', 'como_conheceu', 'observacao',
  'cidade', 'estado', 'pais', 'aniversario',
];

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const cliente = await env.DB.prepare(
      'SELECT * FROM crm_clientes WHERE id = ?'
    ).bind(params.id).first();
    if (!cliente) return json({ error: 'Not found' }, 404);
    return json({ cliente });
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

  // recalculate avatar if nome is being updated
  if (body.nome) {
    const av = body.nome.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
    updates.push(['av', av]);
  }

  const now = Math.floor(Date.now() / 1000);
  updates.push(['updated_at', now]);

  const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
  const values    = updates.map(([, v]) => v);

  try {
    const result = await env.DB.prepare(
      `UPDATE crm_clientes SET ${setClause} WHERE id = ?`
    ).bind(...values, params.id).run();

    if (!result.meta.changes) return json({ error: 'Not found' }, 404);
    const cliente = await env.DB.prepare('SELECT * FROM crm_clientes WHERE id = ?').bind(params.id).first();
    return json({ cliente });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const result = await env.DB.prepare(
      'DELETE FROM crm_clientes WHERE id = ?'
    ).bind(params.id).run();
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
