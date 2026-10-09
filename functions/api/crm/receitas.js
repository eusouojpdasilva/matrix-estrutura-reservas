// GET /api/crm/receitas?key=...                → one consolidated row per client
// GET /api/crm/receitas?key=...&cliente_id=…   → that client's full revenue history
//
// Consolidates everything a person ever generated, across months and across
// sources (consultoria parcelada + passeios + hospedagem). The financeiro month
// view answers "what comes in this month"; this answers "what is this client
// worth", which is what item 3 of the CRM spec asks for.
//
// Reads crm_faturas, which after migration 0024 is the agency's revenue ledger.

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const cliente_id = url.searchParams.get('cliente_id') || '';

  try {
    return cliente_id
      ? json(await historicoCliente(env, cliente_id))
      : json(await consolidadoGeral(env));
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

// ── one row per client ────────────────────────────────────────────────────────

async function consolidadoGeral(env) {
  // Clients with no fatura yet still show up, at zero — an agent looking at
  // this list wants to see who has never generated revenue.
  const rows = await env.DB.prepare(`
    SELECT
      c.id, c.nome, c.av, c.status, c.telefone,
      COUNT(f.id)                                                            as lancamentos,
      COALESCE(SUM(f.valor), 0)                                              as bruto,
      COALESCE(SUM(COALESCE(f.comissao, f.valor)), 0)                        as comissao,
      COALESCE(SUM(CASE WHEN f.status = 'pago' THEN f.valor END), 0)         as recebido,
      COALESCE(SUM(CASE WHEN f.status = 'pendente' THEN f.valor END), 0)     as a_receber,
      COALESCE(SUM(CASE WHEN f.status = 'vencido' THEN f.valor END), 0)      as vencido,
      COUNT(DISTINCT f.categoria)                                            as fontes,
      MIN(COALESCE(f.vencimento, f.mes || '-01'))                            as primeira,
      MAX(COALESCE(f.vencimento, f.mes || '-01'))                            as ultima
    FROM crm_clientes c
    LEFT JOIN crm_faturas f ON f.cliente_id = c.id
    GROUP BY c.id
    ORDER BY bruto DESC, c.nome ASC
  `).all();

  const clientes = rows.results || [];
  const totais = clientes.reduce((t, c) => ({
    bruto:     t.bruto     + c.bruto,
    comissao:  t.comissao  + c.comissao,
    recebido:  t.recebido  + c.recebido,
    a_receber: t.a_receber + c.a_receber,
    vencido:   t.vencido   + c.vencido,
  }), { bruto: 0, comissao: 0, recebido: 0, a_receber: 0, vencido: 0 });

  return {
    clientes,
    totais: {
      ...totais,
      clientes_com_receita: clientes.filter(c => c.lancamentos > 0).length,
      ticket_medio: clientes.filter(c => c.lancamentos > 0).length
        ? totais.bruto / clientes.filter(c => c.lancamentos > 0).length
        : 0,
    },
  };
}

// ── one client's full history ─────────────────────────────────────────────────

async function historicoCliente(env, cliente_id) {
  const [cliente, faturas, porCategoria, contratos] = await Promise.all([
    env.DB.prepare('SELECT * FROM crm_clientes WHERE id = ?').bind(cliente_id).first(),

    // every lançamento ever, newest due date first
    env.DB.prepare(`
      SELECT f.*, k.recorrencia, k.moeda
      FROM crm_faturas f
      LEFT JOIN crm_contratos k ON f.contrato_id = k.id
      WHERE f.cliente_id = ?
      ORDER BY COALESCE(f.vencimento, f.mes || '-01') DESC, f.parcela_num ASC
    `).bind(cliente_id).all(),

    // breakdown by revenue source
    env.DB.prepare(`
      SELECT
        COALESCE(categoria, 'Sem categoria')                        as categoria,
        COUNT(*)                                                    as lancamentos,
        COALESCE(SUM(valor), 0)                                     as bruto,
        COALESCE(SUM(COALESCE(comissao, valor)), 0)                 as comissao,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN valor END), 0)  as recebido
      FROM crm_faturas
      WHERE cliente_id = ?
      GROUP BY COALESCE(categoria, 'Sem categoria')
      ORDER BY bruto DESC
    `).bind(cliente_id).all(),

    env.DB.prepare(
      'SELECT * FROM crm_contratos WHERE cliente_id = ? ORDER BY created_at DESC'
    ).bind(cliente_id).all(),
  ]);

  if (!cliente) return { error: 'Cliente not found' };

  const list = faturas.results || [];
  const soma = (fn) => list.reduce((a, f) => a + (fn(f) || 0), 0);

  return {
    cliente,
    faturas: list,
    por_categoria: porCategoria.results || [],
    contratos: contratos.results || [],
    totais: {
      lancamentos: list.length,
      bruto:       soma(f => f.valor),
      comissao:    soma(f => f.comissao ?? f.valor),
      recebido:    soma(f => f.status === 'pago'     ? f.valor : 0),
      a_receber:   soma(f => f.status === 'pendente' ? f.valor : 0),
      vencido:     soma(f => f.status === 'vencido'  ? f.valor : 0),
    },
  };
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
