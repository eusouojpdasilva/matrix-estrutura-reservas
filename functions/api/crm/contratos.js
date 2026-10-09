// GET  /api/crm/contratos?key=...&cliente_id=...
// POST /api/crm/contratos?key=...  body: contrato fields
//
// On POST: generates the fatura ledger for this contrato.
//
// Three ways to define the schedule, in order of precedence:
//   1. body.parcelas — explicit [{ valor, vencimento, obs }]. Used by the
//      proposal sync, where the agent already typed each due date by hand.
//   2. recorrencia = 'Parcelado' + num_parcelas — splits valor into N monthly
//      parcelas starting at data_inicio, honouring dia_vencimento.
//   3. anything else — a single fatura.
//
// Every fatura carries a real `vencimento` date; `mes` is always derived from it.

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const cliente_id = url.searchParams.get('cliente_id') || '';

  try {
    const rows = cliente_id
      ? await env.DB.prepare(
          'SELECT * FROM crm_contratos WHERE cliente_id = ? ORDER BY created_at DESC'
        ).bind(cliente_id).all()
      : await env.DB.prepare(
          'SELECT * FROM crm_contratos ORDER BY created_at DESC LIMIT 200'
        ).all();

    return json({ contratos: rows.results || [] });
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
    cliente_id, recorrencia = 'Único', moeda = 'BRL',
    data_inicio, vencimento, dia_vencimento, num_parcelas,
    comissao_estimada, forma_pagamento_prevista,
    descricao, categoria, parcelas,
  } = body;

  if (!cliente_id) return json({ error: 'cliente_id is required' }, 400);

  // with an explicit schedule the contract value is the sum of the parcelas
  const temSchedule = Array.isArray(parcelas) && parcelas.length > 0;
  const valor = temSchedule
    ? round2(parcelas.reduce((a, p) => a + (Number(p.valor) || 0), 0))
    : Number(body.valor);

  if (!valor || valor <= 0) return json({ error: 'valor must be positive' }, 400);

  if (temSchedule) {
    const semData = parcelas.findIndex(p => !isYmd(p.vencimento));
    if (semData >= 0) return json({ error: `parcelas[${semData}].vencimento must be YYYY-MM-DD` }, 400);
  }

  const dia = clampDia(dia_vencimento);
  const id  = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  let faturas;
  try {
    faturas = buildFaturas({
      contrato_id: id, cliente_id, valor, recorrencia,
      data_inicio, vencimento, dia, num_parcelas,
      comissao_estimada, forma_pagamento_prevista,
      descricao, categoria, parcelas: temSchedule ? parcelas : null,
    });
  } catch (err) {
    return json({ error: err.message }, 400);
  }

  try {
    await env.DB.prepare(`
      INSERT INTO crm_contratos
        (id, cliente_id, valor, recorrencia, data_inicio, vencimento,
         status, moeda, dia_vencimento, num_parcelas,
         comissao_estimada, forma_pagamento_prevista, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id, cliente_id, valor, recorrencia,
      data_inicio || null,
      vencimento || faturas[0]?.vencimento || null,
      'Ativo', moeda,
      dia ?? null,
      temSchedule ? parcelas.length : (num_parcelas ?? null),
      comissao_estimada ?? null,
      forma_pagamento_prevista ?? null,
      now, now,
    ).run();

    if (faturas.length) {
      const stmt = env.DB.prepare(`
        INSERT INTO crm_faturas
          (id, cliente_id, contrato_id, mes, vencimento, valor, comissao,
           descricao, categoria, parcela_num, parcela_total,
           forma_pagamento, condicao_pagamento, status, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `);
      await env.DB.batch(faturas.map(f => stmt.bind(
        f.id, f.cliente_id, f.contrato_id, f.mes, f.vencimento, f.valor, f.comissao,
        f.descricao, f.categoria, f.parcela_num, f.parcela_total,
        f.forma_pagamento, f.condicao_pagamento, f.status, now, now,
      )));
    }

    const contrato = await env.DB.prepare('SELECT * FROM crm_contratos WHERE id = ?').bind(id).first();
    return json({ contrato, faturas_geradas: faturas.length, faturas }, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── fatura generation ─────────────────────────────────────────────────────────

function buildFaturas(o) {
  const {
    contrato_id, cliente_id, valor, recorrencia,
    data_inicio, vencimento, dia, num_parcelas,
    comissao_estimada, forma_pagamento_prevista,
    descricao, categoria, parcelas,
  } = o;

  // 1. explicit schedule — the proposal already defined valor + date per parcela
  if (parcelas) {
    const valores  = parcelas.map(p => round2(Number(p.valor) || 0));
    const comissoes = splitProportional(comissao_estimada, valores);
    return parcelas.map((p, i) => makeFatura({
      contrato_id, cliente_id,
      valor:         valores[i],
      vencimento:    p.vencimento,
      comissao:      comissoes[i],
      descricao:     p.obs?.trim() || descricao || null,
      categoria,
      parcela_num:   i + 1,
      parcela_total: parcelas.length,
      forma_pagamento:    forma_pagamento_prevista,
      condicao_pagamento: parcelas.length > 1 ? 'Parcelado' : 'À vista',
    }));
  }

  const base = isYmd(data_inicio) ? parseYmd(data_inicio)
             : isYmd(vencimento)  ? parseYmd(vencimento)
             : todayUTC();

  const primeira = firstDue(base, dia);

  // 2. parcelado — split evenly across N months
  const n = Number(num_parcelas);
  if (recorrencia === 'Parcelado' && n > 0) {
    if (n > 120) throw new Error('num_parcelas must be 120 or less');
    const valores   = splitMoney(valor, n);
    const comissoes = splitProportional(comissao_estimada, valores);
    return Array.from({ length: n }, (_, i) => makeFatura({
      contrato_id, cliente_id,
      valor:         valores[i],
      vencimento:    ymd(addMonthsUTC(primeira, i, dia)),
      comissao:      comissoes[i],
      descricao, categoria,
      parcela_num:   i + 1,
      parcela_total: n,
      forma_pagamento:    forma_pagamento_prevista,
      condicao_pagamento: 'Parcelado',
    }));
  }

  // 3. single fatura (Único / Mensal / Trimestral / Anual).
  // Mensal and friends still generate only the first one — the remaining
  // periods are a future cron, same as before this change.
  return [makeFatura({
    contrato_id, cliente_id, valor,
    vencimento:    ymd(primeira),
    comissao:      comissao_estimada ?? null,
    descricao, categoria,
    parcela_num: 1, parcela_total: 1,
    forma_pagamento:    forma_pagamento_prevista,
    condicao_pagamento: 'À vista',
  })];
}

function makeFatura(f) {
  return {
    id:            crypto.randomUUID(),
    cliente_id:    f.cliente_id,
    contrato_id:   f.contrato_id,
    mes:           f.vencimento.slice(0, 7),
    vencimento:    f.vencimento,
    valor:         f.valor,
    comissao:      f.comissao ?? null,
    descricao:     f.descricao ?? null,
    categoria:     f.categoria ?? null,
    parcela_num:   f.parcela_num,
    parcela_total: f.parcela_total,
    forma_pagamento:    f.forma_pagamento ?? null,
    condicao_pagamento: f.condicao_pagamento ?? null,
    status: 'pendente',
  };
}

// ── money ─────────────────────────────────────────────────────────────────────

function round2(v) { return Math.round(v * 100) / 100; }

// Splits a total into n parts that sum back to it exactly, to the cent.
// Leftover cents go to the first parcelas.
function splitMoney(total, n) {
  const cents = Math.round(total * 100);
  const base  = Math.floor(cents / n);
  const rest  = cents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < rest ? 1 : 0)) / 100);
}

// Splits a total proportionally to `weights`, summing back exactly. Returns
// nulls when there is no total to split (commission is optional).
function splitProportional(total, weights) {
  if (total == null || total === '') return weights.map(() => null);
  const t = Number(total);
  if (!Number.isFinite(t)) return weights.map(() => null);
  const sumW = weights.reduce((a, b) => a + b, 0);
  if (!sumW) return splitMoney(t, weights.length);
  const cents = Math.round(t * 100);
  let acc = 0;
  return weights.map((w, i) => {
    if (i === weights.length - 1) return (cents - acc) / 100;
    const v = Math.round(cents * (w / sumW));
    acc += v;
    return v / 100;
  });
}

// ── dates (UTC-explicit: workers run on UTC, and so should the arithmetic) ────

function isYmd(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function ymd(date) { return date.toISOString().slice(0, 10); }

function todayUTC() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

function clampDia(d) {
  const n = Number(d);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
}

// First billing date on or after `base`. Without dia_vencimento the contract
// starts billing on its start date; with it, on the next occurrence of that day
// — so data_inicio 15/01 with dia_vencimento 10 bills 10/02, never 10/01.
function firstDue(base, dia) {
  if (!dia) return base;
  const d = addMonthsUTC(base, 0, dia);
  return d >= base ? d : addMonthsUTC(base, 1, dia);
}

// Adds n months, landing on `dia` when given. Clamps to the last day of the
// target month, so day 31 + one month from January lands on Feb 28/29.
function addMonthsUTC(date, n, dia) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = dia || date.getUTCDate();
  const last = new Date(Date.UTC(y, m + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m + n, Math.min(d, last)));
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
