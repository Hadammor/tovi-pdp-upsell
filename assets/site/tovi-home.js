/* Homepage glue for the static replica (not part of the promotions).
 * The mirrored "Add to cart" buttons post to Shopify's /cart/add, which doesn't exist here.
 * Instead, add Tovi to the replica's own cart (shared with the product page) and open it. */
(function () {
  const CART_KEY = 'tovi-cart-v2';
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-button');
    if (!btn) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const form = btn.closest('form');
    const qty = Math.max(1, Math.min(10, parseInt(form?.querySelector('input[name="quantity"]')?.value || '1', 10) || 1));
    let c = { tovi: 0, cards: false };
    try { c = Object.assign(c, JSON.parse(localStorage.getItem(CART_KEY) || '{}')); } catch {}
    c.tovi = Math.min(10, (c.tovi || 0) + qty);
    try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch {}
    location.href = './products/tovi/index.html#cart';
  }, true);
})();
