// Divisão de parcelas: dinheiro e datas.
//
// Compartilhado por contratos.js (gera o cronograma na criação) e
// faturas/[id].js (parcela um lançamento avulso depois). O prefixo _ mantém o
// arquivo fora do roteamento do Pages.
//
// Duplicar a divisão de centavos nos dois lugares seria pedir para as somas
// divergirem: a soma das parcelas PRECISA bater com o total, sempre.

export function round2(v) { return Math.round(v * 100) / 100; }

// Divide um total em n partes que somam exatamente de volta, ao centavo.
// A sobra vai para as primeiras parcelas.
export function splitMoney(total, n) {
  const cents = Math.round(total * 100);
  const base  = Math.floor(cents / n);
  const rest  = cents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < rest ? 1 : 0)) / 100);
}

// Divide um total proporcionalmente a `weights`, somando exato. Devolve nulls
// quando não há total a dividir (a comissão é opcional).
export function splitProportional(total, weights) {
  if (total == null || total === '') return weights.map(() => null);
  const t = Number(total);
  if (!Number.isFinite(t)) return weights.map(() => null);
  const sumW = weights.reduce((a, b) => a + b, 0);
  if (!sumW) return splitMoney(t, weights.length);
  const cents = Math.round(t * 100);
  let acc = 0;
  return weights.map((w, i) => {
    if (i === weights.length - 1) return (cents - acc) / 100;
    const v = Math.round(cents * (w / sumW));
    acc += v;
    return v / 100;
  });
}

// ── datas (UTC explícito: workers rodam em UTC, e a aritmética também) ───────

export function isYmd(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

export function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function ymd(date) { return date.toISOString().slice(0, 10); }

export function todayUTC() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

export function clampDia(d) {
  const n = Number(d);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
}

// Primeira cobrança em ou após `base`. Sem dia_vencimento o contrato cobra na
// data de início; com ele, na próxima ocorrência daquele dia — então
// data_inicio 15/01 com dia_vencimento 10 cobra 10/02, nunca 10/01.
export function firstDue(base, dia) {
  if (!dia) return base;
  const d = addMonthsUTC(base, 0, dia);
  return d >= base ? d : addMonthsUTC(base, 1, dia);
}

// Soma n meses, caindo em `dia` quando informado. Limita ao último dia do mês
// alvo, então dia 31 + um mês a partir de janeiro cai em 28/29 de fevereiro.
export function addMonthsUTC(date, n, dia) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = dia || date.getUTCDate();
  const last = new Date(Date.UTC(y, m + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m + n, Math.min(d, last)));
}
