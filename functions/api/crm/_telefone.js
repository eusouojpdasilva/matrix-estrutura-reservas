// Casamento de telefone entre o WhatsApp e o CRM.
//
// O problema: o WhatsApp manda números do Brasil sem o nono dígito
// (556181425201), enquanto o lead foi salvo como a pessoa digitou — com o 9,
// com +, com espaço e traço (+55 61 98142 5201). Comparar as strings nunca
// casa, e o lead certo fica órfão.
//
// A chave de comparação é DDI 55 + DDD + os últimos 8 dígitos. Os 8 finais são
// estáveis: o nono dígito entra na frente deles, nunca no meio.

/** Só os dígitos, sem +, espaço, traço ou parêntese. */
export function soDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

/**
 * Chave canônica para comparar dois telefones brasileiros.
 *
 * 5561981425201 (13, com o 9) → 556181425201
 *  556181425201 (12, sem o 9) → 556181425201
 *   61981425201 (11, sem DDI) → 556181425201
 *    6181425201 (10, sem DDI nem 9) → 556181425201
 *
 * Número de fora do Brasil não tem essa regra: devolve os dígitos como vieram,
 * para não estragar um +1 ou +351 cortando pedaço.
 */
export function chaveTelefone(valor) {
  const d = soDigitos(valor);
  if (!d) return '';

  // com DDI explícito: 55 + DDD(2) + 8 ou 9 dígitos
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    return '55' + d.slice(2, 4) + d.slice(-8);
  }

  // Sem DDI, formato nacional. Exige DDD plausível, e nos 11 dígitos exige que
  // o nono dígito seja mesmo 9: celular brasileiro sempre começa com 9 depois
  // do DDD. Sem essa checagem um +1 415 555 0123, que também tem 11 dígitos,
  // viraria "5514..." e passaria por número do Brasil.
  const ddd = Number(d.slice(0, 2));
  const dddPlausivel = ddd >= 11 && ddd <= 99;
  if (dddPlausivel && (d.length === 10 || (d.length === 11 && d[2] === '9'))) {
    return '55' + d.slice(0, 2) + d.slice(-8);
  }

  // estrangeiro ou formato que não reconheço: compara inteiro
  return d;
}

/** true quando os dois números são a mesma linha. */
export function mesmoTelefone(a, b) {
  const ka = chaveTelefone(a);
  return ka !== '' && ka === chaveTelefone(b);
}

/**
 * Acha o lead dono de um telefone.
 *
 * Varre os leads que têm telefone e compara pela chave canônica. Não dá para
 * fazer isso no SQL porque a coluna guarda o texto como foi digitado: não há
 * forma normalizada para indexar. Na escala destes CRMs (centenas de leads) a
 * varredura é instantânea; se um dia passar de alguns milhares, o caminho é
 * uma coluna normalizada com índice, preenchida na escrita.
 *
 * Havendo mais de um lead com o mesmo número, devolve o mais recente que não
 * esteja perdido — é com esse que a conversa está acontecendo.
 */
export async function acharLeadPorTelefone(env, telefone) {
  const chave = chaveTelefone(telefone);
  if (!chave) return null;

  const { results } = await env.DB.prepare(`
    SELECT id, nome, telefone, status, followup, created_at
      FROM crm_leads
     WHERE telefone IS NOT NULL AND telefone <> ''
     ORDER BY CASE WHEN status = 'perdido' THEN 1 ELSE 0 END, created_at DESC
  `).all();

  return (results || []).find(l => chaveTelefone(l.telefone) === chave) || null;
}
