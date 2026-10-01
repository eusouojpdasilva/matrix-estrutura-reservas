// Visual controls only. Authentication and API contracts stay in index.html.
(() => {
  const gate = document.querySelector('#auth-gate');
  const slides = [...document.querySelectorAll('.login-landscapes img')];
  const dots = [...document.querySelectorAll('.slide-dot')];
  const toggle = document.querySelector('#slideshow-toggle');
  const credit = document.querySelector('#photo-credit');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let paused = reducedMotion.matches;
  let timer;
  function show(index) {
    const slide = slides[index];
    if (!slide.complete || !slide.naturalWidth) return;
    current = index;
    slides.forEach((image, i) => image.classList.toggle('active', i === index));
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
    credit.textContent = `${slide.dataset.author} / Unsplash`;
    credit.href = slide.dataset.credit;
  }
  function schedule() {
    clearInterval(timer);
    toggle.textContent = paused ? 'Reproduzir' : 'Pausar';
    toggle.setAttribute('aria-label', paused ? 'Reproduzir paisagens' : 'Pausar paisagens');
    if (!paused && !document.hidden && !gate.classList.contains('hidden')) {
      timer = setInterval(() => {
        for (let step = 1; step < slides.length; step++) {
          const next = (current + step) % slides.length;
          if (slides[next].complete && slides[next].naturalWidth) { show(next); break; }
        }
      }, 3000);
    }
  }
  toggle.addEventListener('click', () => { paused = !paused; schedule(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); schedule(); }));
  slides.forEach((slide, i) => slide.addEventListener('load', () => {
    if (!slides[current].naturalWidth) show(i);
  }));
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; schedule(); });
  document.addEventListener('visibilitychange', schedule);
  new MutationObserver(schedule).observe(gate, { attributes:true, attributeFilter:['class'] });
  schedule();
  const links = [...document.querySelectorAll('.dashboard-nav a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  const observer = new IntersectionObserver(entries => {
    const entry = entries.find(item => item.isIntersecting);
    if (!entry) return;
    links.forEach(link => {
      const active = link.hash === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin:'-15% 0px -65% 0px', threshold:0 });
  sections.forEach(section => observer.observe(section));
})();
