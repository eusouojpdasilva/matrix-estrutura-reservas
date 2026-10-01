import { editorialArticles } from '../../../content/editorial-articles.js';

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '12', 10) || 12, 1), 50);
  const editorial = editorialArticles.map(({ content, cover_alt, meta_description, ...summary }) => summary);
  try {
    let databaseArticles = [];
    if (env.DB) {
      const { results } = await env.DB.prepare(`
        SELECT id, title, slug, excerpt, cover_image, read_time_min, published_at
        FROM articles
        WHERE status = 'published'
        ORDER BY published_at DESC LIMIT ?`
      ).bind(limit).all();
      databaseArticles = results || [];
    }
    const editorialSlugs = new Set(editorial.map((article) => article.slug));
    return Response.json([...editorial, ...databaseArticles.filter((article) => !editorialSlugs.has(article.slug))].slice(0, limit));
  } catch {
    return Response.json(editorial.slice(0, limit));
  }
}
