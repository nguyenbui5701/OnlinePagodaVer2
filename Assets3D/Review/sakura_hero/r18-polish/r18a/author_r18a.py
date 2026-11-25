"""R18a: authored branching surface inlays on exact SA-accepted R18.
No original geometry replacement. All output writes confined to r18a/.
"""
import copy,sys,math,json
from pathlib import Path
import numpy as np
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
PARENT=ROOT.parent
sys.dont_write_bytecode=True
sys.path.insert(0,str(PARENT))
import author_r18 as a
sys.path.insert(0,str(ROOT))
REVIEWED='631273440469b789bf7f1688bff30a35309de601'
REVIEW='https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/27#pullrequestreview-6058176405'
POLICY='06eabf3c96b5a205d94f93e4b4ef197e63923d53'
PIN={'quality':('sakura_hero_r18.glb',6995332,'656cfaf7302dc49ff24c8643f4946536b9d1e77e71a5be7d18538aae01e54f29',237433),
     'eco':('sakura_hero_r18_eco.glb',2165220,'ad6f84f1c04468bba376e5ab7040993870b676cc0ec31b5911b782747750ff9b',58782)}
NAMES={'quality':'sakura_hero_r18a.glb','eco':'sakura_hero_r18a_eco.glb'}
REF={'quality':500000,'eco':120000}
GOLD='Golden_bark_veins'
def require(ok,msg):
    if not ok:raise RuntimeError('R18A_'+msg)
def sha(p):return a.sha(p)
def meta(p):return {'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
def pin_inputs():
    a.pins() # old input hashes only, not old audits or old budget logic
    for f,n,digest,_ in PIN.values():
        p=PARENT/f
        require(p.is_file() and p.stat().st_size==n and sha(p)==digest,'FROZEN_R18_SHA '+f)
    for f,digest in (
      ('attachment_audit.json','d1bd1bc8d914893e6c98b96b00553191b0497dd548e982c44979af7a42c20baa'),
      ('attachment_diagnostics.json','d883c2330696a0ad9494f93cce13bca1154ecb5f75fa59761f545ea0b3249bc0'),
      ('validation.json','0121fb56481dc4b185cf1cdbaf2334eea9e9cc1a97e06b9f73efb5f67f5edd18'),
      ('R18_Repair_Preview/preview_manifest.json','467d105c4f099f2e09de41473dc71651c86090fb337d4456a0870b42ab5b83cc')):
        require(sha(PARENT/f)==digest,'RECEIPT_SHA '+f)
    prior=a.read(PARENT/'validation.json')
    diag=a.read(PARENT/'attachment_diagnostics.json')
    require(diag['status']=='NATIVE_REPAIR_PROXY_PASS_VISUAL_REVIEW_REQUIRED','PREVIOUS_REPAIR_RECEIPT')
    for lod,(_,n,d,t) in PIN.items():
        p=prior['profiles'][lod]
        require((p['bytes'],p['sha256'],p['triangles'])==(n,d,t),'RECEIPT_PROFILE '+lod)
        require(p['reimportAttachmentCheck']['contactEdgesVerified']==(45 if lod=='quality' else 70),'CONTACT_RECEIPT '+lod)
    return prior
def normalize(x):
    n=np.linalg.norm(x,axis=-1,keepdims=True)
    return x/np.maximum(n,1e-12)
def frame(c,trunk):
    v=c['v']
    origin=v.mean(axis=0)
    if trunk:axis=np.array([0.,0.,1.])
    else:
        _,_,vh=np.linalg.svd(v-origin,full_matrices=False);axis=vh[0]
        radial=origin.copy();radial[2]=0
        if axis@radial<0:axis=-axis
    x=(v-origin)@axis;lo=float(x.min());hi=float(x.max());span=hi-lo
    t=(x-lo)/span
    # Smooth local centers estimated from actual mesh rings, not a replacement tree.
    # Quantile-width slices are stable on both triangulation profiles.
    samples=np.linspace(0,1,15)
    centers=[]
    for s in samples:
        ids=np.argsort(abs(t-s))[:max(8,min(len(v),len(v)//12))]
        center=np.median(v[ids],axis=0)
        centers.append(center+axis*(lo+s*span-(center-origin)@axis))
    centers=np.asarray(centers)
    center=np.column_stack([np.interp(t,samples,centers[:,i]) for i in range(3)])
    radial=v-center;radial-=np.outer(radial@axis,axis)
    rr=np.linalg.norm(radial,axis=1)
    ref=np.array([0.,0.,1.]) if abs(axis[2])<.9 else np.array([1.,0.,0.])
    u=normalize(np.cross(axis,ref));w=np.cross(axis,u)
    theta=np.arctan2(radial@w,radial@u)
    return t,theta,normalize(radial),rr,span
def paths(trunk,lod,idx):
    # Long braided fissure paths and natural tapered forks. These are angular
    # trajectories in the surface frame, NOT free-space cylinders.
    n=(10 if lod=='quality' else 7) if trunk else (3 if lod=='quality' else 2)
    out=[]
    for i in range(n):
        ph=2*math.pi*(i+.19*(idx%5))/n
        start=.075+.025*(i%3) if trunk else .14+.04*(i%2)
        end=.92-.04*(i%4) if trunk else .86-.04*(i%3)
        width=(.040+.012*(i%3)) if trunk else (.075+.018*(i%2))
        drift=(.29+.13*math.sin(i*2.1+idx)) if trunk else (.22+.18*math.sin(i+idx))
        def center(t,ph=ph,drift=drift,i=i):
            return ph+drift*t+.08*np.sin(8*t+i*1.7)+.028*np.sin(23*t+i)
        def half(t,start=start,end=end,width=width):
            s=np.clip((t-start)/(end-start),0,1)
            return width*(.13+.87*np.sin(math.pi*s)**.55)*(1+.12*np.sin(19*s))
        out.append((start,end,center,half))
        if i%2==0:
            b=start+(end-start)*.44;e=start+(end-start)*.93
            sign=1 if (i+idx)%2==0 else -1
            def fork(t,center=center,b=b,e=e,sign=sign):
                q=np.clip((t-b)/(e-b),0,1)
                return center(t)+sign*(.24*q+.38*q*q)
            def fw(t,b=b,e=e,width=width):
                q=np.clip((t-b)/(e-b),0,1)
                return width*.55*(.14+.86*np.sin(math.pi*q)**.6)
            out.append((b,e,fork,fw))
    return out
def clip(poly,field,inside=True):
    """Barycentric polygon clipping. Each field is linear on a real bark face."""
    if not poly:return []
    values=[float(x@field)*(1 if inside else -1) for x in poly];out=[]
    for i,x in enumerate(poly):
        y=poly[(i+1)%len(poly)];d=values[i];e=values[(i+1)%len(poly)]
        if d>=0:out.append(x)
        if (d>=0)!=(e>=0):out.append(x+(y-x)*(d/(d-e)))
    return out
def split_band(poly,fields):
    # Subtract the accepted band from subsequent paths to prevent coplanar
    # overlap at forks. Outside pieces form a disjoint partition.
    keep=poly;rest=[]
    for f in fields:
        outside=clip(keep,f,False)
        if len(outside)>=3:rest.append(outside)
        keep=clip(keep,f,True)
        if len(keep)<3:return [],rest
    return keep,rest
def inlay(c,trunk,lod,idx):
    t,theta,rad,rr,span=frame(c,trunk)
    recipe=paths(trunk,lod,idx);verts=[];faces=[];cache={};areas=0.;lengths=[0]*len(recipe)
    v=c['v'];base_area=0.;base_length=0.
    for face in c['f']:
        xyz=v[face];normal=np.cross(xyz[1]-xyz[0],xyz[2]-xyz[0])
        norm=float(np.linalg.norm(normal))
        if norm<1e-12:continue
        base_area+=norm*.5
        # Skip caps and interior-facing creases; retain natural wood contour.
        if float(normal@rad[face].mean(axis=0))/norm<.18 or min(rr[face])<.06:continue
        tx=t[face];angles=theta[face].copy()
        angles=angles[0]+(angles-angles[0]+math.pi)%(2*math.pi)-math.pi
        if np.ptp(angles)>math.pi:continue
        remaining=[list(np.eye(3))]
        for k,(start,end,center,half) in enumerate(recipe):
            if max(tx)<start or min(tx)>end:continue
            target=center(tx);target+=2*math.pi*round(float((angles-target).mean())/(2*math.pi))
            diff=angles-target;wid=half(tx)
            if min(diff-wid)>0 or max(diff+wid)<0:continue
            fields=(tx-start,end-tx,diff+wid,wid-diff)
            next_remaining=[]
            for poly in remaining:
                accepted,rest=split_band(poly,fields);next_remaining.extend(rest)
                if len(accepted)<3:continue
                # Small outward lift, interpolated in the SAME original triangle.
                # Continuous shared-edge radial interpolation; no floating ribbons.
                pts=np.asarray(accepted)@(xyz+.012*rad[face])
                for j in range(1,len(pts)-1):
                    tri=pts[[0,j,j+1]]
                    tri=np.asarray(tri,dtype=np.float32).astype(np.float64)
                    ar=float(np.linalg.norm(np.cross(tri[1]-tri[0],tri[2]-tri[0]))*.5)
                    if ar<1e-9:continue
                    inds=[]
                    for pt in tri:
                        key=tuple(np.rint(pt*1e6).astype(np.int64))
                        if key not in cache:cache[key]=len(verts);verts.append(pt)
                        inds.append(cache[key])
                    if len(set(inds))!=3:continue
                    faces.append(inds);areas+=ar;lengths[k]+=1
            remaining=next_remaining
            if not remaining:break
    if not faces:return None
    vv=np.asarray(verts);ff=np.asarray(faces,dtype=np.int64)
    # Drop unused vertices and zero-area triangles after welding.
    tri=vv[ff];ok=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)>1e-9
    ff=ff[ok];used,inv=np.unique(ff,return_inverse=True);vv=vv[used];ff=inv.reshape(-1,3)
    require(len(ff)>0,'EMPTY_INLAY '+c['id'])
    return {'v':vv,'f':ff,'report':{'component':c['id'],'kind':'trunk' if trunk else 'main_branch','axialSpanM':span,
        'designedPaths':len(recipe),'pathsWithSurfaceFaces':sum(n>0 for n in lengths),'triangles':len(ff),
        'goldAreaApproxM2':areas,'barkAreaM2':base_area,'approxCoveragePct':100*areas/base_area}}
def wood_sources():
    result=[]
    for obj in sorted(bpy.context.scene.objects,key=lambda o:o.name):
        if obj.type=='MESH' and obj.name.startswith(('Trunk_bark','Branches_plum')):
            for c in a.components(obj):
                if c['count']>40:
                    c['tree']=a.bvh(c);result.append(c)
    return result
def verify_surface(parts,wood):
    # Reimport check on actual added surface mesh; all vertices and face centers
    # must stay close to a genuine wood triangle. Does not assert visibility.
    largest=0.;count=0
    for part in parts:
        points=np.vstack((part['v'],part['v'][part['f']].mean(axis=1)))
        for pt in points:
            best=float('inf')
            for c in wood:
                if np.linalg.norm(np.maximum(np.maximum(c['lo']-pt,pt-c['hi']),0))>=best:continue
                _,_,_,dist=c['tree'].find_nearest(Vector(pt))
                if dist is not None:best=min(best,float(dist))
            require(best<=.025,'GOLD_SURFACE_DISTANCE '+str(best))
            largest=max(largest,best);count+=1
    return {'samples':count,'maxDistanceM':largest,'toleranceM':.025,'status':'NATIVE_SURFACE_DISTANCE_PASS'}
def build(lod,prior):
    src=PARENT/PIN[lod][0]
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(src));bpy.context.view_layer.update()
    wood=wood_sources()
    trunks=[c for c in wood if c['obj'].startswith('Trunk_bark')]
    require(bool(trunks),'NO_TRUNK')
    root=max(trunks,key=lambda c:c['count'])
    branches=[]
    for c in wood:
        if not c['obj'].startswith('Branches_plum'):continue
        span=np.linalg.norm(c['hi']-c['lo'])
        if span>=5 and c['hi'][2]>=11.5 and c['lo'][2]>=4.0:branches.append(c)
    branches.sort(key=lambda c:(-np.linalg.norm(c['hi']-c['lo']),c['id']))
    # All qualifying major limbs get accents; no forced triangle or limb quota.
    require(bool(branches),'NO_MAIN_BRANCHES')
    selected=[root]+branches
    parts=[inlay(c,i==0,lod,i) for i,c in enumerate(selected)]
    require(all(x is not None for x in parts),'MISSING_SURFACE_PATH')
    require(all(x['report']['pathsWithSurfaceFaces']>=2 for x in parts),'INSUFFICIENT_PATHS')
    original,payload=a.compact.unpack(src);doc=copy.deepcopy(original);data=bytearray(payload)
    matches=[i for i,m in enumerate(doc['materials']) if m['name']==GOLD]
    require(len(matches)==1,'GOLD_MATERIAL')
    gi=matches[0];old=copy.deepcopy(doc['materials'][gi])
    doc['materials'][gi]['emissiveFactor']=[.95,.49,.12]
    doc['materials'][gi]['pbrMetallicRoughness']['roughnessFactor']=.58
    a.append_geometry(doc,data,parts,gi,'R18a_Surface_Gold_Inlays_'+lod)
    dest=ROOT/NAMES[lod];a.compact.emit(dest,doc,data)
    saved,raw=a.compact.unpack(dest)
    require(raw[:len(payload)]==payload,'ORIGINAL_BIN_CHANGED')
    for k in ('accessors','bufferViews','meshes','nodes'):
        require(saved[k][:len(original[k])]==original[k],'ORIGINAL_'+k+'_CHANGED')
    require(len(saved['materials'])==len(original['materials']) and all(m==saved['materials'][i] for i,m in enumerate(original['materials']) if i!=gi),'NON_GOLD_MATERIAL_CHANGED')
    require(saved['scenes'][original.get('scene',0)]['nodes'][:-1]==original['scenes'][original.get('scene',0)]['nodes'],'ROOT_HIERARCHY_CHANGED')
    newprim=saved['meshes'][-1]['primitives'];require(len(newprim)==1 and newprim[0]['material']==gi,'NON_GOLD_APPEND')
    q=a.rig.audit_glb(dest);stats=a.audit.parse(dest,q)
    delta=sum(len(x['f']) for x in parts)
    require(q['triangles']-PIN[lod][3]==delta and stats['degenerateTriangles']==0,'TRIANGLE_ACCOUNTING_OR_DEGENERATE')
    imported,_=a.audit.inspect_import(dest)
    require(np.allclose(imported['boundsYUpMeters'],prior['boundsYUpMeters'],rtol=0,atol=.001),'BOUNDS_CHANGED')
    new=[]
    for o in bpy.context.scene.objects:
        if o.type=='MESH' and o.name.startswith('R18a_Surface_Gold_Inlays_'):
            mesh=o.data;mesh.calc_loop_triangles()
            require(all(mesh.materials[t.material_index].name.startswith(GOLD) for t in mesh.loop_triangles),'IMPORTED_GOLD_ASSIGNMENT')
            new.append({'v':np.array([tuple(o.matrix_world@v.co) for v in mesh.vertices]),'f':np.array([tuple(t.vertices) for t in mesh.loop_triangles])})
    require(len(new)==1 and len(new[0]['f'])==delta,'IMPORTED_GOLD_TRIANGLES')
    proof=verify_surface(new,wood_sources())
    return {**q,**meta(dest),'vertexRecords':stats['vertexRecordsAcrossPrimitives'],'primitiveCount':stats['primitiveCount'],
       'attributeLogicalBytes':stats['attributeLogicalBytes'],'degenerateTriangles':stats['degenerateTriangles'],
       'boundsYUpMeters':imported['boundsYUpMeters'],'rootNodes':imported['rootNodes'],
       'originalBinPrefixExact':True,'originalAccessorsMeshesNodesExact':True,'nonGoldMaterialsExact':True,
       'attachmentEvidence':'REUSE_SA_ACCEPTED_R18_NON_GOLD_BYTES_IDENTICAL','priorContactEdges':prior['reimportAttachmentCheck']['contactEdgesVerified'],
       'goldMaterialChange':{'before':old,'after':saved['materials'][gi]},'goldOnlyDeltaTriangles':delta,
       'deltaBytes':q['bytes']-PIN[lod][1],'softReferenceTriangles':REF[lod],
       'goldSurfaceProof':proof,'inlays':[x['report'] for x in parts],
       'budgetPolicy':'ART_FIRST_SOFT_REFERENCE_REPORT_ACTUAL_NO_POLYGON_OR_BYTE_REJECTION'}
def main():
    prior=pin_inputs()
    out=ROOT/'validation.json'
    require(not out.exists(),'VALIDATION_ALREADY_EXISTS_DO_NOT_REBUILD_PASSED_CANDIDATE')
    result={}
    for lod in a.LODS:
        result[lod]=build(lod,prior['profiles'][lod])
        print('R18A_GOLD_PROFILE_PASS',lod,result[lod]['triangles'],result[lod]['goldOnlyDeltaTriangles'],flush=True)
    pin_inputs()
    a.write(out,{'status':'R18A_GOLD_NATIVE_VALIDATION_PASS','reviewedHead':REVIEWED,'review':REVIEW,'policyTaskBlob':POLICY,'baseline':a.HEAD,
        'profiles':result,'sourceHashes':{k:v[2] for k,v in PIN.items()},'blenderVersion':bpy.app.version_string,'ownerArtGO':'PENDING',
        'gate':'P10B8_ART_SA_REVIEW_REQUIRED','limitations':['Actual surface distance proxy, not artistic acceptance or manifold proof.','No geometry audit rerun: original R18 bytes identical; gold-only additions independently imported.','No runtime lighting or GPU benchmark.']})
    print('R18A_GOLD_NATIVE_BUILD_PASS',flush=True)
if __name__=='__main__':main()
