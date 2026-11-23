"""Actual GLB native VTK PBR diagnostic A/B (NOT Blender parity)."""
from pathlib import Path
from render_pbr_truth import render
from PIL import Image,ImageOps,ImageDraw
ROOT=Path(__file__).resolve().parent
pairs=[('R10 baseline',ROOT.parent/'r10/sakura_hero.glb'),('R10 palette only',ROOT/'r10_palette_only.glb'),('R11 geometry only',ROOT/'r11_geometry_only.glb'),('R11 final',ROOT/'sakura_hero.glb')]
OUT=ROOT/'PBR_Review';OUT.mkdir(exist_ok=True)
for view in ['top','under','trunk_33s']:
 images=[]
 for ix,(label,file) in enumerate(pairs):
  p=OUT/f'{view}_ab_{ix}.png';render(file,p,view=view,size=(360,430));im=Image.open(p).convert('RGB');images.append((label,im))
 canvas=Image.new('RGB',(360*4,460),(31,26,39));d=ImageDraw.Draw(canvas)
 for i,(label,im) in enumerate(images):
  canvas.paste(im,(i*360,30));d.text((i*360+10,10),label,fill=(255,232,230))
 canvas.save(OUT/f'R10_R11_AB_{view}_VTK_PBR.jpg',quality=89)
 print('FINISHED',view,flush=True)
