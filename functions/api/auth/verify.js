// POST /api/auth/verify — valida a chave sem depender das consultas do dashboard.
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  if (!env.DASH_KEY || typeof body?.key !== 'string' || body.key !== env.DASH_KEY) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
