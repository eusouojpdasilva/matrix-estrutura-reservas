// GET  /api/crm/faturas?key=...
//        &mes=2026-06                  month of reference (default: current)
//        &from=2026-06-01&to=2026-06-15 due-date range; overrides `mes`
//        &all=1                         no period filter at all (export / full ledger)
//        &status=pendente &cliente_id=… &categoria=Passeios
// POST /api/crm/faturas?key=...  body: fatura fields (manual creation)
//
// Actions via PUT /api/crm/faturas/:id — see [id].js
// KPIs always cover the same rows the filter returned, not a fixed month.

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const q          = url.searchParams;
  const all        = q.get('all') === '1';
  const from       = isYmd(q.get('from')) ? q.get('from') : null;
  const to         = isYmd(q.get('to'))   ? q.get('to')   : null;
  const mes        = q.get('mes') || currentMes();
  const status     = q.get('status')     || '';
  const cliente_id = q.get('cliente_id') || '';
  const categoria  = q.get('categoria')  || '';

  // Same filter, emitted twice: once qualified for the JOIN, once bare for the
  // aggregate. `p` is the table prefix ('f.' or ''), so the two never drift.
  // vencimento falls back to mes for rows migrated before the column existed.
  const buildWhere = (p) => {
    const c = [], b = [];
    if (!all) {
      if (from || to) {
        if (from) { c.push(`COALESCE(${p}vencimento, ${p}mes || '-01') >= ?`); b.push(from); }
        if (to)   { c.push(`COALESCE(${p}vencimento, ${p}mes || '-01') <= ?`); b.push(to);   }
      } else {
        c.push(`${p}mes = ?`); b.push(mes);
      }
    }
    if (status)     { c.push(`${p}status = ?`);     b.push(status);     }
    if (cliente_id) { c.push(`${p}cliente_id = ?`); b.push(cliente_id); }
    if (categoria)  { c.push(`${p}categoria = ?`);  b.push(categoria);  }
    return { where: c.length ? `WHERE ${c.join(' AND ')}` : '', binds: b };
  };

  const joined = buildWhere('f.');
  const bare   = buildWhere('');

  // Mesma janela, aplicada à data de caixa. Uma fatura marcada como paga sem
  // data_pagamento cai de volta no vencimento: é a melhor informação que resta,
  // e some-la da receita seria pior do que atribuí-la ao mês em que venceu.
  const caixaFilter = (() => {
    const c = [], b = [];
    if (!all) {
      const ini = from || (mes ? `${mes}-01` : null);
      const fim = to   || (mes ? fimDoMes(mes) : null);
      if (ini) { c.push(`${DATA_CAIXA} >= ?`); b.push(ini); }
      if (fim) { c.push(`${DATA_CAIXA} <= ?`); b.push(fim); }
    }
    if (cliente_id) { c.push('cliente_id = ?'); b.push(cliente_id); }
    if (categoria)  { c.push('categoria = ?');  b.push(categoria);  }
    return { sql: c.length ? `AND ${c.join(' AND ')}` : '', binds: b };
  })();

  try {
    const rows = await env.DB.prepare(
      `SELECT f.*, c.nome as cliente_nome
       FROM crm_faturas f
       LEFT JOIN crm_clientes c ON f.cliente_id = c.id
       ${joined.where}
       ORDER BY COALESCE(f.vencimento, f.mes || '-01') ASC, f.created_at DESC`
    ).bind(...joined.binds).all();

    // A janela se aplica ao vencimento: "o que vence neste mês".
    const kpis = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('pendente','vencido') THEN valor END), 0) as a_receber,
        COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor END), 0) as vencido,
        COALESCE(SUM(valor), 0)                                       as bruto,
        COUNT(*)                                                      as lancamentos
      FROM crm_faturas ${bare.where}
    `).bind(...bare.binds).first();

    // Recebido é regime de caixa: conta pela DATA DE PAGAMENTO, não pelo
    // vencimento. Uma parcela que vencia em setembro e foi paga em outubro é
    // dinheiro que entrou em outubro — com parcelamento isso é rotina, não
    // exceção, e contar pelo vencimento descasaria o CRM do extrato bancário.
    const caixa = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(valor), 0)                     as recebido,
        COALESCE(SUM(COALESCE(comissao, valor)), 0) as comissao,
        COUNT(*)                                    as pagamentos
      FROM crm_faturas
      WHERE status = 'pago' ${caixaFilter.sql}
    `).bind(...caixaFilter.binds).first();

    return json({
      mes: (from || to || all) ? null : mes,
      from, to,
      faturas: rows.results || [],
      kpis: {
        // por vencimento — o que vence na janela
        a_receber:   kpis?.a_receber   || 0,
        vencido:     kpis?.vencido     || 0,
        bruto:       kpis?.bruto       || 0,
        lancamentos: kpis?.lancamentos || 0,
        // por data de pagamento — o que entrou no caixa na janela
        recebido:    caixa?.recebido   || 0,
        comissao:    caixa?.comissao   || 0,
        pagamentos:  caixa?.pagamentos || 0,
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
    cliente_id, contrato_id, valor, status = 'pendente',
    comissao, forma_pagamento, condicao_pagamento,
    descricao, categoria, parcela_num, parcela_total,
  } = body;

  if (!cliente_id || !contrato_id || !valor)
    return json({ error: 'cliente_id, contrato_id, valor are required' }, 400);

  // vencimento is the source of truth; mes is derived from it.
  // Accepts `mes` alone for callers that only know the month.
  const vencimento = isYmd(body.vencimento) ? body.vencimento
                   : isMonth(body.mes)      ? `${body.mes}-01`
                   : null;
  if (!vencimento) return json({ error: 'vencimento (YYYY-MM-DD) or mes (YYYY-MM) is required' }, 400);
  const mes = vencimento.slice(0, 7);

  const id  = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  try {
    await env.DB.prepare(`
      INSERT INTO crm_faturas
        (id, cliente_id, contrato_id, mes, vencimento, valor, comissao,
         descricao, categoria, parcela_num, parcela_total,
         forma_pagamento, condicao_pagamento, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id, cliente_id, contrato_id, mes, vencimento, valor,
      comissao ?? null, descricao ?? null, categoria ?? null,
      parcela_num ?? 1, parcela_total ?? 1,
      forma_pagamento ?? null, condicao_pagamento ?? null,
      status, now, now,
    ).run();

    const fatura = await env.DB.prepare('SELECT * FROM crm_faturas WHERE id = ?').bind(id).first();
    return json({ fatura }, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── helpers ───────────────────────────────────────────────────────────────────

// Data que define o mês de caixa de uma fatura paga, com as quedas de volta
// para dados antigos: pagamento → vencimento → mês de referência.
export const DATA_CAIXA = "COALESCE(data_pagamento, vencimento, mes || '-01')";

function isYmd(s)   { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }
function isMonth(s) { return typeof s === 'string' && /^\d{4}-\d{2}$/.test(s); }

// último dia de 'YYYY-MM', respeitando ano bissexto
function fimDoMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

function currentMes() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
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
