-- 0022_faturas_financeiro_detalhado.sql
-- Adiciona separação bruto/comissão, forma de pagamento e condição de pagamento
-- em crm_faturas. Todos os campos são nullable para não quebrar faturas antigas.
-- D1 (SQLite) não permite ADD COLUMN NOT NULL sem DEFAULT em tabela já populada.

ALTER TABLE crm_faturas ADD COLUMN comissao REAL;
ALTER TABLE crm_faturas ADD COLUMN forma_pagamento TEXT;      -- Pix | Cartão | Boleto
ALTER TABLE crm_faturas ADD COLUMN condicao_pagamento TEXT;   -- À vista | Parcelado

-- Mesmo tratamento em crm_contratos, para registrar a expectativa de comissão
-- já na criação do contrato (antes mesmo de gerar as faturas).
ALTER TABLE crm_contratos ADD COLUMN comissao_estimada REAL;
ALTER TABLE crm_contratos ADD COLUMN forma_pagamento_prevista TEXT;
