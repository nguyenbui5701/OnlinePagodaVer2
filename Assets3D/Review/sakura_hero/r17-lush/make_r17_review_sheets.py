"""Generate six compact JPEG sheets from existing SHA-verified Cycles images. No render."""
import hashlib,json,io
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops,ImageStat
ROOT=Path(__file__).resolve().parent
SRC=ROOT/'R17_Cycles_Evidence'
OUT=ROOT/'R17_Review_Sheets'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
rows=json.loads((SRC/'cycles_manifest.json').read_text(encoding='utf-8'))
assert len(rows)==24
index={}
for row in rows:
    p=SRC/row['file']
    if p.stat().st_size!=row['bytes'] or sha(p)!=row['sha256']:raise RuntimeError('PNG mismatch '+p.name)
    with Image.open(p) as im:
        if im.size!=(720,1280):raise RuntimeError('PNG dimensions '+p.name)
    key=(row['lod'],row['revision'],row['camera'])
    if key in index:raise RuntimeError('duplicate '+str(key))
    index[key]=row
OUT.mkdir(exist_ok=True)
records=[]
for view in sorted({r['camera'] for r in rows}):
    canvas=Image.new('RGB',(1000,1800),(24,24,28));draw=ImageDraw.Draw(canvas)
    draw.text((12,10),view+' | R16 left / R17 right | original Cycles 720x1280',fill='white')
    comparisons=[]
    for j,lod in enumerate(('quality','eco')):
        pair=[]
        for i,rev in enumerate(('r16','r17')):
            row=index[lod,rev,view]
            with Image.open(SRC/row['file']) as source: im=source.convert('RGB')
            pair.append(im)
            x=10+i*495;y=42+j*875
            draw.text((x,y),lod.upper()+' '+rev.upper(),fill='white')
            canvas.paste(im.resize((480,853),Image.Resampling.LANCZOS),(x,y+18))
        diff=ImageChops.difference(*pair)
        hist=diff.convert('L').histogram()
        comparisons.append({'profile':lod,'meanAbsoluteRGBDifference':ImageStat.Stat(diff).mean,'pixelsLumaDifferenceOver16Pct':100*sum(hist[17:])/sum(hist),'note':'Image delta proxy only, includes lighting, occlusion and Cycles noise; not segmentation or silhouette proof.'})
    target=OUT/(view+'_AB.jpg')
    for quality in (88,80,72,64,56,48,40,32):
        buf=io.BytesIO();canvas.save(buf,format='JPEG',quality=quality,optimize=True)
        if len(buf.getvalue())<1024*1024:break
    else:raise RuntimeError('Cannot meet sheet size budget '+view)
    target.write_bytes(buf.getvalue())
    records.append({'file':target.name,'bytes':target.stat().st_size,'sha256':sha(target),'sourceImages':[r for r in rows if r['camera']==view],'comparisons':comparisons})
assert len(records)==6
(OUT/'sheet_manifest.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
print('R17_CONTACT_SHEETS_CREATED 6; original 24 SHA verified; visual SA judgment still required')
