"""P06C Blender 4.5+ REAL old P06B vs new P06C scalp occlusion A/B, matched actor+lotus cameras.
Zero paid tools. Executed status ONLY when owner PNG+JSON+stdout+BLEND exist.
Only hair shell fixed; preserve P06B nonhair, P02 lotus, original palette, 2s idle and all camera/light constants.
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
 'foot_macro_front':((0,.245,.84),(0,.078,.255),(0,1,0),33),
 'foot_macro_left3q':((-.45,.292,.72),(.095,.088,.245),(0,1,0),37),
 'foot_macro_right3q':((.45,.292,.72),(.095,.088,.245),(0,1,0),37),
 'foot_macro_side':((.70,.216,.24),(.120,.072,.22),(0,1,0),34),
 'foot_diag_top':((.45,.67,.52),(.13,.09,.23),(0,1,0),38),
 'foot_diagnostic_center_front':((.17,.245,.87),(.16,.069,.285),(0,1,0),33),
 'foot_diagnostic_center_3q':((.60,.26,.68),(.16,.075,.29),(0,1,0),36),
 'waist_side_right':((1.30,.30,.08),(0,.265,0),(0,1,0),29),
 'waist_side_left':((-1.30,.30,.08),(0,.265,0),(0,1,0),29),
 'waist_low_side_right':((1.07,.070,.30),(0,.265,0),(0,1,0),27),
 'waist_low_side_left':((-1.07,.070,.30),(0,.265,0),(0,1,0),27),
 'waist_under3q':((.96,.075,-.72),(0,.268,-.04),(0,1,0),30),
 'waist_front_close':((0,.22,1.15),(0,.275,0),(0,1,0),32),
 'seat_low_right':((1.45,.22,.38),(0,.25,0),(0,1,0),32),
 'seat_low_left':((-1.40,.27,.40),(0,.26,0),(0,1,0),32),
 'seat_under_3q':((.93,.035,-.74),(0,.21,-.07),(0,1,0),35),
 'hair_front':((0,1.11,1.12),(0,.995,0),(0,1,0),35),
 'hair_left':((-1.11,1.06,.12),(0,.995,0),(0,1,0),35),
 'hair_right':((1.11,1.06,.12),(0,.995,0),(0,1,0),35),
 'hair_back':((0,1.10,-1.16),(0,.995,0),(0,1,0),35),
 'hair_quarter':((.86,1.14,.80),(0,.995,0),(0,1,0),34),
 'hair_top':((.29,1.62,.28),(0,1.045,0),(0,1,0),35),
 'hair_left_3q':((-.87,1.14,.79),(0,.995,0),(0,1,0),34),
 'hair_right_3q':((.87,1.14,.79),(0,.995,0),(0,1,0),34),
 'hair_low_back':((.61,.80,-.82),(0,.975,0),(0,1,0),36),
}
PALETTES={
 'pastel_lilac':('#B9A4D7','#44435D'),'blush_rose':('#D998A6','#59515C'),
 'sage_green':('#94B6A0','#394D48'),'sky_blue':('#85B8D4','#35495F'),
 'warm_cream':('#E7CBAA','#665A59'),'terracotta':('#BD806B','#484044')}
SHA={
 'pad':'80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9',
 'p06b_cross':'d6add5fdd5ec7122c24aee774c1ea10cc0588643842c891e334ffd30c60ce4cb',
 'p06b_kneel':'db78a1b26bff1cd2dced82d4ed4d4255280cfb6eb3db3ea2dd5ab5b5674c0701',
 'p06c_cross':'c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4',
 'p06c_kneel':'38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad'
}

def sha(f):
 h=hashlib.sha256()
 with open(f,'rb') as handle:
  for chunk in iter(lambda:handle.read(1<<20),b''):h.update(chunk)
 return h.hexdigest()
def ref_file(root,revision):
 return {
  'p06b_cross':root/'../p6b/meditator_male_cross_prayer_p06b.glb',
  'p06b_kneel':root/'../p6b/meditator_male_kneel_prayer_p06b.glb',
  'p06c_cross':root/'meditator_male_cross_prayer_p06c.glb',
  'p06c_kneel':root/'meditator_male_kneel_prayer_p06c.glb',
 }[revision]

def glb_contract(path,revision):
 import struct
 dat=path.read_bytes()
 if dat[:4]!=b'glTF' or struct.unpack_from('<I',dat,4)[0]!=2 or struct.unpack_from('<I',dat,8)[0]!=len(dat):
  raise RuntimeError('Invalid GLB '+str(path))
 size,typ=struct.unpack_from('<II',dat,12)
 if typ!=0x4e4f534a:raise RuntimeError('Not glTF JSON chunk')
 g=json.loads(dat[20:20+size])
 variants=[x['name'] for x in g['extensions']['KHR_materials_variants']['variants']]
 assert variants==['pastel_lilac','blush_rose','sage_green','sky_blue','warm_cream','terracotta'],variants
 clips=sorted(a['name'] for a in g['animations'])
 expected=sorted(['sit_idle','cross_prayer_idle' if 'cross' in revision else 'kneel_prayer_idle'])
 assert clips==expected,(clips,expected)
 assert all(a in [n.get('name') for n in g['nodes']] for a in ('SeatRoot','UpperBodyBreath','HeadAnchor','NameplateAnchor','FXAnchor'))
 for clip in g['animations']:
  for sampler in clip['samplers']:
   assert g['accessors'][sampler['input']]['count']==17
 if revision.startswith('p06'):
  nm='hair_neat_male_scalp_coverage_p06c_mesh' if revision.startswith('p06c_') else 'hair_neat_male_soft_sidepart_p06b_mesh'
  hair=next(m for m in g['meshes'] if m['name']==nm)
  lo=g['accessors'][hair['primitives'][0]['attributes']['POSITION']]['min']
  assert lo[1]>.82,('Short male nape gate',lo)
 return {'clipNames':clips,'variants':variants,'meshCount':len(g['meshes'])}

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
 world=bpy.data.worlds.new('P06C_FIXED_WORLD');world.use_nodes=True
 world.node_tree.nodes['Background'].inputs['Color'].default_value=(.59,.40,.48,1)
 world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
 bpy.context.scene.world=world
 for name,pos,intensity,col in [('Key',(4,8,8),2.10,(1,.86,.74)),('Fill',(-5,5,1),1.10,(.77,.79,1)),('Rim',(1,6,-7),1.20,(1,.67,.77))]:
  lamp=bpy.data.lights.new('P06C_'+name,'SUN');lamp.energy=intensity;lamp.color=col;lamp.angle=.24
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
 ob=bpy.context.object;ob.name='P06C_REVIEW_WATER_NOT_RUNTIME_ASSET';ob.scale=(5,5,1)
 mat=bpy.data.materials.new('P06C_REVIEW_WATER');mat.use_nodes=True
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
 print('[P06C_CYCLES_RENDER]',out.name,flush=True)
 return dict(view=shot,**metadata(out))

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument('--root',required=True);ap.add_argument('--out',required=True)
 ap.add_argument('--revision',choices=('p06c_cross','p06c_kneel','p06b_cross','p06b_kneel'),required=True)
 ap.add_argument('--kind',choices=('actor','pair'),required=True)
 ap.add_argument('--samples',type=int,default=32);ap.add_argument('--size',type=int,default=520)
 ap.add_argument('--quick',action='store_true')
 args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])

 root=Path(args.root).resolve();out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
 actor=ref_file(root,args.revision);pad=root/'../p5f/p02_baseline/lotus_pad_01.glb'
 required=[actor]+([pad] if args.kind=='pair' else [])
 for path in required:
  if not path.is_file():raise RuntimeError('Missing original input GLB '+str(path))
  expected=SHA['pad' if path==pad else args.revision]
  if sha(path)!=expected:raise RuntimeError('Input SHA mismatch '+str(path))
  if path==actor:glb_contract(path,args.revision)
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
 if args.revision.startswith('p06c_') and args.kind in ('actor','pair'):
  camera('front' if args.kind=='actor' else 'pair_front');bpy.context.preferences.filepaths.save_version=0
  blend=out/f'meditator_{args.revision}_{args.kind}.blend'
  bpy.ops.wm.save_as_mainfile(filepath=str(blend))
 else:blend=None
 if args.kind=='actor':
  views=['hair_front','hair_top','hair_right_3q','hair_left','hair_right',
   'hair_back','hair_quarter','hair_left_3q','hair_low_back',
   'front','left','right','back','quarter','medium_9x16','close_9x16']
 elif args.kind=='pair':
  views=['pair_medium_9x16','pair_close_9x16','pair_front','pair_side']
 else:raise RuntimeError('Not allowed')
 if args.quick:
  views=['hair_front','hair_top','hair_right_3q'] if args.kind=='actor' else ['pair_medium_9x16']
 scene.frame_set(1)
 images=[]
 for view in views:
  shot=view;filename=f'{args.revision}_{args.kind}_{view}'
  images.append(render(out/(filename+'_cycles.png'),shot,(args.size if args.quick else max(720,args.size)) if shot.endswith('9x16') else args.size,args.samples))
 if args.revision.startswith('p06c_') and args.kind in ('actor','pair') and not args.quick:
  # Imported 17-keyframe action (no animation disabling or synthetic node motion).
  # Keep both old and new actor/pair in matching frames and cameras.
  act=max(list(bpy.data.actions),key=lambda a:a.frame_range[1]-a.frame_range[0])
  start,end=act.frame_range
  for t in (0.,.5,1.,1.5,2.):
   scene.frame_set(round(start+(end-start)*t/2.))
   selected=['hair_front','hair_right'] if args.kind=='actor' else ['pair_medium_9x16']
   for view in selected:
    images.append(render(out/(f'{args.revision}_{args.kind}_idle_{view}_{t:.1f}_cycles.png'),view,args.size,args.samples))

 diagnostic=[]
 if args.kind=='actor' and not args.quick:
  # DIAGNOSTIC ONLY: recolor immutable SKIN inside Blender AFTER genuine
  # asset/editable .blend save and AFTER ART renders. Not exported to GLB.
  skin_objects=[o for o in meshes if 'skin_rose_cream_UpperBodyBreath' in o.name]
  if not skin_objects:raise RuntimeError('Skin diagnostic scalp mesh unavailable')
  for ob in skin_objects:
   if len(ob.data.materials)<1:raise RuntimeError('No skin material')
   mat=ob.data.materials[0].copy();mat.name='DIAGNOSTIC_MAGENTA_SKIN_NOT_ART'
   bs=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
   if bs is None:raise RuntimeError('No diagnostic BSDF')
   bs.inputs['Base Color'].default_value=(1,.025,.30,1)
   ob.data.materials[0]=mat
  scene.frame_set(1)
  for v in ('hair_front','hair_top','hair_right_3q'):
   f=out/(f'{args.revision}_{args.kind}_DIAGNOSTIC_only_skin_magenta_{v}.png')
   diagnostic.append(render(f,v,args.size,args.samples))
 result={'status':'OWNER_EXECUTED_ONLY_IF_REAL_JSON_AND_PNG_EXIST' ,'source':'Real old P06B and new P06C SHA-pinned GLB reimports, exact same hair cameras and P02 lotus in pair' ,
  'blender':bpy.app.version_string,'engine':'Cycles CPU','samples':args.samples,'revision':args.revision,
  'kind':args.kind,'inputs':[metadata(x) for x in required],
  'meshCount':len(meshes),'principledMaterialSlots':pbr,
  'importedActionNames':[a.name for a in bpy.data.actions],
  'glbNativeContract':glb_contract(actor,args.revision),
  'worldStrength':.65,'AgX':True,'exposureEV':0,'sunLights':3,'cameraContract':'P06B original exact hair/front/top/right3Q/left/right/back/quarter and pair 9x16 medium/close; same Cycles CPU AgX EV0 World .65 and 3 suns; diagnostic recolor never stored in GLB' ,
  'originalBlend':metadata(blend) if blend else None,'images':images,
  'diagnosticImagesNotArtApproval':diagnostic}
 (out/'case_report.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
 print('[P06C_CYCLES_COMPLETED]',args.revision,args.kind,len(images),flush=True)
if __name__=='__main__':main()
