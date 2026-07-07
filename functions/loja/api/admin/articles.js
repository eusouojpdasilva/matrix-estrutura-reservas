function auth(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || request.headers.get('x-admin-key') || '';
  return key === env.DASH_KEY;
}

function readTime(html) {
  const words = (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function onRequest({ request, env }) {
  if (!auth(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { method } = request;

  if (method === 'GET') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) {
      const row = await env.DB.prepare('SELECT * FROM articles WHERE id=?').bind(id).first();
      return Response.json(row);
    }
    const { results } = await env.DB.prepare(
      `SELECT id, title, slug, status, published_at, read_time_min
       FROM articles ORDER BY updated_at DESC`
    ).all();
    return Response.json(results);
  }

  if (method === 'POST') {
    const b = await request.json();
    const rt = readTime(b.content);
    const publishedAt = b.status === 'published' ? (b.published_at || new Date().toISOString()) : null;
    const gallery = Array.isArray(b.gallery) ? JSON.stringify(b.gallery) : (b.gallery || null);
    const r = await env.DB.prepare(
      'INSERT INTO articles (title,slug,excerpt,cover_image,content,meta_description,read_time_min,status,published_at,gallery) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).bind(b.title, b.slug, b.excerpt||'', b.cover_image||'', b.content||'', b.meta_description||'', rt, b.status||'draft', publishedAt, gallery).run();
    return Response.json({ id: r.meta.last_row_id });
  }

  if (method === 'PUT') {
    const b = await request.json();
    const rt = readTime(b.content);
    const publishedAt = b.status === 'published' ? (b.published_at || new Date().toISOString()) : null;
    const gallery = Array.isArray(b.gallery) ? JSON.stringify(b.gallery) : (b.gallery || null);
    await env.DB.prepare(
      'UPDATE articles SET title=?,slug=?,excerpt=?,cover_image=?,content=?,meta_description=?,read_time_min=?,status=?,published_at=?,gallery=?,updated_at=datetime("now") WHERE id=?'
    ).bind(b.title, b.slug, b.excerpt||'', b.cover_image||'', b.content||'', b.meta_description||'', rt, b.status||'draft', publishedAt, gallery, b.id).run();
    return Response.json({ ok: true });
  }

  if (method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    await env.DB.prepare('DELETE FROM articles WHERE id=?').bind(id).run();
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
