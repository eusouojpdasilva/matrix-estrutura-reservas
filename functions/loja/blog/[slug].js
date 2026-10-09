import { editorialArticles, editorialArticleBySlug } from '../../../content/editorial-articles.js';

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function onRequest({ params, env, request }) {
  const { slug } = params;

  const article = editorialArticleBySlug.get(slug) || (env.DB ? await env.DB.prepare(`
    SELECT a.*
    FROM articles a
    WHERE a.slug = ? AND a.status = 'published'
  `).bind(slug).first() : null);

  if (!article) {
    return new Response(notFoundHtml(), { status: 404, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  }

  let databaseRelated = [];
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        `SELECT title, slug, cover_image, read_time_min FROM articles
         WHERE status='published' AND slug != ? ORDER BY published_at DESC LIMIT 3`
      ).bind(slug).all();
      databaseRelated = results || [];
    } catch { /* O artigo continua acessível quando a lista de relacionados falha. */ }
  }
  const editorialRelated = editorialArticles.filter((item) => item.slug !== slug);
  const related = (editorialArticleBySlug.has(slug) ? [...editorialRelated, ...databaseRelated] : [...databaseRelated, ...editorialRelated]).slice(0, 3);

  const origin = new URL(request.url).origin;
  const canonical = `${origin}/loja/blog/${slug}`;
  const cover = article.cover_image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80';
  const meta = article.meta_description || article.excerpt || '';

  let galleryImages = [];
  try { galleryImages = JSON.parse(article.gallery || '[]'); } catch {}

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: meta,
    image: cover,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: { '@type': 'Person', name: 'Equipe Scandia Travel', url: `${origin}/loja/#Scandia` },
    publisher: { '@type': 'Organization', name: 'Scandia Travel', logo: { '@type': 'ImageObject', url: `${origin}/brand/logo-light.png` } },
  });

  const galleryHtml = galleryImages.length ? `
  <section class="gallery" aria-label="Galeria de fotos">
    <div class="gallery-grid">
      ${galleryImages.map((url, i) => `
        <div class="gallery-item" data-idx="${i}">
          <img src="${esc(url)}" alt="Foto ${i + 1} — ${esc(article.title)}" loading="lazy">
        </div>`).join('')}
    </div>
  </section>
  <div class="lightbox" id="lb" role="dialog" aria-modal="true" aria-label="Visualizar foto">
    <button class="lb-close" id="lb-close" aria-label="Fechar">&#x2715;</button>
    <button class="lb-prev" id="lb-prev" aria-label="Anterior">&#x2039;</button>
    <img class="lb-img" id="lb-img" src="" alt="">
    <button class="lb-next" id="lb-next" aria-label="Pr&oacute;xima">&#x203A;</button>
  </div>` : '';

  const ctaHtml = `
  <section class="lead-cta">
    <div class="lead-cta-inner">
      <div class="lead-cta-text">
        <span class="lead-cta-eyebrow">Pronto para planejar?</span>
        <h2 class="lead-cta-title">Sua pr&oacute;xima viagem come&ccedil;a com boas escolhas.</h2>
        <p class="lead-cta-sub">Conte o que deseja viver no norte. Quatro escolhas r&aacute;pidas nos ajudam a iniciar a conversa sobre seu roteiro.</p>
      </div>
      <a href="/#formulario" class="lead-cta-btn">Planejar minha viagem &rarr;</a>
    </div>
  </section>`;

  const relatedHtml = related.length ? `
  <section class="related">
    <h2 class="related-title">Leia tamb&eacute;m</h2>
    <div class="related-grid">
      ${related.map(r => `
        <a href="/loja/blog/${esc(r.slug)}" class="related-card">
          <div class="related-img-wrap"><img src="${esc(r.cover_image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=70')}" alt="${esc(r.title)}" loading="lazy"></div>
          <div class="related-info">
            <span class="related-time">${r.read_time_min} min de leitura</span>
            <h3>${esc(r.title)}</h3>
          </div>
        </a>`).join('')}
    </div>
  </section>` : '';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(article.title)} | Scandia Travel</title>
  <meta name="description" content="${esc(meta)}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:title" content="${esc(article.title)}">
  <meta property="og:description" content="${esc(meta)}">
  <meta property="og:image" content="${esc(cover)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Scandia Travel">
  ${article.published_at ? `<meta property="article:published_time" content="${esc(article.published_at)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${schema}</script>
  <link rel="icon" href="/brand/logo-light.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--amber:#0F1B2D;--teal:#4A6278;--dark:#14181D;--gray:#5A5A5A;--light:#FFFFFF;--border:#E8E0F0}
    body{font-family:'Lato',sans-serif;color:var(--dark);background:#fff;line-height:1.6}
    a{color:inherit;text-decoration:none}
    img{max-width:100%;height:auto;display:block}

    /* NAV */
    .nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:1rem 2rem;display:flex;align-items:center;justify-content:space-between;background:rgba(42,26,62,.97);backdrop-filter:blur(8px)}
    .nav-logo{height:40px;width:auto;object-fit:contain;filter:none}
    .nav-links{display:flex;align-items:center;gap:2rem}
    .nav-links a{font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#fff;opacity:.8;transition:opacity .2s}
    .nav-links a:hover{opacity:1;color:var(--amber)}
    .nav-cta{border:1.5px solid var(--amber);color:var(--amber)!important;padding:.5rem 1.25rem;border-radius:.375rem;opacity:1!important}
    .nav-cta:hover{background:var(--amber)!important;color:#fff!important}
    @media(max-width:640px){.nav-links{gap:1rem}.nav{padding:.75rem 1.25rem}}

    /* HERO */
    .hero{position:relative;height:70vh;min-height:480px;display:flex;align-items:flex-end;padding-bottom:3rem}
    .hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(42,26,62,.92) 0%,rgba(42,26,62,.35) 55%,rgba(42,26,62,.1) 100%)}
    .hero-content{position:relative;z-index:1;max-width:800px;margin:0 auto;padding:0 1.5rem;width:100%;color:#fff}
    .hero-breadcrumb{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:1rem}
    .hero-breadcrumb a:hover{color:var(--amber)}
    .hero-breadcrumb span{margin:0 .5rem;opacity:.5}
    .hero-title{font-family:'Cormorant Garamond',serif;font-size:clamp(1.75rem,5vw,3rem);font-weight:700;line-height:1.2;margin-bottom:1rem}
    .hero-meta{display:flex;align-items:center;gap:1.5rem;font-size:.75rem;opacity:.8;flex-wrap:wrap}
    .hero-meta-item{display:flex;align-items:center;gap:.375rem}

    /* ARTICLE */
    .article-wrap{max-width:740px;margin:0 auto;padding:3.5rem 1.5rem 2rem}
    .article-excerpt{font-size:1.125rem;color:var(--gray);line-height:1.75;border-left:3px solid var(--amber);padding-left:1.25rem;margin-bottom:2.5rem;font-style:italic}
    .article-content{font-size:1.0625rem;line-height:1.85;color:#2A2A2A}
    .article-content h2{font-family:'Cormorant Garamond',serif;font-size:1.625rem;color:var(--dark);margin:2.5rem 0 1rem;font-weight:700}
    .article-content h3{font-family:'Cormorant Garamond',serif;font-size:1.25rem;color:var(--dark);margin:2rem 0 .75rem;font-weight:600}
    .article-content p{margin-bottom:1.5rem}
    .article-content strong{font-weight:700;color:var(--dark)}
    .article-content em{font-style:italic}
    .article-content a{color:var(--amber);border-bottom:1px solid currentColor}
    .article-content ul,.article-content ol{margin:0 0 1.5rem 1.5rem}
    .article-content li{margin-bottom:.5rem}
    .article-content blockquote{border-left:3px solid var(--teal);padding:.75rem 1.25rem;margin:2rem 0;background:var(--light);font-style:italic;color:var(--gray)}
    .article-content img{width:100%;border-radius:.5rem;margin:2rem 0;box-shadow:0 4px 24px rgba(0,0,0,.1)}
    .article-content hr{border:none;border-top:1px solid var(--border);margin:2.5rem 0}

    /* GALLERY */
    .gallery{max-width:1100px;margin:2.5rem auto;padding:0 1.5rem}
    .gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem}
    .gallery-item{overflow:hidden;border-radius:.5rem;cursor:pointer;aspect-ratio:4/3;background:#f0f0f0}
    .gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .35s}
    .gallery-item:hover img{transform:scale(1.06)}

    /* LIGHTBOX */
    .lightbox{display:none;position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.92);align-items:center;justify-content:center}
    .lightbox.open{display:flex}
    .lb-img{max-width:90vw;max-height:88vh;object-fit:contain;border-radius:.375rem}
    .lb-close,.lb-prev,.lb-next{position:absolute;background:none;border:none;color:#fff;font-size:2rem;cursor:pointer;padding:.5rem 1rem;opacity:.8;transition:opacity .2s;line-height:1}
    .lb-close:hover,.lb-prev:hover,.lb-next:hover{opacity:1}
    .lb-close{top:1rem;right:1.25rem;font-size:1.5rem}
    .lb-prev{left:.5rem}
    .lb-next{right:.5rem}
    @media(max-width:480px){.lb-prev{left:0}.lb-next{right:0}}

    /* LEAD CTA */
    .lead-cta{max-width:1100px;margin:3rem auto;padding:0 1.5rem}
    .lead-cta-inner{background:linear-gradient(135deg,#0F1B2D 0%,#3D1F5C 60%,#1A3A3B 100%);border-radius:1rem;padding:2.5rem 2rem;display:flex;align-items:center;justify-content:space-between;gap:2rem;flex-wrap:wrap;border-left:5px solid var(--teal)}
    .lead-cta-eyebrow{font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--teal);display:block;margin-bottom:.5rem}
    .lead-cta-title{font-family:'Cormorant Garamond',serif;font-size:1.625rem;color:#fff;line-height:1.25;margin-bottom:.75rem}
    .lead-cta-sub{font-size:.875rem;color:rgba(255,255,255,.65);line-height:1.7;max-width:480px}
    .lead-cta-btn{flex-shrink:0;display:inline-block;background:var(--amber);color:#fff;font-weight:700;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;padding:.875rem 2rem;border-radius:.5rem;transition:background .2s;white-space:nowrap}
    .lead-cta-btn:hover{background:#0F1B2D}
    @media(max-width:640px){.lead-cta-inner{flex-direction:column}.lead-cta-btn{width:100%;text-align:center}}

    /* RELATED */
    .related{max-width:1100px;margin:4rem auto;padding:0 1.5rem}
    .related-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;margin-bottom:2rem;color:var(--dark)}
    .related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem}
    .related-card{display:block;border-radius:.75rem;overflow:hidden;border:1px solid var(--border);transition:box-shadow .2s;background:#fff}
    .related-card:hover{box-shadow:0 8px 32px rgba(0,0,0,.08)}
    .related-img-wrap{height:160px;overflow:hidden}
    .related-img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
    .related-card:hover .related-img-wrap img{transform:scale(1.05)}
    .related-info{padding:1rem 1.25rem}
    .related-time{font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:var(--amber);font-weight:600;display:block;margin-bottom:.375rem}
    .related-info h3{font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--dark);line-height:1.4}

    /* FOOTER */
    .footer{background:linear-gradient(135deg,#0F1B2D 0%,#1A3A3B 100%);color:rgba(255,255,255,.45);padding:3rem 1.5rem;text-align:center;margin-top:4rem}
    .footer img{height:44px;filter:none;opacity:.7;margin:0 auto 1rem}
    .footer p{font-size:.8rem}
    .footer a{color:var(--amber);margin:0 .75rem}
  </style>
  <link rel="stylesheet" href="/loja/assets/article-editorial.css">
</head>
<body>
  <div class="reading-progress" aria-hidden="true"><span id="reading-progress-bar"></span></div>
  <nav class="nav">
    <a href="/"><img src="/brand/logo-light.png" alt="Scandia Travel" class="nav-logo"></a>
    <div class="nav-links">
      <a href="/loja/blog">Blog</a>
      <a href="/#formulario" class="nav-cta">Planejar viagem</a>
    </div>
  </nav>

  <div style="padding-top:72px">
    <div class="hero">
      <img src="${esc(cover)}" alt="${esc(article.cover_alt || article.title)}" class="hero-img" fetchpriority="high">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-breadcrumb"><a href="/">In&iacute;cio</a><span>&rsaquo;</span><a href="/loja/blog">Blog</a></div>
        ${article.category ? `<div class="hero-category">${esc(article.category)}</div>` : ''}
        <h1 class="hero-title">${esc(article.title)}</h1>
        <div class="hero-meta">
          <span class="hero-meta-item">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${article.read_time_min} min de leitura
          </span>
          ${article.published_at ? `<span class="hero-meta-item">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            ${fmtDate(article.published_at)}
          </span>` : ''}
          <span class="hero-meta-item">Por equipe Scandia Travel</span>
        </div>
      </div>
    </div>
  </div>

  <article class="article-wrap">
    ${article.excerpt ? `<p class="article-excerpt">${esc(article.excerpt)}</p>` : ''}
    <div class="article-content">${article.content || ''}</div>
    <a class="back-to-blog" href="/loja/blog/">&larr; Voltar ao caderno de viagem</a>
  </article>

  ${galleryHtml}
  ${ctaHtml}
  ${relatedHtml}

  <footer class="footer">
    <img src="/brand/logo-light.png" alt="Scandia Travel">
    <p>&copy; ${new Date().getFullYear()} Scandia Travel &nbsp;&middot;&nbsp; <a href="/loja/blog">Blog</a><a href="/">Consultoria</a></p>
  </footer>

  <script>
    const progressBar = document.getElementById('reading-progress-bar');
    const updateProgress = () => {
      const article = document.querySelector('.article-wrap');
      const end = article.offsetTop + article.offsetHeight - innerHeight;
      progressBar.style.width = Math.min(100, Math.max(0, (scrollY - article.offsetTop + innerHeight * .45) / Math.max(1, end - article.offsetTop + innerHeight * .45) * 100)) + '%';
    };
    addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    fetch('/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'ViewContent',
        event_id: crypto.randomUUID(),
        custom_data: { content_type: 'article', content_ids: ['${esc(slug)}'], content_name: '${esc(article.title)}' }
      })
    }).catch(() => {});

    const imgs = ${JSON.stringify(galleryImages)};
    if (imgs.length) {
      let cur = 0;
      const lb = document.getElementById('lb');
      const lbImg = document.getElementById('lb-img');
      const open = i => { cur = (i + imgs.length) % imgs.length; lbImg.src = imgs[cur]; lb.classList.add('open'); document.body.style.overflow='hidden'; };
      const close = () => { lb.classList.remove('open'); document.body.style.overflow=''; };
      document.querySelectorAll('.gallery-item').forEach((el, i) => el.addEventListener('click', () => open(i)));
      document.getElementById('lb-close').addEventListener('click', close);
      document.getElementById('lb-prev').addEventListener('click', () => open(cur - 1));
      document.getElementById('lb-next').addEventListener('click', () => open(cur + 1));
      lb.addEventListener('click', e => { if (e.target === lb) close(); });
      document.addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key==='Escape') close(); if (e.key==='ArrowLeft') open(cur-1); if (e.key==='ArrowRight') open(cur+1); });
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    }
  });
}

function notFoundHtml() {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Artigo n&atilde;o encontrado | Scandia Travel</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Lato:wght@400;600&display=swap" rel="stylesheet">
  <style>body{font-family:Lato,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F4F1EC}
  .box{text-align:center}.box h1{font-family:'Cormorant Garamond',serif;font-size:2rem;margin-bottom:1rem;color:#0F1B2D}
  .box a{color:#0F1B2D;font-weight:600}</style></head>
  <body><div class="box"><h1>Artigo n&atilde;o encontrado</h1><p><a href="/loja/blog">&larr; Voltar ao Blog</a></p></div></body></html>`;
}
