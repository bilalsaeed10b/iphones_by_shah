"""Create a portable, single HTML file from the editable page sources."""
from pathlib import Path
import base64
import re

root = Path(__file__).resolve().parent.parent
html = (root / 'planning.html').read_text(encoding='utf-8')
css = (root / 'plan.css').read_text(encoding='utf-8')
js = (root / 'plan.js').read_text(encoding='utf-8')
viewer = (root / 'assets/vendor/model-viewer.min.js').read_text(encoding='utf-8')

def data_uri(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

html = html.replace('href="plan.css"', 'href="data:text/css;base64,' + base64.b64encode(css.encode()).decode() + '"')
html = html.replace('<script type="module" src="assets/vendor/model-viewer.min.js"></script>', '<script type="module">' + viewer.replace('</script', '<\\/script') + '</script>')
html = html.replace('<script defer src="plan.js"></script>', '')
html = html.replace('src="logo.png"', 'src="' + data_uri(root / 'logo.png', 'image/png') + '"')
for file in ['iphone-16-pro-max.glb', 'iphone-18-pro-max.glb', 'iphone-duo.glb']:
    html = html.replace('src="assets/models/' + file + '"', 'src="' + data_uri(root / 'assets/models' / file, 'model/gltf-binary') + '"')
html = html.replace('</body>', '<script>' + js.replace('</script', '<\\/script') + '</script>\n</body>')
(root / 'website-plan.html').write_text(html, encoding='utf-8')
print('Portable plan:', root / 'website-plan.html')
print('Size:', round((root / 'website-plan.html').stat().st_size / 1024 / 1024, 1), 'MB')
