// Tarefa automática de follow-up.
//
// Preencher a data de follow-up de um lead cria a tarefa correspondente sem
// passo manual. Compartilhado por leads.js (POST) e leads/[id].js (PUT) — o
// prefixo _ mantém o arquivo fora do roteamento do Pages.
//
// Regras:
//  • Reaproveita a tarefa de follow-up ainda aberta do mesmo lead em vez de
//    criar outra. Sem isso, cada edição do lead empilharia tarefas duplicadas,
//    que é pior do que o passo manual que isto veio eliminar.
//  • Lead fechado ou perdido não gera tarefa: follow-up de negócio encerrado
//    é ruído na lista.
//  • Limpar a data NÃO apaga a tarefa já criada. A descrição foi escrita pela
//    pessoa, e apagar conteúdo dela em silêncio seria pior que deixar a tarefa
//    para ela resolver.

const STATUS_ENCERRADO = ['fechado', 'perdido'];

/**
 * Cria ou atualiza a tarefa de follow-up de um lead.
 * Devolve { tarefa_id, acao: 'criada'|'atualizada'|'ignorada' }.
 */
export async function syncTarefaFollowup(env, lead, descricao) {
  const texto = String(descricao || '').trim();

  // sem data ou sem descrição não há o que agendar
  if (!lead?.followup || !texto) return { tarefa_id: null, acao: 'ignorada' };
  if (STATUS_ENCERRADO.includes(lead.status)) return { tarefa_id: null, acao: 'ignorada' };

  const now = Math.floor(Date.now() / 1000);

  // contexto do lead no corpo da tarefa, já que ela vive numa lista separada
  const contexto = [
    lead.destino ? `Destino: ${lead.destino}` : '',
    lead.telefone ? `Contato: ${lead.telefone}` : '',
  ].filter(Boolean).join(' · ');

  const aberta = await env.DB.prepare(`
    SELECT id FROM crm_tarefas
    WHERE lead_id = ? AND origem = 'followup' AND status != 'concluído'
    ORDER BY created_at DESC LIMIT 1
  `).bind(lead.id).first();

  if (aberta) {
    await env.DB.prepare(`
      UPDATE crm_tarefas
      SET titulo = ?, obs = ?, data_entrega = ?, updated_at = ?
      WHERE id = ?
    `).bind(texto, contexto || null, lead.followup, now, aberta.id).run();
    return { tarefa_id: aberta.id, acao: 'atualizada' };
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO crm_tarefas
      (id, cliente_id, lead_id, origem, titulo, obs, status, data_entrega, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id, null, lead.id, 'followup', texto, contexto || null,
    'a-fazer', lead.followup, now, now,
  ).run();

  return { tarefa_id: id, acao: 'criada' };
}
