// GET /api/crm/dashboard?key=...
//       &from=2026-06-01&to=2026-06-15   optional period filter
//       &alerta_dias=15                  due-date alert window (default 15)
//
// Returns every KPI the CRM dashboard needs in a single request:
//   leads_ativos, em_proposta, clientes_ativos, faturamento_mes, comissao_mes
//   funil (count per status), followup_risco (overdue), pipeline_estimado
//   parcelas (vencidas + a vencer), aniversariantes
//
// Period filter: leads are filtered by created_at, revenue by vencimento.
// Without from/to the behaviour is the pre-filter one — all leads ever, revenue
// for the current month — so the default dashboard view does not change.
//
// The parcelas alerts deliberately ignore the period filter: "what is overdue"
// is a question about today, not about the window the agent happens to be
// looking at.

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const q    = url.searchParams;
  const from = isYmd(q.get('from')) ? q.get('from') : null;
  const to   = isYmd(q.get('to'))   ? q.get('to')   : null;
  const periodo = from || to;

  const alertaDias = clampDias(q.get('alerta_dias'), 15);
  const hoje       = todayYmd();
  const limite     = addDaysYmd(hoje, alertaDias);

  const mes = currentMes();

  // leads: period filter applies to created_at (unix seconds)
  const leadFilter = periodo ? leadRange(from, to) : { sql: '', binds: [] };

  // revenue: period filter applies to vencimento, falling back to mes for rows
  // migrated before the column existed
  const recFilter = periodo
    ? rangeSql('COALESCE(vencimento, mes || \'-01\')', from, to)
    : { sql: 'AND mes = ?', binds: [mes] };

  try {
    const [funil, clientes, receita, pipeline, risco, anivRes, vencidas, aVencer, totParc] =
      await Promise.all([
        // leads por status
        env.DB.prepare(`
          SELECT status, COUNT(*) as total
          FROM crm_leads WHERE 1=1 ${leadFilter.sql} GROUP BY status
        `).bind(...leadFilter.binds).all(),

        // clientes ativos
        env.DB.prepare(`
          SELECT COUNT(*) as total FROM crm_clientes WHERE status = 'Ativo'
        `).first(),

        // receita do período (faturas pagas): bruto = faturamento, líquido = comissão real
        // (COALESCE(comissao, valor) garante retrocompatibilidade com faturas antigas sem comissão)
        env.DB.prepare(`
          SELECT
            COALESCE(SUM(valor), 0) as bruto,
            COALESCE(SUM(COALESCE(comissao, valor)), 0) as liquido
          FROM crm_faturas
          WHERE status = 'pago' ${recFilter.sql}
        `).bind(...recFilter.binds).first(),

        // pipeline estimado (leads abertos)
        env.DB.prepare(`
          SELECT COALESCE(SUM(valor_estimado), 0) as total
          FROM crm_leads
          WHERE status NOT IN ('fechado','perdido') ${leadFilter.sql}
        `).bind(...leadFilter.binds).first(),

        // fila de risco: leads com followup vencido e ainda abertos
        env.DB.prepare(`
          SELECT COUNT(*) as total FROM crm_leads
          WHERE followup < date('now')
            AND status NOT IN ('fechado','perdido') ${leadFilter.sql}
        `).bind(...leadFilter.binds).first(),

        // clientes com aniversário cadastrado
        env.DB.prepare(`
          SELECT id, nome, aniversario, telefone FROM crm_clientes
          WHERE aniversario IS NOT NULL AND status = 'Ativo'
        `).all(),

        // parcelas já vencidas e ainda não pagas
        env.DB.prepare(`
          SELECT f.id, f.valor, f.vencimento, f.mes, f.descricao, f.categoria,
                 f.parcela_num, f.parcela_total, f.status, f.forma_pagamento,
                 c.nome as cliente_nome, c.telefone as cliente_telefone
          FROM crm_faturas f
          LEFT JOIN crm_clientes c ON f.cliente_id = c.id
          WHERE f.status != 'pago'
            AND COALESCE(f.vencimento, f.mes || '-01') < ?
          ORDER BY COALESCE(f.vencimento, f.mes || '-01') ASC
          LIMIT 12
        `).bind(hoje).all(),

        // parcelas vencendo na janela de alerta (inclui hoje)
        env.DB.prepare(`
          SELECT f.id, f.valor, f.vencimento, f.mes, f.descricao, f.categoria,
                 f.parcela_num, f.parcela_total, f.status, f.forma_pagamento,
                 c.nome as cliente_nome, c.telefone as cliente_telefone
          FROM crm_faturas f
          LEFT JOIN crm_clientes c ON f.cliente_id = c.id
          WHERE f.status != 'pago'
            AND COALESCE(f.vencimento, f.mes || '-01') >= ?
            AND COALESCE(f.vencimento, f.mes || '-01') <= ?
          ORDER BY COALESCE(f.vencimento, f.mes || '-01') ASC
          LIMIT 12
        `).bind(hoje, limite).all(),

        // totais das duas janelas, sem o LIMIT das listas acima
        env.DB.prepare(`
          SELECT
            COUNT(CASE WHEN venc <  ? THEN 1 END)        as qtd_vencidas,
            COALESCE(SUM(CASE WHEN venc <  ? THEN valor END), 0) as total_vencidas,
            COUNT(CASE WHEN venc >= ? AND venc <= ? THEN 1 END)  as qtd_a_vencer,
            COALESCE(SUM(CASE WHEN venc >= ? AND venc <= ? THEN valor END), 0) as total_a_vencer
          FROM (
            SELECT valor, COALESCE(vencimento, mes || '-01') as venc
            FROM crm_faturas WHERE status != 'pago'
          )
        `).bind(hoje, hoje, hoje, limite, hoje, limite).first(),
      ]);

    // filtrar aniversários nos próximos 15 dias (no JS para evitar edge case virada de ano)
    // "hoje" no fuso de Brasília (-03:00) — Workers rodam em UTC.
    // Nome distinto de `hoje` (string 'YYYY-MM-DD' usada pelos alertas de
    // parcela acima): aqui é um Date, e sombrear quebraria o cálculo de atraso.
    const hojeBR = new Date(Date.now() - 3 * 3600 * 1000);
    const proximos15 = Array.from({ length: 16 }, (_, i) => {
      const d = new Date(hojeBR);
      d.setUTCDate(hojeBR.getUTCDate() + i);
      return `${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    });
    // normaliza o aniversário para 'MM-DD'. Convenção:
    //  • 'DD/MM' (com barra) = dia/mês, padrão brasileiro (ex: 05/10 = 5 de out)
    //  • 'MM-DD' (com hífen) = mês/dia (formato do placeholder antigo)
    //  • 'YYYY-MM-DD' / ISO = ano-mês-dia
    const toMMDD = (v) => {
      if (!v) return null;
      const s = String(v).trim();
      let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[2]}-${m[3]}`; // YYYY-MM-DD
      m = s.match(/^(\d{1,2})\/(\d{1,2})$/);       if (m) return `${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; // DD/MM (BR)
      m = s.match(/^(\d{1,2})-(\d{1,2})$/);        if (m) return `${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`; // MM-DD
      return s;
    };
    const aniversariantes = (anivRes.results || [])
      .map(c => ({ ...c, mmdd: toMMDD(c.aniversario) }))
      .filter(c => c.mmdd && proximos15.includes(c.mmdd))
      .map(c => ({ ...c, dias: proximos15.indexOf(c.mmdd) }))
      .sort((a, b) => a.dias - b.dias);

    const funilMap = Object.fromEntries(
      (funil.results || []).map(r => [r.status, r.total])
    );

    // dias de atraso / dias restantes, calculados aqui para a UI não refazer
    const comAtraso   = (rows) => rows.map(f => ({ ...f, dias: diffDias(venc(f), hoje) }));
    const comRestante = (rows) => rows.map(f => ({ ...f, dias: diffDias(hoje, venc(f)) }));

    return json({
      mes,
      periodo: periodo ? { from, to } : null,
      kpis: {
        leads_ativos:     (funilMap['novo'] || 0) + (funilMap['contato'] || 0),
        em_proposta:      funilMap['proposta'] || 0,
        clientes_ativos:  clientes?.total || 0,
        faturamento_mes:  receita?.bruto   || 0,
        comissao_mes:     receita?.liquido || 0,
      },
      funil: {
        novo:     funilMap['novo']     || 0,
        contato:  funilMap['contato']  || 0,
        proposta: funilMap['proposta'] || 0,
        fechado:  funilMap['fechado']  || 0,
        perdido:  funilMap['perdido']  || 0,
      },
      pipeline_estimado: pipeline?.total || 0,
      followup_risco:    risco?.total    || 0,
      parcelas: {
        alerta_dias:    alertaDias,
        hoje,
        vencidas:       comAtraso(vencidas.results || []),
        a_vencer:       comRestante(aVencer.results || []),
        qtd_vencidas:   totParc?.qtd_vencidas   || 0,
        total_vencidas: totParc?.total_vencidas || 0,
        qtd_a_vencer:   totParc?.qtd_a_vencer   || 0,
        total_a_vencer: totParc?.total_a_vencer || 0,
      },
      aniversariantes,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── period helpers ────────────────────────────────────────────────────────────

function isYmd(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

function clampDias(v, fallback) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 365 ? n : fallback;
}

// Date-string comparison on a text column, so it works with 'YYYY-MM-DD'.
function rangeSql(expr, from, to) {
  const sql = [], binds = [];
  if (from) { sql.push(`AND ${expr} >= ?`); binds.push(from); }
  if (to)   { sql.push(`AND ${expr} <= ?`); binds.push(to);   }
  return { sql: sql.join(' '), binds };
}

// crm_leads.created_at is unix seconds, so the bounds are computed here rather
// than relying on SQLite's date functions.
function leadRange(from, to) {
  const sql = [], binds = [];
  if (from) { sql.push('AND created_at >= ?'); binds.push(startOfDay(from)); }
  if (to)   { sql.push('AND created_at <= ?'); binds.push(endOfDay(to));     }
  return { sql: sql.join(' '), binds };
}

function startOfDay(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 1000);
}

function endOfDay(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d, 23, 59, 59) / 1000);
}

// Data corrente no fuso de Brasília (-03:00), mesma convenção dos aniversários.
// Em UTC puro, entre 21h e meia-noite de Brasília o "hoje" já teria virado e uma
// parcela que vence hoje apareceria como vencida.
function todayYmd() {
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

function addDaysYmd(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function venc(f) { return f.vencimento || `${f.mes}-01`; }

// whole days between two 'YYYY-MM-DD' strings (b - a), never negative
function diffDias(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const diff = (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000;
  return Math.max(0, Math.round(diff));
}

function currentMes() {
  return todayYmd().slice(0, 7);
}

// ── helpers ───────────────────────────────────────────────────────────────────

function auth(url, env) {
  return env.DASH_KEY && url.searchParams.get('key') === env.DASH_KEY;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
}
