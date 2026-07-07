// GET    /api/crm/faturas/:id?key=...
// PUT    /api/crm/faturas/:id?key=...  body: { action: 'pagar'|'vencer'|'desfazer' }
//                                      or partial fields: { valor, mes, status }
// DELETE /api/crm/faturas/:id?key=...

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const fatura = await env.DB.prepare('SELECT * FROM crm_faturas WHERE id = ?').bind(params.id).first();
    if (!fatura) return json({ error: 'Not found' }, 404);
    return json({ fatura });
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

  const now     = Math.floor(Date.now() / 1000);
  const today   = new Date().toISOString().slice(0, 10);
  const { action } = body;

  let updates;

  if (action === 'pagar') {
    updates = [['status', 'pago'], ['data_pagamento', today], ['updated_at', now]];
  } else if (action === 'vencer') {
    updates = [['status', 'vencido'], ['updated_at', now]];
  } else if (action === 'desfazer') {
    updates = [['status', 'pendente'], ['data_pagamento', null], ['updated_at', now]];
  } else {
    // generic partial update
    const UPDATABLE = ['valor', 'mes', 'status', 'data_pagamento'];
    updates = Object.entries(body).filter(([k]) => UPDATABLE.includes(k));
    if (!updates.length) return json({ error: 'No valid fields' }, 400);
    updates.push(['updated_at', now]);
  }

  const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
  const values    = updates.map(([, v]) => v);

  try {
    const result = await env.DB.prepare(
      `UPDATE crm_faturas SET ${setClause} WHERE id = ?`
    ).bind(...values, params.id).run();

    if (!result.meta.changes) return json({ error: 'Not found' }, 404);
    const fatura = await env.DB.prepare('SELECT * FROM crm_faturas WHERE id = ?').bind(params.id).first();
    return json({ fatura });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const result = await env.DB.prepare('DELETE FROM crm_faturas WHERE id = ?').bind(params.id).run();
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
