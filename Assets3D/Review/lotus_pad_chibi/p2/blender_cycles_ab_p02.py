"""P0-02 owner Blender 4.5+ TRUE Cycles fixed-rig p0.1/p0.2 asset A/B.
Only tool that may produce/declare Cycles PNGs and editable .blend.
Uses exactly original exported glTF2 GLBs; never regenerates geometry in Blender.
"""
from pathlib import Path
import bpy,sys,math,json,hashlib,argparse
from mathutils import Matrix,Vector

def sha(path):
 h=hashlib.sha256()
 with open(path,'rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def xyz_glb_to_blender(p):
 x,y,z=p;return Vector((x,-z,y))

def lights():
 world=bpy.data.worlds.new('P02_Cycles_Dusk_Fixed_Rig')
 world.use_nodes=True
 world.node_tree.nodes['Background'].inputs['Color'].default_value=(.59,.40,.48,1.)
 world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
 bpy.context.scene.world=world
 for name,pos,strength,color,angle in [
  ('Key_Amber',(4.,8.,8.),2.10,(1.,.86,.74),.24),
  ('Fill_Lilac',(-5.,5.,1.),1.10,(.77,.79,1.),.26),
  ('Rim_Rose',(1.,6.,-7.),1.20,(1.,.67,.77),.20)]:
  data=bpy.data.lights.new(name,'SUN');data.energy=strength;data.color=color;data.angle=angle
  ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob)
  o=xyz_glb_to_blender(pos);target=xyz_glb_to_blender((0,.55,0))
  ob.location=o;ob.rotation_euler=(target-o).to_track_quat('-Z','Y').to_euler()

def camera(viewname,views):
 pos,target,up,fov=views[viewname]
 p=xyz_glb_to_blender(pos);t=xyz_glb_to_blender(target);u=xyz_glb_to_blender(up)
 direct=(t-p).normalized();right=direct.cross(u).normalized();actual_up=right.cross(direct).normalized()
 m=Matrix(((right.x,actual_up.x,-direct.x),(right.y,actual_up.y,-direct.y),(right.z,actual_up.z,-direct.z)))
 data=bpy.data.cameras.new('Camera_'+viewname)
 ob=bpy.data.objects.new('Camera_'+viewname,data);bpy.context.collection.objects.link(ob)
 ob.location=p;ob.rotation_euler=m.to_quaternion().to_euler()
 data.type='PERSP';data.sensor_fit='VERTICAL';data.angle=math.radians(fov)
 data.clip_start=.02;data.clip_end=180
 bpy.context.scene.camera=ob
 return ob

VIEWS={
 'pad_top':((0,3.9,1.8),(0,.1,0),(0,0,-1),42),
 'pad_waterlevel':((2.6,.39,3.6),(0,.11,0),(0,1,0),40),
 'pad_side':((3.1,.25,.35),(0,.08,0),(0,1,0),40),
 'chibi_front':((0,.75,2.75),(0,.61,0),(0,1,0),33),
 'chibi_side':((2.7,.68,.12),(0,.61,0),(0,1,0),36),
 'chibi_three_quarter':((2.05,1.32,2.55),(0,.61,0),(0,1,0),41),
 'chibi_back':((.3,.7,-2.8),(0,.61,0),(0,1,0),36),
 'pair_front':((0,1.04,3.0),(0,.67,0),(0,1,0),42),
 'pair_three_quarter':((2.55,1.52,2.85),(0,.55,0),(0,1,0),47),
 'pair_medium_9x16':((1.75,1.26,4.1),(0,.59,0),(0,1,0),47),
 'pair_close_9x16':((1.30,1.22,2.55),(0,.74,.04),(0,1,0),43),
}

def load(path):
 before=set(bpy.context.scene.objects)
 bpy.ops.import_scene.gltf(filepath=str(path))
 new=[o for o in bpy.context.scene.objects if o not in before]
 meshes=[x for x in new if x.type=='MESH']
 if not meshes:raise RuntimeError('No imported real GLB mesh '+str(path))
 bsdf=sum(bool(m and m.use_nodes and any(n.type=='BSDF_PRINCIPLED' for n in m.node_tree.nodes))
          for o in meshes for m in o.data.materials)
 if not bsdf:raise RuntimeError('No native Principled PBR after GLB import')
 return new,meshes,bsdf

def add_water():
 # Review-only plane is deliberately absent from exported asset GLBs.
 bpy.ops.mesh.primitive_plane_add(size=2,location=(0,0,0))
 ob=bpy.context.object;ob.name='REVIEW_WATER_NOT_RUNTIME_ASSET';ob.scale=(6,6,1)
 mat=bpy.data.materials.new('ReviewOnly_NavyWater');mat.use_nodes=True
 p=mat.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(.017,.045,.103,1)
 p.inputs['Roughness'].default_value=.25;p.inputs['Metallic'].default_value=.12
 ob.data.materials.append(mat)

def add_anchor_debug():
 for name,p,color in [
  ('SeatRoot',(0,.195,0),(.2,1.,.37,1)),
  ('HeadAnchor',(0,1.030,.04),(.29,.83,1,1)),
  ('NameplateAnchor',(0,1.530,.03),(1.,.85,.2,1)),
  ('FXAnchor',(.37,1.,.16),(1.,.27,.6,1))]:
  bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.033,location=xyz_glb_to_blender(p))
  obj=bpy.context.object;obj.name='REVIEW_GIZMO_'+name
  mat=bpy.data.materials.new('Gizmo_'+name);mat.diffuse_color=color;obj.data.materials.append(mat)

def run():
 a=argparse.ArgumentParser()
 a.add_argument('--root',required=True);a.add_argument('--out',required=True)
 a.add_argument('--revision',choices=['p01','p02'],required=True)
 a.add_argument('--kind',choices=['pad','actor','pair'],required=True)
 a.add_argument('--samples',type=int,default=32);a.add_argument('--size',type=int,default=520)
 a.add_argument('--quick',action='store_true')
 opt=a.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
 root=Path(opt.root).resolve();out=Path(opt.out).resolve();out.mkdir(parents=True,exist_ok=True)
 folder=root/'p01_baseline' if opt.revision=='p01' else root
 pad=folder/'lotus_pad_01.glb';chibi=folder/'meditator_base.glb'
 for f in (pad,chibi):
  if not f.exists():raise RuntimeError('Missing original GLB '+str(f))
 bpy.ops.wm.read_factory_settings(use_empty=True)
 imported=[];model_meshes=[];bsdfs=0
 if opt.kind in ('pad','pair'):
  created,mesh,count=load(pad);imported.extend(created);model_meshes.extend(mesh);bsdfs+=count
 if opt.kind in ('actor','pair'):
  created,mesh,count=load(chibi);imported.extend(created);model_meshes.extend(mesh);bsdfs+=count
  if opt.kind=='pair':
   created_set=set(created)
   for o in created:
    if o.parent not in created_set:o.location.z+=.195
 if opt.kind in ('actor','pair'):
  names=[o.name.split('.')[0] for o in imported]
  for anchor in ('SeatRoot','UpperBodyBreath','HeadAnchor','NameplateAnchor','FXAnchor'):
   if anchor not in names:raise RuntimeError('Missing imported named anchor '+anchor)
  if not bpy.data.actions:raise RuntimeError('Native glTF sit_idle did not import into Blender')
 lights();scene=bpy.context.scene
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=opt.samples
 scene.render.image_settings.file_format='PNG';scene.render.resolution_percentage=100
 scene.view_settings.view_transform='AgX'
 try:scene.view_settings.look='Medium High Contrast'
 except (ValueError,TypeError):pass
 scene.view_settings.exposure=0;scene.view_settings.gamma=1
 scene.render.film_transparent=False
 views={
  'pad':['pad_top','pad_waterlevel','pad_side'],
  'actor':['chibi_front','chibi_side','chibi_three_quarter','chibi_back'],
  'pair':['pair_front','pair_three_quarter','pair_medium_9x16','pair_close_9x16']
 }[opt.kind]
 if opt.quick:
  views=views[:1]+([views[-1]] if len(views)>1 else [])
 if opt.revision=='p02':
  camera(views[0],VIEWS)
  bpy.context.preferences.filepaths.save_version=0
  name={'pad':'lotus_pad_01_p02.blend','actor':'meditator_base_p02.blend','pair':'lotus_chibi_pair_review_p02.blend'}[opt.kind]
  blend=out/name
  bpy.ops.wm.save_as_mainfile(filepath=str(blend))
 else:blend=None
 if opt.kind in ('pad','pair'):add_water()
 pics=[]
 for view in views:
  camera(view,VIEWS)
  scene.render.resolution_x=opt.size
  scene.render.resolution_y=round(opt.size*16/9) if view.endswith('9x16') else round(opt.size*1.12)
  scene.render.filepath=str(out/f'{opt.revision}_{opt.kind}_{view}_cycles.png')
  bpy.ops.render.render(write_still=True)
  file=Path(scene.render.filepath)
  if not file.exists():raise RuntimeError('Missing actual Cycles PNG '+str(file))
  pics.append(dict(view=view,file=file.name,bytes=file.stat().st_size,sha256=sha(file)))
  print('[P02_CYCLES_IMAGE]',opt.revision,opt.kind,view,flush=True)
 if opt.kind=='actor' and not opt.quick:
  # 0, .5, 1, 1.5, 2 seconds at true glTF clip sample frames.
  all_actions=list(bpy.data.actions);action=max(all_actions,key=lambda act:act.frame_range[1]-act.frame_range[0])
  start,end=map(float,action.frame_range)
  for t in (0.,.5,1.,1.5,2.):
   scene.frame_set(int(round(start+(end-start)*t/2.)))
   camera('chibi_front',VIEWS)
   scene.render.resolution_x=opt.size;scene.render.resolution_y=round(opt.size*1.12)
   file=out/f'{opt.revision}_sit_idle_t{t:.1f}_cycles.png';scene.render.filepath=str(file)
   bpy.ops.render.render(write_still=True)
   if not file.exists():raise RuntimeError('Missing idle still '+str(file))
   pics.append(dict(view='sit_idle',timeSeconds=t,file=file.name,bytes=file.stat().st_size,sha256=sha(file)))
 report={
   'status':'ACTUAL_OWNER_EXECUTION','revision':opt.revision,'kind':opt.kind,
   'blenderVersion':bpy.app.version_string,'engine':'Cycles CPU','samples':opt.samples,
   'viewTransform':scene.view_settings.view_transform,'exposureEV':scene.view_settings.exposure,
   'worldStrength':.65,'lighting':'fixed warm key + lilac fill + rose rim',
   'sourceGLBs':{f.name:{'bytes':f.stat().st_size,'sha256':sha(f)} for f in ((pad,chibi) if opt.kind=='pair' else ((pad,) if opt.kind=='pad' else (chibi,)))},
   'importedMeshCount':len(model_meshes),'principledMaterialSlots':bsdfs,
   'animationNames':[x.name for x in bpy.data.actions],
   'originalBlender':dict(file=blend.name,bytes=blend.stat().st_size,sha256=sha(blend)) if blend else None,
   'images':pics
 }
 (out/'case_report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
 print('[P02_CYCLES_COMPLETED]',opt.revision,opt.kind,len(pics),flush=True)

if __name__=='__main__':run()
