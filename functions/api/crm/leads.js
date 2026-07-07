// GET  /api/crm/leads?key=...&status=novo&limit=200
// POST /api/crm/leads?key=...  body: lead fields
//
// Filtros GET: status (optional), limit (1-500, default 200)
// Campos extras de agência: destino, data_viagem, tipo (Pacote|Seguro|Hotel)

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const status = url.searchParams.get('status') || '';
  const limit  = clamp(url.searchParams.get('limit'), 200, 1, 500);

  try {
    const rows = status
      ? await env.DB.prepare(
          'SELECT * FROM crm_leads WHERE status = ? ORDER BY created_at DESC LIMIT ?'
        ).bind(status, limit).all()
      : await env.DB.prepare(
          'SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT ?'
        ).bind(limit).all();

    return json({ leads: rows.results || [] });
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
    return json({ lead }, 201);
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
