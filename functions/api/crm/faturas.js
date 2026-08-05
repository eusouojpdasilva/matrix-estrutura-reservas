// GET  /api/crm/faturas?key=...&mes=2026-06&status=pendente&cliente_id=...
// POST /api/crm/faturas?key=...  body: fatura fields (manual creation)
//
// Actions via PUT /api/crm/faturas/:id — see [id].js
// KPIs: a_receber, recebido, vencido for current month

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const mes        = url.searchParams.get('mes') || currentMes();
  const status     = url.searchParams.get('status') || '';
  const cliente_id = url.searchParams.get('cliente_id') || '';

  try {
    // build dynamic WHERE
    const conditions = ['mes = ?'];
    const binds      = [mes];
    if (status)     { conditions.push('status = ?');     binds.push(status);     }
    if (cliente_id) { conditions.push('cliente_id = ?'); binds.push(cliente_id); }

    const where = conditions.join(' AND ');

    const rows = await env.DB.prepare(
      `SELECT f.*, c.nome as cliente_nome
       FROM crm_faturas f
       LEFT JOIN crm_clientes c ON f.cliente_id = c.id
       WHERE ${where}
       ORDER BY f.created_at DESC`
    ).bind(...binds).all();

    // KPIs for the requested month
    const kpis = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('pendente','vencido') THEN valor END), 0) as a_receber,
        COALESCE(SUM(CASE WHEN status = 'pago'    THEN valor END), 0) as recebido,
        COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor END), 0) as vencido
      FROM crm_faturas WHERE mes = ?
    `).bind(mes).first();

    return json({
      mes,
      faturas: rows.results || [],
      kpis: {
        a_receber: kpis?.a_receber || 0,
        recebido:  kpis?.recebido  || 0,
        vencido:   kpis?.vencido   || 0,
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

  const {
    cliente_id, contrato_id, mes, valor, status = 'pendente',
    comissao, forma_pagamento, condicao_pagamento,
  } = body;

  if (!cliente_id || !contrato_id || !mes || !valor)
    return json({ error: 'cliente_id, contrato_id, mes, valor are required' }, 400);

  const id  = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  try {
    await env.DB.prepare(`
      INSERT INTO crm_faturas
        (id, cliente_id, contrato_id, mes, valor, comissao, forma_pagamento, condicao_pagamento, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id, cliente_id, contrato_id, mes, valor,
      comissao ?? null, forma_pagamento ?? null, condicao_pagamento ?? null,
      status, now, now,
    ).run();

    const fatura = await env.DB.prepare('SELECT * FROM crm_faturas WHERE id = ?').bind(id).first();
    return json({ fatura }, 201);
  } catch (err) {
    // UNIQUE (cliente_id, mes) violation
    if (err.message?.includes('UNIQUE')) return json({ error: 'Fatura already exists for this client/month' }, 409);
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── helpers ───────────────────────────────────────────────────────────────────

function currentMes() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
