"""Final R18a comparison sheets, exact evidence inventory; no Blender work."""
import json,io,hashlib,os
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(n):return json.loads((ROOT/n).read_text(encoding='utf-8'))
def meta(p):return {'path':os.path.relpath(p,ROOT).replace('\\','/'),'bytes':p.stat().st_size,'sha256':sha(p)}
def check(row):
    p=ROOT/row['path']
    if not p.is_file() or p.stat().st_size!=row['bytes'] or sha(p)!=row['sha256']:raise RuntimeError('SHA mismatch '+str(p))
    return p
v=read('final_result.json');m=read('cycles_manifest.json')
assert v['status']=='R18A_NATIVE_FINAL_EVIDENCE_READY_SA_REVIEW_PENDING'
assert v['validationSHA256']==sha(ROOT/'validation.json')
assert len(m['frames'])==24 and len(m['lookOnly'])==2 and len(m['goldControls'])==4
for x in list(v['profiles'].values())+[v['editable']]:check(x)
for x in m['frames']+m['lookOnly']+m['goldControls']:
    with Image.open(check(x)) as im:assert im.size==(720,1280)
for label,marker in (('R18a_build','R18A_GOLD_NATIVE_BUILD_PASS'),('R18a_final','R18A_FINAL_COMPLETE 24 MATCHED + 4 R18 CONTROLS + 2 LOOK ONLY')):
    assert (ROOT/(label+'_exit_code.txt')).read_text(encoding='ascii').strip()=='0'
    assert marker in (ROOT/(label+'_stdout.log')).read_text(encoding='utf-8',errors='replace')
E=ROOT/'R18a_Cycles_Evidence';rows=[]
def sheet(name,views,heading):
    im=Image.new('RGB',(1000,1800),(24,24,28));d=ImageDraw.Draw(im);d.text((12,10),heading,fill='white')
    for i,(r,label) in enumerate(views):
        x=10+i%2*495;y=42+i//2*875;d.text((x,y),label,fill='white')
        with Image.open(check(r)) as src:im.paste(src.convert('RGB').resize((480,853),Image.Resampling.LANCZOS),(x,y+18))
    p=E/name
    for q in (88,80,72,64,56,48,40,32):
        b=io.BytesIO();im.save(b,'JPEG',quality=q,optimize=True)
        if len(b.getvalue())<1024*1024:break
    else:raise RuntimeError('sheet exceeds 1MiB')
    p.write_bytes(b.getvalue());rows.append({**meta(p),'sourceFrames':[r for r,_ in views]})
idx={(r['lod'],r['revision'],r['view']):r for r in m['frames']}
for view in sorted({r['view'] for r in m['frames']}):
    sheet(view+'_AB.jpg',[(idx[lod,rev,view],lod.upper()+' '+rev.upper()) for lod in ('quality','eco') for rev in ('r17b','r18a')],view+' | R17B left / R18a right | matched Cycles')
controls={(r['lod'],r['view']):r for r in m['goldControls']}
for view in ('under_tree','branch_close'):
    sheet('gold_revision_'+view+'_AB.jpg',[(r,lod.upper()+' '+label) for lod in ('quality','eco') for r,label in ((controls[lod,view],'R18'),(idx[lod,'r18a',view],'R18a'))],'Gold-only revision | R18 left / R18a right | same rig')
looks={r['lod']:r for r in m['lookOnly']}
sheet('gold_lighting_control_AB.jpg',[(r,lod.upper()+' '+name) for lod in ('quality','eco') for r,name in ((idx[lod,'r18a','under_tree'],'same rig'),(looks[lod],'render-only warm fill'))],'Controlled light | same R18a model | not runtime')
assert len(rows)==9
(ROOT/'sheet_manifest.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8')
files=[ROOT/n for n in ('sakura_hero_r18a.glb','sakura_hero_r18a_eco.glb','sakura_hero_r18a_editable.blend','validation.json','editable_reopen.json','final_result.json','cycles_manifest.json','sheet_manifest.json','R18a_build_stdout.log','R18a_build_stderr.log','R18a_build_exit_code.txt','R18a_final_stdout.log','R18a_final_stderr.log','R18a_final_exit_code.txt')]
files += [ROOT/x['path'] for x in m['frames']+m['lookOnly'] if x['origin']=='NATIVE_CYCLES']+[ROOT/x['path'] for x in rows]
assert all(p.is_file() for p in files)
inventory=[meta(p) for p in files]
reuse=[x for x in m['frames']+m['goldControls'] if x['origin'].startswith('REUSED')]
report={'status':'R18A_NATIVE_GENERATED_PENDING_OWNER_UPLOAD_AND_SA_REVIEW','reviewedHead':v['reviewedHead'],'review':v['review'],'policyTaskBlob':v['policyTaskBlob'],
    'profiles':v['profiles'],'editable':v['editable'],'cycles':m['counts'],'sheets':rows,'inventory':inventory,'reusedFrames':reuse,
    'gate':'P10B8_ART_SA_REVIEW_REQUIRED','ownerArtGO':'PENDING','independentSAHash':'PENDING','costVNDSoftwareLicense':0}
p=ROOT/'native_manifest.json';p.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
(ROOT/'owner_sha256.txt').write_text(''.join(f"{r['sha256']}  {r['path']}\n" for r in inventory+[meta(p)]+reuse),encoding='utf-8')
print('R18A_SHEETS_PASS 9; P10B8_ART_SA_REVIEW_REQUIRED')
