# BRANDING.md — Checklist de personalização por cliente

Rode este checklist inteiro ANTES do deploy. Cada item diz o arquivo e o que
trocar. Depois de concluir, siga para a skill `deploy-stack`.

## 1. Identidade

| Item | Onde | O que fazer |
|---|---|---|
| Nome da agência | Busca global por `Sua Agência` | Substituir em todos os arquivos |
| Nome do consultor | Busca global por `Nome do Consultor` | Substituir (blog byline, página de links) |
| Domínio | Busca global por `SEUDOMINIO.com.br` | Substituir pelo domínio do cliente (canonical, OG tags) |
| WhatsApp | Busca global por `wa.me/5500000000000` | Substituir pelo número do cliente com DDI+DDD |

## 2. Logos (substituir os arquivos, manter os nomes)

| Arquivo | Uso | Formato ideal |
|---|---|---|
| `assets/logo.png` | Página pública de propostas, favicon geral | PNG fundo transparente |
| `crm/assets/logo-vertical.png` | Tela de login do CRM | ~400px largura |
| `crm/assets/logo-circle.png` | Sidebar do CRM | Quadrado/círculo |
| `crm/assets/logo-horizontal.png` | Reservado | Horizontal |

## 3. Paleta de cores

- **CRM**: `crm/index.html`, bloco `:root` no `<style>` (comentado como
  "identidade da agência — edite aqui"). Trocar `--accent`, `--accent-d` e,
  se o cliente não for dark-theme, os fundos (`--bg`, `--card`, etc.).
- **Proposta pública**: `functions/loja/proposta/[slug].js`, `:root` no CSS
  inline (`--amber`, `--dark`).
- **Blog**: `loja/blog/index.html` + `functions/loja/blog/[slug].js`.
- **Consultoria/captação**: `consultoria/index.html` (variáveis no `<style>`).
- **Página de links**: `index.html`.

## 4. Conteúdo

- `consultoria/index.html` — reescrever TODA a copy (hero, dores, como
  funciona, sobre, FAQ) para o posicionamento do cliente. As fotos do hero
  (Swiper) e a foto do "sobre" também.
- `index.html` — links e bio.
- Fotos: usar as do cliente ou Unsplash com fit ao nicho.

## 5. Tracking

- GTM: busca global por `GTM-XXXXXXX` → container do cliente (ou remover o
  snippet se não usar GTM).
- Env vars no Cloudflare (via `deploy-stack`): `DASH_KEY` (novo, forte),
  `LEAD_CAPTURE_KEY`, `META_PIXEL_ID`, `META_ACCESS_TOKEN`, `GA4_*`,
  slugs de webhook por plataforma.
- `config/products.js` — produtos do cliente (se vender infoproduto).

## 6. Verificação final

- [ ] `grep -ri "sua agência\|SEUDOMINIO\|5500000000000\|GTM-XXXXXXX\|Nome do Consultor"` retorna zero
- [ ] Login do CRM com a nova `DASH_KEY`
- [ ] Form da consultoria cria lead no pipeline
- [ ] Artigo de teste publica e aparece no blog
- [ ] Proposta de teste publica e renderiza em `/loja/proposta/{slug}`
- [ ] `verify-tracking` (skill) passa nos 6 checkpoints
