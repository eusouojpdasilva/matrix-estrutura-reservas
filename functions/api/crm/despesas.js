// GET  /api/crm/despesas?key=...&periodo=Mensal
// POST /api/crm/despesas?key=...  body: despesa fields
// PUT  /api/crm/despesas/:id  — see [id].js
// DELETE /api/crm/despesas/:id  — see [id].js

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const periodo = url.searchParams.get('periodo') || '';

  try {
    const rows = periodo
      ? await env.DB.prepare(
          'SELECT * FROM crm_despesas WHERE periodo = ? ORDER BY data DESC'
        ).bind(periodo).all()
      : await env.DB.prepare(
          'SELECT * FROM crm_despesas ORDER BY data DESC LIMIT 200'
        ).all();

    // total mensal estimado (recorrentes)
    const totals = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN periodo = 'Mensal' THEN valor END), 0) as mensal,
        COALESCE(SUM(valor), 0) as total
      FROM crm_despesas
      WHERE data_fim IS NULL OR data_fim >= date('now')
    `).first();

    return json({
      despesas: rows.results || [],
      totais: {
        mensal: totals?.mensal || 0,
        total:  totals?.total  || 0,
      },
    });
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

  const { item, valor, periodo = 'Único', categoria, data, data_fim } = body;

  if (!item?.trim()) return json({ error: 'item is required' }, 400);
  if (!valor || valor <= 0) return json({ error: 'valor must be positive' }, 400);
  if (!data) return json({ error: 'data is required' }, 400);

  const id  = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  try {
    await env.DB.prepare(`
      INSERT INTO crm_despesas (id, item, valor, periodo, categoria, data, data_fim, created_at)
      VALUES (?,?,?,?,?,?,?,?)
    `).bind(id, item.trim(), valor, periodo, categoria || null, data, data_fim || null, now).run();

    const despesa = await env.DB.prepare('SELECT * FROM crm_despesas WHERE id = ?').bind(id).first();
    return json({ despesa }, 201);
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
