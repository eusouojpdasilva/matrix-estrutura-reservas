# Scandia Travel — matriz de agências

Repositório matriz para novos clientes: página de captação, CRM, dashboard, loja de guias, blog, propostas e APIs Cloudflare Pages + D1. Identidade padrão Scandia Travel. Para criar um cliente, clone esta base e siga [BRANDING.md](BRANDING.md).

| Caminho | Conteúdo |
|---|---|
| `src/`, `index.html` | Página de captação React |
| `public/crm/` | CRM e pipeline |
| `public/dash/` | Dashboard |
| `public/loja/` | Loja estática de guias e blog |
| `functions/` | APIs, artigos e propostas públicas |
| `migrations/` | Esquema D1, aplicado explicitamente |
| `public/brand/` | Logos e configuração pública |
| `dist/` | Saída do build, ignorada pelo Git |

`public/lp/` foi excluída. A loja de guias foi recebida como distribuição compilada; mudanças profundas nela exigem recuperar seu projeto fonte.

Use Node 22 e npm: `npm ci`, `npm test`, `npm run build`, `npm run check:build`. O Vite serve a interface; Functions exigem Pages/Workers. Veja [DEPLOY.md](DEPLOY.md) para criar o projeto de cada cliente. A configuração pública inclui o WhatsApp da Scandia e não inclui IDs de tracking. Troque o contato ao clonar para outro cliente.

A base funcional veio do projeto consolidado da Andrea em 2026-10-01. A identidade e os contatos foram adaptados para Scandia, sem dados nem credenciais de cliente. Veja [docs/matrix-update.md](docs/matrix-update.md).
