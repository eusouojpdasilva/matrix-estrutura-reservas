function auth(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || request.headers.get('x-admin-key') || '';
  return key === env.DASH_KEY;
}

function j(val, fallback = []) {
  try { return JSON.parse(val || null) ?? fallback; } catch { return fallback; }
}

export async function onRequest({ request, env }) {
  if (!auth(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { method } = request;

  if (method === 'GET') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) {
      const row = await env.DB.prepare('SELECT * FROM proposals WHERE id=?').bind(id).first();
      return Response.json(row);
    }
    const { results } = await env.DB.prepare(
      `SELECT id,title,slug,status,client_name,destinations,travel_start,travel_end,
              price_total,currency,expires_at,views,created_at
       FROM proposals ORDER BY created_at DESC`
    ).all();
    return Response.json(results);
  }

  if (method === 'POST') {
    const b = await request.json();
    const r = await env.DB.prepare(
      `INSERT INTO proposals
        (lead_id,client_name,title,slug,status,destinations,travel_start,travel_end,travelers,
         hotels,flights,activities,price_total,price_per_person,currency,includes,excludes,payment_info,
         internal_cost,internal_notes,cover_images,description,
         cta_primary_label,cta_primary_url,cta_secondary_label,cta_secondary_url,
         itinerary,expires_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      b.lead_id || null, b.client_name || '', b.title, b.slug, b.status || 'draft',
      JSON.stringify(b.destinations || []),
      b.travel_start || null, b.travel_end || null, b.travelers || 1,
      JSON.stringify(b.hotels || []), JSON.stringify(b.flights || []), JSON.stringify(b.activities || []),
      b.price_total || null, b.price_per_person || null, b.currency || 'BRL',
      b.includes || '', b.excludes || '', b.payment_info || '',
      b.internal_cost || null, b.internal_notes || '',
      JSON.stringify(b.cover_images || []), b.description || '',
      b.cta_primary_label || 'Quero reservar', b.cta_primary_url || '',
      b.cta_secondary_label || 'Tenho dúvidas', b.cta_secondary_url || '',
      JSON.stringify(b.itinerary || []), b.expires_at || null
    ).run();
    return Response.json({ id: r.meta.last_row_id });
  }

  if (method === 'PUT') {
    const b = await request.json();
    await env.DB.prepare(
      `UPDATE proposals SET
        lead_id=?,client_name=?,title=?,slug=?,status=?,destinations=?,
        travel_start=?,travel_end=?,travelers=?,hotels=?,flights=?,activities=?,
        price_total=?,price_per_person=?,currency=?,includes=?,excludes=?,payment_info=?,
        internal_cost=?,internal_notes=?,cover_images=?,description=?,
        cta_primary_label=?,cta_primary_url=?,cta_secondary_label=?,cta_secondary_url=?,
        itinerary=?,expires_at=?,updated_at=datetime('now')
       WHERE id=?`
    ).bind(
      b.lead_id || null, b.client_name || '', b.title, b.slug, b.status || 'draft',
      JSON.stringify(b.destinations || []),
      b.travel_start || null, b.travel_end || null, b.travelers || 1,
      JSON.stringify(b.hotels || []), JSON.stringify(b.flights || []), JSON.stringify(b.activities || []),
      b.price_total || null, b.price_per_person || null, b.currency || 'BRL',
      b.includes || '', b.excludes || '', b.payment_info || '',
      b.internal_cost || null, b.internal_notes || '',
      JSON.stringify(b.cover_images || []), b.description || '',
      b.cta_primary_label || 'Quero reservar', b.cta_primary_url || '',
      b.cta_secondary_label || 'Tenho dúvidas', b.cta_secondary_url || '',
      JSON.stringify(b.itinerary || []), b.expires_at || null,
      b.id
    ).run();
    return Response.json({ ok: true });
  }

  if (method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    await env.DB.prepare('DELETE FROM proposals WHERE id=?').bind(id).run();
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
