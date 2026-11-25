"""B9 R2 focused offline habitat evidence only. Never invokes R01 main/render/validation."""
import sys, json, math, hashlib, struct, subprocess
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
sys.path.insert(0,str(ROOT))
import native_b9 as b

BASE='1f7565a38fe4ae644bb602c2bcfc7ed433905642'
OLD_NATIVE_SHA='2fb7ff2958ac644886d47d433074db9a06e23bcb87159ddf5e7de65a1eede795'
OLD_SOURCE_LF_SHA='7f0bb4b4e45f741559dbbf6c12e11e48f945cd33787d46d39bddcfb3eb2c9b11'
OUT=HERE/'evidence'
POSE=15
# New offline composition only. Both A/B and profiles share exactly these parameters.
CAM=(4.7,3.4,33.5)
TARGET=(3.5,.1,25)
FOV=53
def req(v,msg):
    if not v:raise RuntimeError('B9_R2_'+msg)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def info(p):return {'path':p.relative_to(HERE).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
def git(*args):
    return subprocess.check_output(['git',*args],cwd=HERE,text=True).strip()
def old_inputs():
    req(sha(ROOT/'native_manifest.json')==OLD_NATIVE_SHA,'OLD_MANIFEST')
    req(hashlib.sha256((ROOT/'native_b9.py').read_bytes().replace(b'\r\n',b'\n')).hexdigest()==OLD_SOURCE_LF_SHA,'OLD_SOURCE')
    m=json.loads((ROOT/'native_manifest.json').read_text(encoding='utf-8'))
    req(len(m['inventory'])==34 and m['status']=='B9_NATIVE_EVIDENCE_READY_SA_REVIEW_PENDING','OLD_INVENTORY')
    for row in m['inventory']:
        p=ROOT/row['path']
        req(p.is_file() and p.stat().st_size==row['bytes'] and sha(p)==row['sha256'],'OLD_ARTIFACT '+row['path'])
    req(sum(x['path'].endswith('.png') for x in m['inventory'])==22,'OLD_FRAMES')
    req(git('branch','--show-current')=='assets/pond-environment-b9','BRANCH')
    req(subprocess.call(['git','merge-base','--is-ancestor',BASE,'HEAD'],cwd=HERE)==0,'BASE_ANCESTRY')
    req(not git('diff','--name-only',BASE,'--','../',':(exclude,top)Assets3D/Review/pond_environment/b9/r01/r2_visibility/**'),'OLD_TRACKED_DIFF')
    return m
def mesh_points(obj,matrix=None,triangles=False):
    dg=bpy.context.evaluated_depsgraph_get()
    ev=obj.evaluated_get(dg) if not obj.is_evaluated else obj
    mat=ev.matrix_world if matrix is None else matrix
    mesh=ev.to_mesh()
    try:
        pts=np.array([tuple(mat@v.co) for v in mesh.vertices],dtype=np.float64)
        req(len(pts)>0 and np.isfinite(pts).all(),'MESH_POINTS '+obj.name)
        if not triangles:return pts
        mesh.calc_loop_triangles()
        idx=np.array([tuple(t.vertices) for t in mesh.loop_triangles],dtype=np.int64)
        return pts,idx
    finally:ev.to_mesh_clear()
def box(pts):return np.stack((pts.min(0),pts.max(0)))
def gap(a,c):
    return float(np.linalg.norm(np.maximum(0,np.maximum(a[0]-c[1],c[0]-a[1]))))
def bounds_yup(p):
    return box(np.column_stack((p[:,0],p[:,2],-p[:,1]))).tolist()
def fishes(layout):
    result=[]
    for i,(x,z) in enumerate(layout['fishCentersYUpXZ']):
        col=bpy.data.collections['HabitatKoi_'+str(i)]
        objects=[o for o in col.all_objects if o.type=='MESH']
        pts=np.concatenate([mesh_points(o) for o in objects])
        a=box(pts);depth=-.42-.075*(i%3);scale=.67+.13*(i%3)
        req(a[1,2]<-.02 and a[0,2]>-1.8,'SUBMERGED '+str(i))
        result.append({'index':i,'palette':b.PALETTES[i%3],'centerYUp':[x,depth,z],'scale':scale,
          'yaw':.6+i*1.74,'boundsYUp':bounds_yup(pts),'topClearanceM':float(-a[1,2]),
          'floorClearanceM':float(a[0,2]+1.8),'_points':pts,'_box':a,
          '_names':{o.name for o in objects}})
    return result
def obstacle_clearance(s,fish):
    # Actual evaluated world-space instance geometry, not the placement radius alone.
    # AABB gap is a conservative lower bound; refine broad overlapping tree mesh boxes
    # with triangle AABBs. This tests surface separation, not continuous swim motion.
    dg=bpy.context.evaluated_depsgraph_get()
    tree_names={o.name for o in bpy.data.collections['Immutable_R18a_context'].all_objects if o.type=='MESH'}
    lotus_names=set()
    for k in ('pad','bloom','bud'):
        lotus_names.update(o.name for o in bpy.data.collections['Context_'+k].all_objects if o.type=='MESH')
    obstacles=[]
    # Capture instance descriptors before evaluating meshes, because depsgraph iteration is ephemeral.
    for inst in dg.object_instances:
        o=inst.object
        if o.type!='MESH':continue
        name=o.original.name
        if name in tree_names or name in lotus_names:
            obstacles.append((name,inst.matrix_world.copy(),name in tree_names))
    req(any(x[2] for x in obstacles) and any(not x[2] for x in obstacles),'CONTEXT_INSTANCES')
    tree_gap=[float('inf')]*len(fish);lotus_gap=tree_gap.copy()
    cache={}
    for name,mat,is_tree in obstacles:
        o=bpy.data.objects[name]
        if name not in cache:
            ev=o.evaluated_get(dg);m=ev.to_mesh()
            try:
                m.calc_loop_triangles()
                cache[name]=(np.array([tuple(v.co) for v in m.vertices],dtype=float),
                  np.array([tuple(t.vertices) for t in m.loop_triangles],dtype=np.int64))
            finally:ev.to_mesh_clear()
        local,idx=cache[name]
        req(len(local)>0 and np.isfinite(local).all(),'OBSTACLE_GEOMETRY')
        rot=np.array([list(row) for row in mat],dtype=float)
        pts=local@rot[:3,:3].T+rot[:3,3];ob=box(pts)
        for i,f in enumerate(fish):
            a=f['_box'];g=gap(a,ob)
            if g<.05 and len(idx):
                tri=pts[idx];lo=tri.min(1);hi=tri.max(1)
                g=float(np.linalg.norm(np.maximum(0,np.maximum(a[0]-hi,lo-a[1])),axis=1).min())
            dest=tree_gap if is_tree else lotus_gap
            dest[i]=min(dest[i],g)
    for i,f in enumerate(fish):
        f['treeSurfaceAABBLowerBoundM']=tree_gap[i]
        f['lotusSurfaceAABBLowerBoundM']=lotus_gap[i]
        f['otherFishAABBLowerBoundM']=min(gap(f['_box'],q['_box']) for q in fish if q is not f)
        req(min(tree_gap[i],lotus_gap[i],f['otherFishAABBLowerBoundM'])>.0,'CLEARANCE '+str(i))
    return {'treeMeshInstances':sum(x[2] for x in obstacles),'lotusMeshInstances':sum(not x[2] for x in obstacles),
      'method':'Evaluated mesh/triangle AABB surface lower bounds at frame 15; not continuous collision or solid containment certification.'}
def ray_clear(s,cam,point,names,water):
    origin=cam.matrix_world.translation.copy()
    delta=Vector(point)-origin;distance=delta.length
    if distance<1e-5:return False
    direction=delta.normalized();dg=bpy.context.evaluated_depsgraph_get()
    for _ in range(4):
        hit,loc,normal,index,obj,matrix=s.ray_cast(dg,origin,direction,distance=distance+.002)
        if not hit:return False
        if obj.original.name==water.name:
            advance=(loc-origin).length+.002
            origin=loc+direction*.002;distance-=advance
            if distance<=0:return False
            continue
        return obj.original.name in names
    return False
def projection(s,cam,fish,water):
    result=[]
    for f in fish:
        pts=f['_points']
        ndc=np.array([tuple(world_to_camera_view(s,cam,Vector(p))) for p in pts])
        inside=(ndc[:,2]>cam.data.clip_start)&(ndc[:,2]<cam.data.clip_end)&(ndc[:,:2]>=0).all(1)&(ndc[:,:2]<=1).all(1)
        good=ndc[ndc[:,2]>0]
        pixel=None if not len(good) else (box(good[:,:2])*np.array([720,1280])).tolist()
        ids=np.flatnonzero(inside)
        selected=ids[np.linspace(0,len(ids)-1,min(128,len(ids)),dtype=int)] if len(ids) else []
        clear=sum(ray_clear(s,cam,pts[j],f['_names'],water) for j in selected)
        result.append({'index':f['index'],'verticesInFrustum':int(inside.sum()),'verticesTotal':len(pts),
          'projectedPixelBoundsBottomLeft':pixel,'samples':len(selected),'firstNonWaterHitSameFish':clear,
          'centerNDC':list(world_to_camera_view(s,cam,b.coords(f['centerYUp'])))})
    return result
def draw(s,lod,label,rows):
    p=OUT/(lod+'_'+label+'.png')
    req(not p.exists(),'OUTPUT_EXISTS '+p.name)
    s.render.filepath=str(p);bpy.ops.render.render(write_still=True)
    header=p.read_bytes()[:24]
    req(header[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',header[16:24])==(720,1280),'PNG')
    rows.append({**info(p),'profile':lod,'variant':label,'frame':POSE,'samples':32,'resolution':[720,1280]})
    print('B9_R2_FRAME_WRITTEN',p.name,flush=True)
def main():
    req(bpy.app.version==(4,5,16),'BLENDER_VERSION '+bpy.app.version_string)
    old_inputs();b.verify() # checksum only, no native regressions
    req(not OUT.exists(),'OUTPUT_EXISTS_ARCHIVE_FIRST')
    OUT.mkdir()
    d=b.context();old=json.loads((ROOT/'cycles_manifest.json').read_text(encoding='utf-8'))
    rows=[];profiles=[]
    for lod in b.PROFILES:
        # Reuse exact original habitat builder, suppress its six render callbacks.
        original=b.render;b.render=lambda *args,**kwargs:None
        try:layout=b.habitat(lod,d,[])
        finally:b.render=original
        archived=next(x for x in old['layout'] if x['profile']==lod)
        req(json.loads(json.dumps(layout))==archived,'LAYOUT_MISMATCH '+lod)
        s=bpy.context.scene;b.at(s,POSE);fish=fishes(layout)
        clearance=obstacle_clearance(s,fish)
        water=bpy.data.objects['Water_ART_PROXY']
        oldcam=next(x['camera'] for x in old['frames'] if x['lod']==lod and x['view']=='low_water')
        b.camera(s,oldcam['positionYUp'],oldcam['targetYUp'],oldcam['verticalFovDegrees'])
        bpy.context.view_layer.update();before=projection(s,s.camera,fish,water)
        caminfo=b.camera(s,CAM,TARGET,FOV);bpy.context.view_layer.update()
        focused=projection(s,s.camera,fish,water)
        eligible=[x['index'] for x in focused if x['samples'] and x['firstNonWaterHitSameFish']/x['samples']>=.2 and
          x['verticesInFrustum']==x['verticesTotal'] and
          max(np.subtract(*x['projectedPixelBoundsBottomLeft'][::-1]))>=48]
        req(bool(eligible),'NO_CLEAR_REPRESENTATIVE_FISH '+lod)
        nt=water.data.materials[0].node_tree
        mix=next(n for n in nt.nodes if n.type=='MIX_SHADER')
        tr=next(n for n in nt.nodes if n.type=='BSDF_TRANSPARENT')
        A={'principledMix':float(mix.inputs[0].default_value),'transparentRGBA':list(tr.inputs[0].default_value)}
        req(abs(A['principledMix']-.28)<1e-6,'WATER_A')
        signature={'cameraMatrix':[list(r) for r in s.camera.matrix_world],'frame':s.frame_current,
          'exposure':s.view_settings.exposure,'seed':s.cycles.seed,'samples':s.cycles.samples}
        draw(s,lod,'A_original_water',rows)
        # Only the original offline surface mixture changes between A and B.
        mix.inputs[0].default_value=.10;tr.inputs[0].default_value=(.97,.98,1,1)
        B={'principledMix':float(mix.inputs[0].default_value),'transparentRGBA':list(tr.inputs[0].default_value)}
        bpy.context.view_layer.update()
        req(signature=={'cameraMatrix':[list(r) for r in s.camera.matrix_world],'frame':s.frame_current,
          'exposure':s.view_settings.exposure,'seed':s.cycles.seed,'samples':s.cycles.samples},'PAIR_DRIFT')
        draw(s,lod,'B_clearer_water',rows)
        public=[{k:v for k,v in x.items() if not k.startswith('_')} for x in fish]
        report={'profile':lod,'layoutMatchesR01':True,'originalLowWaterCamera':oldcam,'originalProjection':before,
          'focusedCamera':caminfo,'focusedProjection':focused,'eligibleFish':eligible,'fish':public,'clearance':clearance,
          'pairIdentity':signature,'waterA':A,'waterB':B}
        profiles.append(report);print('B9_R2_PROFILE '+json.dumps(report,allow_nan=False),flush=True)
    old_inputs();req(len(rows)==4,'FRAME_BUDGET')
    out={'status':'B9_R2_FOCUSED_RENDER_COMPLETE_ART_REVIEW_PENDING','base':BASE,'executionHEAD':git('rev-parse','HEAD'),
      'blenderVersion':bpy.app.version_string,'source':info(Path(__file__)),'runner':info(HERE/'run_r2.ps1'),
      'r01NativeManifestSHA256':OLD_NATIVE_SHA,'profiles':profiles,'frames':rows,'costVND':0,
      'limitations':'Offline above-water art proxy; no runtime visibility/physics/FPS claim; SA must inspect actual images for recognizable koi.'}
    (OUT/'visibility_manifest.json').write_text(json.dumps(out,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    print('B9_R2_FOCUSED_RENDER_COMPLETE 4 FRAMES; P10B9_ART_SA_REVIEW_REQUIRED',flush=True)
if __name__=='__main__':main()
