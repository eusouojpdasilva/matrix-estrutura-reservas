// GET /api/crm/dashboard?key=...
//
// Returns all KPIs needed by CRM Module 1 in a single request:
//   leads_ativos, em_proposta, clientes_ativos, faturamento_mes, comissao_mes
//   funil (count per status), followup_risco (overdue), pipeline_estimado

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  const mes = currentMes();

  try {
    const [funil, clientes, receita, pipeline, risco, anivRes] = await Promise.all([
      // leads por status
      env.DB.prepare(`
        SELECT status, COUNT(*) as total
        FROM crm_leads GROUP BY status
      `).all(),

      // clientes ativos
      env.DB.prepare(`
        SELECT COUNT(*) as total FROM crm_clientes WHERE status = 'Ativo'
      `).first(),

      // receita do mês (faturas pagas): bruto = faturamento, líquido = comissão real
      // (COALESCE(comissao, valor) garante retrocompatibilidade com faturas antigas sem comissão)
      env.DB.prepare(`
        SELECT
          COALESCE(SUM(valor), 0) as bruto,
          COALESCE(SUM(COALESCE(comissao, valor)), 0) as liquido
        FROM crm_faturas
        WHERE mes = ? AND status = 'pago'
      `).bind(mes).first(),

      // pipeline estimado (leads abertos)
      env.DB.prepare(`
        SELECT COALESCE(SUM(valor_estimado), 0) as total
        FROM crm_leads WHERE status NOT IN ('fechado','perdido')
      `).first(),

      // fila de risco: leads com followup vencido e ainda abertos
      env.DB.prepare(`
        SELECT COUNT(*) as total FROM crm_leads
        WHERE followup < date('now')
          AND status NOT IN ('fechado','perdido')
      `).first(),

      // clientes com aniversário cadastrado
      env.DB.prepare(`
        SELECT id, nome, aniversario, telefone FROM crm_clientes
        WHERE aniversario IS NOT NULL AND status = 'Ativo'
      `).all(),
    ]);

    // filtrar aniversários nos próximos 15 dias (no JS para evitar edge case virada de ano)
    // "hoje" no fuso de Brasília (-03:00) — Workers rodam em UTC.
    const hoje = new Date(Date.now() - 3 * 3600 * 1000);
    const proximos15 = Array.from({ length: 16 }, (_, i) => {
      const d = new Date(hoje);
      d.setUTCDate(hoje.getUTCDate() + i);
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

    return json({
      mes,
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
      aniversariantes,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
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
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
