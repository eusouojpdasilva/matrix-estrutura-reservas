# Scandia Travel — matriz

- Fonte de referência para novos clientes. Leia `README.md`, `BRANDING.md` e `DEPLOY.md`.
- Captação em `src/`; CRM, dashboard, loja e blog estático em `public/`; APIs em `functions/`.
- `public/lp/` não faz parte desta matriz.
- Personalize o clone de cada cliente; preserve a base Scandia aqui.
- Não copie fotos, vídeos, telefone, IDs de pixels, GA4, domínios ou credenciais de outro cliente.
- Build em `dist/`. Nunca versionar `dist/`, `node_modules/`, `.dev.vars`, `.env*` ou `wrangler.toml` local.
- D1 remoto tem binding `DB`. Não executar migrations nem gravar em banco para testar aparência.
- Antes do push: `npm test`, `npm run build`, `npm run check:build` e revisão de referências de cliente.
- Após deploy: confirmar status do Pages e rotas públicas.
- A loja de guias é bundle estático recebido da origem; evitar edições amplas no arquivo minificado sem sua fonte.
