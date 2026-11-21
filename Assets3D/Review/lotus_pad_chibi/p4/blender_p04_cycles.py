"""Blender 4.5+ owner-run actual exported GLB re-import / editable .blend / Cycles.
P0.3 versus P0.4 SAME camera, light, AgX0EV, FOV. Six material variations.
This script itself does not prove any render has run until owner supplies logs+PNG.
"""
from pathlib import Path
import argparse,sys,math,json,hashlib
import bpy
from mathutils import Vector,Matrix

def sha(path):
 h=hashlib.sha256()
 with open(path,'rb') as f:
  for chunk in iter(lambda:f.read(1<<20),b''):h.update(chunk)
 return h.hexdigest()
def coord(v):return Vector((v[0],-v[2],v[1]))
CAM={
 'front':((0,.88,2.6),(0,.63,0),(0,1,0),34),
 'side':((2.55,.87,.12),(0,.60,0),(0,1,0),35),
 'quarter':((1.9,1.22,2.26),(0,.62,0),(0,1,0),40),
 'back':((0,.86,-2.7),(0,.63,0),(0,1,0),34),
 'placket':((.38,.64,1.62),(0,.46,.06),(0,1,0),32),
 'backhair':((.34,.89,-1.57),(0,.67,-.12),(0,1,0),38),
 'pair_front':((0,1.04,3.0),(0,.67,0),(0,1,0),42),
 'pair_quarter':((2.55,1.52,2.85),(0,.55,0),(0,1,0),47),
 'medium_9x16':((1.18,1.29,2.92),(0,.61,0),(0,1,0),42),
 'close_9x16':((1.3,1.22,2.55),(0,.74,.04),(0,1,0),43),
}
PAL={'pastel_lilac':('#B9A4D7','#44435D'), 'blush_rose':('#D998A6','#59515C'),
 'sage_green':('#94B6A0','#394D48'),'sky_blue':('#85B8D4','#35495F'),
 'warm_cream':('#E7CBAA','#665A59'),'terracotta':('#BD806B','#484044')}
def linear(hexval):
 c=[int(hexval[i:i+2],16)/255 for i in (1,3,5)];return [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]+[1.]
def import_glb(p):
 old=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(p))
 new=[obj for obj in bpy.context.scene.objects if obj not in old]
 meshes=[o for o in new if o.type=='MESH']
 if not meshes:raise RuntimeError('GLB import has no 3D mesh: '+str(p))
 pbr=sum(1 for o in meshes for mat in o.data.materials if mat and mat.use_nodes and any(n.type=='BSDF_PRINCIPLED' for n in mat.node_tree.nodes))
 if pbr==0:raise RuntimeError('No Principled PBR on imported GLB')
 return new,meshes,pbr

def rig():
 world=bpy.data.worlds.new('P04_FIXED_DUSK_WORLD');world.use_nodes=True
 world.node_tree.nodes['Background'].inputs['Color'].default_value=(.59,.40,.48,1)
 world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
 bpy.context.scene.world=world
 for name,pos,energy,color in [('P04_Key',(4,8,8),2.1,(1,.86,.74)),('P04_Fill',(-5,5,1),1.1,(.77,.79,1)),('P04_Rim',(1,6,-7),1.2,(1,.67,.77))]:
  l=bpy.data.lights.new(name,'SUN');l.energy=energy;l.color=color;l.angle=.24
  o=bpy.data.objects.new(name,l);bpy.context.collection.objects.link(o)
  p=coord(pos);t=coord((0,.55,0));o.location=p;o.rotation_euler=(t-p).to_track_quat('-Z','Y').to_euler()
def camera(name):
 pos,target,up,fov=CAM[name];p=coord(pos);t=coord(target);u=coord(up)
 forward=(t-p).normalized();right=forward.cross(u).normalized();actual=right.cross(forward).normalized()
 mat=Matrix(((right.x,actual.x,-forward.x),(right.y,actual.y,-forward.y),(right.z,actual.z,-forward.z)))
 cam=bpy.data.cameras.new('P04_Camera_'+name)
 obj=bpy.data.objects.new(cam.name,cam);bpy.context.collection.objects.link(obj)
 obj.location=p;obj.rotation_euler=mat.to_quaternion().to_euler()
 cam.type='PERSP';cam.sensor_fit='VERTICAL';cam.angle=math.radians(fov);cam.clip_start=.02;cam.clip_end=120
 bpy.context.scene.camera=obj

def review_water():
 bpy.ops.mesh.primitive_plane_add(size=2,location=(0,0,0));obj=bpy.context.object;obj.name='P04_REVIEW_ONLY_NOT_EXPORTED_WATER';obj.scale=(5,5,1)
 mat=bpy.data.materials.new('ReviewOnly_NavyWater');mat.use_nodes=True
 bsdf=mat.node_tree.nodes.get('Principled BSDF')
 bsdf.inputs['Base Color'].default_value=(.025,.04,.10,1)
 bsdf.inputs['Roughness'].default_value=.27
 obj.data.materials.append(mat)

def report_file(p):return {'name':p.name,'bytes':p.stat().st_size,'sha256':sha(p)}
def render_image(out,name,size,samples):
 scene=bpy.context.scene;scene.cycles.samples=samples
 scene.render.resolution_x=size
 scene.render.resolution_y=round(size*16/9) if name.endswith('9x16') else round(size*1.12)
 scene.render.filepath=str(out);bpy.ops.render.render(write_still=True)
 if not out.is_file() or out.stat().st_size<2000:raise RuntimeError('Actual Cycles PNG missing/empty '+str(out))
 return report_file(out)

def material_by_name(slot):
 candidates=[m for m in bpy.data.materials if m.name==slot or m.name.startswith(slot+'.')]
 if not candidates:raise RuntimeError('P0.4 clothing material absent '+slot)
 return candidates[0]
def set_palette(name):
 for key,hexval in zip(('ao_ba_ba_top','ao_ba_ba_pants'),PAL[name]):
  material=material_by_name(key);node=next((n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
  if node is None:raise RuntimeError('PBR variant BSDF absent: '+key)
  node.inputs['Base Color'].default_value=linear(hexval)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--root',required=True);ap.add_argument('--out',required=True)
 ap.add_argument('--revision',choices=('p03','p04'),required=True)
 ap.add_argument('--kind',choices=('actor','pair','palette'),required=True)
 ap.add_argument('--samples',type=int,default=32);ap.add_argument('--size',type=int,default=520)
 ap.add_argument('--quick',action='store_true')
 args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
 root=Path(args.root).resolve();out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
 p03=root/'p03_baseline/meditator_base.glb';p04=root/'meditator_female_ao_ba_ba_p04.glb';pad=root/'p02_baseline/lotus_pad_01.glb'
 actor=p03 if args.revision=='p03' else p04
 inputs=[actor] + ([pad] if args.kind=='pair' else [])
 for p in inputs:
  if not p.is_file():raise RuntimeError('Missing original source GLB '+str(p))
 bpy.ops.wm.read_factory_settings(use_empty=True)
 total_mesh=0;total_pbr=0
 if args.kind=='pair':
  _,meshes,count=import_glb(pad);total_mesh+=len(meshes);total_pbr+=count
 created,meshes,count=import_glb(actor);total_mesh+=len(meshes);total_pbr+=count
 if args.kind=='pair':
  own=set(created)
  for obj in created:
   if obj.parent not in own:obj.location.z+=.195
 if args.revision=='p04':
  names=[o.name.split('.')[0] for o in created]
  for n in ('SeatRoot','UpperBodyBreath','HeadAnchor','NameplateAnchor','FXAnchor'):
   if n not in names:raise RuntimeError('P0.4 required hierarchy node not imported: '+n)
 if not bpy.data.actions:raise RuntimeError('Missing imported sit_idle action')
 rig();sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=args.samples
 sc.render.image_settings.file_format='PNG';sc.render.resolution_percentage=100
 sc.view_settings.view_transform='AgX';sc.view_settings.exposure=0;sc.view_settings.gamma=1
 try:sc.view_settings.look='Medium High Contrast'
 except Exception:pass
 if args.revision=='p04' and args.kind in ('actor','pair'):
  camera('front' if args.kind=='actor' else 'pair_front');bpy.context.preferences.filepaths.save_version=0
  bl=out/f'meditator_female_p04_{args.kind}.blend';bpy.ops.wm.save_as_mainfile(filepath=str(bl))
 else:bl=None
 if args.kind=='pair':review_water()
 if args.kind=='palette':
  if args.revision!='p04':raise RuntimeError('Palette only p04')
  views=list(PAL)
 else:
  views=(['front','side','quarter','back','placket','backhair'] if args.kind=='actor' else ['pair_front','pair_quarter','medium_9x16','close_9x16'])
 if args.quick:views=views[:2]
 images=[]
 for view in views:
  if args.kind=='palette':set_palette(view);shot='quarter';filename='swatch_'+view
  else:shot=view;filename=args.revision+'_'+args.kind+'_'+view
  camera(shot)
  images.append(render_image(out/(filename+'_cycles.png'),shot,args.size,args.samples))
 if args.revision=='p04' and args.kind=='actor' and not args.quick:
  action=max(list(bpy.data.actions),key=lambda a:a.frame_range[1]-a.frame_range[0]);start,end=action.frame_range
  for t in (0,.5,1,1.5,2):
   sc.frame_set(round(start+(end-start)*t/2))
   for shot in ('front','back'):
    camera(shot);images.append(render_image(out/f'P04_idle_{shot}_t{t:.1f}_cycles.png',shot,args.size,args.samples))
 result={'status':'EXECUTED_ONLY_WHEN_THIS_JSON_EXISTS','blender':bpy.app.version_string,'engine':'Cycles CPU','samples':args.samples,
  'revision':args.revision,'kind':args.kind,'inputs':[report_file(f) for f in inputs],
  'realImportedMeshes':total_mesh,'pbrMaterialSlots':total_pbr,'animations':[a.name for a in bpy.data.actions],
  'cameraFOVAndLightingFixed':True,'AgX':True,'exposureEV':0,'worldStrength':.65,
  'originalBlend':report_file(bl) if bl else None,'images':images}
 (out/'case_report.json').write_text(json.dumps(result,indent=2)+'\n')
 print('[P04_CYCLES_COMPLETED]',args.revision,args.kind,len(images),flush=True)
if __name__=='__main__':main()
