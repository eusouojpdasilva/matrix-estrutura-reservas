# Deploy de um clone da matriz

Crie um repositório por cliente e conecte ao Cloudflare Pages da conta dele. Use raiz do repositório, Node 22 (`.nvmrc`), comando `npm run build && npm run check:build` e saída `dist`. O binding D1 deve se chamar `DB`.

Migrations em `migrations/` não são executadas pelo build. Revise e aplique explicitamente ao banco novo, em ordem. Configure variáveis, secrets e webhooks próprios; não herde valores da Andrea ou Scandia.

Configure `public/brand/config.js` antes de ativar formulário e rastreamento. Configure `.github/workflows/meta-ads-sync.yml` com `PAGES_BASE_URL` e `SYNC_SECRET` do novo cliente; sem ambos o workflow não executa sync.

Para cada alteração: `npm ci`, `npm test`, `npm run build`, `npm run check:build`; faça push, acompanhe CI e Pages e confirme as rotas. Nunca copie ou versione `dist/`.
