-- Adiciona o nome cru (sem hash) do lead à event_log, para exibição na coluna
-- NOME do dashboard ("Leads recentes"). O dash já lê `raw_name`, o tracker já
-- recebe fn/ln do formulário e gera o hash para o Meta — só faltava persistir
-- o valor cru para leitura interna. Fica na infraestrutura do recipient e
-- nunca é enviado a plataformas de anúncio.
ALTER TABLE event_log ADD COLUMN raw_name TEXT DEFAULT '';
