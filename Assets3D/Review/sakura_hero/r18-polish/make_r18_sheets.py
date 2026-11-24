"""Generate compact review sheets and SHA ledger from native final evidence."""
import json,io,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(n):return json.loads((ROOT/n).read_text(encoding='utf-8'))
def meta(p):return {'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
def check(row):
    p=ROOT/row['path']
    if not p.is_file() or p.stat().st_size!=row['bytes'] or sha(p)!=row['sha256']:raise RuntimeError('SHA mismatch '+str(p))
    return p
v=read('validation.json');m=read('cycles_manifest.json')
assert v['status']=='R18_NATIVE_EVIDENCE_READY_VISUAL_SA_REVIEW_PENDING'
assert len(m['frames'])==24 and len(m['lookOnly'])==2
for x in list(v['profiles'].values())+[v['editable']]:check(x)
for x in m['frames']+m['lookOnly']:
    with Image.open(check(x)) as im:assert im.size==(720,1280)
E=ROOT/'R18_Cycles_Evidence';rows=[]
def sheet(name,views,heading):
    im=Image.new('RGB',(1000,1800),(24,24,28));d=ImageDraw.Draw(im);d.text((12,10),heading,fill='white')
    for i,(r,label) in enumerate(views):
        x=10+i%2*495;y=42+i//2*875;d.text((x,y),label,fill='white')
        with Image.open(check(r)) as src:im.paste(src.convert('RGB').resize((480,853),Image.Resampling.LANCZOS),(x,y+18))
    p=E/name
    for q in (88,80,72,64,56,48,40,32):
        b=io.BytesIO();im.save(b,'JPEG',quality=q,optimize=True)
        if len(b.getvalue())<1024*1024:break
    else:raise RuntimeError('sheet >1MiB')
    p.write_bytes(b.getvalue());rows.append({**meta(p),'sourceFrames':[r for r,_ in views]})
idx={(r['lod'],r['revision'],r['view']):r for r in m['frames']}
for view in sorted({r['view'] for r in m['frames']}):
    sheet(view+'_AB.jpg',[(idx[lod,rev,view],lod.upper()+' '+rev.upper()) for lod in ('quality','eco') for rev in ('r17b','r18')],view+' | R17B left / R18 right | matched Cycles')
looks={r['lod']:r for r in m['lookOnly']}
sheet('gold_lighting_control_AB.jpg',[(r,lod.upper()+' '+name) for lod in ('quality','eco') for r,name in ((idx[lod,'r18','under_tree'],'same rig'),(looks[lod],'render-only warm fill'))],'Controlled light test | same R18 model | not runtime')
(ROOT/'sheet_manifest.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8')
files=[ROOT/n for n in ('sakura_hero_r18.glb','sakura_hero_r18_eco.glb','sakura_hero_r18_editable.blend','attachment_audit.json','attachment_diagnostics.json','validation.json','cycles_manifest.json','sheet_manifest.json')]
files+=list((ROOT/'R18_Attachment_Audit').glob('*'))+list(E.glob('*.png'))+list(E.glob('*.jpg'))+list(ROOT.glob('R18_*_stdout.log'))+list(ROOT.glob('R18_*_stderr.log'))
inventory=[meta(p) for p in sorted(set(files)) if p.is_file()]
report={'status':'NATIVE_GENERATED_PENDING_OWNER_UPLOAD_AND_SA_REVIEW','baseline':v['baseline'],'profiles':v['profiles'],'editable':v['editable'],'cycles':v['cycles'],'sheets':rows,'inventory':inventory,'gate':'P10B8_ART_SA_REVIEW_REQUIRED','costVND':0}
p=ROOT/'native_manifest.json';p.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
(ROOT/'owner_sha256.txt').write_text(''.join(f"{r['sha256']}  {r['path']}\n" for r in inventory+[meta(p)]+[r for r in m['frames'] if r['origin'].startswith('REUSED')]),encoding='utf-8')
print('R18_SHEETS_COMPLETE 6 matched + 1 controlled lighting; P10B8_ART_SA_REVIEW_REQUIRED')
