# Tovi — PDP with Adventure Cards upsell

Static replica of the Tovi product page (heytovi.com/products/tovi) used to prototype a
"50 Adventure Cards" upsell.

- `index.html` — the whole page (HTML, CSS and JS inline)
- `img/` — product, feature, review and card images

Three upsell designs (A: checkbox, B: special offer, C: card strip) can be switched with the
pill at the bottom of the page or with `?upsell=a|b|c`. "Learn more" opens the cards popup.
The cart is a demo only (count + toast), not connected to Shopify.

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
