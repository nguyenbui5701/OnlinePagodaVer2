"""R13 original GLB / Blender 4.5+ Cycles, fixed-rig R12/R13 A/B.

Owner Windows execution required. Not executed on AI runtime without Blender.
Imported GLB Principled materials stay untouched. No Phong, no material relight.
"""
import argparse
import json
import sys
from pathlib import Path
import bpy
from blender_reference_rig_r10 import (VIEWS,load_and_set_lighting,
    imported_world_bounds,set_camera,sha)

# R13 hero 9:16 full-fit camera obtained from BOTH R12 and R13 source vertices,
# i.e. exact same shot, not an independently recomputed per-case camera.
FULL_POS=(24.641505854426047,38.825045790301786,54.139118204520734)
FULL_TARGET=(.15,12.4,0.)
VIEWS['hero_full_9x16']=(FULL_POS,FULL_TARGET,(0.,1.,0.),50)
VIEWS['hero_close_9x16']=VIEWS['top']
VIEWS_R13=('top','three_quarter','under','trunk_33s',
           'hero_full_9x16','hero_close_9x16')
CASES=('r12_baseline','r13_final','eco_unchanged')


def materials_metadata(mats):
    summary={}
    for name, mat in mats.items():
        if not mat.use_nodes:
            raise RuntimeError('Material missing nodes: '+name)
        bsdf=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
        if bsdf is None:
            raise RuntimeError('Material missing Principled BSDF: '+name)
        props={}
        for key in ('Base Color','Metallic','Roughness','Emission Color','Emission Strength'):
            socket=bsdf.inputs.get(key)
            if socket is not None:
                v=socket.default_value
                props[key]=list(v) if hasattr(v,'__len__') else float(v)
        summary[name]=props
    return summary


def main():
    cli=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    p=argparse.ArgumentParser()
    p.add_argument('--model',required=True)
    p.add_argument('--out',required=True)
    p.add_argument('--case',required=True,choices=CASES)
    p.add_argument('--samples',type=int,default=32)
    p.add_argument('--size',type=int,default=520)
    p.add_argument('--quick',action='store_true')
    a=p.parse_args(cli)
    model=Path(a.model).resolve()
    out=Path(a.out).resolve()
    out.mkdir(parents=True,exist_ok=True)
    imported,mats=load_and_set_lighting(model)
    lo,hi=imported_world_bounds(imported)
    if hi[2]-lo[2]<18 or hi[2]<18:
        raise RuntimeError('Unexpected Blender Z-up bounds '+str((lo,hi)))
    scene=bpy.context.scene
    scene.render.engine='CYCLES'
    scene.cycles.device='CPU'
    scene.cycles.samples=a.samples
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.film_transparent=False
    scene.view_settings.view_transform='AgX'
    try:scene.view_settings.look='Medium High Contrast'
    except (ValueError,TypeError):pass
    scene.view_settings.exposure=0.
    scene.view_settings.gamma=1.
    matdata=materials_metadata(mats)
    blend=None
    if a.case in ('r13_final','eco_unchanged'):
        set_camera('hero_full_9x16')
        bpy.context.preferences.filepaths.save_version=0
        name='sakura_hero_r13_quality.blend' if a.case=='r13_final' else 'sakura_hero_r13_eco.blend'
        blend=out/name
        bpy.ops.wm.save_as_mainfile(filepath=str(blend))
        if not blend.is_file():
            raise RuntimeError('Missing saved editable Blender file: '+str(blend))
    cams=['top','trunk_33s','hero_full_9x16'] if a.quick else VIEWS_R13
    images=[]
    for view in cams:
        set_camera(view)
        scene.render.resolution_x=a.size
        scene.render.resolution_y=round(a.size*16/9) if view.endswith('_9x16') else round(a.size*1.16)
        target=out/(a.case+'_'+view+'_cycles.png')
        scene.render.filepath=str(target)
        bpy.ops.render.render(write_still=True)
        if not target.is_file() or target.stat().st_size<100:
            raise RuntimeError('No Cycles image written '+str(target))
        images.append({'view':view,'name':target.name,'bytes':target.stat().st_size,
                       'sha256':sha(target),'width':scene.render.resolution_x,
                       'height':scene.render.resolution_y})
        print('[R13_CYCLES_IMAGE]',a.case,view,flush=True)
    report={
        'case':a.case,'status':'OWNER_RUN_COMPLETE_REQUIRES_SA_VISUAL_REVIEW',
        'blenderVersion':bpy.app.version_string,'renderEngine':'Cycles CPU',
        'sourceName':model.name,'sourceBytes':model.stat().st_size,'sourceSha256':sha(model),
        'meshCount':len(imported),
        'triangleCount':sum(len(poly.vertices)-2 for obj in imported for poly in obj.data.polygons),
        'materials':matdata, 'samples':a.samples,
        'viewTransform':scene.view_settings.view_transform,
        'look':scene.view_settings.look,
        'exposureEV':scene.view_settings.exposure,
        'gamma':scene.view_settings.gamma,
        'worldStrength':scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value,
        'lights':[{'name':o.name,'energy':o.data.energy,'color':list(o.data.color),
                   'angle':o.data.angle} for o in scene.objects if o.type=='LIGHT'],
        'geometryZBounds':{'min':list(lo),'max':list(hi)},
        'cameras':list(cams),'cameraFOVDeg':{'top':50,'three_quarter':44,'under':44,
            'trunk_33s':56,'hero_full_9x16':50,'hero_close_9x16':50},
        'heroFullCameraYup':{'position':list(FULL_POS),'target':list(FULL_TARGET),'up':[0,1,0]},
        'heroCloseCameraYup':{'position':[3,54,10],'target':[0,13.5,0],'up':[0,0,-1]},
        'gltfToBlenderAxes':'(x,y,z)->(x,-z,y)','images':images,
        'blend':None if blend is None else {'filename':blend.name,'bytes':blend.stat().st_size,
                                           'sha256':sha(blend)},
    }
    (out/(a.case+'_report.json')).write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
    print('[R13_CYCLES_COMPLETED]',a.case,'views',len(cams),flush=True)

if __name__=='__main__':main()
