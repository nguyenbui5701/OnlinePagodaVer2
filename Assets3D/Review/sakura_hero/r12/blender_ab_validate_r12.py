"""Owner-run, zero-cost R12 Blender 4.5+ Cycles PBR comparison.

DO NOT claim R12 Blender PASS until owner executes and supplies generated evidence.
Loads exact real GLB files and retains imported glTF Principled materials.
Base contract: same R10/R11 axes V2 camera, AgX, 0 EV, World .65, three SUN.
The 9:16 aerial is an extra framing of the same top camera/FOV.
"""
import bpy, argparse, hashlib, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from blender_reference_rig_r10 import (sha,set_camera,load_and_set_lighting,
                                       imported_world_bounds)

CASES=['r10_palette_only','r11_final','r12_final','eco']
CAMERAS=['top','three_quarter','under','trunk_33s','top_9x16']

def principled(m):
    assert m.use_nodes, f'Non node material: {m.name}'
    for n in m.node_tree.nodes:
        if n.type=='BSDF_PRINCIPLED':
            d={}
            for key in ['Base Color','Metallic','Roughness','Emission Color','Emission Strength']:
                sock=n.inputs.get(key)
                if sock is not None:
                    val=sock.default_value
                    d[key]=list(val) if hasattr(val,'__len__') else float(val)
            return d
    raise RuntimeError(f'No Principled BSDF: {m.name}')

def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    p=argparse.ArgumentParser()
    p.add_argument('--model',required=True);p.add_argument('--out',required=True)
    p.add_argument('--case',choices=CASES,required=True)
    p.add_argument('--samples',type=int,default=32);p.add_argument('--size',type=int,default=520)
    p.add_argument('--quick',action='store_true')
    a=p.parse_args(args)
    model=Path(a.model).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
    imported,mats=load_and_set_lighting(model)
    lo,hi=imported_world_bounds(imported)
    if hi[2]-lo[2]<18:raise RuntimeError(f'Unexpected GLB +Y to Blender +Z axis conversion {lo} {hi}')
    s=bpy.context.scene
    s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=a.samples
    s.render.resolution_x=a.size;s.render.resolution_y=int(a.size*1.16)
    s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    s.render.film_transparent=False
    s.view_settings.view_transform='AgX'
    try:s.view_settings.look='Medium High Contrast'
    except (TypeError,ValueError):pass
    s.view_settings.exposure=0.;s.view_settings.gamma=1.
    # Do not alter the glTF imported materials, normals, roughness or emission.
    material_info={name:principled(m) for name,m in mats.items()}
    blender_file=None
    if a.case in ('r12_final','eco'):
        set_camera('top')
        bpy.context.preferences.filepaths.save_version=0
        filename='sakura_hero_r12_quality.blend' if a.case=='r12_final' else 'sakura_hero_r12_eco.blend'
        blender_file=out/filename
        bpy.ops.wm.save_as_mainfile(filepath=str(blender_file))
    images=[]
    cameras=['top','trunk_33s'] if a.quick else CAMERAS
    for view in cameras:
        set_camera('top' if view=='top_9x16' else view)
        s.render.resolution_x=a.size
        s.render.resolution_y=int(a.size*16/9) if view=='top_9x16' else int(a.size*1.16)
        pth=out/(a.case+'_'+view+'_cycles.png')
        s.render.filepath=str(pth)
        bpy.ops.render.render(write_still=True)
        if not pth.is_file() or pth.stat().st_size<100:raise RuntimeError('Missing Cycles image '+str(pth))
        images.append({'name':pth.name,'bytes':pth.stat().st_size,'sha256':sha(pth)})
        print('[R12_CYCLES_IMAGE]',pth.name,flush=True)
    report={
      'case':a.case,'originalGLB':model.name,'sourceBytes':model.stat().st_size,'sourceSha256':sha(model),
      'blender':bpy.app.version_string,'renderEngine':'Blender Cycles CPU',
      'samples':a.samples,'width':a.size,'viewTransform':'AgX','exposureEV':0.,
      'worldStrength':s.world.node_tree.nodes.get('Background').inputs['Strength'].default_value,
      'lights':[{'name':o.name,'energy':o.data.energy,'color':list(o.data.color)} for o in s.objects if o.type=='LIGHT'],
      'meshCount':len(imported),'triangles':sum(len(poly.vertices)-2 for o in imported for poly in o.data.polygons),
      'materials':material_info,'cameras':cameras,'cameraFovDegrees':{'top':50,'three_quarter':44,'under':44,'trunk_33s':56,'top_9x16':50},
      'glTFToBlenderAxes':'(x,y,z)->(x,-z,y)', 'boundsBlenderZUp':{'min':lo,'max':hi},
      'images':images,
      'blend':None if blender_file is None else {'name':blender_file.name,'bytes':blender_file.stat().st_size,'sha256':sha(blender_file)},
      'status':'OWNER_RUN_AWAITING_SA_VISUAL_ART_ASSESSMENT'
    }
    (out/(a.case+'_report.json')).write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
    print('[R12_CYCLES_COMPLETED]',a.case,'views',len(cameras),flush=True)

if __name__=='__main__':main()
