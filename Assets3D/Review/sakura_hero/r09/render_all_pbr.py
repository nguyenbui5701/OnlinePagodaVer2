"""R08/R09 same-camera PBR regression images. Reference video is OPTIONAL, not model texture."""
import argparse
from pathlib import Path
from PIL import Image,ImageDraw
from render_pbr_truth import render
VIEWS=['top','aerial_e','aerial_w','aerial_n','aerial_s']
def pair(a,b,dest,title):
 a=Image.open(a).convert('RGB');b=Image.open(b).convert('RGB')
 w=max(a.width,b.width);out=Image.new('RGB',(2*w,max(a.height,b.height)+32),(26,20,35))
 out.paste(a,(0,32));out.paste(b,(w,32))
 draw=ImageDraw.Draw(out);draw.text((8,8),'R08 '+title,fill='white');draw.text((w+8,8),'R09 '+title,fill='white')
 out.save(dest,quality=88)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--r08',required=True,help='R08 folder containing GLBs')
 p.add_argument('--r09',default='.',help='R09 folder containing GLBs')
 p.add_argument('--out',default='PBR_Review');args=p.parse_args()
 r08=Path(args.r08);r09=Path(args.r09);out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
 for v in VIEWS:
  for rev,root in [('r08',r08),('r09',r09)]:
   render(root/'sakura_hero_eco.glb',out/f'{rev}_eco_{v}.png',v,size=(400,480))
  pair(out/f'r08_eco_{v}.png',out/f'r09_eco_{v}.png',out/f'R08_R09_ECO_{v}.jpg',f'ECO {v}')
 for v in ['top','three_quarter','under','trunk_33s']:
  for rev,root in [('r08',r08),('r09',r09)]:
   render(root/'sakura_hero.glb',out/f'{rev}_quality_{v}.png',v,size=(480,550))
  pair(out/f'r08_quality_{v}.png',out/f'r09_quality_{v}.png',out/f'R08_R09_QUALITY_{v}.jpg',f'QUALITY {v}')
 render(r09/'sakura_hero_eco.glb',out/'r09_eco_under.png','under',size=(400,480))
