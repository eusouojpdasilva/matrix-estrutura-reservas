-- 0024_faturas_parcelas_receitas.sql
--
-- Reestrutura crm_faturas para suportar, de uma vez:
--   • múltiplas fontes de receita no mesmo cliente/mês (consultoria + passeios + hospedagem)
--   • parcelamento com data de vencimento real por parcela
--   • alertas de vencimento (painel no dashboard)
--
-- O bloqueio era a constraint UNIQUE (cliente_id, mes) da 0017, que limitava cada
-- cliente a UMA fatura por mês. SQLite/D1 não tem DROP CONSTRAINT, então a tabela
-- é reconstruída (create → copy → drop → rename). Nenhuma linha existente é perdida.
--
-- A tabela nova NÃO tem constraint de unicidade por campo de negócio, de propósito:
-- crm_faturas virou o livro de receitas da agência, e a identidade de uma linha de
-- livro é o próprio id. Qualquer UNIQUE sobre (cliente, mês, contrato, parcela)
-- volta a bloquear o caso que os itens 2 e 3 pedem — duas receitas do mesmo contrato
-- vencendo no mesmo mês (consultoria + passeio, por exemplo). A idempotência que a
-- 0017 buscava já vem do UUID gerado a cada POST /api/crm/contratos.
--
-- Formas de pagamento: boleto sai do sistema. 'Boleto' existente vira NULL e o
-- 'Cartão' genérico da 0022 vira 'Cartão de crédito'. O padrão passa a ser
-- Pix | Cartão de crédito | Cartão de débito.

CREATE TABLE crm_faturas_new (
  id                 TEXT    PRIMARY KEY,
  cliente_id         TEXT    NOT NULL,              -- → crm_clientes.id
  contrato_id        TEXT    NOT NULL,              -- → crm_contratos.id
  mes                TEXT    NOT NULL,              -- 'YYYY-MM', derivado de vencimento
  vencimento         TEXT,                          -- 'YYYY-MM-DD', data real de vencimento
  valor              REAL    NOT NULL,              -- bruto (faturamento)
  comissao           REAL,                          -- líquido (o que entra no caixa)
  descricao          TEXT,                          -- "Consultoria 2/3", "Passeio Fushimi Inari"
  categoria          TEXT,                          -- Consultoria | Passeios | Hospedagem | Aéreo | Seguro | Outro
  parcela_num        INTEGER NOT NULL DEFAULT 1,    -- 1 quando não é parcelado
  parcela_total      INTEGER NOT NULL DEFAULT 1,
  forma_pagamento    TEXT,                          -- Pix | Cartão de crédito | Cartão de débito
  condicao_pagamento TEXT,                          -- À vista | Parcelado
  status             TEXT    NOT NULL DEFAULT 'pendente', -- pago | pendente | vencido
  data_pagamento     TEXT,                          -- 'YYYY-MM-DD', null até pagar
  created_at         INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at         INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO crm_faturas_new
  (id, cliente_id, contrato_id, mes, vencimento, valor, comissao,
   descricao, categoria, parcela_num, parcela_total,
   forma_pagamento, condicao_pagamento, status, data_pagamento, created_at, updated_at)
SELECT
  id, cliente_id, contrato_id, mes,
  mes || '-01',   -- faturas antigas não têm data: assume dia 1 do mês de referência
  valor, comissao,
  NULL, NULL, 1, 1,
  CASE forma_pagamento
    WHEN 'Boleto' THEN NULL
    WHEN 'Cartão' THEN 'Cartão de crédito'
    ELSE forma_pagamento
  END,
  condicao_pagamento, status, data_pagamento, created_at, updated_at
FROM crm_faturas;

DROP TABLE crm_faturas;

ALTER TABLE crm_faturas_new RENAME TO crm_faturas;

-- índices (os da 0017 caíram junto com a tabela antiga)
CREATE INDEX IF NOT EXISTS idx_crm_faturas_status     ON crm_faturas(status, mes);
CREATE INDEX IF NOT EXISTS idx_crm_faturas_mes        ON crm_faturas(mes);
CREATE INDEX IF NOT EXISTS idx_crm_faturas_cliente    ON crm_faturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_crm_faturas_vencimento ON crm_faturas(vencimento, status);
CREATE INDEX IF NOT EXISTS idx_crm_faturas_contrato   ON crm_faturas(contrato_id);

-- contratos: mesma limpeza das formas de pagamento
UPDATE crm_contratos SET forma_pagamento_prevista = NULL                WHERE forma_pagamento_prevista = 'Boleto';
UPDATE crm_contratos SET forma_pagamento_prevista = 'Cartão de crédito' WHERE forma_pagamento_prevista = 'Cartão';

-- propostas: parcelamento definido já na proposta, antes de ir pro financeiro.
-- JSON: [{ parcela: 1, valor: 2500, vencimento: '2026-03-10', obs: 'Entrada' }]
ALTER TABLE proposals ADD COLUMN installments TEXT DEFAULT '[]';

-- marca a proposta já lançada no financeiro, pra não lançar duas vezes
ALTER TABLE proposals ADD COLUMN synced_contrato_id TEXT;
