# Tovi replica — promotions (branch `promotions`)

Homepage + product page replica of heytovi.com, with the Discovery Cards upsell and a simple promotions system
(adapted from the Lumo replica).

- `index.html` — homepage, mirrored from heytovi.com (`tools/mirror.py`; local assets in `assets/media|theme|fonts`, videos stay on Tovi's CDN)
- `products/tovi/index.html` — the hand-built product page (upsell flows A/B/C, Learn more popup, cart)
- `assets/site/tovi-home.js` — homepage "Add to cart" → our cart (the mirrored buttons post to Shopify otherwise)
- `img/` — product page images

## Promotions (`assets/promo/`)
Three themes: **Sale** (default, generic — reword it for any other holiday/promotion), **Christmas** (snow), **Cyber Monday** (digital rain).
- `promo-themes.js` — per theme: colors, icon, effect, countdown end (`MM-DD` or `week`), code, strip messages, badge, callout, hero label.
  ⚠️ Discount codes (TOVI10, TOVIJOY, TOVICYBER15), the Christmas "order by Dec 14" date and the Cyber Monday end date are placeholders.
- `promo.js` — strip (3 rotating messages, countdown, tap-to-copy code), effect (homepage hero / inside the product image),
  round badge (product image + homepage "Get Tovi Today" blocks), product-page price callout, homepage hero label, button glow.
  All settings are fixed; a floating tab at the bottom switches themes (remembered across pages).
- URL: `?promo=sale|christmas|cybermonday|off`, `&controls=0` hides the floating tab. `?upsell=a|b|c` still picks the upsell flow.
- `tools/inject_promo.py` wires the module into both pages.

## Run & QA
    python3 -m http.server 8090        # from the repo root → http://127.0.0.1:8090
    cd tools && npm install && npx playwright install chrome
    node promo-qa.js                   # every theme × home/pdp × 390/768/1024/1440/1920: layout checks + screenshots in tools/qa-out/
    node promo-switch.js               # floating tab: switching, memory across pages, URL params

## Netlify
`netlify.toml` publishes the repo root with no build. Connect this repo and set the production branch to `promotions`.
