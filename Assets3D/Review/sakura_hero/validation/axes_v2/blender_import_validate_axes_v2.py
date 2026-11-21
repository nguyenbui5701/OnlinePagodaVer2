"""Sakura R09 — AXES V2 independent Blender Cycles PBR inspection.

Run in Blender 4.x, with --model, --out and --variant after -- in CLI.
Axes V2 corrects glTF Y-up to Blender Z-up camera/light coordinates.
This patch has NOT been run in Blender in the AI Visual environment (Blender absent).
It imports the original GLB, preserves imported materials, saves an editable .blend,
and renders reproducible perspective cameras using Cycles CPU / world lighting.
This is a separate PBR rig from the VTK IBL scene, not pixel-identical to VTK.
"""
import os, sys, json, hashlib, argparse, math
from pathlib import Path
import bpy
from mathutils import Vector, Matrix

VIEWS={
    'top':((3,54,10),(0,13.5,0),(0,0,-1),50),
    'aerial_e':((15,54,7),(0,13.5,0),(0,0,-1),50),
    'aerial_w':((-13,54,8),(0,13.5,0),(0,0,-1),50),
    'aerial_n':((5,54,-15),(0,13.5,0),(0,0,-1),50),
    'aerial_s':((-6,54,18),(0,13.5,0),(0,0,-1),50),
    'three_quarter':((31,25,31),(0,11.6,0),(0,1,0),44),
    'under':((3,4.8,18.5),(0,11.9,0),(0,1,0),44),
    'trunk_33s':((4.8,4,11.5),(0,6.6,0),(0,1,0),56),
}
LIGHTS=[
  {'name':'R09_Key','position':(22,40,26),'energy':2.1,'color':(1.0,.84,.82),'angle':.12},
  {'name':'R09_Rim','position':(-18,23,-15),'energy':1.05,'color':(1.0,.76,.89),'angle':.17},
  {'name':'R09_LowerFill','position':(6,3,18),'energy':.72,'color':(1.0,.74,.83),'angle':.32},
]

def gltf_yup_to_blender_zup(p):
    """Right-handed glTF world +Y-up -> Blender world +Z-up.

    Rotation Rx(+90 deg): (x,y,z) -> (x,-z,y).
    Apply to camera positions, targets, VIEW-UP, and sun light positions.
    This matches Blender's glTF importer axis adjustment; DO NOT edit GLB bytes.
    """
    x,y,z=p
    return (x,-z,y)

def imported_world_bounds(objects):
    # Blender world-space bounds, including the transform applied by its GLB importer.
    pts=[o.matrix_world @ Vector(v) for o in objects for v in o.bound_box]
    lo=[min(p[i] for p in pts) for i in range(3)]
    hi=[max(p[i] for p in pts) for i in range(3)]
    return lo,hi

def sha(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()

def aim(obj,pos,target):
    obj.location=pos
    direction=Vector(target)-obj.location
    obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()

def load_and_set_lighting(path):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(path))
    imported=[obj for obj in bpy.context.scene.objects if obj.type=='MESH']
    if not imported:raise RuntimeError('GLB contains no imported meshes')
    mats={m.name:m for o in imported for m in o.data.materials if m is not None}
    if not mats:raise RuntimeError('GLB import has no materials')
    # Keep GLB imported material nodes/Principled factors unchanged — crucial truth gate.
    for n,m in mats.items():
        if not m.use_nodes:raise RuntimeError('material not node based: '+n)
        if not any(node.type=='BSDF_PRINCIPLED' for node in m.node_tree.nodes):
            raise RuntimeError('no Principled BSDF after glTF import: '+n)
    world=bpy.data.worlds.new('R09_Dusk_Constant_World')
    world.use_nodes=True
    bg=world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value=(.69,.47,.60,1.0)
    bg.inputs['Strength'].default_value=.65
    bpy.context.scene.world=world
    for item in LIGHTS:
        lamp=bpy.data.lights.new(item['name'],'SUN')
        lamp.energy=item['energy'];lamp.color=item['color'];lamp.angle=item['angle']
        obj=bpy.data.objects.new(item['name'],lamp)
        bpy.context.collection.objects.link(obj)
        aim(obj,gltf_yup_to_blender_zup(item['position']),gltf_yup_to_blender_zup((0,9,0)))
    return imported,mats

def set_camera(name):
    pos_yup,target_yup,up_yup,deg=VIEWS[name]
    pos=gltf_yup_to_blender_zup(pos_yup)
    target=gltf_yup_to_blender_zup(target_yup)
    up=gltf_yup_to_blender_zup(up_yup)
    data=bpy.data.cameras.new('Camera_R09_'+name)
    obj=bpy.data.objects.new('Camera_R09_'+name,data)
    bpy.context.collection.objects.link(obj)
    aim(obj,pos,target)
    # Blender mathutils.to_track_quat uses world Z-up tracking; force the
    # original fixed camera up vector with explicit orthonormal basis instead.
    forward=(Vector(target)-Vector(pos)).normalized()
    nominal=Vector(up)
    right=forward.cross(nominal).normalized()
    true_up=right.cross(forward).normalized()
    mat=Matrix(((right.x,true_up.x,-forward.x),
                (right.y,true_up.y,-forward.y),
                (right.z,true_up.z,-forward.z)))
    obj.rotation_euler=mat.to_quaternion().to_euler()
    # VTK SetViewAngle uses vertical FOV; do not let Blender AUTO choose horizontal.
    data.type='PERSP'; data.sensor_fit='VERTICAL'
    data.angle=math.radians(deg); data.clip_start=.05; data.clip_end=500
    bpy.context.scene.camera=obj
    return obj

def main():
    cli=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    p=argparse.ArgumentParser();p.add_argument('--model',required=True)
    p.add_argument('--out',required=True);p.add_argument('--variant',default='quality')
    p.add_argument('--samples',type=int,default=32);p.add_argument('--size',type=int,default=520)
    args=p.parse_args(cli)
    model=Path(args.model).resolve();out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
    imported,mats=load_and_set_lighting(model)
    bounds_min,bounds_max=imported_world_bounds(imported)
    # Blender importer should convert source +Y height (~25 m) to Blender +Z height.
    if bounds_max[2]-bounds_min[2] < 18 or bounds_max[2] < 18:
        raise RuntimeError('GLTF axis conversion unexpected: imported world bounds '+repr([bounds_min,bounds_max]))
    print('[AXES_V2] Imported Blender +Z bounds:', bounds_min,bounds_max,flush=True)
    scene=bpy.context.scene
    # Cycles with Principled materials is a second independent physically based renderer.
    scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=args.samples
    scene.render.resolution_x=args.size;scene.render.resolution_y=int(args.size*1.16)
    scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
    scene.render.film_transparent=False
    try:scene.view_settings.view_transform='AgX'
    except Exception:scene.view_settings.view_transform='Standard'
    try: scene.view_settings.look='Medium High Contrast'
    except Exception: pass  # Blender version-specific view look; do not fail geometry import
    scene.view_settings.exposure=0.0;scene.view_settings.gamma=1.0
    # Export editable Blender source BEFORE rendering; no claim about optimization or fps.
    save=out/('sakura_hero_r09_'+args.variant+'.blend')
    set_camera('top');bpy.ops.wm.save_as_mainfile(filepath=str(save))
    camera_names=list(VIEWS)  # 8 poses for BOTH variants; camera test is symmetric
    for name in camera_names:
        set_camera(name)
        scene.render.filepath=str(out/('r09_'+args.variant+'_'+name+'_blender_cycles.png'))
        bpy.ops.render.render(write_still=True)
    # Snapshot material and mesh facts; GLB is not silently re-exported with changes.
    report={'sourceFile':str(model),'sourceBytes':model.stat().st_size,
       'sourceSha256':sha(model),'blenderFile':str(save),
       'blenderFileSha256':sha(save),'blenderVersion':bpy.app.version_string,
       'engine':'Cycles CPU physically based, imported glTF PBR nodes unmodified',
       'status':'RENDERED_ON_OWNER_MACHINE_AXES_V2' if bpy.app.background else 'RENDERED_IN_BLENDER_AXES_V2',
       'axisConversion':'glTF (x,y,z) -> Blender (x,-z,y)',
       'importedBoundsBlenderZup':{'min':bounds_min,'max':bounds_max}, 'world':{'color':[.69,.47,.60],'strength':.65},
       'lights':LIGHTS,'exposureEV':0.0,'cameras':camera_names,
       'cameraDataSourceYup':VIEWS, 'cameraSensorFit':'VERTICAL',
       'meshCount':len(imported),'triangleCount':sum(len(p.vertices)-2 for o in imported for p in o.data.polygons),
       'materials':list(mats),'materialNodeTypes':{k:[n.type for n in m.node_tree.nodes] for k,m in mats.items()},
       'screenshots':[str(out/('r09_'+args.variant+'_'+name+'_blender_cycles.png')) for name in camera_names]}
    with open(out/('r09_'+args.variant+'_blender_report.json'),'w',encoding='utf8') as f:
        json.dump(report,f,indent=2,ensure_ascii=False)
    print('R09 AXES_V2 BLENDER IMPORT/RENDER DONE',str(save),flush=True)

if __name__=='__main__':main()
