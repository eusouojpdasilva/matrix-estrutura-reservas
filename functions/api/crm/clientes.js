// GET  /api/crm/clientes?key=...&status=Ativo&limit=200
// POST /api/crm/clientes?key=...  body: cliente fields

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const status = url.searchParams.get('status') || '';
  const limit  = clamp(url.searchParams.get('limit'), 200, 1, 500);

  try {
    const rows = status
      ? await env.DB.prepare(
          'SELECT * FROM crm_clientes WHERE status = ? ORDER BY created_at DESC LIMIT ?'
        ).bind(status, limit).all()
      : await env.DB.prepare(
          'SELECT * FROM crm_clientes ORDER BY created_at DESC LIMIT ?'
        ).bind(limit).all();

    return json({ clientes: rows.results || [] });
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
    nome, empresa, instagram, email, telefone,
    proj, status = 'Ativo',
    como_conheceu, observacao,
    lead_id, aniversario,
    cidade, estado, pais,
  } = body;

  if (!nome?.trim()) return json({ error: 'nome is required' }, 400);

  // avatar: first letters of each word (up to 2), uppercase
  const av = nome.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');

  const id  = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  try {
    await env.DB.prepare(`
      INSERT INTO crm_clientes
        (id, nome, empresa, instagram, email, telefone, proj, status,
         como_conheceu, observacao, lead_id, av, cidade, estado, pais,
         aniversario, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id, nome.trim(), empresa || null, instagram || null,
      email || null, telefone || null,
      proj || null, status,
      como_conheceu || null, observacao || null,
      lead_id || null, av,
      cidade || null, estado || null, pais || null,
      aniversario || null,
      now, now,
    ).run();

    // if created from a lead, mark that lead as closed
    if (lead_id) {
      await env.DB.prepare(
        'UPDATE crm_leads SET status = ?, cliente_id = ?, updated_at = ? WHERE id = ?'
      ).bind('fechado', id, now, lead_id).run();
    }

    const cliente = await env.DB.prepare('SELECT * FROM crm_clientes WHERE id = ?').bind(id).first();
    return json({ cliente }, 201);
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

function clamp(raw, fallback, min, max) {
  const n = parseInt(raw || '', 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
