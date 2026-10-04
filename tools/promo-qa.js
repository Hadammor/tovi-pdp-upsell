// QA for the Tovi promo module (adapted from the Lumo replica): layout checks across widths + screenshots.
// Run from tools/:  node promo-qa.js [themes] [widths] [noshots]   (needs a server on :8090 — see README)
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://127.0.0.1:8090';
const OUT = __dirname + '/qa-out/promo'; fs.mkdirSync(OUT, { recursive: true });
const THEMES = (process.argv[2] || 'sale,christmas,cybermonday').split(',');
const WIDTHS = (process.argv[3] || '390,768,1024,1440,1920').split(',').map(Number);
const SHOTS = process.argv[4] !== 'noshots';
// the mirrored theme's search drawer asks Shopify for a section on load; a static copy can't answer (also with ?promo=off)
const IGNORE = /No empty section markup/;
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const problems = [];
  for (const theme of THEMES) for (const w of WIDTHS) for (const [pname, path] of [['home', '/'], ['pdp', '/products/tovi/index.html']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, isMobile: w < 768, hasTouch: w < 768 });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => !IGNORE.test(e.message) && errs.push(e.message.slice(0, 120)));
    await p.goto(`${BASE}${path}?promo=${theme}`, { waitUntil: 'load' }); await p.waitForTimeout(1600);
    const r = await p.evaluate(() => {
      const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height, r: r.right, b: r.bottom + scrollY }; };
      const strip = document.querySelector('.lp-strip');
      const badges = [...document.querySelectorAll('.lp-badge')].map(bd => {
        const host = bd.classList.contains('lp-badge--pdp') ? bd.parentElement : bd.parentElement.querySelector('img');
        const H = rect(host), B = rect(bd);
        return { kind: bd.className.split(' ')[1], b: B, host: H, insetTop: Math.round(B.y - H.y), insetRight: Math.round(H.r - B.r) };
      });
      const msgs = [...document.querySelectorAll('.lp-msg')].map(m => ({ over: m.scrollWidth > m.clientWidth + 1, text: m.textContent.trim().slice(0, 60) }));
      const pill = document.querySelector('.lp-countdown--pill');
      const pillBox = pill && getComputedStyle(pill).display !== 'none' && rect(pill);
      const rot = document.querySelector('.lp-rotator'); const rotBox = rot && rect(rot);
      return { overflow: document.documentElement.scrollWidth > innerWidth, sw: document.documentElement.scrollWidth, strip: strip && rect(strip),
        pillOverlap: !!(pillBox && rotBox && [...document.querySelectorAll('.lp-msg.is-active .lp-msg__text')].some(t => { const tr = t.getBoundingClientRect(); return tr.right > pillBox.x && tr.left < pillBox.r; })),
        badges, msgs, callout: !!document.querySelector('.lp-callout'), heroPill: !!document.querySelector('.lp-hero-pill'), canvas: !!document.querySelector('.lp-fx'),
        switcher: (() => { const n = document.querySelector('.lps'); if (!n) return null; const r = n.getBoundingClientRect(); return { l: r.left, r: r.right }; })() };
    });
    const tag = `${theme}/${pname}/${w}`;
    if (r.overflow) problems.push(`${tag}: horizontal overflow (scrollWidth ${r.sw})`);
    if (!r.strip) problems.push(`${tag}: no strip`);
    for (const m of r.msgs) if (m.over) problems.push(`${tag}: strip message truncated "${m.text}"`);
    if (r.pillOverlap) problems.push(`${tag}: countdown pill overlaps the message`);
    const expectInset = w < 750 ? 18 : w < 990 ? 26 : 32;
    for (const bd of r.badges) {
      const { b: B, host: H } = bd;
      if (B.x < H.x - 1 || B.r > H.r + 1 || B.y < H.y - 1 || B.b > H.b + 1) problems.push(`${tag}: ${bd.kind} outside image (${Math.round(B.x)},${Math.round(B.y)} ${Math.round(B.w)} vs host ${Math.round(H.x)},${Math.round(H.y)} ${Math.round(H.w)}x${Math.round(H.h)})`);
      if (Math.abs(bd.insetTop - expectInset) > 1 || Math.abs(bd.insetRight - expectInset) > 1) problems.push(`${tag}: ${bd.kind} inset ${bd.insetTop}/${bd.insetRight}, expected ${expectInset}`);
      if (B.w > H.w * 0.35) problems.push(`${tag}: ${bd.kind} too big relative to image (${Math.round(B.w)} / ${Math.round(H.w)})`);
    }
    if (pname === 'pdp' && r.badges.filter(x => x.kind === 'lp-badge--pdp').length !== 1) problems.push(`${tag}: expected 1 PDP badge`);
    if (pname === 'home' && r.badges.filter(x => x.kind === 'lp-badge--feature').length !== 2) problems.push(`${tag}: expected 2 homepage product badges, got ${r.badges.length}`);
    if (pname === 'pdp' && !r.callout) problems.push(`${tag}: no callout`);
    if (pname === 'home' && !r.heroPill) problems.push(`${tag}: no hero label`);
    if (!r.canvas) problems.push(`${tag}: no effect canvas`);
    if (!r.switcher) problems.push(`${tag}: no switcher`); else if (r.switcher.l < 0 || r.switcher.r > w) problems.push(`${tag}: switcher off-screen`);
    errs.forEach(e => problems.push(`${tag}: JS ${e}`));
    if (SHOTS) {
      await p.screenshot({ path: `${OUT}/${theme}-${pname}-${w}.png` });
      if (pname === 'home') { // first "Get Tovi Today" product block, with its badge
        await p.evaluate(() => { const s = document.querySelector('main .featured-product-section'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 40); });
        await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/${theme}-feature-${w}.png` });
      }
    }
    await ctx.close();
  }
  console.log(problems.length ? problems.join('\n') : 'NO PROBLEMS');
  await b.close();
})();
