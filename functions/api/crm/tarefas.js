// GET  /api/crm/tarefas?key=...&status=a-fazer&cliente_id=...
// POST /api/crm/tarefas?key=...  body: tarefa fields
//
// checklist field: JSON string — [{item: string, done: boolean}]

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const status     = url.searchParams.get('status') || '';
  const cliente_id = url.searchParams.get('cliente_id') || '';
  const limit      = clamp(url.searchParams.get('limit'), 200, 1, 500);

  try {
    const conditions = [];
    const binds      = [];
    if (status)     { conditions.push('t.status = ?');     binds.push(status);     }
    if (cliente_id) { conditions.push('t.cliente_id = ?'); binds.push(cliente_id); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    binds.push(limit);

    // lead_nome dá contexto às tarefas de follow-up, que nascem sem cliente —
    // o lead só vira cliente quando fecha
    const rows = await env.DB.prepare(`
      SELECT t.*, c.nome as cliente_nome, l.nome as lead_nome
      FROM crm_tarefas t
      LEFT JOIN crm_clientes c ON t.cliente_id = c.id
      LEFT JOIN crm_leads    l ON t.lead_id    = l.id
      ${where}
      ORDER BY t.data_entrega ASC, t.created_at DESC
      LIMIT ?
    `).bind(...binds).all();

    // parse checklist JSON in each row
    const tarefas = (rows.results || []).map(parseChecklist);
    return json({ tarefas });
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

  const { titulo, cliente_id, obs, status = 'a-fazer', data_inicio, data_entrega, checklist } = body;

  if (!titulo?.trim()) return json({ error: 'titulo is required' }, 400);

  const id  = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const checklistJson = checklist ? JSON.stringify(checklist) : null;

  try {
    await env.DB.prepare(`
      INSERT INTO crm_tarefas
        (id, cliente_id, titulo, obs, status, data_inicio, data_entrega, checklist, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id, cliente_id || null, titulo.trim(),
      obs || null, status,
      data_inicio || null, data_entrega || null,
      checklistJson, now, now,
    ).run();

    const row = await env.DB.prepare('SELECT * FROM crm_tarefas WHERE id = ?').bind(id).first();
    return json({ tarefa: parseChecklist(row) }, 201);
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

function clamp(raw, fallback, min, max) {
  const n = parseInt(raw || '', 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
