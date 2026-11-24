"""Build final A/B sheets from 24 SHA-checked final-grade frames; never render."""
import hashlib, io, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageStat
HERE=Path(__file__).resolve().parent
OUT=HERE/'final'
ROOT=HERE.parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def check(p,info):
    if not p.is_file() or p.stat().st_size!=info['bytes'] or sha(p)!=info['sha256']:raise RuntimeError('checksum mismatch '+str(p))
def record(p):
    return {'path':p.relative_to(OUT).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
report=json.loads((OUT/'R17B_FINAL_RESULT.json').read_text(encoding='utf-8'))
rows=json.loads((OUT/'cycles_manifest.json').read_text(encoding='utf-8'))
assert report['status']=='R17B_FINAL_NATIVE_EVIDENCE_READY_OWNER_UPLOAD_SA_REVIEW_PENDING'
assert len(rows)==24
for lod,a in report['canonicalGLBs'].items():check(OUT/a['path'],a)
check(OUT/report['editable']['file'],report['editable'])
idx={}
for row in rows:
    key=(row['lod'],row['revision'],row['view'])
    if key in idx:raise RuntimeError('duplicate final frame '+str(key))
    p=OUT/row['path'];check(p,row)
    assert [row['width'],row['height'],row['samples']]==[720,1280,32]
    with Image.open(p) as im:
        if im.size!=(720,1280):raise RuntimeError('wrong dimensions '+str(p))
    idx[key]=row
sheets=[]
for view in sorted({x['view'] for x in rows}):
    canvas=Image.new('RGB',(1000,1800),(24,24,28));draw=ImageDraw.Draw(canvas)
    draw.text((12,10),view+' | R16 left / R17b right | Native Cycles 720x1280 / 32 samples',fill='white')
    comparisons=[]
    for j,lod in enumerate(('quality','eco')):
        imgs=[]
        for i,rev in enumerate(('r16','r17b')):
            row=idx[lod,rev,view]
            with Image.open(OUT/row['path']) as src:im=src.convert('RGB')
            imgs.append(im)
            x=10+i*495;y=42+j*875
            draw.text((x,y),lod.upper()+' '+rev.upper(),fill='white')
            canvas.paste(im.resize((480,853),Image.Resampling.LANCZOS),(x,y+18))
        diff=ImageChops.difference(*imgs)
        hist=diff.convert('L').histogram()
        comparisons.append({'profile':lod,'meanAbsoluteRGBDifference':ImageStat.Stat(diff).mean,
          'pixelsLumaDifferenceOver16Pct':100*sum(hist[17:])/sum(hist),
          'limitation':'Noise-inclusive image delta proxy only; not silhouette segmentation, volume, or art PASS.'})
    dst=OUT/(view+'_AB.jpg')
    for q in (88,80,72,64,56,48,40,32):
        buf=io.BytesIO();canvas.save(buf,'JPEG',quality=q,optimize=True)
        if len(buf.getvalue())<1024*1024:break
    else:raise RuntimeError('sheet exceeds 1 MiB')
    dst.write_bytes(buf.getvalue())
    sheets.append({**record(dst),'view':view,'comparisons':comparisons,'sourceFrames':[r for r in rows if r['view']==view]})
assert len(sheets)==6
ledger=OUT/'sheet_manifest.json'
ledger.write_text(json.dumps(sheets,indent=2)+'\n',encoding='utf-8')
files=[OUT/n for n in ('R17B_FINAL_RESULT.json','editable_reopen.json','cycles_manifest.json','sheet_manifest.json','blender_final_stdout.log','blender_final_stderr.log','blender_exit_code.txt',report['editable']['file'])]
files += [OUT/r['path'] for r in rows if r['origin']=='NATIVE_FINAL_CYCLES']
files += [OUT/s['path'] for s in sheets]
for p in files:
    if not p.is_file():raise RuntimeError('missing final handoff artifact '+str(p))
require_stdout=(OUT/'blender_final_stdout.log').read_text(encoding='utf-8',errors='replace')
assert 'R17B_FINAL_COMPLETE 12 R17B + 6 NEW R16 + 6 REUSED R16' in require_stdout
assert (OUT/'blender_exit_code.txt').read_text(encoding='ascii').strip()=='R17B_FINAL_BLENDER_EXIT_CODE=0'
inventory=[record(p) for p in files]
manifest={'status':'R17B_FINAL_EVIDENCE_GENERATED_LOCALLY_PENDING_GITHUB_UPLOAD_AND_SA_REVIEW',
  'approvedHead':report['approvedHead'],'review':report['review'],
  'nativeReport':record(OUT/'R17B_FINAL_RESULT.json'),'canonicalGLBs':report['canonicalGLBs'],
  'editable':{k:v for k,v in report['editable'].items() if k!='reopenedCollections'},
  'cycles':report['cycles'],'sheetCount':len(sheets),'sheets':[{k:s[k] for k in ('path','bytes','sha256','view')} for s in sheets],
  'inventory':inventory,'reusedBaselineFrames':[r for r in rows if r['origin']!='NATIVE_FINAL_CYCLES'],
  'gate':'R17_SA_ART_REVIEW_REQUIRED','independentSAHash':'PENDING','ownerArtGO':'PENDING','costVNDSoftwareLicense':0}
final=OUT/'final_manifest.json'
final.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
# SHA ledger references existing canonical GLBs and reused originals, no duplicate binary.
entries=[(r['sha256'],r['path']) for r in inventory]+[(sha(final),final.name)]
entries += [(r['sha256'],r['path']) for r in manifest['reusedBaselineFrames']]
entries += [(a['sha256'],a['path']) for a in manifest['canonicalGLBs'].values()]
(OUT/'owner_sha256.txt').write_text(''.join(f'{s}  {p}\n' for s,p in entries),encoding='utf-8')
print('R17B_FINAL_SHEETS_PASS 6; 24 final-grade ledger rows (18 new + 6 reused); STOP R17_SA_ART_REVIEW_REQUIRED')
