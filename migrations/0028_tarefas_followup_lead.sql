-- 0028_tarefas_followup_lead.sql
--
-- Vincula tarefa a lead, para o follow-up do pipeline gerar tarefa sozinho.
--
-- crm_tarefas já tinha cliente_id (→ crm_clientes), mas um lead ainda não é
-- cliente: a conversão só acontece quando ele fecha. Sem uma coluna própria, a
-- tarefa de follow-up ficaria solta, sem como saber de quem é nem como
-- reaproveitá-la quando a data mudasse.
--
-- origem distingue a tarefa criada pelo follow-up da criada à mão. É o que
-- permite reaproveitar a tarefa certa em vez de criar uma nova a cada edição
-- do lead.

ALTER TABLE crm_tarefas ADD COLUMN lead_id TEXT;              -- → crm_leads.id
ALTER TABLE crm_tarefas ADD COLUMN origem  TEXT;              -- followup | NULL (manual)

CREATE INDEX IF NOT EXISTS idx_crm_tarefas_lead ON crm_tarefas(lead_id, status);
