"""Inject the promo module (assets/promo) into the homepage and the product page. Idempotent."""
import os
SITE = os.path.join(os.path.dirname(__file__), '..')

def inject(rel_file):
    path = os.path.join(SITE, rel_file)
    up = '../' * rel_file.count('/') or './'
    doc = open(path).read()
    if 'assets/promo/promo.js' in doc: return
    doc = doc.replace('</head>', f'  <link rel="stylesheet" href="{up}assets/promo/promo.css">\n</head>', 1)
    doc = doc.replace('</body>', f'  <script src="{up}assets/promo/promo-themes.js"></script>\n  <script src="{up}assets/promo/promo.js"></script>\n</body>', 1)
    open(path, 'w').write(doc)

if __name__ == '__main__':
    inject('index.html'); inject('products/tovi/index.html')
