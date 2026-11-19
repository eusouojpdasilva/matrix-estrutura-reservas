-- 0029_crm_mensagens_whatsapp.sql
--
-- Guarda as mensagens de WhatsApp trocadas com o lead, para a conversa
-- aparecer dentro do CRM e o agente responder sem sair do sistema.
--
-- Até aqui o WhatsApp era só um link wa.me que abria o aplicativo: o que foi
-- combinado com o cliente ficava no celular de quem atendeu, fora do CRM.
--
-- lead_id é nulo de propósito. Nem todo evento do Kapso traz telefone, e uma
-- mensagem sem dono é melhor que uma mensagem perdida: ela fica gravada com o
-- kapso_conversation_id e pode ser ligada ao lead depois.
--
-- kapso_message_id é o wamid da Meta, único por mensagem. É ele que segura a
-- idempotência: o Kapso reenvia o mesmo evento quando não recebe 200, e os
-- eventos de status (delivered, read, failed) chegam depois da mensagem já
-- gravada — todos precisam encontrar a linha existente em vez de criar outra.

CREATE TABLE IF NOT EXISTS crm_mensagens (
  id                     TEXT    PRIMARY KEY,
  lead_id                TEXT,                                -- nullable → crm_leads.id
  kapso_message_id       TEXT    UNIQUE,                      -- wamid da Meta
  kapso_conversation_id  TEXT,
  direcao                TEXT    NOT NULL,                    -- entrada | saida
  tipo                   TEXT,                                -- text | image | audio | document | ...
  texto                  TEXT,
  telefone               TEXT,                                -- só dígitos, como o WhatsApp manda
  contato_nome           TEXT,
  status                 TEXT,                                -- received | sent | delivered | read | failed
  enviado_em             INTEGER,                             -- unix seconds, vindo do Kapso
  created_at             INTEGER NOT NULL DEFAULT (unixepoch())
);

-- a conversa do lead, em ordem cronológica: é a leitura que a tela faz
CREATE INDEX IF NOT EXISTS idx_crm_mensagens_lead     ON crm_mensagens(lead_id, enviado_em);

-- achar o lead pelo número quando a mensagem chega sem vínculo
CREATE INDEX IF NOT EXISTS idx_crm_mensagens_telefone ON crm_mensagens(telefone);
