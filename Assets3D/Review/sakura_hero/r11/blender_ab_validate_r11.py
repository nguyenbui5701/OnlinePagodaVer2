"""Owner-run Blender 4.5+ R10/R11 *real GLB* controlled Cycles A/B, zero-cost.

This program has NOT been executed in Blender by AI Visual; it requires Blender
on the owner's Windows workstation. Source code is syntax-checked only here.

Each case starts Blender with --factory-startup and imports the named .glb.
The same glTF Principled material nodes, Cycles CPU, AgX, EV 0, the original
R10 dusk World + 3 Sun lamps and the exact original Y->Z camera conversion are
retained. Nonbaseline tone_map and light75 controls change exactly one variable.
Do not compare Cycles radiance numerically to VTK's synthetic IBL.
"""
from pathlib import Path
import argparse, hashlib, json, sys
import bpy
sys.path.insert(0,str(Path(__file__).resolve().parent))
from blender_reference_rig_r10 import (VIEWS, LIGHTS, sha, set_camera,
                                       load_and_set_lighting, imported_world_bounds)

CASES={
 'r10_baseline': ['top','under','three_quarter','trunk_33s'],
 'r10_emissive_only': ['top','under'],
 'r10_albedo_only': ['top','under'],
 'r10_palette_only': ['top','under'],
 'r11_geometry_only': ['top','under'],
 'r11_final': ['top','under','three_quarter','trunk_33s'],
 'eco': ['top','under','three_quarter','trunk_33s'],
 'r10_standard': ['top'],
 'r10_light75': ['top'],
}

def principled_summary(material):
    for node in material.node_tree.nodes:
        if node.type=='BSDF_PRINCIPLED':
            result={}
            for prop in ('Base Color','Emission Color','Emission Strength','Metallic','Roughness'):
                v=node.inputs.get(prop)
                if v is not None:
                    value=v.default_value
                    result[prop] = list(value) if hasattr(value,'__len__') else float(value)
            return result
    return {}

def main():
    cli=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    p=argparse.ArgumentParser()
    p.add_argument('--model',required=True);p.add_argument('--out',required=True)
    p.add_argument('--case',choices=CASES,required=True)
    p.add_argument('--samples',type=int,default=32)
    p.add_argument('--size',type=int,default=520)
    a=p.parse_args(cli)
    model=Path(a.model).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
    imported,mats=load_and_set_lighting(model)
    lo,hi=imported_world_bounds(imported)
    if hi[2]-lo[2]<18:raise RuntimeError('Imported GLB is NOT Z-up! '+repr((lo,hi)))
    s=bpy.context.scene
    s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=a.samples
    s.render.resolution_x=a.size;s.render.resolution_y=int(a.size*1.16)
    s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    s.render.film_transparent=False
    s.view_settings.view_transform='AgX'
    try:s.view_settings.look='Medium High Contrast'
    except (TypeError,ValueError):pass
    s.view_settings.exposure=0.;s.view_settings.gamma=1.
    if a.case=='r10_standard':
        s.view_settings.view_transform='Standard'
        try:s.view_settings.look='Medium High Contrast'
        except (TypeError,ValueError):pass
    if a.case=='r10_light75':
        s.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.65*.75
        for ob in s.objects:
            if ob.type=='LIGHT':ob.data.energy*=.75
    blender_file=None
    if a.case in ('r11_final','eco'):
        set_camera('top')
        blender_file=out/('sakura_hero_r11_quality.blend' if a.case=='r11_final' else 'sakura_hero_r11_eco.blend')
        bpy.ops.wm.save_as_mainfile(filepath=str(blender_file))
    files=[]
    for view in CASES[a.case]:
        set_camera(view)
        pth=out/(a.case+'_'+view+'_cycles.png')
        s.render.filepath=str(pth)
        bpy.ops.render.render(write_still=True)
        if not pth.is_file() or pth.stat().st_size<=0:raise RuntimeError('Missing render '+str(pth))
        files.append(dict(name=pth.name,bytes=pth.stat().st_size,sha256=sha(pth)))
        print('[R11_CYCLES_IMAGE]',str(pth),flush=True)
    report={
      'case':a.case,'source':str(model),'sourceBytes':model.stat().st_size,
      'sourceSha256':sha(model),'engine':'Blender Cycles CPU physical Principled glTF import',
      'blenderVersion':bpy.app.version_string,'samples':a.samples,
      'renderResolution':[s.render.resolution_x,s.render.resolution_y],
      'viewTransform':s.view_settings.view_transform,'exposureEV':s.view_settings.exposure,
      'worldStrength':s.world.node_tree.nodes.get('Background').inputs['Strength'].default_value,
      'lights':[dict(name=o.name,energy=o.data.energy,color=list(o.data.color)) for o in s.objects if o.type=='LIGHT'],
      'meshCount':len(imported),
      'triangleCount':sum(len(p.vertices)-2 for o in imported for p in o.data.polygons),
      'materials':{k:principled_summary(v) for k,v in mats.items()},
      'axes':'GLB +Y to Blender +Z: (x,y,z)->(x,-z,y)',
      'boundsBlenderZup':{'min':lo,'max':hi},
      'cameras':list(CASES[a.case]), 'images':files,
      'blend':None if blender_file is None else {'path':str(blender_file),'bytes':blender_file.stat().st_size,'sha256':sha(blender_file)},
      'status':'OWNER_CYCLES_RENDERED_NOT_PRODUCTION_APPROVED'
    }
    dest=out/(a.case+'_report.json');dest.write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('[R11_CYCLES_COMPLETED]',a.case,'images',len(files),'report',str(dest),flush=True)

if __name__=='__main__':main()
