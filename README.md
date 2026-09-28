# Tovi — PDP with Discovery Cards upsell

Static replica of the Tovi product page (heytovi.com/products/tovi) used to prototype a
"50 Discovery Cards" upsell.

- `index.html` — the whole page (HTML, CSS and JS inline)
- `img/` — product, feature, review and card images
- `img/cards/discovery/` — illustrated card faces used in the A/B card fan
- `img/cards/simple/` — subject cards used in Option C's strip
- `img/cards/real/` — Tovi's real cards, used in the Learn more popup

Three upsell designs (A: checkbox that bundles with the main Add to cart, B: its own
"+ Add to order" button, C: slowly drifting strip of cards with "Add for $10") can be
switched with the pill at the bottom of the page or with `?upsell=a|b|c`. "Learn more" opens the cards popup, which can add the cards directly.
The cart is a demo only (count + toast), not connected to Shopify.

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
