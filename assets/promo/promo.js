/* Tovi promotions — engine + floating theme switcher (adapted from the Lumo promo module).
 * Renders: top strip (rotating text, countdown, copy-code chip), effects canvas, round product badges,
 * PDP price callout, homepage hero label, CTA glow. A floating tab switches between the three themes.
 * Works on both pages: the mirrored homepage (Shopify Horizon markup) and the hand-built product page.
 * Settings are fixed on purpose (no panel). ?promo=<sale|christmas|cybermonday|off> picks a theme (shareable),
 * ?controls=0 hides the floating tab for a clean presentation.
 */
(function () {
  const THEMES = window.TOVI_PROMO_THEMES;
  const ORDER = Object.keys(THEMES);
  const KEY = 'toviPromo:v1';
  const PRICE = '$99';
  // fixed behaviour — decided for the client, not configurable
  const ROTATE_MS = 3800;      // strip message rotation
  const FX_AMOUNT = 1;         // particle density (1 = default)
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMQ = matchMedia('(max-width: 749px)');
  // which page are we on: the product page has our gallery; the homepage has the Horizon hero
  const pdpImage = () => document.querySelector('.gallery-main');
  const homeFeatureImages = () => [...document.querySelectorAll('main .featured-product-section .media-block')];

  const ICONS = {
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  };
  const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- state: just the active theme ----------
  const params = new URLSearchParams(location.search);
  let active = (() => {
    const q = params.get('promo');
    if (q === 'off') return null;
    if (q && THEMES[q]) return q;
    try { const s = localStorage.getItem(KEY); if (s && THEMES[s]) return s; } catch {}
    return ORDER[0];
  })();
  const remember = () => { try { localStorage.setItem(KEY, active || ''); } catch {} };

  // ---------- countdown target ----------
  function endsAt(t, now = new Date()) {
    if (t.ends === 'week') { // next Sunday, end of day
      const d = new Date(now); d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); d.setHours(23, 59, 59, 999); return d;
    }
    const [m, day] = t.ends.split('-').map(Number);
    const d = new Date(now.getFullYear(), m - 1, day, 23, 59, 59, 999);
    if (d < now) d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  // ---------- render helpers ----------
  const fill = (str, t) => esc(str)
    .replace(/\{code\}/g, `<button type="button" class="lp-code" data-code="${esc(t.code)}" aria-label="Copy code ${esc(t.code)}">${esc(t.code)}</button>`)
    .replace(/\{price\}/g, `<b>${PRICE}</b>`);

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.lp-code');
    if (!chip) return;
    e.preventDefault();
    const code = chip.dataset.code;
    navigator.clipboard?.writeText(code).catch(() => {});
    chip.classList.add('is-copied'); chip.textContent = 'Copied!';
    setTimeout(() => { chip.classList.remove('is-copied'); chip.textContent = code; }, 1400);
  });

  let cleanup = [];
  const onCleanup = (fn) => cleanup.push(fn);

  function applyVars(t) {
    const r = document.documentElement.style, c = t.colors;
    const vars = { '--lp-strip-bg': c.stripBg, '--lp-strip-text': c.stripText, '--lp-accent': c.accent, '--lp-accent2': c.accent2 };
    Object.entries(vars).forEach(([k, v]) => r.setProperty(k, v));
    onCleanup(() => Object.keys(vars).forEach((k) => r.removeProperty(k)));
  }

  // ---------- strip ----------
  function renderStrip(t) {
    const strip = document.createElement('div');
    strip.id = 'tovi-promo-strip';
    strip.className = 'lp-strip';
    strip.setAttribute('role', 'region');
    strip.setAttribute('aria-label', `${t.name} promotion`);
    const end = endsAt(t);
    strip.innerHTML = `
      <div class="lp-strip__inner">
        <div class="lp-rotator" aria-live="polite"></div>
        <span class="lp-countdown lp-countdown--pill"><span class="lp-countdown__label">Ends in</span> <span class="lp-countdown__time"></span></span>
      </div>`;
    const anchor = document.getElementById('header-group') || document.querySelector('body > header') || document.body.firstChild;
    anchor.parentNode.insertBefore(strip, anchor);
    onCleanup(() => strip.remove());

    const rot = strip.querySelector('.lp-rotator');
    const tick = () => {
      let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s %= 86400;
      const pad = (n) => String(n).padStart(2, '0');
      const txt = `${d ? d + 'd ' : ''}${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
      strip.querySelectorAll('.lp-countdown__time').forEach((el) => (el.textContent = txt));
    };
    const build = () => {
      const ic = `<span class="lp-strip__icon">${icon(t.icon)}</span>`;
      const msgs = t.messages.map((m) => ic + `<span class="lp-msg__text">${fill(m, t)}</span>`);
      // on mobile the countdown joins the rotation instead of sitting on the right
      if (mobileMQ.matches) msgs.push(ic + '<span class="lp-countdown"><span class="lp-countdown__label">Ends in</span> <span class="lp-countdown__time"></span></span>');
      rot.innerHTML = msgs.map((m, i) => `<div class="lp-msg${i === 0 ? ' is-active' : ''}">${m}</div>`).join('');
      tick();
    };
    build();
    const ct = setInterval(tick, 1000); onCleanup(() => clearInterval(ct));
    mobileMQ.addEventListener('change', build); onCleanup(() => mobileMQ.removeEventListener('change', build));

    let paused = false;
    strip.addEventListener('mouseenter', () => (paused = true));
    strip.addEventListener('mouseleave', () => (paused = false));
    strip.addEventListener('focusin', () => (paused = true));
    strip.addEventListener('focusout', () => (paused = false));
    const rt = setInterval(() => {
      const items = [...rot.children];
      if (paused || items.length < 2 || document.hidden) return;
      const i = items.findIndex((x) => x.classList.contains('is-active'));
      items[i].classList.remove('is-active'); items[i].classList.add('is-leaving');
      setTimeout(() => items[i].classList.remove('is-leaving'), 600);
      items[(i + 1) % items.length].classList.add('is-active');
    }, ROTATE_MS);
    onCleanup(() => clearInterval(rt));
  }

  // ---------- badges ----------
  function badgeEl(t, variant) {
    const b = document.createElement('div');
    b.className = `lp-badge lp-badge--${variant}`;
    b.setAttribute('aria-label', t.badge.join(' '));
    b.innerHTML = `<span class="lp-badge__inner"><span class="lp-badge__top">${esc(t.badge[0])}</span><span class="lp-badge__main">${esc(t.badge[1])}</span><span class="lp-badge__bottom">${esc(t.badge[2] || '')}</span></span>`;
    return b;
  }
  function renderBadges(t) {
    // product page: top-right corner of the main product image (the gallery is positioned and clips)
    const g = pdpImage();
    if (g) { const b = badgeEl(t, 'pdp'); g.appendChild(b); onCleanup(() => b.remove()); }
    // homepage: the "Get Tovi Today" product blocks — the image box is positioned and clips to the image
    homeFeatureImages().forEach((box) => { const b = badgeEl(t, 'feature'); box.appendChild(b); onCleanup(() => b.remove()); });
  }

  // ---------- PDP price callout ----------
  function renderCallout(t) {
    // product page only: on its own line under the title + price row
    const row = pdpImage() && document.querySelector('main .info .title-row');
    if (!row) return;
    const el = document.createElement('div');
    el.className = 'lp-callout';
    el.innerHTML = `${icon(t.icon, 'lp-callout__icon')}<span>${fill(t.callout, t)}</span>`;
    row.insertAdjacentElement('afterend', el);
    onCleanup(() => el.remove());
  }

  // ---------- homepage hero label ----------
  function renderHeroPill(t) {
    const hero = document.querySelector('main [id*="__hero_"]');
    // the hero headline is a text block (<p> with <strong>), not an h1
    const block = hero && (hero.querySelector('h1, h2')?.closest('.text-block') || hero.querySelector('.text-block'));
    if (!block) return;
    const el = document.createElement('div');
    el.className = 'lp-hero-pill';
    el.innerHTML = `${icon(t.icon)}<span>${esc(t.heroPill)}</span>`;
    block.parentNode.insertBefore(el, block);
    onCleanup(() => el.remove());
  }

  // ---------- effects ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const FX = {
    snow: { base: 90, make: (W, H, init) => ({ x: rand(0, W), y: init ? rand(-H, H) : rand(-40, -5), r: rand(1.2, 3.6), vy: rand(0.35, 1.1), vx: rand(-0.25, 0.25), ph: rand(0, 6.3) }),
      step: (p, t) => { p.y += p.vy; p.x += p.vx + Math.sin(t / 1100 + p.ph) * 0.35; },
      draw: (g, p) => { g.globalAlpha = 0.9; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(53,53,53,.28)'; g.lineWidth = 1; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill(); g.stroke(); } },
    sparkles: { base: 40, make: (W, H, init, c) => ({ x: rand(0, W), y: rand(0, H), s: rand(3, 8), ph: rand(0, 6.3), sp: rand(0.6, 1.6), life: 0, max: rand(180, 420), col: pick([c.accent, c.accent, c.accent2, '#ffffff']) }),
      step: (p) => { p.life++; },
      out: (p) => p.life > p.max,
      draw: (g, p, t) => { const a = Math.sin((p.life / p.max) * Math.PI) * (0.55 + 0.45 * Math.sin(t / 300 * p.sp + p.ph)); const s = p.s; g.globalAlpha = Math.max(0, a); g.fillStyle = p.col; g.beginPath();
        g.moveTo(p.x, p.y - s); g.quadraticCurveTo(p.x, p.y, p.x + s, p.y); g.quadraticCurveTo(p.x, p.y, p.x, p.y + s); g.quadraticCurveTo(p.x, p.y, p.x - s, p.y); g.quadraticCurveTo(p.x, p.y, p.x, p.y - s); g.fill(); } },
    pixels: { base: 60, make: (W, H, init, c) => ({ x: Math.round(rand(0, W) / 14) * 14, y: init ? rand(-H, H) : rand(-60, -5), s: pick([3, 4, 5]), vy: rand(1.2, 3), col: pick([c.accent, c.accent, c.accent2, '#2f5bd3']) }),
      step: (p) => { p.y += p.vy; },
      draw: (g, p) => { g.fillStyle = p.col; for (let i = 0; i < 4; i++) { g.globalAlpha = 0.7 - i * 0.17; g.fillRect(p.x, p.y - i * p.s * 2.2, p.s, p.s); } } },
  };

  function runEffects(t) {
    const def = FX[t.effect];
    if (reducedMotion || !def) return;
    // homepage: whole viewport, fading out as you scroll past the hero; PDP: inside the product image only
    const box = pdpImage();
    const cv = document.createElement('canvas');
    cv.className = box ? 'lp-fx lp-fx--contained' : 'lp-fx';
    cv.setAttribute('aria-hidden', 'true');
    (box || document.body).appendChild(cv);
    const g = cv.getContext('2d');
    let W, H;
    const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 2); W = box ? box.clientWidth : innerWidth; H = box ? box.clientHeight : innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const n = Math.max(3, Math.round(def.base * FX_AMOUNT * (mobileMQ.matches ? 0.5 : 1) * (box ? 0.45 : 1)));
    const parts = Array.from({ length: n }, () => def.make(W, H, true, t.colors));
    let raf;
    const frame = (time) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const fade = box ? 1 : Math.max(0, 1 - scrollY / (H * 0.9));
      cv.style.opacity = fade;
      if (fade === 0) return;
      g.clearRect(0, 0, W, H);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        def.step(p, time);
        if (def.out ? def.out(p) : p.y > H + 30) parts[i] = def.make(W, H, false, t.colors);
        def.draw(g, parts[i], time);
      }
      g.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);
    addEventListener('resize', resize);
    onCleanup(() => { cancelAnimationFrame(raf); removeEventListener('resize', resize); cv.remove(); });
  }

  // ---------- apply ----------
  function apply() {
    cleanup.forEach((fn) => { try { fn(); } catch {} });
    cleanup = [];
    const html = document.documentElement;
    [...html.classList].filter((c) => c.startsWith('lp-')).forEach((c) => html.classList.remove(c));
    if (active) {
      const t = { id: active, ...THEMES[active] };
      html.classList.add('lp-on', 'lp-glow', 'lp-theme-' + active);
      applyVars(t);
      renderStrip(t);
      runEffects(t);
      renderBadges(t);
      renderCallout(t);
      renderHeroPill(t);
    }
    switcher.sync();
  }

  // ---------- floating switcher: three buttons, nothing else ----------
  const switcher = (() => {
    if (params.get('controls') === '0') return { sync() {} };
    const nav = document.createElement('nav');
    nav.className = 'lps';
    nav.setAttribute('aria-label', 'Promotion theme');
    nav.innerHTML = ORDER.map((id) => {
      const t = THEMES[id];
      return `<button type="button" class="lps-btn" data-theme="${id}" style="--ac:${t.colors.accent}">${icon(t.icon)}<span>${esc(t.name)}</span></button>`;
    }).join('');
    document.body.appendChild(nav);
    document.documentElement.classList.add('lps-shown');   // the upsell-flow pill sits in the same spot
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('[data-theme]');
      if (!b || b.dataset.theme === active) return;
      active = b.dataset.theme; remember(); apply();
    });
    return { sync() { nav.querySelectorAll('[data-theme]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.theme === active)); } };
  })();

  // theme JS may re-render the product section (morph) — re-attach promo pieces if they disappear
  let pending;
  new MutationObserver(() => {
    if (!active) return;
    clearTimeout(pending);
    pending = setTimeout(() => {
      const missingBadge = (pdpImage() && !document.querySelector('.lp-badge--pdp')) || (homeFeatureImages().length && !document.querySelector('.lp-badge--feature'));
      const missingCallout = pdpImage() && !document.querySelector('.lp-callout');
      const missingFx = !reducedMotion && FX[THEMES[active].effect] && !document.querySelector('.lp-fx');
      if (missingBadge || missingCallout || missingFx) apply();
    }, 300);
  }).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  window.ToviPromo = { apply, set: (id) => { active = THEMES[id] ? id : null; remember(); apply(); } };
})();
