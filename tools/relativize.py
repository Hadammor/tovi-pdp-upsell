"""Make site/ paths relative so pages also render when opened straight from Finder (file://)."""
import os, re
SITE = os.path.join(os.path.dirname(__file__), '..')

def fix_html(rel_file):
    path = os.path.join(SITE, rel_file)
    up = '../' * rel_file.count('/') or './'  # './' for root: import maps reject bare 'assets/…' paths
    doc = open(path).read()
    doc = re.sub(r'(?<=["\'(\s,])/assets/', up + 'assets/', doc)
    doc = re.sub(r'href="/products/tovi(?:/)?(?=[?"#])', f'href="{up}products/tovi/index.html', doc)
    doc = doc.replace('href="/"', f'href="{up}index.html"')
    open(path, 'w').write(doc)

def fix_css():
    tdir = os.path.join(SITE, 'assets', 'theme')
    for f in os.listdir(tdir):
        if f.endswith('.css'):
            p = os.path.join(tdir, f); css = open(p).read()
            open(p, 'w').write(re.sub(r'url\((["\']?)/assets/', r'url(\1../', css))

if __name__ == '__main__':
    fix_html('index.html'); fix_css()
