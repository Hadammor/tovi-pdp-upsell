"""Post-mirror fixes for the static homepage (idempotent): local product links, live store links for
pages we don't replicate, and the cart glue script."""
import os, re
PATH = os.path.join(os.path.dirname(__file__), '..', 'index.html')

def run():
    doc = open(PATH).read()
    # product links (incl. ones with a stray newline, and the bundle product) -> our product page
    doc = re.sub(r'href="\s*/products/tovi(?:-with-cards)?(?:/)?(?=[?"#])', 'href="./products/tovi/index.html', doc)
    # pages that aren't part of the replica -> the live store
    doc = re.sub(r'href="(/(?:pages|policies)/[^"]+)"', r'href="https://heytovi.com\1"', doc)
    # import-map polyfill is served by Shopify only (modern browsers support import maps natively)
    doc = re.sub(r'<script[^>]*es-modules-shim[^>]*></script>\s*', '', doc)
    if 'assets/site/tovi-home.js' not in doc:
        doc = doc.replace('</body>', '  <script src="./assets/site/tovi-home.js"></script>\n</body>', 1)
    open(PATH, 'w').write(doc)

if __name__ == '__main__':
    run()
