export async function onRequest({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT id,nome,descricao,preco,imagem,status,destaque,link,ordem FROM guias ORDER BY ordem ASC, id ASC'
  ).all();
  return Response.json(results, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
  });
}
