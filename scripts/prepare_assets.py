from pathlib import Path
import zipfile, struct, json, shutil, urllib.request
root=Path('.')
for archive,target in [('apple-iphone-18-pro-max-burgundy-2026.zip','iphone-18-pro-max.glb'),('apple-iphone-duo-fold-star-white-2026-animated.zip','iphone-duo.glb')]:
    with zipfile.ZipFile(root/'phone3d models'/archive) as z:
        source=next(n for n in z.namelist() if n.endswith('.glb'))
        raw=z.read(source)
        (root/'assets/models'/target).write_bytes(raw)
        count=struct.unpack_from('<I',raw,12)[0]
        data=json.loads(raw[20:20+count])
        print(target,json.dumps({'asset':data.get('asset'),'externalImages':[i.get('uri') for i in data.get('images',[]) if 'uri' in i],'extensions':data.get('extensionsUsed')}))
shutil.copy2(root/'phone3d models/iphone_16_pro_max.glb',root/'assets/models/iphone-16-pro-max.glb')
url='https://cdn.jsdelivr.net/npm/@google/model-viewer@4.1.0/dist/model-viewer.min.js'
urllib.request.urlretrieve(url,root/'assets/vendor/model-viewer.min.js')
print('model-viewer downloaded', (root/'assets/vendor/model-viewer.min.js').stat().st_size)
