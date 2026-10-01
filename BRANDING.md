# Personalização para um novo cliente

A identidade base Scandia Travel usa azul profundo `#0F1B2D`, azul acinzentado `#4A6278`, dourado `#C9A24B`, creme `#F4F1EC`, texto `#14181D`, Cormorant Garamond e Lato. `public/brand/logo-light.png` e `logo-dark.png` são os logos fornecidos. Não os reutilize em cliente sem autorização.

1. Crie um repositório próprio a partir desta matriz. Troque logos e nome em `src/`, `public/`, `functions/loja/` e `index.html`.
2. Ajuste cores em `src/index.css`, `tailwind.config.ts`, CRM, dashboard, loja, blog e propostas.
3. Troque textos e fotos em `src/components/`. Configure WhatsApp em `public/brand/config.js`; sem número válido o formulário não envia leads.
4. Configure domínio em `index.html`. IDs de Meta Pixel e GA4 vão em `public/brand/config.js`; só então habilite `trackingEnabled`. Segredos nunca vão nesse arquivo.
5. Configure D1 `DB`, `DASH_KEY` e demais secrets no Pages do novo cliente. Revise `config/products.js` e o workflow Meta Ads antes de ativá-lo.
6. Confira `/`, `/crm/`, `/dash/`, `/loja/`, `/loja/blog/`, artigos e propostas. Faça um teste real do formulário no ambiente novo.

Os vídeos pessoais da Andrea foram removidos. Os componentes de depoimento aguardam material autorizado. `public/lp/` não integra esta matriz.
