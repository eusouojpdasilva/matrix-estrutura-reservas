function auth(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || request.headers.get('x-admin-key') || '';
  return key === env.DASH_KEY;
}

export async function onRequest({ request, env }) {
  if (!auth(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { method } = request;

  if (method === 'GET') {
    const id = new URL(request.url).searchParams.get('id');
    if (id) {
      const row = await env.DB.prepare('SELECT * FROM guias WHERE id=?').bind(id).first();
      return Response.json(row);
    }
    const { results } = await env.DB.prepare(
      'SELECT * FROM guias ORDER BY ordem ASC, id ASC'
    ).all();
    return Response.json(results);
  }

  if (method === 'POST') {
    const b = await request.json();
    const r = await env.DB.prepare(
      'INSERT INTO guias (nome,descricao,preco,imagem,status,destaque,link,ordem) VALUES (?,?,?,?,?,?,?,?)'
    ).bind(b.nome, b.descricao||'', b.preco||'Em breve', b.imagem||'', b.status||'coming_soon', b.destaque||0, b.link||null, b.ordem||0).run();
    return Response.json({ id: r.meta.last_row_id });
  }

  if (method === 'PUT') {
    const b = await request.json();
    await env.DB.prepare(
      'UPDATE guias SET nome=?,descricao=?,preco=?,imagem=?,status=?,destaque=?,link=?,ordem=?,updated_at=datetime("now") WHERE id=?'
    ).bind(b.nome, b.descricao||'', b.preco||'Em breve', b.imagem||'', b.status||'coming_soon', b.destaque||0, b.link||null, b.ordem||0, b.id).run();
    return Response.json({ ok: true });
  }

  if (method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    await env.DB.prepare('DELETE FROM guias WHERE id=?').bind(id).run();
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
