// POST /api/crm/lead-capture
//
// Endpoint público write-only para capturar leads de landing pages.
// Usa LEAD_CAPTURE_KEY (separada da DASH_KEY) — só cria leads, não lê dados.
// Proteção: verificação de Origin + chave write-only.
//
// Body esperado:
//   nome        string  (obrigatório)
//   whatsapp    string
//   destino     string
//   datas       string  — quando quer viajar
//   orcamento   string  — faixa de orçamento
//   observacoes string  — desafio / situação
//   origem      string  — identificador da landing page (ex: "Consultoria")

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── origin check ───────────────────────────────────────────────────────────
  // Autoconfigurável: aceita requisições do próprio domínio (inclui subdomínios
  // que compartilham o mesmo eTLD+1) e localhost para desenvolvimento.
  const reqHost = new URL(request.url).hostname;
  const baseDomain = reqHost.split('.').slice(-3).join('.').replace(/^www\./, '');
  const hostOf = (u) => { try { return new URL(u).hostname; } catch { return ''; } };
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const sameSite = (h) => h === reqHost || h.endsWith('.' + baseDomain) || h === baseDomain;
  const isAllowed =
    !origin ||                                              // same-origin (sem CORS)
    sameSite(hostOf(origin)) ||
    sameSite(hostOf(referer)) ||
    origin.includes('localhost');

  if (!isAllowed) {
    return json({ error: 'Forbidden' }, 403);
  }

  // ── parse body ─────────────────────────────────────────────────────────────
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { nome, whatsapp, destino, datas, orcamento, observacoes, origem } = body;

  if (!nome?.trim()) return json({ error: 'nome is required' }, 400);

  // ── montar obs com campos que não têm coluna própria ──────────────────────
  const obsLines = [];
  if (datas)       obsLines.push(`📅 Período: ${datas}`);
  if (orcamento)   obsLines.push(`💰 Orçamento: ${orcamento}`);
  if (observacoes) obsLines.push(`💬 Situação: ${observacoes}`);
  if (origem)      obsLines.push(`🔗 Origem: ${origem}`);
  const obs = obsLines.length ? obsLines.join('\n') : null;

  // ── followup = 3 dias após o cadastro ─────────────────────────────────────
  const followupDate = new Date();
  followupDate.setDate(followupDate.getDate() + 3);
  const followup = followupDate.toISOString().slice(0, 10);

  const id  = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  try {
    await env.DB.prepare(`
      INSERT INTO crm_leads
        (id, nome, destino, telefone, obs, status, followup, contato_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'novo', ?, ?, ?, ?)
    `).bind(
      id,
      nome.trim(),
      destino?.trim() || null,
      whatsapp?.trim() || null,
      obs,
      followup,
      now,
      now, now,
    ).run();

    return json({ ok: true, lead_id: id }, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ── helpers ───────────────────────────────────────────────────────────────────

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
