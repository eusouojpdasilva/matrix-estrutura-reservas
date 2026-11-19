# Deploy de um clone da matriz

Crie um repositório por cliente e conecte ao Cloudflare Pages da conta dele. Use raiz do repositório, Node 22 (`.nvmrc`), comando `npm run build && npm run check:build` e saída `dist`. O binding D1 deve se chamar `DB`.

Migrations em `migrations/` não são executadas pelo build. Revise e aplique explicitamente ao banco novo, em ordem. Configure variáveis, secrets e webhooks próprios; não herde valores da Andrea ou Scandia.

Configure `public/brand/config.js` antes de ativar formulário e rastreamento. Configure `.github/workflows/meta-ads-sync.yml` com `PAGES_BASE_URL` e `SYNC_SECRET` do novo cliente; sem ambos o workflow não executa sync.

Para cada alteração: `npm ci`, `npm test`, `npm run build`, `npm run check:build`; faça push, acompanhe CI e Pages e confirme as rotas. Nunca copie ou versione `dist/`.

## WhatsApp pelo Kapso (opcional)

Sem as variáveis abaixo o CRM funciona normalmente: a aba de conversa não
aparece e o endpoint de envio responde 503. Configure só para quem for usar.

No Cloudflare Pages, em **Settings → Environment variables**, cadastre como
**secret** (não como texto):

| Variável | Onde achar |
| --- | --- |
| `KAPSO_API_KEY` | Painel do Kapso → **API keys** |
| `KAPSO_PHONE_NUMBER_ID` | Painel do Kapso → **Phone numbers**. É o id interno do Kapso, não o `phone_number_id` da Meta |
| `KAPSO_WEBHOOK_SECRET` | Gerado ao criar o webhook (passo abaixo) |
| `KAPSO_WEBHOOK_SLUG` | UUID que você escolhe; compõe a URL do webhook |

Gere o slug com `node -e "console.log(crypto.randomUUID())"`.

### Criar o webhook no Kapso

Painel do Kapso → **Webhooks** → aba **WhatsApp** → no bloco do número,
**Add webhook**. O webhook precisa ser **por número**: webhook de projeto não
recebe evento de mensagem.

- URL: `https://DOMINIO_DO_CLIENTE/webhook/kapso/<KAPSO_WEBHOOK_SLUG>`
- Tipo: **Kapso** (não **Meta**)
- Eventos: `message.received`, `message.sent`, `message.delivered`,
  `message.read`, `message.failed`
- Copie o **Secret** gerado para `KAPSO_WEBHOOK_SECRET`

A assinatura é HMAC SHA256 do corpo cru, em hex, no cabeçalho
`X-Webhook-Signature`. Secret errado faz todo evento virar 401 em silêncio —
as mensagens simplesmente não aparecem no CRM.

### Migration

A `0029_crm_mensagens_whatsapp.sql` cria `crm_mensagens`. Aplique antes de
publicar o código, como qualquer migration deste repositório.

### Janela de 24 horas

O WhatsApp só aceita texto livre dentro de 24h da última mensagem do cliente.
Fora disso é preciso modelo aprovado pela Meta, criado em
`business.facebook.com` → WhatsApp Manager → Modelos de mensagem, ou pela API
em `POST /meta/whatsapp/v24.0/<business_account_id>/message_templates`.
Categoria `UTILITY` para aviso de cobrança: é mais barata e aprova mais fácil
que `MARKETING`.

Nenhum valor real deve ser versionado. Para rodar local, use `.dev.vars`, que
está no `.gitignore`.
