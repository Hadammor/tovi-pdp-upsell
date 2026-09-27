# Tovi — PDP with Discovery Cards upsell

Static replica of the Tovi product page (heytovi.com/products/tovi) used to prototype a
"50 Discovery Cards" upsell.

- `index.html` — the whole page (HTML, CSS and JS inline)
- `img/` — product, feature, review and card images
- `img/cards/discovery/` — simple one-picture card faces used in the upsell and popup

Two upsell designs (A: checkbox that bundles with the main Add to cart, B: its own
"+ Add to order" button) can be switched with the pill at the bottom of the page or with
`?upsell=a|b`. "Learn more" opens the cards popup, which can add the cards directly.
The cart is a demo only (count + toast), not connected to Shopify.

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
