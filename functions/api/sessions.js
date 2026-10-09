// GET /api/sessions?key=...&days=30
//
// Returns session (page visit) counts from the sessions table.
// Used by the dashboard to compute conversion rate (leads/visits),
// cost-per-visit, and the dual visits+leads time-series chart.
//
// Hard rule: PageView events are NEVER written to event_log.
// Page visits live exclusively in the sessions table — one row per visit.
//
// Response: {
//   days,
//   total,          // total sessions in period
//   today,          // sessions no dia-calendário de Brasília (-03:00)
//   daily: [{ date, count }],            // agrupado por dia de Brasília (-03:00), ASC
//   utm_breakdown: {                     // top values per UTM dimension
//     utm_source:   [{ value, count }],
//     utm_medium:   [{ value, count }],
//     utm_campaign: [{ value, count }],
//     utm_content:  [{ value, count }],
//   },
// }

export async function onRequestGet(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!env.DASH_KEY || key !== env.DASH_KEY) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const rawSince = parseInt(url.searchParams.get('since') || '', 10);
  const rawUntil = parseInt(url.searchParams.get('until') || '', 10);
  const days = clampInt(url.searchParams.get('days'), 30, 1, 365);
  const now = Math.floor(Date.now() / 1000);
  const since = Number.isFinite(rawSince) ? rawSince : now - days * 86400;
  const until = Number.isFinite(rawUntil) ? rawUntil : now;

  try {
    // Total sessions in period
    const totalRow = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM sessions WHERE created_at >= ? AND created_at <= ?`
    ).bind(since, until).first();

    // Sessions "hoje" — dia-calendário de Brasília (-03:00), para casar com o
    // contador de leads "hoje" do dashboard (que usa o mesmo fuso).
    const todayRow = await env.DB.prepare(`
      SELECT COUNT(*) as cnt FROM sessions
      WHERE date(datetime(created_at, 'unixepoch', '-3 hours')) = date('now', '-3 hours')
    `).first();

    // Daily breakdown — agrupado por dia de Brasília (-03:00) para bater com o
    // eixo do gráfico e com a hora exibida na tabela.
    const dailyRows = await env.DB.prepare(`
      SELECT
        date(datetime(created_at, 'unixepoch', '-3 hours')) as date,
        COUNT(*) as count
      FROM sessions
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY date
      ORDER BY date ASC
    `).bind(since, until).all();

    // UTM breakdown — one query per dimension (D1 doesn't support PIVOT)
    const dims = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const utmBreakdown = {};

    await Promise.all(dims.map(async dim => {
      const rows = await env.DB.prepare(`
        SELECT
          COALESCE(${dim}, '') as value,
          COUNT(*) as count
        FROM sessions
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY ${dim}
        ORDER BY count DESC
        LIMIT 20
      `).bind(since, until).all();
      utmBreakdown[dim] = (rows.results || []).map(r => ({
        value: r.value || '',
        count: Number(r.count || 0),
      }));
    }));

    return json({
      days,
      total: Number(totalRow?.cnt || 0),
      today: Number(todayRow?.cnt || 0),
      daily: (dailyRows.results || []).map(r => ({
        date: r.date,
        count: Number(r.count || 0),
      })),
      utm_breakdown: utmBreakdown,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function clampInt(raw, fallback, min, max) {
  const n = parseInt(raw || '', 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
