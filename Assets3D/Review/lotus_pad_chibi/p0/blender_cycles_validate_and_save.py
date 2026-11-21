"""OWNER WINDOWS Blender 4.5+ Cycles source editor & TRUE GLB render protocol.

Run via run_p0_blender.ps1. Saves actual editable pad, actor and seated-scene
.blend from previously verified original glTF GLB imports; no unexecuted
Blender render may be labeled PASS until owner supplies original output.
"""
import bpy,sys,argparse,math,json,hashlib
from pathlib import Path
from mathutils import Matrix,Vector


def sha(path):
 h=hashlib.sha256()
 with open(path,'rb') as f:
  for buf in iter(lambda:f.read(1024*1024),b''):h.update(buf)
 return h.hexdigest()

def to_blender(p):
 x,y,z=p
 return Vector((x,-z,y))

def world_lights():
 world=bpy.data.worlds.new('Dream_Dusk_P0_Review')
 world.use_nodes=True
 bg=world.node_tree.nodes.get('Background')
 bg.inputs['Color'].default_value=(.52,.35,.55,1)
 bg.inputs['Strength'].default_value=.65
 bpy.context.scene.world=world
 for name,pos,strength,color,angle in [
  ('Key_warm',(4,8,5),2.0,(1.,.82,.75),.21),
  ('Fill_lilac',(-5,5,1),1.1,(.73,.77,1.),.26),
  ('Rim_rose',(1,6,-5),1.3,(1.,.64,.80),.18)]:
  ld=bpy.data.lights.new(name,'SUN')
  ld.energy=strength;ld.angle=angle;ld.color=color
  obj=bpy.data.objects.new(name,ld);bpy.context.collection.objects.link(obj)
  p=to_blender(pos);target=to_blender((0,.5,0));obj.location=p
  obj.rotation_euler=(target-p).to_track_quat('-Z','Y').to_euler()

def set_camera(name,view):
 position,target,up,fov=view
 pos=to_blender(position);tar=to_blender(target);u=to_blender(up)
 direction=(tar-pos).normalized()
 right=direction.cross(u).normalized();true_up=right.cross(direction).normalized()
 orient=Matrix(((right.x,true_up.x,-direction.x),
                (right.y,true_up.y,-direction.y),
                (right.z,true_up.z,-direction.z)))
 data=bpy.data.cameras.new('P0_'+name)
 ob=bpy.data.objects.new('P0_'+name,data);bpy.context.collection.objects.link(ob)
 ob.location=pos;ob.rotation_euler=orient.to_quaternion().to_euler()
 data.type='PERSP';data.sensor_fit='VERTICAL';data.angle=math.radians(fov)
 data.clip_start=.02;data.clip_end=200
 bpy.context.scene.camera=ob
 return ob

VIEWS={
 'pad_top':((0,3.9,1.8),(0,.1,0),(0,0,-1),42),
 'pad_waterlevel':((2.6,.39,3.6),(0,.1,0),(0,1,0),40),
 'pad_side':((3.1,.25,.35),(0,.08,0),(0,1,0),40),
 'chibi_front':((0,.75,2.75),(0,.61,0),(0,1,0),33),
 'chibi_side':((2.7,.68,.12),(0,.61,0),(0,1,0),36),
 'chibi_back':((.3,.7,-2.8),(0,.61,0),(0,1,0),36),
 'chibi_three_quarter':((2.05,1.32,2.55),(0,.61,0),(0,1,0),41),
 'pair_front':((0,1.04,3.0),(0,.67,0),(0,1,0),42),
 'pair_side':((2.7,.82,.3),(0,.62,0),(0,1,0),42),
 'pair_back':((.3,.85,-3.0),(0,.65,0),(0,1,0),42),
 'pair_top':((1.5,3.8,2.2),(0,.55,0),(0,0,-1),49),
 'pair_9x16':((1.5,1.23,3.5),(0,.70,0),(0,1,0),43),
 'anchor_debug':((1.75,1.45,3.4),(0,.77,0),(0,1,0),43),
}

def load_model(path):
 before=set(bpy.context.scene.objects)
 bpy.ops.import_scene.gltf(filepath=str(path))
 created=[x for x in bpy.context.scene.objects if x not in before]
 meshes=[x for x in created if x.type=='MESH']
 if not meshes:raise RuntimeError('No mesh imported from actual GLB '+str(path))
 principled=0
 for obj in meshes:
  for mat in obj.data.materials:
   if mat and mat.use_nodes and any(n.type=='BSDF_PRINCIPLED' for n in mat.node_tree.nodes):principled+=1
 if principled==0:raise RuntimeError('GLTF imported without Principled PBR material nodes')
 return created,meshes

def add_preview_water():
 bpy.ops.mesh.primitive_plane_add(size=2,location=(0,0,0))
 obj=bpy.context.object;obj.name='ReviewWaterPlane_ONLY_NOT_EXPORTED'
 obj.scale=(6,6,1)
 mat=bpy.data.materials.new('PreviewOnly_NavyWater');mat.diffuse_color=(.022,.048,.145,1)
 mat.use_nodes=True
 bsdf=mat.node_tree.nodes.get('Principled BSDF')
 bsdf.inputs['Base Color'].default_value=(.022,.048,.145,1)
 bsdf.inputs['Roughness'].default_value=.20
 bsdf.inputs['Metallic'].default_value=.25
 obj.data.materials.append(mat)

def add_debug_markers():
 # Coordinates are in world glTF Y-up, actor has been placed on pad at Y=.195.
 for name,pt,color in [('SeatRoot',(0,.195,0),(.1,1,.3,1)),
                        ('HeadAnchor',(0,1.030,.04),(.2,.8,1,1)),
                        ('NameplateAnchor',(0,1.530,.03),(1,.8,.2,1)),
                        ('FXAnchor',(.37,1.0,.16),(1,.2,.6,1))]:
  p=to_blender(pt)
  bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.042,location=p)
  o=bpy.context.object;o.name='GIZMO_'+name
  m=bpy.data.materials.new('GIZMO_'+name);m.diffuse_color=color;o.data.materials.append(m)
  bpy.ops.object.text_add(location=p+Vector((.10,0,.04)))
  tx=bpy.context.object;tx.name='GIZMO_LABEL_'+name;tx.data.body=name;tx.data.size=.09

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--root',required=True)
 parser.add_argument('--out',required=True)
 parser.add_argument('--case',choices=['pad','actor','pair'],required=True)
 parser.add_argument('--samples',type=int,default=32)
 parser.add_argument('--size',type=int,default=520)
 parser.add_argument('--quick',action='store_true')
 cli=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
 a=parser.parse_args(cli)
 root=Path(a.root).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
 pad=root/'lotus_pad_01.glb';actor=root/'meditator_base.glb'
 bpy.ops.wm.read_factory_settings(use_empty=True)
 created=[];mesh=[]
 if a.case in ('pad','pair'):
  x,y=load_model(pad);created.extend(x);mesh.extend(y)
 if a.case in ('actor','pair'):
  x,y=load_model(actor);created.extend(x);mesh.extend(y)
  if a.case=='pair':
   # Blender +Z is glTF +Y. Translate ONLY imported actor top-level roots.
   created_set=set(x)
   for o in x:
    if o.parent not in created_set:o.location.z+=.195
 # Anchor import checks are scoped to actor only, never mock source geometry.
 if a.case in ('actor','pair'):
  names=[o.name for o in created]
  for required in ('SeatRoot','HeadAnchor','NameplateAnchor','FXAnchor','UpperBodyBreath'):
   if not any(n==required or n.startswith(required+'.') for n in names):
    raise RuntimeError('Missing glTF node '+required+' in Blender import')
  if len(bpy.data.actions)==0:raise RuntimeError('sit_idle native animation failed glTF import')
 world_lights()
 scene=bpy.context.scene
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=a.samples
 scene.render.film_transparent=False
 scene.render.image_settings.file_format='PNG';scene.render.resolution_percentage=100
 scene.view_settings.view_transform='AgX'
 try:scene.view_settings.look='Medium High Contrast'
 except (ValueError,TypeError):pass
 scene.view_settings.exposure=0;scene.view_settings.gamma=1
 scene.render.film_transparent=False
 set_camera('source_front',VIEWS['pair_front' if a.case=='pair' else 'chibi_front' if a.case=='actor' else 'pad_waterlevel'])
 bpy.context.preferences.filepaths.save_version=0
 blend_name={'pad':'lotus_pad_01.blend','actor':'meditator_base.blend','pair':'lotus_chibi_seated_review.blend'}[a.case]
 blend=out/blend_name
 bpy.ops.wm.save_as_mainfile(filepath=str(blend))
 if not blend.is_file():raise RuntimeError('No editable Blender project was saved')
 if a.case in ('pad','pair'):add_preview_water()
 views={'pad':['pad_top','pad_waterlevel','pad_side'],
        'actor':['chibi_front','chibi_side','chibi_back','chibi_three_quarter'],
        'pair':['pair_front','pair_side','pair_back','pair_top','pair_9x16','anchor_debug']}[a.case]
 if a.quick:views=views[:2]+(['pair_9x16'] if a.case=='pair' else [])
 renders=[]
 for v in views:
  if v=='anchor_debug':add_debug_markers()
  set_camera(v,VIEWS[v]);scene.render.resolution_x=a.size
  scene.render.resolution_y=round(a.size*16/9) if v=='pair_9x16' else round(a.size*1.12)
  img=out/(a.case+'_'+v+'_cycles.png');scene.render.filepath=str(img)
  bpy.ops.render.render(write_still=True)
  if not img.is_file():raise RuntimeError('Cycles PNG missing '+str(img))
  renders.append({'view':v,'file':img.name,'bytes':img.stat().st_size,'sha256':sha(img)})
  print('[P0_CYCLES_IMAGE]',a.case,v,flush=True)
 if a.case=='actor':
  # After glTF import, action.frame_range describes the original 2-second clip.
  end=max(float(action.frame_range[1]) for action in bpy.data.actions)
  frame_indices=[int(1+(end-1)*i/4) for i in range(5)]
  for fi in frame_indices:
   scene.frame_set(fi)
   set_camera('sit_idle',VIEWS['chibi_front'])
   scene.render.resolution_x=a.size;scene.render.resolution_y=round(a.size*1.12)
   img=out/f'sit_idle_frame_{fi:03d}.png';scene.render.filepath=str(img)
   bpy.ops.render.render(write_still=True)
   renders.append({'view':'sit_idle','frame':fi,'file':img.name,'bytes':img.stat().st_size,'sha256':sha(img)})
  scene.frame_set(1)
 report={'case':a.case,'status':'REAL_OWNER_RUN', 'blenderVersion':bpy.app.version_string,
   'engine':'Cycles CPU','samples':a.samples,'source':{str(p.name):sha(p) for p in [pad,actor] if p.is_file()},
   'originalImportedMeshCount':len(mesh), 'nativePrincipledMaterials':list(sorted({m.name for o in mesh for m in o.data.materials if m})),
   'importedGlTFAnimations':[x.name for x in bpy.data.actions],
   'anchorObjects':[x.name for x in created if x.name.split('.')[0] in ('SeatRoot','HeadAnchor','NameplateAnchor','FXAnchor')],
   'viewTransform':scene.view_settings.view_transform,'exposure':scene.view_settings.exposure,
   'blend':{'file':blend.name,'bytes':blend.stat().st_size,'sha256':sha(blend)},'images':renders}
 (out/(a.case+'_report.json')).write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
 print('[P0_CYCLES_COMPLETED]',a.case,'images',len(renders),flush=True)

if __name__=='__main__':main()
