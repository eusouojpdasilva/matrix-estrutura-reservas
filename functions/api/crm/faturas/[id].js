// GET    /api/crm/faturas/:id?key=...
// PUT    /api/crm/faturas/:id?key=...  body: { action: 'pagar'|'vencer'|'desfazer'|'parcelar' }
//          'pagar' aceita data_pagamento (YYYY-MM-DD) para registrar quando o
//          dinheiro entrou de fato; sem ela, usa hoje.
//          'parcelar' + num_parcelas divide um lançamento avulso em N parcelas
//          mensais no mesmo contrato. valor_parcela (opcional) fixa o valor de
//          cada uma — é como se cobra juros; sem ele, divide o valor original.
//                                      or partial fields: { valor, vencimento, comissao,
//                                      descricao, categoria, parcela_num, parcela_total,
//                                      forma_pagamento, condicao_pagamento, status }
//                                      Updating vencimento re-derives mes.
// DELETE /api/crm/faturas/:id?key=...

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const fatura = await env.DB.prepare('SELECT * FROM crm_faturas WHERE id = ?').bind(params.id).first();
    if (!fatura) return json({ error: 'Not found' }, 404);
    return json({ fatura });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const now     = Math.floor(Date.now() / 1000);
  const today   = new Date().toISOString().slice(0, 10);
  const { action } = body;

  // Divide um lançamento avulso em N parcelas mensais, no mesmo contrato.
  // Fica antes do bloco de updates porque não é um UPDATE: substitui a linha.
  if (action === 'parcelar') {
    return parcelar(env, params.id, body, now);
  }

  let updates;

  if (action === 'pagar') {
    // data_pagamento é o que define em que mês o dinheiro entrou no caixa,
    // então aceita ser informada — uma parcela atrasada paga hoje pode ter
    // caído na conta em outra data.
    const quando = isYmd(body.data_pagamento) ? body.data_pagamento : today;
    updates = [['status', 'pago'], ['data_pagamento', quando], ['updated_at', now]];
  } else if (action === 'vencer') {
    updates = [['status', 'vencido'], ['updated_at', now]];
  } else if (action === 'desfazer') {
    updates = [['status', 'pendente'], ['data_pagamento', null], ['updated_at', now]];
  } else {
    // generic partial update
    const UPDATABLE = [
      'valor', 'mes', 'vencimento', 'status', 'data_pagamento', 'comissao',
      'descricao', 'categoria', 'parcela_num', 'parcela_total',
      'forma_pagamento', 'condicao_pagamento',
    ];
    updates = Object.entries(body).filter(([k]) => UPDATABLE.includes(k));
    if (!updates.length) return json({ error: 'No valid fields' }, 400);

    // vencimento is the source of truth for the period: moving the due date
    // moves the fatura's month, so the financeiro month view stays consistent.
    if (Object.prototype.hasOwnProperty.call(body, 'vencimento')) {
      if (!isYmd(body.vencimento)) return json({ error: 'vencimento must be YYYY-MM-DD' }, 400);
      updates = updates.filter(([k]) => k !== 'mes');
      updates.push(['mes', body.vencimento.slice(0, 7)]);
    }
    updates.push(['updated_at', now]);
  }

  const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
  const values    = updates.map(([, v]) => v);

  try {
    const result = await env.DB.prepare(
      `UPDATE crm_faturas SET ${setClause} WHERE id = ?`
    ).bind(...values, params.id).run();

    if (!result.meta.changes) return json({ error: 'Not found' }, 404);
    const fatura = await env.DB.prepare('SELECT * FROM crm_faturas WHERE id = ?').bind(params.id).first();
    return json({ fatura });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!auth(url, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const result = await env.DB.prepare('DELETE FROM crm_faturas WHERE id = ?').bind(params.id).run();
    if (!result.meta.changes) return json({ error: 'Not found' }, 404);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── parcelar um lançamento avulso ─────────────────────────────────────────────
// Substitui a fatura única por N parcelas mensais no mesmo contrato, mantendo
// o vínculo com o cliente. Mesma divisão de centavos da criação (_parcelas.js),
// então a soma das parcelas bate exatamente com o valor original.
async function parcelar(env, id, body, now) {
  const n = Number(body.num_parcelas);
  if (!Number.isInteger(n) || n < 2 || n > 120)
    return json({ error: 'num_parcelas must be an integer between 2 and 120' }, 400);

  const f = await env.DB.prepare('SELECT * FROM crm_faturas WHERE id = ?').bind(id).first();
  if (!f) return json({ error: 'Not found' }, 404);

  // Já parcelado: dividir de novo deixaria o cronograma incoerente com as
  // outras parcelas do mesmo contrato.
  if (f.parcela_total > 1)
    return json({ error: 'Este lançamento já faz parte de um parcelamento' }, 409);

  // Já pago: o dinheiro entrou, parcelar depois reescreveria o caixa.
  if (f.status === 'pago')
    return json({ error: 'Não dá para parcelar um lançamento já pago' }, 409);

  const base = isYmd(body.vencimento) ? body.vencimento
             : isYmd(f.vencimento)    ? f.vencimento
             : `${f.mes}-01`;

  // valor_parcela manda quando vem: com juros a parcela não é o total dividido,
  // e a soma passa a ser o que o cliente vai pagar de fato. Sem ele, divide o
  // valor original com os centavos fechando exato.
  const vParc = Number(body.valor_parcela);
  const temValor = Number.isFinite(vParc) && vParc > 0;
  if (body.valor_parcela != null && !temValor)
    return json({ error: 'valor_parcela must be a positive number' }, 400);

  const valores   = temValor ? Array(n).fill(round2(vParc)) : splitMoney(f.valor, n);
  const comissoes = splitProportional(f.comissao, valores);
  const baseDate  = parseYmd(base);

  const novas = Array.from({ length: n }, (_, i) => {
    const venc = ymd(addMonthsUTC(baseDate, i));
    return {
      id: crypto.randomUUID(),
      mes: venc.slice(0, 7), vencimento: venc,
      valor: valores[i], comissao: comissoes[i],
      parcela_num: i + 1, parcela_total: n,
    };
  });

  try {
    const insert = env.DB.prepare(`
      INSERT INTO crm_faturas
        (id, cliente_id, contrato_id, mes, vencimento, valor, comissao,
         descricao, categoria, parcela_num, parcela_total,
         forma_pagamento, condicao_pagamento, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    // o DELETE entra no mesmo batch: ou a troca inteira acontece, ou nenhuma
    // parte dela — não dá para ficar com a original e as parcelas ao mesmo tempo
    await env.DB.batch([
      ...novas.map(p => insert.bind(
        p.id, f.cliente_id, f.contrato_id, p.mes, p.vencimento, p.valor, p.comissao,
        f.descricao, f.categoria, p.parcela_num, p.parcela_total,
        f.forma_pagamento, 'Parcelado', f.status, now, now,
      )),
      env.DB.prepare('DELETE FROM crm_faturas WHERE id = ?').bind(id),
    ]);

    const rows = await env.DB.prepare(
      'SELECT * FROM crm_faturas WHERE contrato_id = ? AND parcela_total = ? ORDER BY parcela_num'
    ).bind(f.contrato_id, n).all();

    return json({ parcelas_criadas: n, faturas: rows.results || [] });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

import {
  round2, splitMoney, splitProportional, isYmd, parseYmd, ymd, addMonthsUTC,
} from '../_parcelas.js';

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
