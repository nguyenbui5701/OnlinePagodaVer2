# Blender 4.x native Cycles runner. Free/offline. Creates EDITABLE .blend and real Cycles PNGs.
# Input: four project GLBs plus exact original P02 GLB (provided by Owner checkout).
import bpy, sys, os, json, hashlib, math
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
from pathlib import Path

def args():
    a=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    def pick(flag,default): return a[a.index(flag)+1] if flag in a else default
    return Path(pick('--assets','.')).resolve(), Path(pick('--p02','')).resolve()
root,p02=args()
CONTEXT_ONLY = '--context-only' in sys.argv
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
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0
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
# When running only the four 9:16 proof frames, freeze the sixteen PASS single-object PNGs.
# Both SHA and bytes are verified from the last real Cycles manifest, before and after rendering.
isolated_files = [f'{kind}_{lod}_{view}_cycles.png'
                  for kind in ('bloom','bud') for lod in ('quality','eco')
                  for view in ('front','side','three_quarter','elevated')]
isolated_sha = {}
if CONTEXT_ONLY:
    previous_report = out/'cycles_manifest.json'
    if not previous_report.is_file():
        raise RuntimeError('P012B_CONTEXT_ONLY_NEEDS_EXISTING_20_IMAGE_MANIFEST')
    record = {r['file']:r for r in json.loads(previous_report.read_text(encoding='utf-8'))}
    for filename in isolated_files:
        p=out/filename
        if not p.is_file() or filename not in record:
            raise RuntimeError('P012B_MISSING_PASSED_ISOLATED_IMAGE: '+filename)
        payload=p.read_bytes()
        digest=hashlib.sha256(payload).hexdigest()
        if len(payload)!=record[filename]['bytes'] or digest!=record[filename]['sha256']:
            raise RuntimeError('P012B_ISOLATED_IMAGE_SHA_CHANGED_BEFORE_RENDER: '+filename)
        isolated_sha[filename]=(len(payload),digest)
    print('P012B_ISOLATED_EVIDENCE_LOCK_PASS',len(isolated_sha))

if not CONTEXT_ONLY:
    for key,col in collections.items():
        # Matched ECO/QUALITY camera, exposure, world and lights for each kind.
        active([key]);scene.render.resolution_x=640;scene.render.resolution_y=640
        target=(0,0,.27 if key.startswith('bloom') else .38)
        for view,pos in viewpoints.items():
            camera_pose(pos,target)
            scene.render.filepath=str(out/(key+'_'+view+'_cycles.png'))
            bpy.ops.render.render(write_still=True)

# Render-only scene staging; all frozen GLB geometry, materials and waterline remain unchanged.
# Original P02 lives behind both flowers. The bud is camera-left/foreground while the
# open bloom is camera-right/midground, so the bud is not hidden by the bloom shell.
# Values are Blender-meter X/Y offsets, GLB +Y-up already converted to Blender +Z-up.
context_positions = {
    'p02':   (0.0, 0.83),
    'bloom': (0.70, -0.80),
    'bud':   (-0.58, -1.15),
}
xy_offset(pad,*context_positions['p02'])
for name,col in collections.items():
    kind=name.split('_')[0]
    xy_offset(col,*context_positions[kind])

# Portrait render must NOT silently switch the Blender camera into a narrow vertical
# sensor fit; force the same horizontal field of view on 720x1280 as on 640x640.
cam.sensor_fit='HORIZONTAL'
cam.lens=46
scene.render.resolution_x=720;scene.render.resolution_y=1280

def projected_bounds(col):
    bpy.context.view_layer.update()
    verts=[]
    for o in col.all_objects:
        if o.type=='MESH':
            for point in o.bound_box:
                p=world_to_camera_view(scene,camera,o.matrix_world @ Vector(point))
                if p.z<=0: raise RuntimeError('P012B_SUBJECT_BEHIND_CAMERA: '+col.name)
                verts.append(p)
    if not verts: raise RuntimeError('P012B_NO_MESH_IN_CONTEXT: '+col.name)
    return (min(p.x for p in verts),max(p.x for p in verts),
            min(p.y for p in verts),max(p.y for p in verts))

def verify_three_subjects(view_name,kind):
    boxes={
        'p02':projected_bounds(pad),
        'bloom':projected_bounds(collections['bloom_'+kind]),
        'bud':projected_bounds(collections['bud_'+kind]),
    }
    for name,(left,right,bottom,top) in boxes.items():
        # All the actual mesh corners, not merely object origins, must be on frame.
        if left<.025 or right>.975 or bottom<.025 or top>.975:
            raise RuntimeError('P012B_CONTEXT_CROPPED '+view_name+' '+kind+' '+name+' '+str((left,right,bottom,top)))
        if right-left<.045 or top-bottom<.008:
            raise RuntimeError('P012B_CONTEXT_SUBJECT_TOO_SMALL '+view_name+' '+kind+' '+name)
    bloom=boxes['bloom'];bud=boxes['bud']
    horizontal_gap=max(bloom[0]-bud[1],bud[0]-bloom[1])
    if horizontal_gap<.035:
        raise RuntimeError('P012B_CONTEXT_BUD_BLOOM_NOT_SEPARATE '+view_name+' '+kind+' '+str(horizontal_gap))
    # The bud must have enough actual pixels to identify its pointed body/calyx.
    if (bud[1]-bud[0])*720<36 or (bud[3]-bud[2])*1280<42:
        raise RuntimeError('P012B_CONTEXT_BUD_TOO_SMALL '+view_name+' '+kind)
    for name,box in boxes.items():
        print('P012B_CONTEXT_PROJECTION',view_name,kind,name,
              'px',(round(box[0]*720),round(box[1]*720),
                    round(box[2]*1280),round(box[3]*1280)))
    print('P012B_CONTEXT_PROJECTED_THREE_SUBJECTS_PASS',view_name,kind)

# Four context frames only, preserving all 16 independent baseline images in context-only mode.
for kind in ('quality','eco'):
    active(['bloom_'+kind,'bud_'+kind],ctx=True)
    camera_pose((.35,-4.2,2.4),(0,-.15,.18))
    verify_three_subjects('p02_scale_context',kind)
    scene.render.filepath=str(out/('p02_scale_context_'+kind+'_720x1280_cycles.png'))
    bpy.ops.render.render(write_still=True)

active(['bloom_quality','bud_quality'],ctx=True)
for view_name,position,target in [
    ('water_level_low',(0,-4.6,.40),(0,-.12,.27)),
    ('aerial',(.30,-2.1,4.1),(0,-.10,.16)),
]:
    camera_pose(position,target)
    verify_three_subjects(view_name,'quality')
    scene.render.filepath=str(out/(view_name+'_quality_720x1280_cycles.png'))
    bpy.ops.render.render(write_still=True)

if CONTEXT_ONLY:
    for filename,(size,digest) in isolated_sha.items():
        data=(out/filename).read_bytes()
        if len(data)!=size or hashlib.sha256(data).hexdigest()!=digest:
            raise RuntimeError('P012B_ISOLATED_IMAGE_SHA_CHANGED_AFTER_RENDER: '+filename)
    print('P012B_16_ISOLATED_CYCLES_PRESERVED_SHA_PASS')
# All 4 imported GLBs and the render-only P02 scale reference remain editable in .blend.
active(['bloom_quality','bloom_eco','bud_quality','bud_eco'],ctx=True)
# Save the updated context staging along with editable source; disable .blend1 backup.
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(root/'P012B_botanicals_editable.blend'))
report=[]
for p in sorted(out.glob('*.png')):
    b=p.read_bytes();report.append(dict(file=p.name,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),renderer='Blender Cycles',samples=32))
(out/'cycles_manifest.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
if len(report)!=20: raise RuntimeError('P012B_EXPECTED_TOTAL_20_CYCLES_IMAGES')
blendfile=root/'P012B_botanicals_editable.blend'
entries=[blendfile]+sorted(out.glob('*.png'))
(out/'owner_sha256.txt').write_text(''.join(
    hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in entries
),encoding='utf-8')
if CONTEXT_ONLY:
    print('P012B_CONTEXT_ONLY_FINISHED 4 PNG; TOTAL_EVIDENCE_20',blendfile)
else:
    print('P012B_BLENDER_CYCLES_FINISHED',len(report),'PNG',blendfile)

