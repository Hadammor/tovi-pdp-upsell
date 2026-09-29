# Tovi — PDP with Discovery Cards upsell

Static replica of the Tovi product page (heytovi.com/products/tovi) used to prototype a
"50 Discovery Cards" upsell.

- `index.html` — the whole page (HTML, CSS and JS inline)
- `img/` — product, feature, review and card images
- `img/cards/discovery/` — illustrated card faces used in the card fan
- `img/cards/real/` — Tovi's real cards, used in the Learn more popup

Three upsell flows (switch with the pill at the bottom of the page or `?upsell=a|b|c`):

- **A** — checkbox block on the product page; ticking it bundles the cards with the main Add to cart.
- **B** — no block on the page; after Add to cart, a drawer confirms Tovi was added and offers the cards (add, or skip to the cart).
- **C** — no block on the page; after Add to cart, the cart page shows the same checkbox offer.

All flows end on a cart page that copies heytovi.com/cart (open it any time from the cart icon, or `#cart`).
"Learn more" opens the cards popup. The cart is a demo only (saved in the browser), not connected to Shopify.

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
