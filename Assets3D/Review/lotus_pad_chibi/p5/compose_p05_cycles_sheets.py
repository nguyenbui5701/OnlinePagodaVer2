"""Owner post-Cycles truthful A/B contact sheets: requires pip install pillow.
Only uses genuine exported Cycles PNGs from run_p05_blender.ps1's case reports.
Run after -Mode all. No generated image should be claimed before actual call.
"""
from pathlib import Path
import argparse,hashlib,json,math
from PIL import Image,ImageOps,ImageDraw
ROOT=Path(__file__).parent

def path_of(base,case,shot):
 p=base/case/(shot+'_cycles.png');assert p.is_file(),f'Cycles input missing {p}'
 # Confirm image hash against original case report.
 report=json.loads((base/case/'case_report.json').read_text())
 record=next((x for x in report['images'] if x['file']==p.name),None)
 assert record and hashlib.sha256(p.read_bytes()).hexdigest()==record['sha256'],p
 return p

def save(files,out,cols=2,size=(390,540)):
 w,h=size;rows=math.ceil(len(files)/cols);canvas=Image.new('RGB',(w*cols,rows*(h+34)),'#252234');draw=ImageDraw.Draw(canvas)
 for i,(label,p) in enumerate(files):
  im=Image.open(p).convert('RGB');im.thumbnail((w,h),Image.Resampling.LANCZOS)
  x=i%cols*w+(w-im.width)//2;y=i//cols*(h+34)+(h-im.height)//2
  canvas.paste(im,(x,y));draw.text((i%cols*w+11,i//cols*(h+34)+h+6),label,fill='white')
 canvas.save(out,quality=94)
 return {'file':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}

def run():
 ap=argparse.ArgumentParser();ap.add_argument('--evidence',default='P05_Cycles_Evidence');opt=ap.parse_args()
 folder=ROOT/opt.evidence;out=ROOT/'P05_Cycles_Contact_Sheets';out.mkdir(exist_ok=True)
 sheets={}
 for name,views in [
  ('P05_CYCLES_AB_P04_VS_CROSS.jpg',['front','hands_front','knees_front','right']),
  ('P05_CYCLES_CROSS_VS_KNEEL.jpg',['front','right','quarter','knees_side']),
  ('P05_CYCLES_PAIR_9x16.jpg',['pair_full_9x16','pair_medium_9x16','pair_close_9x16']),
  ('P05_CYCLES_IDLE_FRONT_BACK.jpg',['idle_front_0.0','idle_front_2.0','idle_back_0.0','idle_back_2.0'])]:
  entries=[]
  for v in views:
   if name=='P05_CYCLES_AB_P04_VS_CROSS.jpg':cases=['p04_actor','cross_actor']
   elif name=='P05_CYCLES_PAIR_9x16.jpg':cases=['cross_pair','kneel_pair']
   else:cases=['cross_actor','kneel_actor']
   for case in cases:
    rev=case.split('_')[0]
    if v.startswith('idle_'):filename=f'{rev}_{v}'
    else:filename=f'{rev}_{case.split("_")[1]}_{v}'
    entries.append((f'{case} {v}',path_of(folder,case,filename)))
  sheets[name]=save(entries,out/name,cols=2,size=(390,680) if '9x16' in name else (390,430))
 for rev in ('cross','kneel'):
  name='P05_CYCLES_SIX_COLORS_'+rev.upper()+'.jpg'
  entries=[(rev+' '+variant,path_of(folder,rev+'_palette',rev+'_palette_'+variant)) for variant in
           ('pastel_lilac','blush_rose','sage_green','sky_blue','warm_cream','terracotta')]
  sheets[name]=save(entries,out/name,cols=3,size=(320,400))
 (out/'CONTACT_SHEETS_SHA256.json').write_text(json.dumps(sheets,indent=2)+'\n')
 print('ORIGINAL_OWNER_CYCLES_CONTACT_SHEETS',len(sheets))
if __name__=='__main__':run()
