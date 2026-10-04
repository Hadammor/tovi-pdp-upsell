"""Mirror the heytovi.com homepage into the repo root with local assets (adapted from the Lumo replica).
The product page (products/tovi/index.html) is our own hand-built replica, so only the homepage is mirrored.
Videos stay on Tovi's CDN to keep the repo small."""
import re, os, hashlib, html, urllib.request, concurrent.futures as cf
from urllib.parse import urlparse, urljoin

ROOT = os.path.join(os.path.dirname(__file__), '..')
ORIGIN = 'https://heytovi.com'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36'
PAGES = {'/': 'index.html'}

DROP_SCRIPT = re.compile(r'klaviyo|trekkie|wpmLoader|ShopifyAnalytics|perf-kit|shop-js|preloads\.js|shopify_pay|'
                         r'origin_trials|captcha|webmcp|Shopify\.MCP|load_feature|standard-actions|es-modules-shim|'
                         r'sendBeacon|ShopifyPaypal|SignInWithShop|ShopifyPay|featureAssets|customDocumentWrite|'
                         r'dynamic_checkout|content_for_header|userAgent;var platform|shop-js-analytics|__st=', re.S)
ASSET_RE = re.compile(r'(?:https?:)?//(?:heytovi\.com|cdn\.shopify\.com)/[^"\'\s,)<>\\]+|(?<=["\'(\s])/cdn/shop/[^"\'\s,)<>\\]+')

cache = {}

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def norm(u):
    u = html.unescape(u)
    if u.startswith('//'): u = 'https:' + u
    elif u.startswith('/'): u = ORIGIN + u
    return u

def local_path(url):
    p = urlparse(url)
    name = os.path.basename(p.path) or 'file'
    base, ext = os.path.splitext(name)
    q = p.query
    # keep width/crop variants distinct, drop cache-busting v=
    q2 = '&'.join(x for x in q.split('&') if x and not x.startswith('v='))
    if q2: base += '_' + hashlib.md5(q2.encode()).hexdigest()[:8]
    if p.path.startswith('/cdn/shop/t/'): sub = 'theme'
    elif 'extensions' in p.path: sub = 'ext'
    elif '/videos/' in p.path: sub = 'videos'
    elif ext in ('.woff', '.woff2', '.ttf', '.otf'): sub = 'fonts'
    else: sub = 'media'
    if not ext and 'fonts' in p.path: ext = '.woff2'
    return f'/assets/{sub}/{base}{ext}'

def download(url):
    if url in cache: return cache[url]
    lp = local_path(url); cache[url] = lp
    dest = ROOT + lp
    if not os.path.exists(dest):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        try:
            data = fetch(url)
        except Exception as e:
            print('FAIL', url, e); cache[url] = url; return url
        if dest.endswith('.css'):
            data = localize_css(data.decode('utf-8', 'ignore'), url).encode()
        open(dest, 'wb').write(data)
    return lp

def localize_css(css, base):
    def rep(m):
        u = m.group(2)
        if u.startswith('data:'): return m.group(0)
        return f'url({m.group(1)}{download(norm(urljoin(base, u)))}{m.group(1)})'
    return re.sub(r'url\((["\']?)([^)"\']+)\1\)', rep, css)

def clean_scripts(doc):
    def rep(m):
        tag = m.group(0)
        head = tag[:tag.find('>') + 1]
        if 'jdgm' in tag or 'importmap' in head or 'ld+json' in head: return tag
        return '' if DROP_SCRIPT.search(tag) else tag
    doc = re.sub(r'<script\b[^>]*>.*?</script>', rep, doc, flags=re.S)
    doc = re.sub(r'<link[^>]*(portable-wallets|shop\.app|monorail|preconnect|dns-prefetch)[^>]*>', '', doc)
    return doc

def mirror_page(path, out):
    doc = fetch(ORIGIN + path).decode('utf-8')
    doc = clean_scripts(doc)
    urls = set(ASSET_RE.findall(doc))
    # Judge.me resolves its widget files relative to its CDN base, so it stays remote
    fetchable = [u for u in urls if not re.search(r'shopifycloud|/checkouts/|\.js\.map|/extensions/|/videos/', u)]
    with cf.ThreadPoolExecutor(16) as ex:
        results = dict(zip(fetchable, ex.map(lambda u: download(norm(u)), fetchable)))
    for u in sorted(results, key=len, reverse=True):
        doc = doc.replace(u, results[u])
    # live theme has a srcset with missing width descriptors ("url&width=832832w,url...") that Shopify's CDN
    # tolerates; locally the joined string 404s, so collapse any descriptor-less list to its first entry
    doc = re.sub(r'srcset="(/assets/[^" ,]+),/assets/[^" ]*"', r'srcset="\1"', doc)
    # Judge.me tags its Horizon app block at runtime only on the real storefront domain; without the class the
    # block collapses to 0 width inside the flex panel, so bake it in
    doc = re.sub(r'(__judge_me_reviews_review_widget_\w+" class="shopify-block shopify-app-block)"', r'\1 jdgm-horizon-widget"', doc)
    # absolute store links -> local
    doc = doc.replace('https://heytovi.com/products/tovi', '/products/tovi').replace('href="https://heytovi.com/"', 'href="/"')
    # the cart is our own (inside the product page replica)
    doc = re.sub(r'href="(?:https://heytovi\.com)?/cart"', 'href="/products/tovi/#cart"', doc)
    dest = os.path.join(ROOT, out)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w').write(doc)
    print(out, len(results), 'assets')

def follow_js_imports():
    # theme modules import each other through the importmap, plus some relative imports
    tdir = ROOT + '/assets/theme'
    changed = True
    while changed:
        changed = False
        for f in os.listdir(tdir):
            if not f.endswith('.js'): continue
            src = open(os.path.join(tdir, f)).read()
            for rel in re.findall(r'''(?:from|import)\s*\(?\s*['"](\./[^'"]+)['"]''', src):
                p = os.path.join(tdir, os.path.basename(rel))
                if not os.path.exists(p):
                    open(p, 'wb').write(fetch(f'{ORIGIN}/cdn/shop/t/18/assets/{os.path.basename(rel)}')); changed = True
                    print('import', rel)

if __name__ == '__main__':
    for p, o in PAGES.items(): mirror_page(p, o)
    follow_js_imports()
    import relativize; relativize.fix_html("index.html"); relativize.fix_css()
    import glue; glue.run()
    import inject_promo; inject_promo.inject("index.html"); inject_promo.inject("products/tovi/index.html")
