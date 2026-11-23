"""P05C Blender 4.5+ true Cycles baseline P05B vs P05C identical GLB reimport.
Zero paid tools. Executed status ONLY when owner PNG+JSON+stdout+BLEND exist.
Four exact old/new P05B/P05C actor GLBs; six variants share geometry.
"""
from pathlib import Path
import bpy,sys,math,json,hashlib,argparse
from mathutils import Vector,Matrix

CAM={
 'front':((0,.91,2.58),(0,.60,0),(0,1,0),36),
 'left':((-2.6,.88,.13),(0,.61,0),(0,1,0),36),
 'right':((2.6,.88,.13),(0,.61,0),(0,1,0),36),
 'hands_left_3q':((-.72,.675,1.10),(0,.53,.352),(0,1,0),29),
 'hands_right_3q':((.72,.675,1.10),(0,.53,.352),(0,1,0),29),
 'hands_contact_diag':((.36,.72,.64),(0,.53,.35),(0,1,0),28),
 'torso_front':((0,.73,1.91),(0,.48,.15),(0,1,0),35),
 'torso_3q':((1.06,.88,1.75),(0,.51,.13),(0,1,0),35),
 'quarter':((2.05,1.22,2.37),(0,.63,0),(0,1,0),40),
 'back':((.08,.87,-2.58),(0,.61,0),(0,1,0),36),
 'hands_front':((0,.64,1.45),(0,.53,.28),(0,1,0),32),
 'hands_side':((1.18,.67,.58),(0,.53,.26),(0,1,0),38),
 'knees_front':((0,.36,1.42),(0,.16,.12),(0,1,0),38),
 'knees_side':((1.24,.32,.55),(0,.15,.005),(0,1,0),41),
 'full_9x16':((1.52,1.45,3.65),(0,.57,0),(0,1,0),43),
 'medium_9x16':((1.18,1.29,2.92),(0,.61,0),(0,1,0),42),
 'close_9x16':((1.3,1.22,2.55),(0,.74,.04),(0,1,0),43),
 'pair_front':((0,1.04,3.0),(0,.67,0),(0,1,0),42),
 'pair_quarter':((2.55,1.52,2.85),(0,.55,0),(0,1,0),47),
 'pair_side':((2.75,.62,.43),(0,.45,0),(0,1,0),42),
 'pair_full_9x16':((1.52,1.45,3.65),(0,.55,0),(0,1,0),43),
 'pair_medium_9x16':((1.18,1.29,2.92),(0,.61,0),(0,1,0),42),
 'pair_close_9x16':((1.3,1.22,2.55),(0,.74,.04),(0,1,0),43),
}
PALETTES={
 'pastel_lilac':('#B9A4D7','#44435D'),'blush_rose':('#D998A6','#59515C'),
 'sage_green':('#94B6A0','#394D48'),'sky_blue':('#85B8D4','#35495F'),
 'warm_cream':('#E7CBAA','#665A59'),'terracotta':('#BD806B','#484044')}
SHA={
 'pad':'80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9',
 'p05b_cross':'81e8548cf6e46d9f5ff60c7bdf342ac1857015140e7d06d67dbd9284054137fd',
 'p05b_kneel':'533b84cba69332107ea25c57ed952b76c8276d4971a558496e4caf7aea400e9f',
 'p05c_cross':'1da8c12982165cf57e2ef678013cdd57b67bba7fd6c08e2979c267599d35e5bf',
 'p05c_kneel':'a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac'
}
def sha(f):
 h=hashlib.sha256()
 with open(f,'rb') as handle:
  for chunk in iter(lambda:handle.read(1<<20),b''):h.update(chunk)
 return h.hexdigest()
def ref_file(root,revision):
 return {
 'p05b_cross':root/'p05b_baseline/meditator_female_cross_prayer_p05b.glb',
 'p05b_kneel':root/'p05b_baseline/meditator_female_kneel_prayer_p05b.glb',
 'p05c_cross':root/'meditator_female_cross_prayer_p05c.glb',
 'p05c_kneel':root/'meditator_female_kneel_prayer_p05c.glb'
 }[revision]
def metadata(f):return {'file':f.name,'bytes':f.stat().st_size,'sha256':sha(f)}
def coord(v):return Vector((v[0],-v[2],v[1]))

def import_glb(path):
 before=set(bpy.context.scene.objects)
 bpy.ops.import_scene.gltf(filepath=str(path))
 created=[o for o in bpy.context.scene.objects if o not in before]
 meshes=[x for x in created if x.type=='MESH']
 if not meshes:raise RuntimeError('No actual imported GLB geometry '+str(path))
 pbr=sum(1 for o in meshes for m in o.data.materials if m and m.use_nodes and any(n.type=='BSDF_PRINCIPLED' for n in m.node_tree.nodes))
 if pbr==0:raise RuntimeError('No imported glTF Principled PBR materials')
 return created,meshes,pbr

def rig():
 world=bpy.data.worlds.new('P05C_FIXED_WORLD');world.use_nodes=True
 world.node_tree.nodes['Background'].inputs['Color'].default_value=(.59,.40,.48,1)
 world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
 bpy.context.scene.world=world
 for name,pos,intensity,col in [('Key',(4,8,8),2.10,(1,.86,.74)),('Fill',(-5,5,1),1.10,(.77,.79,1)),('Rim',(1,6,-7),1.20,(1,.67,.77))]:
  lamp=bpy.data.lights.new('P05C_'+name,'SUN');lamp.energy=intensity;lamp.color=col;lamp.angle=.24
  ob=bpy.data.objects.new(lamp.name,lamp);bpy.context.collection.objects.link(ob)
  point=coord(pos);target=coord((0,.55,0));ob.location=point;ob.rotation_euler=(target-point).to_track_quat('-Z','Y').to_euler()

def camera(view):
 pos,target,up,deg=CAM[view];p=coord(pos);t=coord(target);u=coord(up)
 forward=(t-p).normalized();right=forward.cross(u).normalized();actual=right.cross(forward).normalized()
 rot=Matrix(((right.x,actual.x,-forward.x),(right.y,actual.y,-forward.y),(right.z,actual.z,-forward.z)))
 data=bpy.data.cameras.new('Camera_'+view);ob=bpy.data.objects.new(data.name,data)
 bpy.context.collection.objects.link(ob);ob.location=p;ob.rotation_euler=rot.to_quaternion().to_euler()
 data.sensor_fit='VERTICAL';data.angle=math.radians(deg);data.clip_start=.02;data.clip_end=100
 bpy.context.scene.camera=ob

def water():
 bpy.ops.mesh.primitive_plane_add(size=2,location=(0,0,0))
 ob=bpy.context.object;ob.name='P05C_REVIEW_WATER_NOT_RUNTIME_ASSET';ob.scale=(5,5,1)
 mat=bpy.data.materials.new('P05C_REVIEW_WATER');mat.use_nodes=True
 bsdf=mat.node_tree.nodes.get('Principled BSDF')
 bsdf.inputs['Base Color'].default_value=(.025,.04,.10,1)
 bsdf.inputs['Roughness'].default_value=.27;ob.data.materials.append(mat)

def srgb_linear(s):
 f=[int(s[i:i+2],16)/255 for i in (1,3,5)]
 return [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in f]+[1.]
def switch_palette(name):
 # This only changes two selected *imported material instances* in this case.
 # The native GLB's six variant mappings are separately checked from JSON.
 for slot,hexcode in zip(('ao_ba_ba_top','ao_ba_ba_pants'),PALETTES[name]):
  candidates=[mat for mat in bpy.data.materials if mat.name==slot or mat.name.startswith(slot+'.')]
  if not candidates:raise RuntimeError('Missing clothing material '+slot)
  material=candidates[0];node=next((n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
  if node is None:raise RuntimeError('Missing BSDF for '+slot)
  node.inputs['Base Color'].default_value=srgb_linear(hexcode)

def render(out,shot,size,samples):
 scene=bpy.context.scene;camera(shot)
 scene.cycles.samples=samples;scene.render.resolution_x=size
 scene.render.resolution_y=round(size*16/9) if shot.endswith('9x16') else round(size*1.12)
 scene.render.image_settings.file_format='PNG';scene.render.filepath=str(out)
 bpy.ops.render.render(write_still=True)
 if not out.exists() or out.stat().st_size<2500:raise RuntimeError('No actual Cycles PNG '+str(out))
 print('[P05C_CYCLES_RENDER]',out.name,flush=True)
 return dict(view=shot,**metadata(out))

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument('--root',required=True);ap.add_argument('--out',required=True)
 ap.add_argument('--revision',choices=tuple(k for k in SHA if k!='pad'),required=True)
 ap.add_argument('--kind',choices=('actor','pair','palette'),required=True)
 ap.add_argument('--samples',type=int,default=32);ap.add_argument('--size',type=int,default=520)
 ap.add_argument('--quick',action='store_true')
 args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
 if args.kind=='palette' and not args.revision.startswith('p05c'):raise RuntimeError('P0.5b variants only new revisions')
 root=Path(args.root).resolve();out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
 actor=ref_file(root,args.revision);pad=root/'p02_baseline/lotus_pad_01.glb'
 required=[actor]+([pad] if args.kind=='pair' else [])
 for path in required:
  if not path.is_file():raise RuntimeError('Missing original input GLB '+str(path))
  expected=SHA['pad' if path==pad else args.revision]
  if sha(path)!=expected:raise RuntimeError('Input SHA mismatch '+str(path))
 bpy.ops.wm.read_factory_settings(use_empty=True)
 meshes=[];pbr=0
 if args.kind=='pair':
  _,m,c=import_glb(pad);meshes+=m;pbr+=c
 created,m,c=import_glb(actor);meshes+=m;pbr+=c
 if args.kind=='pair':
  owned=set(created)
  for ob in created:
   if ob.parent not in owned:ob.location.z+=.195
 names=[o.name.split('.')[0] for o in created]
 for a in ('SeatRoot','UpperBodyBreath','HeadAnchor','NameplateAnchor','FXAnchor'):
   if a not in names:raise RuntimeError('Missing named GLB anchor in Blender: '+a)
 if not bpy.data.actions:raise RuntimeError('No imported real glTF sit_idle/pose animation action')
 rig();scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU'
 scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.view_settings.exposure=0;scene.view_settings.gamma=1
 try:scene.view_settings.look='Medium High Contrast'
 except Exception:pass
 if args.kind=='pair':water()
 if args.revision.startswith('p05c') and args.kind in ('actor','pair'):
  camera('front' if args.kind=='actor' else 'pair_front');bpy.context.preferences.filepaths.save_version=0
  blend=out/f'meditator_female_{args.revision}_prayer_{args.kind}.blend'
  bpy.ops.wm.save_as_mainfile(filepath=str(blend))
 else:blend=None
 if args.kind=='actor':views=['front','hands_front','hands_side','hands_left_3q','hands_right_3q','torso_front','torso_3q','right','medium_9x16','close_9x16']+(['hands_contact_diag'] if args.revision.startswith('p05c') else [])
 elif args.kind=='pair':views=['pair_front','pair_full_9x16','pair_medium_9x16','pair_close_9x16']
 else:views=list(PALETTES)
 if args.quick:views=views[:2]
 images=[]
 for view in views:
  if args.kind=='palette':
   switch_palette(view);shot='quarter';filename=f'{args.revision}_palette_{view}'
  else:shot=view;filename=f'{args.revision}_{args.kind}_{view}'
  images.append(render(out/(filename+'_cycles.png'),shot,(args.size if args.quick else max(720,args.size)) if shot.endswith('9x16') else args.size,args.samples))
 if args.kind=='actor' and args.revision.startswith('p05c') and not args.quick:
  # Original glTF has both sit_idle and <pose>_idle, same 17 timestamps/translation.
  # Actual action animation imported from GLB, not procedural camera moves.
  act=max(list(bpy.data.actions),key=lambda a:a.frame_range[1]-a.frame_range[0]);start,end=act.frame_range
  for t in (0.,.5,1.,1.5,2.):
   scene.frame_set(round(start+(end-start)*t/2.))
   for view in ('hands_front','hands_side'):
    images.append(render(out/(f'{args.revision}_idle_{view}_{t:.1f}_cycles.png'),view,args.size,args.samples))
 result={'status':'OWNER_EXECUTED_ONLY_IF_REAL_JSON_AND_PNG_EXIST' ,'source':'reimport actual exported P05b/P05c GLB' ,
  'blender':bpy.app.version_string,'engine':'Cycles CPU','samples':args.samples,'revision':args.revision,
  'kind':args.kind,'inputs':[metadata(x) for x in required],
  'meshCount':len(meshes),'principledMaterialSlots':pbr,
  'importedActionNames':[a.name for a in bpy.data.actions],
  'worldStrength':.65,'AgX':True,'exposureEV':0,'sunLights':3,'cameraContract':'P05_CAMERA_CONTRACT.json + exact P05b macro-left/right/torso, new diagnostic separately labeled' ,
  'originalBlend':metadata(blend) if blend else None,'images':images}
 (out/'case_report.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
 print('[P05C_CYCLES_COMPLETED]',args.revision,args.kind,len(images),flush=True)
if __name__=='__main__':main()
