"""Sakura R16 owner-run Blender Cycles, fixed original GLB R15/R16 A/B rig.

Blender is not available in the AI evaluation environment; this is a reproducible
Windows validation protocol, not evidence of a completed Blender R16 test.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

HERE=Path(__file__).resolve().parent
CASES=('r15_baseline','r16_final','eco_unchanged')
TARGET_FULL=(.15,12.4,0.)
FULL_POS=(24.641505854426047,38.825045790301786,54.139118204520734)
DIRECTION=Vector(FULL_POS)-Vector(TARGET_FULL)
DIRECTION.normalize()
MEDIUM_POS=tuple(Vector(TARGET_FULL)+DIRECTION*48.0)
VIEWS={
  'top':((3.,54.,10.),(0.,13.5,0.),(0.,0.,-1.),50),
  'under':((3.,4.8,18.5),(0.,11.9,0.),(0.,1.,0.),44),
  'three_quarter':((31.,25.,31.),(0.,11.6,0.),(0.,1.,0.),44),
  'trunk_33s':((4.8,4.,11.5),(0.,6.6,0.),(0.,1.,0.),56),
  'hero_full_9x16':(FULL_POS,TARGET_FULL,(0.,1.,0.),50),
  'hero_medium_9x16':(MEDIUM_POS,TARGET_FULL,(0.,1.,0.),50),
  'hero_close_9x16':((3.,54.,10.),(0.,13.5,0.),(0.,0.,-1.),50),
  'fork_front':((4.0,10.2,12.0),(1.8,11.9,1.2),(0.,1.,0.),38),
  'fork_side':((12.0,12.1,3.5),(1.8,11.9,1.2),(0.,1.,0.),38),
  'fork_back':((-6.6,12.0,-10.0),(1.8,11.9,1.2),(0.,1.,0.),38),
}
LIGHTS=(
  ('R10_Key',(22,40,26),2.1,(1.,.84,.82),.12),
  ('R10_Rim',(-18,23,-15),1.05,(1.,.76,.89),.17),
  ('R10_LowerFill',(6,3,18),.72,(1.,.74,.83),.32),
)

def sha_file(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):
            h.update(chunk)
    return h.hexdigest()

def to_blender(p):
    x,y,z=p
    return Vector((x,-z,y))

def set_camera(name):
    pos,tar,up,fov=VIEWS[name]
    pos=to_blender(pos);tar=to_blender(tar);up=to_blender(up)
    direction=(tar-pos).normalized()
    right=direction.cross(up).normalized()
    true_up=right.cross(direction).normalized()
    basis=Matrix(((right.x,true_up.x,-direction.x),
                  (right.y,true_up.y,-direction.y),
                  (right.z,true_up.z,-direction.z)))
    cam=bpy.data.cameras.new('Sakura_R16_'+name)
    obj=bpy.data.objects.new('Sakura_R16_'+name,cam)
    bpy.context.collection.objects.link(obj)
    obj.location=pos
    obj.rotation_euler=basis.to_quaternion().to_euler()
    cam.type='PERSP';cam.sensor_fit='VERTICAL';cam.angle=math.radians(fov)
    cam.clip_start=.05;cam.clip_end=500
    bpy.context.scene.camera=obj
    return obj

def setup_world(model):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(model))
    objs=[o for o in bpy.context.scene.objects if o.type=='MESH']
    if not objs:raise RuntimeError('No imported meshes from '+str(model))
    bounds=[o.matrix_world@Vector(v) for o in objs for v in o.bound_box]
    bmin=[float(min(v[i] for v in bounds)) for i in range(3)]
    bmax=[float(max(v[i] for v in bounds)) for i in range(3)]
    if bmax[2]-bmin[2]<18 or bmax[2]<18:
        raise RuntimeError('glTF+Y→Blender+Z axes invalid '+str([bmin,bmax]))
    mats={m.name:m for o in objs for m in o.data.materials if m is not None}
    if not mats:raise RuntimeError('No imported glTF PBR materials')
    factors={}
    for name,mat in mats.items():
        if not mat.use_nodes:raise RuntimeError('Material has no nodes '+name)
        bsdf=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
        if bsdf is None:raise RuntimeError('No native Principled glTF material '+name)
        state={}
        for k in ('Base Color','Metallic','Roughness','Emission Color','Emission Strength'):
            sock=bsdf.inputs.get(k)
            if sock is not None:
                v=sock.default_value
                state[k]=list(v) if hasattr(v,'__len__') else float(v)
        factors[name]=state
    world=bpy.data.worlds.new('R16_Dusk_Same_R15')
    world.use_nodes=True
    bg=world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value=(.69,.47,.60,1.)
    bg.inputs['Strength'].default_value=.65
    bpy.context.scene.world=world
    for name,pos,energy,color,angle in LIGHTS:
        data=bpy.data.lights.new(name,'SUN')
        data.energy=energy;data.color=color;data.angle=angle
        light=bpy.data.objects.new(name,data)
        bpy.context.collection.objects.link(light)
        p=to_blender(pos);target=to_blender((0,9,0));light.location=p
        light.rotation_euler=(target-p).to_track_quat('-Z','Y').to_euler()
    return objs,factors,bmin,bmax

def main():
    cli=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    parser=argparse.ArgumentParser()
    parser.add_argument('--model',required=True)
    parser.add_argument('--out',required=True)
    parser.add_argument('--case',required=True,choices=CASES)
    parser.add_argument('--samples',type=int,default=32)
    parser.add_argument('--size',type=int,default=520)
    parser.add_argument('--quick',action='store_true')
    a=parser.parse_args(cli)
    model=Path(a.model).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
    objs,mats,bmin,bmax=setup_world(model)
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=a.samples
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.film_transparent=False
    scene.view_settings.view_transform='AgX'
    try:scene.view_settings.look='Medium High Contrast'
    except (ValueError,TypeError):pass
    scene.view_settings.exposure=0.;scene.view_settings.gamma=1.
    blend=None
    if a.case in ('r16_final','eco_unchanged'):
        set_camera('hero_medium_9x16')
        bpy.context.preferences.filepaths.save_version=0
        name='sakura_hero_r16_quality.blend' if a.case=='r16_final' else 'sakura_hero_r16_eco.blend'
        blend=out/name
        bpy.ops.wm.save_as_mainfile(filepath=str(blend))
        if not blend.is_file():raise RuntimeError('Editable BLEND was not written')
    cameras=['fork_front','fork_side','fork_back','under','trunk_33s'] if a.quick else list(VIEWS)
    images=[]
    for view in cameras:
        set_camera(view)
        scene.render.resolution_x=a.size
        scene.render.resolution_y=round(a.size*16/9) if view.endswith('_9x16') else round(a.size*1.16)
        img=out/(a.case+'_'+view+'_cycles.png')
        scene.render.filepath=str(img)
        bpy.ops.render.render(write_still=True)
        if not img.is_file() or img.stat().st_size<100:
            raise RuntimeError('No Cycles PNG: '+str(img))
        images.append({'view':view,'filename':img.name,'bytes':img.stat().st_size,
            'sha256':sha_file(img),'width':scene.render.resolution_x,'height':scene.render.resolution_y})
        print('[R16_CYCLES_IMAGE]',a.case,view,flush=True)
    report={'case':a.case,'status':'OWNER_RUN_EVIDENCE_FOR_SA_REVIEW',
      'blenderVersion':bpy.app.version_string,'renderEngine':'Cycles CPU',
      'sourceName':model.name,'sourceBytes':model.stat().st_size,'sourceSha256':sha_file(model),
      'meshCount':len(objs),'triangles':sum(len(p.vertices)-2 for o in objs for p in o.data.polygons),
      'materials':mats,'samples':a.samples,'viewTransform':scene.view_settings.view_transform,
      'look':scene.view_settings.look,'exposureEV':scene.view_settings.exposure,
      'worldStrength':scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value,
      'lights':[{'name':o.name,'energy':o.data.energy,'color':list(o.data.color)} for o in scene.objects if o.type=='LIGHT'],
      'cameras':list(cameras),'cameraDataYup':VIEWS,'axisTransform':'glTF(x,y,z)->Blender(x,-z,y)',
      'boundsBlenderZup':[bmin,bmax],'images':images,
      'blend':None if blend is None else {'name':blend.name,'bytes':blend.stat().st_size,'sha256':sha_file(blend)}}
    (out/(a.case+'_report.json')).write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
    print('[R16_CYCLES_COMPLETED]',a.case,'views',len(cameras),flush=True)

if __name__=='__main__':main()
