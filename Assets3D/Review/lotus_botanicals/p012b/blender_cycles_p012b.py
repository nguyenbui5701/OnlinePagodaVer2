# Blender 4.x native Cycles runner. Free/offline. Creates EDITABLE .blend and real Cycles PNGs.
# Input: four project GLBs plus exact original P02 GLB (provided by Owner checkout).
import bpy, sys, os, json, hashlib, math
from mathutils import Vector
from pathlib import Path

def args():
    a=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    def pick(flag,default): return a[a.index(flag)+1] if flag in a else default
    return Path(pick('--assets','.')).resolve(), Path(pick('--p02','')).resolve()
root,p02=args()
paths=[root/(f'lotus_{kind}_p012b_{lod}.glb') for kind in ('bloom','bud') for lod in ('quality','eco')]
for p in paths:
    if not p.is_file(): raise FileNotFoundError('Missing original GLB: '+str(p))
if not p02.is_file(): raise FileNotFoundError('Missing P02 baseline GLB: '+str(p02))
expected=json.loads((root/'asset_manifest.json').read_text(encoding='utf-8'))
for a in expected['assets']:
    f=root/a['filename']; raw=f.read_bytes(); actual=hashlib.sha256(raw).hexdigest()
    if len(raw)!=a['bytes'] or actual!=a['sha256']: raise RuntimeError('GLB manifest hash/byte mismatch: '+str(f))
# P02 exact source check
if hashlib.sha256(p02.read_bytes()).hexdigest()!=expected['baseline']['p02PadSHA256']:
    raise RuntimeError('P02 original checksum mismatch: '+str(p02))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=32; scene.cycles.device='CPU'
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='Medium High Contrast';scene.view_settings.exposure=0
scene.world=bpy.data.worlds.new('P012B_Dusk_World');scene.world.use_nodes=True
bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.06,.07,.12,1);bg.inputs['Strength'].default_value=.43

def import_collection(key,path):
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    new=list(set(bpy.data.objects)-before)
    col=bpy.data.collections.new(key);scene.collection.children.link(col)
    for o in new:
        for old in list(o.users_collection):old.objects.unlink(o)
        col.objects.link(o)
    return col
collections={}
for key,path in zip(['bloom_quality','bloom_eco','bud_quality','bud_eco'],paths):
    collections[key]=import_collection(key,path)
pad=import_collection('P02_SCALE_REFERENCE_ONLY',p02)
# Keep imported P02 as context only. It must never appear in any new exported GLB.
def mat(name,base,rough,metal):
    m=bpy.data.materials.new(name);m.diffuse_color=(*base,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*base,1)
    bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    return m
water=mat('Render_only_dark_twilight_water',(.052,.064,.13),.27,.2)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.008));plane=bpy.context.object;plane.name='RENDER_ONLY_WaterPlane';plane.data.materials.append(water)
# glTF +Y up is converted to Blender +Z by the official glTF importer.
def light(name,loc,color,power,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=loc
    return ob
light('P012B_Warm_Key',(1.2,-1.5,2.3),(1,.81,.69),280,3.0)
light('P012B_Cool_Fill',(-1.9,.7,1.9),(.47,.59,1),240,3.5)
light('P012B_Soft_Rim',(0.2,1.3,2.7),(.92,.67,.79),180,2.8)
cam=bpy.data.cameras.new('P012B_Matched_Camera');camera=bpy.data.objects.new('P012B_Matched_Camera',cam)
scene.collection.objects.link(camera);scene.camera=camera;cam.type='PERSP';cam.lens=46

def camera_pose(pos,target):
    camera.location=pos
    direction=Vector(target)-camera.location
    camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()

def active(names,ctx=False):
    for name,col in collections.items():
        show=name in names
        for o in col.all_objects:o.hide_render=not show
    for o in pad.all_objects:o.hide_render=not ctx
    plane.hide_render=not ctx

def xy_offset(col,x,y):
    # Only shift top-level imported GLB roots, preserving original child transforms.
    for o in col.objects:
        if o.parent is None:o.location.x=x;o.location.y=y

out=root/'P012B_Cycles_Evidence';out.mkdir(exist_ok=True)
viewpoints={
 'front':(0,-1.55,.74),
 'side':(1.55,0,.74),
 'three_quarter':(1.16,-1.16,.86),
 'elevated':(.82,-.72,1.6)
}
for key,col in collections.items():
    # Matched ECO/QUALITY camera, exposure, world and lights for each kind.
    active([key]);scene.render.resolution_x=640;scene.render.resolution_y=640
    target=(0,0,.27 if key.startswith('bloom') else .38)
    for view,pos in viewpoints.items():
        camera_pose(pos,target)
        scene.render.filepath=str(out/(key+'_'+view+'_cycles.png'))
        bpy.ops.render.render(write_still=True)
# Context: actual original P02, all from imported original GLBs
for kind in ('quality','eco'):
    xy_offset(pad,-1.05,0)
    xy_offset(collections['bloom_'+kind],.73,-.05)
    xy_offset(collections['bud_'+kind],1.23,.25)
    active(['bloom_'+kind,'bud_'+kind],ctx=True)
    scene.render.resolution_x=720;scene.render.resolution_y=1280
    camera_pose((2.1,-3.1,1.65),(.15,0,.2))
    scene.render.filepath=str(out/('p02_scale_context_'+kind+'_720x1280_cycles.png'))
    bpy.ops.render.render(write_still=True)
# One low water-level angle and one elevated view of the two botanicals + pad
active(['bloom_quality','bud_quality'],ctx=True)
scene.render.resolution_x=720;scene.render.resolution_y=1280
for key,pos,target in [
    ('water_level_low',(1.5,-3.4,.25),(.2,0,.22)),
    ('aerial',(.9,-2.4,3.8),(.0,0,.03))]:
    camera_pose(pos,target)
    scene.render.filepath=str(out/(key+'_quality_720x1280_cycles.png'))
    bpy.ops.render.render(write_still=True)
# All 4 imported GLBs and the render-only P02 scale reference remain editable in .blend.
active(['bloom_quality','bloom_eco','bud_quality','bud_eco'],ctx=True)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'P012B_botanicals_editable.blend'))
report=[]
for p in sorted(out.glob('*.png')):
    b=p.read_bytes();report.append(dict(file=p.name,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),renderer='Blender Cycles',samples=32))
(out/'cycles_manifest.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('P012B_BLENDER_CYCLES_FINISHED',len(report),'PNG',root/'P012B_botanicals_editable.blend')
