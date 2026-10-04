// Floating switcher test (adapted from the Lumo replica): default theme, each tab, persistence across pages,
// ?promo / ?controls params, no errors.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8090';
const IGNORE = /No empty section markup/;
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [w, mobile] of [[1440, false], [390, true]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => !IGNORE.test(e.message) && errs.push(e.message));
    const state = () => p.evaluate(() => {
      const nav = document.querySelector('.lps'); const r = nav?.getBoundingClientRect();
      return { theme: [...document.documentElement.classList].find(c => c.startsWith('lp-theme-'))?.slice(9) || 'none',
        pressed: document.querySelector('.lps-btn[aria-pressed="true"]')?.textContent.trim(),
        nav: r ? `${Math.round(r.left)}..${Math.round(r.right)} of ${innerWidth}` : 'hidden',
        strip: !!document.querySelector('.lp-strip'), badge: document.querySelectorAll('.lp-badge').length, fx: !!document.querySelector('.lp-fx'),
        overflow: document.documentElement.scrollWidth > innerWidth };
    });
    const log = async l => console.log(`${w}`.padEnd(5), l.padEnd(30), JSON.stringify(await state()));
    await p.goto(`${BASE}/`, { waitUntil: 'load' }); await p.waitForTimeout(1000); await log('home default');
    for (const id of ['christmas', 'cybermonday', 'sale']) { await p.click(`.lps-btn[data-theme="${id}"]`); await p.waitForTimeout(300); await log(`tap ${id}`); }
    await p.click('.lps-btn[data-theme="christmas"]');
    await p.goto(`${BASE}/products/tovi/index.html`, { waitUntil: 'load' }); await p.waitForTimeout(1000); await log('pdp remembers christmas');
    await p.click('.lps-btn[data-theme="cybermonday"]'); await p.waitForTimeout(300);
    await p.goto(`${BASE}/`, { waitUntil: 'load' }); await p.waitForTimeout(1000); await log('home remembers cybermonday');
    await p.goto(`${BASE}/?promo=sale&controls=0`, { waitUntil: 'load' }); await p.waitForTimeout(800); await log('?promo=sale&controls=0');
    await p.goto(`${BASE}/products/tovi/index.html?promo=off`, { waitUntil: 'load' }); await p.waitForTimeout(800); await log('pdp ?promo=off');
    console.log('errors:', errs.length ? errs : 'none');
    await ctx.close();
  }
  await b.close();
})();
