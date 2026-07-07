export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);

    const { results } = await env.DB.prepare(`
      SELECT id, title, slug, excerpt, cover_image, read_time_min, published_at
      FROM articles
      WHERE status = 'published'
      ORDER BY published_at DESC LIMIT ?`
    ).bind(limit).all();
    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
