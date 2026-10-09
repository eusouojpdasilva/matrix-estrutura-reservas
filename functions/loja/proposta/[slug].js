function safeJson(val, fallback) {
  try { return JSON.parse(val || null) ?? fallback; } catch { return fallback; }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtBRL(v) {
  if (!v && v !== 0) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}

// com centavos: numa parcela de R$ 3.333,34 o centavo importa pro cliente
function fmtBRL2(v) {
  if (!v && v !== 0) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v);
}

function stars(n) {
  return '★'.repeat(Math.min(5, Math.max(0, n || 0))) + '☆'.repeat(5 - Math.min(5, Math.max(0, n || 0)));
}

// "São Paulo (GRU)" → { city: "São Paulo", code: "GRU" }
function splitAirport(s) {
  const m = String(s || '').match(/^(.*?)\s*\(([A-Za-z]{3})\)\s*$/);
  if (m) return { city: m[1].trim(), code: m[2].toUpperCase() };
  return { city: String(s || ''), code: '' };
}

function resumoHtml(p, destinations, hotels) {
  const rota = destinations.length ? destinations.join(' → ') : '';
  let noites = hotels.reduce((a, h) => a + (parseInt(h.nights) || 0), 0);
  if (!noites && p.travel_start && p.travel_end) {
    noites = Math.round((new Date(p.travel_end) - new Date(p.travel_start)) / 86400000);
  }
  const cards = [
    rota ? `<div class="sum-card"><div class="s-label">Rota</div><div class="s-value">${esc(rota)}</div></div>` : '',
    noites ? `<div class="sum-card"><div class="s-label">Duração</div><div class="s-value">${noites} noites</div></div>` : '',
    p.travelers ? `<div class="sum-card"><div class="s-label">Viajantes</div><div class="s-value">${p.travelers} ${p.travelers > 1 ? 'pessoas' : 'pessoa'}</div></div>` : '',
    hotels.length ? `<div class="sum-card"><div class="s-label">Hospedagem</div><div class="s-value">${hotels.length > 1 ? hotels.length + ' hotéis' : hotels[0].stars ? stars(hotels[0].stars).replace(/☆/g, '') : '1 hotel'}</div></div>` : '',
  ].filter(Boolean).join('');
  if (!cards) return '';
  return `
  <section class="section" style="padding-bottom:1rem">
    <div class="section-inner">
      <div class="section-label">Resumo</div>
      <div class="summary-grid">${cards}</div>
    </div>
  </section>`;
}

function hotelsHtml(hotels) {
  if (!hotels.length) return '';
  const cards = hotels.map(h => {
    const details = [
      h.room ? `<li>Quarto: <strong>${esc(h.room)}</strong></li>` : '',
      h.regime ? `<li>Regime: <strong>${esc(h.regime)}</strong></li>` : '',
      h.checkin ? `<li>Check-in: <strong>${fmtDate(h.checkin)}</strong></li>` : '',
      h.checkout ? `<li>Check-out: <strong>${fmtDate(h.checkout)}</strong></li>` : '',
    ].filter(Boolean).join('');
    return `
    <div class="h-card${h.featured ? ' h-featured' : ''}">
      ${h.featured ? '<span class="h-badge">Mais escolhido</span>' : ''}
      ${h.image ? `<div class="h-img"><img src="${esc(h.image)}" alt="${esc(h.name)}" loading="lazy"></div>` : '<div class="h-img h-img-empty"><span>🏨</span></div>'}
      <div class="h-body">
        <div class="h-city">${esc(h.city || '')}</div>
        <div class="h-name">${esc(h.name || '')}</div>
        ${h.stars ? `<div class="h-stars">${stars(h.stars)}</div>` : ''}
        <div class="h-meta">
          ${h.nights ? `<span>${h.nights} ${h.nights > 1 ? 'noites' : 'noite'}</span>` : ''}
          ${h.nights && h.price_per_night ? '<span class="dot">·</span>' : ''}
          ${h.price_per_night ? `<span>${fmtBRL(h.price_per_night)}/noite</span>` : ''}
        </div>
        ${details ? `<ul class="h-details">${details}</ul>` : ''}
        ${h.description ? `<p class="h-desc">${esc(h.description)}</p>` : ''}
        ${h.price_option ? `<div class="h-price"><span class="h-price-label">Total com esta opção</span><span class="h-price-value">${fmtBRL(h.price_option)}</span></div>` : ''}
      </div>
    </div>`;
  }).join('');
  return `
  <section class="section">
    <div class="section-inner">
      <div class="section-label">Hospedagem</div>
      <div class="hotels-grid">${cards}</div>
    </div>
  </section>`;
}

function flightsHtml(flights) {
  if (!flights.length) return '';
  const cards = flights.map(f => {
    const dep = splitAirport(f.origin);
    const arr = splitAirport(f.destination);
    const depDate = f.departure_date ? fmtDate(f.departure_date) : '';
    const arrDate = f.arrival_date ? fmtDate(f.arrival_date) : '';
    const foot = [
      f.baggage_hand ? `<span>Bagagem de mão: <strong>${esc(f.baggage_hand)}</strong></span>` : '',
      f.baggage_checked ? `<span>Despachada: <strong>${esc(f.baggage_checked)}</strong></span>` : '',
      f.flight_class ? `<span>Classe: <strong>${esc(f.flight_class)}</strong></span>` : '',
    ].filter(Boolean).join('');
    return `
    <div class="fl-card">
      <div class="fl-top">
        <span class="fl-dir">${esc(f.type || 'Voo')}${f.airline ? ' · ' + esc(f.airline) : ''}</span>
        ${f.flight_no ? `<span class="fl-no">Voo ${esc(f.flight_no)}</span>` : ''}
      </div>
      <div class="fl-route">
        <div class="fl-airport">
          ${dep.code ? `<div class="fl-code">${esc(dep.code)}</div>` : ''}
          <div class="fl-city">${esc(dep.city)}</div>
          ${f.departure_time ? `<div class="fl-time">${esc(f.departure_time)}</div>` : ''}
          ${depDate ? `<div class="fl-date">${depDate}</div>` : ''}
        </div>
        <div class="fl-line">${f.duration ? `<span class="fl-dur">${esc(f.duration)}</span>` : ''}<span class="fl-plane">✈</span></div>
        <div class="fl-airport">
          ${arr.code ? `<div class="fl-code">${esc(arr.code)}</div>` : ''}
          <div class="fl-city">${esc(arr.city)}</div>
          ${f.arrival_time ? `<div class="fl-time">${esc(f.arrival_time)}</div>` : ''}
          ${arrDate ? `<div class="fl-date">${arrDate}</div>` : ''}
        </div>
      </div>
      ${f.stopover ? `<div class="fl-stopover">Conexão: <strong>${esc(f.stopover)}</strong></div>` : ''}
      ${foot ? `<div class="fl-foot">${foot}</div>` : ''}
    </div>`;
  }).join('');
  return `
  <section class="section section-alt">
    <div class="section-inner">
      <div class="section-label">Aéreo</div>
      <div class="flights-list">${cards}</div>
    </div>
  </section>`;
}

function activitiesHtml(activities) {
  if (!activities.length) return '';
  const cards = activities.map(a => `
    <div class="act-card">
      <div class="act-body">
        <div class="act-name">${esc(a.name || '')}</div>
        ${a.description ? `<p class="act-desc">${esc(a.description)}</p>` : ''}
      </div>
      ${a.price ? `<div class="act-price">${fmtBRL(a.price)}</div>` : ''}
    </div>`).join('');
  return `
  <section class="section">
    <div class="section-inner">
      <div class="section-label">Passeios &amp; Experiências</div>
      <div class="activities-list">${cards}</div>
    </div>
  </section>`;
}

function condicoesHtml(p) {
  const items = [
    p.expires_at ? `<p><strong>Validade:</strong> esta proposta é válida até ${fmtDate(p.expires_at)}. Após essa data, valores e disponibilidade devem ser reconsultados.</p>` : '',
    `<p><strong>Disponibilidade:</strong> tarifas de aéreo e hotelaria estão sujeitas a alteração até a emissão e confirmação da reserva.</p>`,
    `<p><strong>Cancelamento:</strong> conforme política da operadora e dos fornecedores envolvidos, informada no ato da confirmação.</p>`,
    `<p><strong>Documentação:</strong> passaporte com validade mínima de 6 meses a partir da data de retorno. Vistos e vacinas conforme exigência de cada destino.</p>`,
  ].filter(Boolean).join('');
  return `
  <section class="section">
    <div class="section-inner">
      <div class="section-label">Condições gerais</div>
      <div class="cond">${items}</div>
    </div>
  </section>`;
}

function investimentoHtml(p, installments) {
  const hasIncludes = p.includes && p.includes.trim();
  const hasExcludes = p.excludes && p.excludes.trim();
  const hasPrice = p.price_total || p.price_per_person;
  const hasCta = p.cta_primary_url || p.cta_secondary_url;
  const hasPayment = p.payment_info && p.payment_info.trim();

  // só mostra parcelas completas — linha sem data ou sem valor não vai pro ar
  const parcelas = (installments || []).filter(x => x && x.vencimento && x.valor > 0);
  const hasParcelas = parcelas.length > 0;

  if (!hasIncludes && !hasExcludes && !hasPrice && !hasCta && !hasPayment && !hasParcelas) return '';

  const parcelasHtml = hasParcelas ? `
    <div class="parcelas">
      <div class="parcelas-head">${parcelas.length > 1 ? `Em até ${parcelas.length}×` : 'Pagamento'}</div>
      ${parcelas.map((x, i) => `
        <div class="parcela-row">
          <span class="parcela-n">${parcelas.length > 1 ? `${i + 1}ª` : '·'}</span>
          <span class="parcela-data">${fmtDate(x.vencimento)}</span>
          ${x.obs ? `<span class="parcela-obs">${esc(x.obs)}</span>` : '<span class="parcela-obs"></span>'}
          <span class="parcela-valor">${fmtBRL2(x.valor)}</span>
        </div>`).join('')}
    </div>` : '';

  const inclLines = hasIncludes
    ? p.includes.split('\n').filter(Boolean).map(l => `<li>${esc(l.replace(/^[•\-*]\s*/, ''))}</li>`).join('')
    : '';
  const exclLines = hasExcludes
    ? p.excludes.split('\n').filter(Boolean).map(l => `<li>${esc(l.replace(/^[•\-*]\s*/, ''))}</li>`).join('')
    : '';

  const payLines = hasPayment
    ? p.payment_info.split('\n').filter(Boolean).map(l => `<p class="pay-line">${esc(l.replace(/^[•\-*]\s*/, ''))}</p>`).join('')
    : '';

  return `
  <section class="section">
    <div class="section-inner">
      <div class="section-label">Investimento</div>
      ${(hasIncludes || hasExcludes) ? `
      <div class="incl-grid">
        ${hasIncludes ? `<div class="incl-col"><div class="incl-head incl-yes">✓ Incluso</div><ul class="incl-list">${inclLines}</ul></div>` : ''}
        ${hasExcludes ? `<div class="incl-col"><div class="incl-head incl-no">✗ Não incluso</div><ul class="incl-list excl-list">${exclLines}</ul></div>` : ''}
      </div>` : ''}
      ${(hasPrice || hasParcelas) ? `
      <div class="price-card">
        ${p.price_total ? `<div class="price-total">${fmtBRL(p.price_total)}</div>` : ''}
        ${p.price_per_person && p.travelers > 1 ? `<div class="price-pp">${fmtBRL(p.price_per_person)} por pessoa · ${p.travelers} viajantes</div>` : (p.price_per_person ? `<div class="price-pp">${fmtBRL(p.price_per_person)} por pessoa</div>` : '')}
        ${parcelasHtml}
        ${hasCta ? `
        <div class="cta-row">
          ${p.cta_primary_url ? `<a href="${esc(p.cta_primary_url)}" class="cta-btn cta-primary" target="_blank" rel="noopener">${esc(p.cta_primary_label || 'Quero reservar')}</a>` : ''}
          ${p.cta_secondary_url ? `<a href="${esc(p.cta_secondary_url)}" class="cta-btn cta-secondary" target="_blank" rel="noopener">${esc(p.cta_secondary_label || 'Tenho dúvidas')}</a>` : ''}
        </div>` : ''}
        ${hasPayment ? `<div class="payment-info">${payLines}</div>` : ''}
      </div>` : (hasCta ? `
      <div class="cta-row" style="margin-top:1.5rem">
        ${p.cta_primary_url ? `<a href="${esc(p.cta_primary_url)}" class="cta-btn cta-primary" target="_blank" rel="noopener">${esc(p.cta_primary_label || 'Quero reservar')}</a>` : ''}
        ${p.cta_secondary_url ? `<a href="${esc(p.cta_secondary_url)}" class="cta-btn cta-secondary" target="_blank" rel="noopener">${esc(p.cta_secondary_label || 'Tenho dúvidas')}</a>` : ''}
      </div>` : '')}
    </div>
  </section>`;
}

function itinerarioHtml(itinerary) {
  if (!itinerary.length) return '';
  const items = itinerary.map((day, i) => {
    const dayItems = Array.isArray(day.items) ? day.items.filter(it => it && it.title) : [];
    const timeline = dayItems.length ? `
      <div class="day-timeline">
        ${dayItems.map(it => `
          <div class="day-time-item">
            ${it.time ? `<div class="dti-time">${esc(it.time)}</div>` : '<div class="dti-time">·</div>'}
            <div class="dti-title">${esc(it.title)}</div>
          </div>`).join('')}
      </div>` : '';
    return `
    <div class="day-item">
      <button class="day-toggle" onclick="toggleDay(${i})">
        <span class="day-num">Dia ${day.day || i + 1}</span>
        ${day.date ? `<span class="day-date">${fmtDate(day.date)}</span>` : ''}
        <span class="day-title">${esc(day.title || '')}</span>
        <span class="day-chevron" id="chev-${i}">▸</span>
      </button>
      <div class="day-body" id="day-body-${i}" style="display:none">
        ${day.image ? `<img src="${esc(day.image)}" alt="" class="day-img" loading="lazy">` : ''}
        ${day.description ? `<p class="day-desc">${esc(day.description)}</p>` : ''}
        ${timeline}
      </div>
    </div>`;
  }).join('');
  return `
  <section class="section section-alt">
    <div class="section-inner">
      <div class="section-label" style="display:flex;align-items:center;justify-content:space-between">
        <span>Roteiro</span>
        <span class="itin-controls">
          <button class="itin-btn" onclick="expandAllDays()">Expandir tudo</button>
          <button class="itin-btn" onclick="collapseAllDays()">Recolher tudo</button>
        </span>
      </div>
      <div class="itinerary">${items}</div>
    </div>
  </section>`;
}

function renderPage(p, { destinations, hotels, flights, activities, coverImages, itinerary, installments }) {
  const hero = coverImages[0] || '';
  const dateRange = p.travel_start && p.travel_end
    ? `${fmtDate(p.travel_start)} → ${fmtDate(p.travel_end)}`
    : (p.travel_start ? `A partir de ${fmtDate(p.travel_start)}` : '');
  const destChips = destinations.map(d => `<span class="dest-chip">${esc(d)}</span>`).join('');

  let diasFaltam = null;
  if (p.travel_start) {
    const diff = Math.ceil((new Date(p.travel_start + 'T00:00:00') - new Date()) / 86400000);
    if (diff > 0) diasFaltam = diff;
  }

  const hasMobileCta = p.cta_primary_url;
  const propYear = p.created_at ? new Date(p.created_at * 1000 || p.created_at).getFullYear() : new Date().getFullYear();
  const propNum = `${String(p.id).padStart(4, '0')}/${propYear}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(p.title)} · Scandia Travel</title>
  <meta name="robots" content="noindex,nofollow">
  <link rel="icon" href="/assets/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--amber:#E3522A;--dark:#0A1520;--surface:#12233A;--surface2:#182E4A;--border:#223652;--text:#E8EEF4;--muted:#7A90A8}
    html{scroll-behavior:smooth}
    body{font-family:'Montserrat',sans-serif;background:var(--dark);color:var(--text);line-height:1.6}
    a{color:inherit;text-decoration:none}
    img{max-width:100%;height:auto;display:block}

    /* NAV */
    .nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(to bottom,rgba(0,0,0,.7),transparent)}
    .nav-logo{height:36px;width:auto;object-fit:contain;filter:brightness(0) invert(1)}
    .nav-back{font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.2);padding:.375rem .875rem;border-radius:.375rem;transition:all .2s}
    .nav-back:hover{color:#fff;border-color:#fff}

    /* HERO */
    .hero{position:relative;min-height:90vh;display:flex;align-items:flex-end;overflow:hidden;background:var(--surface)}
    .hero-bg{position:absolute;inset:0;background-size:cover;background-position:center}
    .hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 50%,rgba(0,0,0,.2) 100%)}
    .hero-content{position:relative;z-index:1;padding:3rem 1.5rem 4rem;width:100%;max-width:900px;margin:0 auto}
    .dest-chips{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.25rem}
    .dest-chip{font-size:.6rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;background:rgba(227,82,42,.15);border:1px solid rgba(227,82,42,.4);color:var(--amber);padding:.3rem .875rem;border-radius:2rem}
    .hero-title{font-family:'Playfair Display',serif;font-size:clamp(1.75rem,5vw,3.25rem);font-weight:700;color:#fff;line-height:1.2;margin-bottom:1rem}
    .hero-meta{display:flex;flex-wrap:wrap;gap:1rem;font-size:.8rem;color:rgba(255,255,255,.65)}
    .hero-meta span{display:flex;align-items:center;gap:.375rem}

    /* SECTIONS */
    .section{padding:4rem 1.5rem}
    .section-alt{background:var(--surface)}
    .section-inner{max-width:860px;margin:0 auto}
    .section-label{font-size:.62rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--amber);margin-bottom:1.5rem}

    /* INTRO TEXT */
    .intro-text{font-size:1.2rem;font-weight:600;color:#fff;line-height:1.7;font-style:normal;border-left:4px solid var(--amber);padding-left:1.5rem}
    .intro-text::first-line{color:var(--amber)}

    /* COUNTDOWN */
    .countdown-badge{display:inline-flex;align-items:center;gap:.75rem;margin-top:1.5rem;background:rgba(20,20,20,.6);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12);border-radius:1rem;padding:.75rem 1.25rem}
    .cd-ico{font-size:1.4rem}
    .cd-num{font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;color:var(--amber);line-height:1}
    .cd-text{display:flex;flex-direction:column;font-size:.8rem;font-weight:600;color:#fff;line-height:1.3}
    .cd-label{font-size:.58rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}

    /* VALIDITY BAR */
    .validity-bar{position:sticky;top:0;z-index:110;background:#000;color:rgba(255,255,255,.85);font-size:.68rem;letter-spacing:.08em;text-align:center;padding:.55rem 1rem;border-bottom:1px solid var(--border)}
    .validity-bar strong{color:var(--amber)}

    /* RESUMO */
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.875rem}
    .sum-card{background:var(--surface2);border:1px solid var(--border);border-radius:.75rem;padding:1.1rem}
    .sum-card .s-label{font-size:.58rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);margin-bottom:.35rem}
    .sum-card .s-value{font-family:'Playfair Display',serif;font-size:1rem;font-weight:600;color:var(--text)}
    @media(max-width:700px){.summary-grid{grid-template-columns:1fr 1fr}}

    /* HOTELS */
    .hotels-grid{display:flex;flex-direction:column;gap:1rem}
    .h-card{position:relative;display:grid;grid-template-columns:160px 1fr;border:1px solid var(--border);border-radius:.75rem;overflow:hidden;background:var(--surface2)}
    .h-featured{border-color:var(--amber);box-shadow:0 0 24px rgba(227,82,42,.12)}
    .h-badge{position:absolute;top:10px;right:10px;z-index:2;background:var(--amber);color:#000;font-size:.56rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:.3rem .65rem;border-radius:2rem}
    .h-details{list-style:none;font-size:.75rem;color:var(--muted);margin-top:.6rem;display:flex;flex-direction:column;gap:.25rem}
    .h-details strong{color:var(--text);font-weight:600}
    .h-price{margin-top:.875rem;padding-top:.75rem;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:.15rem}
    .h-price-label{font-size:.58rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
    .h-price-value{font-family:'Playfair Display',serif;font-size:1.35rem;font-weight:700;color:var(--amber)}
    .h-img{height:160px;overflow:hidden}
    .h-img img{width:100%;height:100%;object-fit:cover}
    .h-img-empty{display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--border)}
    .h-body{padding:1.25rem}
    .h-city{font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--amber);margin-bottom:.25rem}
    .h-name{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:600;margin-bottom:.375rem}
    .h-stars{color:var(--amber);font-size:.75rem;letter-spacing:.1em;margin-bottom:.5rem}
    .h-meta{font-size:.78rem;color:var(--muted);display:flex;gap:.375rem;flex-wrap:wrap;align-items:center}
    .h-desc{font-size:.8rem;color:var(--muted);margin-top:.625rem;line-height:1.6}
    @media(max-width:520px){.h-card{grid-template-columns:1fr}.h-img{height:180px}}

    /* FLIGHTS — boarding-pass cards */
    .flights-list{display:flex;flex-direction:column;gap:1rem}
    .fl-card{background:var(--surface2);border:1px solid var(--border);border-radius:.875rem;padding:1.25rem 1.5rem}
    .fl-top{display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap;margin-bottom:1.1rem}
    .fl-dir{font-size:.62rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--amber)}
    .fl-no{font-size:.7rem;color:var(--muted)}
    .fl-route{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1rem}
    .fl-airport{text-align:center}
    .fl-code{font-family:'Playfair Display',serif;font-size:1.9rem;font-weight:700;color:var(--text);line-height:1.1}
    .fl-city{font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:.15rem}
    .fl-time{font-size:.9rem;font-weight:600;margin-top:.35rem}
    .fl-date{font-size:.68rem;color:var(--muted)}
    .fl-line{position:relative;height:2px;background:var(--border);min-width:60px;align-self:center}
    .fl-plane{position:absolute;top:50%;left:50%;transform:translate(-50%,-55%);background:var(--surface2);padding:0 .4rem;color:var(--amber);font-size:.9rem}
    .fl-dur{position:absolute;top:-1.35rem;left:50%;transform:translateX(-50%);font-size:.62rem;color:var(--muted);white-space:nowrap}
    .fl-stopover{margin-top:1rem;font-size:.72rem;color:var(--muted);text-align:center}
    .fl-stopover strong{color:var(--text)}
    .fl-foot{display:flex;gap:1.25rem;flex-wrap:wrap;margin-top:1.1rem;padding-top:.875rem;border-top:1px dashed var(--border);font-size:.7rem;color:var(--muted)}
    .fl-foot strong{color:var(--text)}
    @media(max-width:480px){.fl-code{font-size:1.4rem}.fl-card{padding:1rem}}

    /* ACTIVITIES */
    .activities-list{display:flex;flex-direction:column;gap:.75rem}
    .act-card{display:flex;align-items:center;justify-content:space-between;gap:1.25rem;background:var(--surface2);border:1px solid var(--border);border-radius:.75rem;padding:1rem 1.25rem}
    .act-name{font-family:'Playfair Display',serif;font-size:1rem;font-weight:600}
    .act-desc{font-size:.78rem;color:var(--muted);margin-top:.3rem;line-height:1.6}
    .act-price{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--amber);white-space:nowrap;flex-shrink:0}
    @media(max-width:520px){.act-card{flex-direction:column;align-items:flex-start;gap:.5rem}}

    /* CONDIÇÕES */
    .cond{font-size:.8rem;color:var(--muted);line-height:1.7}
    .cond p{padding:.6rem 0;border-bottom:1px solid var(--border)}
    .cond p:last-child{border-bottom:none}
    .cond strong{color:var(--text)}

    /* INVESTIMENTO */
    .incl-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem}
    .incl-head{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.75rem}
    .incl-yes{color:#50C864}
    .incl-no{color:#E05252}
    .incl-list{list-style:none;display:flex;flex-direction:column;gap:.5rem}
    .incl-list li{font-size:.8rem;color:var(--text);padding-left:1.25rem;position:relative;line-height:1.5}
    .incl-list li::before{content:"✓";position:absolute;left:0;color:#50C864;font-weight:700}
    .excl-list li::before{content:"✗";color:#E05252}
    @media(max-width:520px){.incl-grid{grid-template-columns:1fr}}

    .price-card{background:var(--surface2);border:1px solid var(--border);border-radius:.875rem;padding:2rem;text-align:center}
    .price-total{font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:700;color:var(--amber);margin-bottom:.25rem}
    .price-pp{font-size:.8rem;color:var(--muted);margin-bottom:1.5rem}
    .cta-row{display:flex;gap:.875rem;justify-content:center;flex-wrap:wrap;margin-bottom:1.25rem}
    .cta-btn{display:inline-flex;align-items:center;justify-content:center;font-family:inherit;font-size:.78rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.875rem 2rem;border-radius:.5rem;cursor:pointer;transition:all .2s;min-width:160px}
    .cta-primary{background:var(--amber);color:#fff;border:none}
    .cta-primary:hover{background:#B8401E;transform:translateY(-2px)}
    .cta-secondary{background:none;border:2px solid var(--border);color:var(--text)}
    .cta-secondary:hover{border-color:var(--amber);color:var(--amber)}
    .payment-info{border-top:1px solid var(--border);padding-top:1.25rem;margin-top:1.25rem}
    .pay-line{font-size:.8rem;color:var(--muted);margin-bottom:.375rem}
    .parcelas{border-top:1px solid var(--border);padding-top:1.25rem;margin:1.25rem 0 .5rem;text-align:left}
    .parcelas-head{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:.875rem;text-align:center}
    .parcela-row{display:grid;grid-template-columns:2.2rem 1fr auto auto;gap:.6rem;align-items:baseline;padding:.5rem 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:.82rem}
    .parcela-row:last-child{border-bottom:none}
    .parcela-n{color:var(--amber);font-weight:700;font-size:.75rem}
    .parcela-data{color:var(--muted)}
    .parcela-obs{color:var(--muted);font-size:.72rem;font-style:italic;text-align:right}
    .parcela-valor{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
    @media(max-width:560px){.parcela-row{grid-template-columns:1.8rem 1fr auto;gap:.4rem}.parcela-obs{display:none}}

    /* ITINERARY */
    .itinerary{display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:.75rem;overflow:hidden}
    .day-item{border-bottom:1px solid var(--border)}
    .day-item:last-child{border-bottom:none}
    .day-toggle{width:100%;background:none;border:none;color:var(--text);font-family:inherit;cursor:pointer;padding:1rem 1.25rem;display:flex;align-items:center;gap:.875rem;text-align:left;transition:background .15s}
    .day-toggle:hover{background:var(--surface2)}
    .day-num{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--amber);flex-shrink:0}
    .day-date{font-size:.72rem;color:var(--muted);flex-shrink:0}
    .day-title{flex:1;font-size:.875rem;font-weight:600}
    .day-chevron{color:var(--muted);font-size:.75rem;flex-shrink:0;transition:transform .2s}
    .day-body{padding:0 1.25rem 1.25rem;background:var(--surface2)}
    .day-img{width:100%;height:180px;object-fit:cover;border-radius:.5rem;margin-bottom:.875rem}
    .day-desc{font-size:.8rem;color:var(--muted);line-height:1.7;margin-bottom:.75rem}
    .itin-controls{display:flex;gap:.5rem}
    .itin-btn{background:none;border:1px solid var(--border);color:var(--muted);font-family:inherit;font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.4rem .75rem;border-radius:.4rem;cursor:pointer;transition:all .15s}
    .itin-btn:hover{color:var(--amber);border-color:var(--amber)}
    .day-timeline{display:flex;flex-direction:column;position:relative;padding-left:.25rem}
    .day-time-item{display:flex;gap:1rem;align-items:flex-start;padding:.6rem 0;position:relative}
    .day-time-item:not(:last-child)::after{content:'';position:absolute;left:2.35rem;top:1.6rem;bottom:-.4rem;width:1px;background:var(--border)}
    .dti-time{flex-shrink:0;width:4.5rem;font-size:.72rem;font-weight:700;color:var(--amber);background:rgba(227,82,42,.1);border:1px solid rgba(227,82,42,.3);border-radius:.4rem;padding:.25rem .5rem;text-align:center}
    .dti-title{font-size:.82rem;color:var(--text);padding-top:.3rem;line-height:1.5}

    /* MOBILE STICKY CTA */
    .sticky-cta{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(13,13,13,.97);backdrop-filter:blur(8px);border-top:1px solid var(--border);padding:.875rem 1.25rem}
    .sticky-cta a{display:block;text-align:center;background:var(--amber);color:#fff;font-size:.82rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.875rem;border-radius:.5rem}
    @media(max-width:640px){.sticky-cta{display:block}}

    /* FOOTER */
    .footer{background:#000;border-top:1px solid var(--border);padding:2rem 1.5rem;text-align:center}
    .footer img{height:36px;filter:brightness(0) invert(1);opacity:.5;margin:0 auto .875rem}
    .footer p{font-size:.72rem;color:var(--muted)}

    .dot{opacity:.5}
    @media(max-width:640px){body{padding-bottom:${hasMobileCta ? '72px' : '0'}}}
  </style>
</head>
<body>

${p.expires_at ? `<div class="validity-bar">Proposta Nº ${propNum} · válida até <strong>${fmtDate(p.expires_at)}</strong> · valores sujeitos a disponibilidade</div>` : `<div class="validity-bar">Proposta Nº ${propNum} · valores sujeitos a disponibilidade</div>`}

<nav class="nav" style="top:2.2rem">
  <a href="/consultoria"><img src="/assets/logo.png" alt="Scandia Travel" class="nav-logo"></a>
</nav>

<div class="hero" ${hero ? `style="background-image:url('${esc(hero)}')"` : ''}>
  ${hero ? '' : '<div class="hero-bg" style="background:#0A1520"></div>'}
  <div class="hero-overlay"></div>
  <div class="hero-content">
    ${destChips ? `<div class="dest-chips">${destChips}</div>` : ''}
    <h1 class="hero-title">${esc(p.title)}</h1>
    <div class="hero-meta">
      ${dateRange ? `<span>📅 ${dateRange}</span>` : ''}
      ${p.travelers ? `<span>👥 ${p.travelers} ${p.travelers > 1 ? 'viajantes' : 'viajante'}</span>` : ''}
    </div>
    ${diasFaltam ? `
    <div class="countdown-badge">
      <span class="cd-ico">⏳</span>
      <span class="cd-num">${diasFaltam}</span>
      <span class="cd-text"><span class="cd-label">Faltam</span>dias para o início da viagem</span>
    </div>` : ''}
  </div>
</div>

${p.description ? `
<section class="section">
  <div class="section-inner">
    <p class="intro-text">${esc(p.description)}</p>
  </div>
</section>` : ''}

${resumoHtml(p, destinations, hotels)}
${flightsHtml(flights)}
${hotelsHtml(hotels)}
${activitiesHtml(activities)}
${itinerarioHtml(itinerary)}
${investimentoHtml(p, installments)}
${condicoesHtml(p)}

${hasMobileCta ? `
<div class="sticky-cta">
  <a href="${esc(p.cta_primary_url)}" target="_blank" rel="noopener">${esc(p.cta_primary_label || 'Quero reservar')}</a>
</div>` : ''}

<footer class="footer">
  <img src="/assets/logo.png" alt="Scandia Travel">
  <p>Proposta preparada por Scandia Travel &nbsp;·&nbsp; <a href="/consultoria" style="color:var(--amber)">SEUDOMINIO.com.br</a></p>
</footer>

<script>
  function toggleDay(i) {
    var body = document.getElementById('day-body-' + i);
    var chev = document.getElementById('chev-' + i);
    var open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    chev.style.transform = open ? '' : 'rotate(90deg)';
  }
  function expandAllDays() {
    document.querySelectorAll('.day-body').forEach(function(b){ b.style.display = 'block'; });
    document.querySelectorAll('.day-chevron').forEach(function(c){ c.style.transform = 'rotate(90deg)'; });
  }
  function collapseAllDays() {
    document.querySelectorAll('.day-body').forEach(function(b){ b.style.display = 'none'; });
    document.querySelectorAll('.day-chevron').forEach(function(c){ c.style.transform = ''; });
  }
</script>
</body>
</html>`;
}

function expiredHtml(p) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Proposta expirada · Scandia Travel</title><link rel="icon" href="/assets/logo.png"><style>body{font-family:sans-serif;background:#0A1520;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}h1{font-size:1.5rem;margin-bottom:.75rem}p{opacity:.6;font-size:.9rem}</style></head><body><div><h1>Esta proposta expirou</h1><p>O prazo de validade desta proposta foi encerrado.</p><p style="margin-top:1rem"><a href="/consultoria" style="color:#E3522A">Fale com a Scandia Travel →</a></p></div></body></html>`;
}

export async function onRequest({ params, env }) {
  const slug = params.slug;

  const proposal = await env.DB.prepare(
    `SELECT * FROM proposals WHERE slug=? AND status='published'`
  ).bind(slug).first();

  if (!proposal) {
    return new Response('<html><body>Proposta não encontrada.</body></html>', {
      status: 404,
      headers: { 'content-type': 'text/html;charset=utf-8' }
    });
  }

  if (proposal.expires_at && new Date(proposal.expires_at + 'T23:59:59') < new Date()) {
    return new Response(expiredHtml(proposal), {
      headers: { 'content-type': 'text/html;charset=utf-8' }
    });
  }

  // Fire-and-forget view count
  env.DB.prepare('UPDATE proposals SET views=views+1,updated_at=updated_at WHERE id=?').bind(proposal.id).run().catch(() => {});

  const destinations = safeJson(proposal.destinations, []);
  const hotels = safeJson(proposal.hotels, []);
  const flights = safeJson(proposal.flights, []);
  const activities = safeJson(proposal.activities, []);
  const coverImages = safeJson(proposal.cover_images, []);
  const itinerary = safeJson(proposal.itinerary, []);
  const installments = safeJson(proposal.installments, []);

  return new Response(renderPage(proposal, { destinations, hotels, flights, activities, coverImages, itinerary, installments }), {
    headers: { 'content-type': 'text/html;charset=utf-8' }
  });
}
