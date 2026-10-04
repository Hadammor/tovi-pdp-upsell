/* Tovi promotions — three themes (adapted from the Lumo promo module).
 * Every theme keeps the Tovi brand base (Nunito, rounded 20px+ shapes, Tovi yellow #ffb700, charcoal #353535)
 * and layers its own accent, icon, copy and effect on top.
 * Strings may use {code} (tap-to-copy chip) and {price}.
 * "sale" is the generic theme: reword it for any other holiday or promotion (Black Friday, New Year, Back to School…).
 * Countdown: `ends` = 'MM-DD' (end of that day, next occurrence) or 'week' (rolls to the end of the current week).
 *
 * ⚠️ PLACEHOLDERS — confirm with Tovi before going live:
 *   - discount codes: TOVI10, TOVIJOY, TOVICYBER15 (not set up in Shopify)
 *   - Christmas "order by Dec 14" date (based on 4–7 business-day standard shipping)
 *   - Cyber Monday end date (11-30 = Cyber Monday 2026)
 */
window.TOVI_PROMO_THEMES = {
  sale: {
    name: 'Sale', icon: 'tag', effect: 'sparkles', ends: 'week',
    colors: { stripBg: '#353535', stripText: '#fff', accent: '#ffb700', accent2: '#ffd666' },
    code: 'TOVI10',
    messages: ['Launch sale — Tovi for {price}, was $149', 'Extra $10 off with {code}', 'Free 30-day returns · No subscription'],
    badge: ['Sale', '$99', 'was $149'],
    callout: 'Launch sale — take an extra $10 off with {code}',
    heroPill: 'Launch Sale · Tovi for $99',
  },
  christmas: {
    name: 'Christmas', icon: 'gift', effect: 'snow', ends: '12-25',
    colors: { stripBg: 'linear-gradient(90deg,#173f2b 0%,#21583c 50%,#173f2b 100%)', stripText: '#fff', accent: '#ff5a5f', accent2: '#ffb700' },
    code: 'TOVIJOY',
    messages: ['The gift that answers every “why?”', 'Order by Dec 14 to have it for Christmas', 'Holiday deal: $10 off with {code}'],
    badge: ['Holiday', '$99', 'gift pick'],
    callout: 'Holiday gift deal — extra $10 off with {code}',
    heroPill: 'The Holiday Gift · Screen-free fun all winter',
  },
  cybermonday: {
    name: 'Cyber Monday', icon: 'bolt', effect: 'pixels', ends: '11-30',
    colors: { stripBg: 'linear-gradient(90deg,#1d3686 0%,#2f5bd3 55%,#1aa6d9 100%)', stripText: '#fff', accent: '#5ee7ff', accent2: '#ffb700' },
    code: 'TOVICYBER15',
    messages: ['Cyber Monday is live — Tovi for {price}', 'Online only: 15% off with {code}', 'Deal ends at midnight'],
    badge: ['Cyber', '−15%', 'online only'],
    callout: 'Cyber Monday — 15% off with {code}, online only',
    heroPill: 'Cyber Monday · 15% off online',
  },
};
