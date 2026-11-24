"""Compact 3-way contact sheets from SHA-checked native R17b previews; no rendering."""
import io,json,hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageStat
ROOT=Path(__file__).resolve().parent/'preview'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=ROOT/'preview_manifest.json'
m=json.loads(manifest.read_text(encoding='utf-8'))
assert m['status']=='R17B_PREVIEW_READY_OWNER_SA_VISUAL_REVIEW_PENDING'
assert len(m['images'])==18
idx={}
for row in m['images']:
    p=ROOT/row['file']
    if p.stat().st_size!=row['bytes'] or sha(p)!=row['sha256']:raise RuntimeError('preview mismatch '+p.name)
    key=(row['profile'],row['revision'],row['view'])
    if key in idx:raise RuntimeError('duplicate '+str(key))
    idx[key]=row
for lod in ('quality','eco'):
    a=m['candidate'][lod];p=ROOT/a['file']
    if sha(p)!=a['sha256'] or p.stat().st_size!=a['bytes']:raise RuntimeError('candidate mismatch '+p.name)
records=[]
for view in sorted({r['view'] for r in m['images']}):
    sheet=Image.new('RGB',(1120,1370),(24,24,28))
    draw=ImageDraw.Draw(sheet);draw.text((12,8),view+'  |  Native quick Cycles 360x640, 8 samples  |  Not final evidence',fill='white')
    diffs=[]
    for j,lod in enumerate(('quality','eco')):
        imgs={}
        for i,rev in enumerate(('r16','r17','r17b')):
            row=idx[lod,rev,view]
            with Image.open(ROOT/row['file']) as source:
                if source.size!=(360,640):raise RuntimeError('wrong preview dimensions')
                im=source.convert('RGB')
            imgs[rev]=im
            x=10+i*370;y=30+j*665
            draw.text((x,y),lod.upper()+' '+rev.upper(),fill='white')
            sheet.paste(im,(x,y+18))
        for rev in ('r16','r17'):
            diff=ImageChops.difference(imgs[rev],imgs['r17b'])
            hist=diff.convert('L').histogram()
            diffs.append({'profile':lod,'baseline':rev,'meanRGBDelta':ImageStat.Stat(diff).mean,
                'lumaDeltaOver16Pct':100*sum(hist[17:])/sum(hist),
                'note':'Noise-inclusive image difference proxy, not segmented silhouette or art acceptance.'})
    out=ROOT/(view+'_ABC.jpg')
    for q in (90,82,74,66,58,50,42,34):
        b=io.BytesIO();sheet.save(b,'JPEG',quality=q,optimize=True)
        if len(b.getvalue())<1024*1024:break
    else:raise RuntimeError('contact sheet exceeds 1MiB')
    out.write_bytes(b.getvalue())
    records.append({'file':out.name,'sha256':sha(out),'bytes':out.stat().st_size,'metrics':diffs,'sourceFrames':[r for r in m['images'] if r['view']==view]})
assert len(records)==3
(ROOT/'preview_sheet_manifest.json').write_text(json.dumps({'previewManifestSHA256':sha(manifest),'sheets':records,'gate':'R17_SA_ART_REVIEW_REQUIRED','ownerArtGO':'PENDING'},indent=2)+'\n',encoding='utf-8')
print('R17B_3_PREVIEW_SHEETS_READY; REVIEW BEFORE FINAL CYCLES')
