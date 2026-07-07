// GET /api/crm/dashboard?key=...
//
// Returns all KPIs needed by CRM Module 1 in a single request:
//   leads_ativos, em_proposta, clientes_ativos, receita_mes
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

      // receita do mês (faturas pagas)
      env.DB.prepare(`
        SELECT COALESCE(SUM(valor), 0) as total FROM crm_faturas
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
    const hoje = new Date();
    const proximos15 = Array.from({ length: 16 }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    });
    const aniversariantes = (anivRes.results || [])
      .map(c => ({ ...c, mmdd: c.aniversario }))
      .filter(c => proximos15.includes(c.mmdd))
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
        receita_mes:      receita?.total  || 0,
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
