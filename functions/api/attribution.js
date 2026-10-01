// GET /api/attribution?key=...&since=&until=
//
// Returns Meta Ads spend filtered to the tracked landing page's ad set
// (configured via TRACKED_ADSET_NAME env var — partial match on ad_name).
// Also returns daily spend breakdown for charts.
//
// Response: {
//   days,
//   meta_spend,           // total spend for tracked adset in period
//   daily_spend,          // [{ date, spend }] per day, for charts
//   tracked_adset,        // the TRACKED_ADSET_NAME value (for UI label)
//   last_synced_at,
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

  const sinceDate = ymd(new Date(since * 1000));
  const untilDate = ymd(new Date(until * 1000));

  // TRACKED_ADSET_NAME filters spend to a specific ad set (partial match).
  // If not set, returns zero spend so the UI shows "not configured".
  const trackedAdset = (env.TRACKED_ADSET_NAME || '').trim();

  try {
    let spendRow, dailySpendRows;

    if (trackedAdset) {
      spendRow = await env.DB.prepare(`
        SELECT COALESCE(SUM(spend_cents), 0) as spend_cents
        FROM ad_spend
        WHERE platform = 'meta' AND date >= ? AND date <= ?
          AND ad_name LIKE ?
      `).bind(sinceDate, untilDate, `%${trackedAdset}%`).first();

      dailySpendRows = await env.DB.prepare(`
        SELECT date, COALESCE(SUM(spend_cents), 0) as spend_cents
        FROM ad_spend
        WHERE platform = 'meta' AND date >= ? AND date <= ?
          AND ad_name LIKE ?
        GROUP BY date
        ORDER BY date ASC
      `).bind(sinceDate, untilDate, `%${trackedAdset}%`).all();
    } else {
      spendRow = { spend_cents: 0 };
      dailySpendRows = { results: [] };
    }

    const metaSpend = Number(spendRow?.spend_cents || 0) / 100;

    const dailySpend = (dailySpendRows.results || []).map(r => ({
      date: r.date,
      spend: Number(r.spend_cents || 0) / 100,
    }));

    const syncRow = await env.DB.prepare(`
      SELECT MAX(run_at) as last_synced_at
      FROM sync_log
      WHERE platform = 'meta' AND status = 'ok'
    `).first();

    return json({
      days,
      meta_spend: metaSpend,
      daily_spend: dailySpend,
      tracked_adset: trackedAdset || null,
      last_synced_at: syncRow?.last_synced_at || null,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

function ymd(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
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
