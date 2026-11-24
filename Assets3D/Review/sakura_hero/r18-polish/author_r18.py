"""R18 focused native Blender authoring; only R18 directory is writable.
Baseline editable is opened for focused group relocation. Compact GLB patch
changes only selected positions and adds short indexed surface-anchored supports.
No automatic replacement, decimation or regeneration of the accepted crown.
"""
import hashlib,json,math,sys,struct,copy
from pathlib import Path
from types import SimpleNamespace
import bpy
import numpy as np
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

ROOT=Path(__file__).resolve().parent
R17=ROOT.parent/'r17-lush'
BASE=R17/'r17b'
sys.dont_write_bytecode=True
sys.path.insert(0,str(R17))
sys.path.insert(0,str(BASE))
import author_r17_blender as rig
import author_r17b_preview as compact
import audit_r17_read_only as audit
import repair_r18_groups as repair
HEAD='07f57cb35ba3ec68184abbd2c173e29a3fcc4788'
PIN={
 'quality':('preview/sakura_hero_r17b.glb',6981312,'1ed05dd2c0451364122e20999955dedb3be213305a59a45c61853013495f0267',236888,250000),
 'eco':('preview/sakura_hero_r17b_eco.glb',2149264,'3b7e87f61ed120a2c938e572e0d0fe2c858c6fbc8027657efe16c232906de770',58212,60000)}
BLEND=('final/sakura_hero_r17b_editable.blend',22191226,'9043df77297e82051dbdc6da2c9bbe5ac38895fa1155d9661fd9ef8cca3d63e2')
LODS=('quality','eco')
NAMES={'quality':'sakura_hero_r18.glb','eco':'sakura_hero_r18_eco.glb'}
E=ROOT/'R18_Cycles_Evidence'
def require(ok,msg):
    if not ok:raise RuntimeError(msg)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,obj):p.write_text(json.dumps(obj,indent=2)+'\n',encoding='utf-8')
def filemeta(p):return {'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
def pins():
    for rel,n,h,*_ in [*PIN.values(),BLEND]:
        p=BASE/rel;require(p.is_file() and p.stat().st_size==n and sha(p)==h,'R18_INPUT_MISSING_OR_SHA_MISMATCH '+str(p))
    require(bpy.app.version_string=='4.5.16 LTS','Use baseline Blender 4.5.16 LTS')
    print('R18_BASELINE_SHA_PASS',flush=True)
def components(obj):
    """Coordinate-weld for analysis only (10 micrometers); no original mesh mutation."""
    mesh=obj.data;mesh.calc_loop_triangles()
    verts=np.array([tuple(obj.matrix_world@v.co) for v in mesh.vertices],dtype=np.float64)
    keys=np.rint(verts*100000).astype(np.int64)
    _,inverse=np.unique(keys,axis=0,return_inverse=True)
    inverse=inverse.reshape(-1)
    parent=list(range(int(inverse.max())+1))
    def find(a):
        while parent[a]!=a:
            parent[a]=parent[parent[a]];a=parent[a]
        return a
    faces=np.array([tuple(t.vertices) for t in mesh.loop_triangles],dtype=np.int64)
    for t in inverse[faces]:
        a,b,c=map(find,t);parent[b]=a;parent[c]=a
    buckets={}
    for i,t in enumerate(faces):buckets.setdefault(find(int(inverse[t[0]])),[]).append(i)
    out=[]
    for k,ids in enumerate(buckets.values()):
        tri=faces[ids];vi,inv=np.unique(tri,return_inverse=True);v=verts[vi];tri=inv.reshape(-1,3)
        lo=v.min(axis=0);hi=v.max(axis=0)
        out.append({'id':obj.name+':'+str(k),'obj':obj.name,'v':v,'f':tri,'lo':lo,'hi':hi,
                    'count':len(tri),'center':(lo+hi)/2})
    return out
def bvh(c):return BVHTree.FromPolygons(c['v'].tolist(),c['f'].tolist(),all_triangles=True,epsilon=0.0)
def box_overlap(a,b):
    return bool(np.all(a['lo']<=b['hi']) and np.all(b['lo']<=a['hi']))
def touching(a,b):
    return box_overlap(a,b) and bool(a['tree'].overlap(b['tree']))
def summary(c):
    return {'id':c['id'],'triangles':c['count'],'boundsBlenderMeters':[c['lo'].tolist(),c['hi'].tolist()]}
def nearest(c,targets,points=None):
    best=None
    for a in (c['v'] if points is None else points):
        for t in targets:
            # AABB lower bound prevents unnecessary BVH queries.
            d=np.maximum(np.maximum(t['lo']-a,a-t['hi']),0)
            if best and np.linalg.norm(d)>=best[0]:continue
            p,n,i,gap=t['tree'].find_nearest(Vector(a))
            if p is not None and (best is None or gap<best[0]):best=(gap,np.array(a),np.array(p),t)
    require(best is not None,'no parent surface')
    return best
def draped(c):
    # R16 source: 3 rings, 5 sides, capped = 30 triangles; thin ~1.4m hanging stem.
    span=c['hi']-c['lo']
    return c['obj'].startswith('Branches_plum') and c['count']==30 and 1.0<span[2]<1.8 and max(span[:2])<.65 and 9<c['lo'][2]<12
def top_band(c):
    return c['v'][c['v'][:,2]>=c['hi'][2]-.13]
def unit(v):
    n=np.linalg.norm(v);require(n>1e-8,'zero support tangent');return v/n
def tube(a,b,radius,sides):
    """Small taper with buried ends and continuous bent centerline, not disconnected caps."""
    d=unit(b-a);axis=np.array([0.,0.,1.]) if abs(d[2])<.93 else np.array([1.,0.,0.])
    u=unit(np.cross(d,axis));v=np.cross(d,u)
    vertices=[];faces=[]
    for j,t in enumerate((0.,.33,.67,1.)):
        center=a+(b-a)*t+u*(.06*np.linalg.norm(b-a)*math.sin(math.pi*t))
        rr=radius*(1-.45*t)
        for i in range(sides):
            th=2*math.pi*i/sides;vertices.append(center+rr*(u*math.cos(th)+v*math.sin(th)))
    for j in range(3):
        for i in range(sides):
            x=j*sides+i;y=j*sides+(i+1)%sides;z=x+sides;w=y+sides
            faces.extend(((x,y,z),(y,w,z)))
    for i in range(1,sides-1):
        faces.extend(((0,i+1,i),(3*sides,3*sides+i,3*sides+i+1)))
    xyz=np.asarray(vertices);f=np.asarray(faces,dtype=np.int64)
    return {'v':xyz,'f':f,'lo':xyz.min(axis=0),'hi':xyz.max(axis=0),'count':len(f)}
def closure(root,wood):
    rooted={root['id']}
    changed=True
    while changed:
        changed=False
        for a in wood:
            if a['id'] in rooted:continue
            if any(touching(a,b) for b in wood if b['id'] in rooted):
                rooted.add(a['id']);changed=True
    return rooted
def append_geometry(doc,data,parts,mat,name):
    if not parts:return
    xyz=[];idx=[]
    for c in parts:
        off=len(xyz);xyz.extend(c['v']);idx.extend(c['f']+off)
    # Blender Z-up to glTF Y-up, proper orientation transform.
    v=np.asarray(xyz,dtype='<f4')[:,[0,2,1]].copy();v[:,2]*=-1
    f=np.asarray(idx,dtype=np.int64);tri=v[f].astype(np.float64)
    cross=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);require((np.linalg.norm(cross,axis=1)>1e-12).all(),'degenerate repair')
    normals=np.zeros_like(v,dtype=np.float64)
    for i in range(3):np.add.at(normals,f[:,i],cross)
    norm=np.linalg.norm(normals,axis=1);require((norm>1e-12).all(),'zero repair normal')
    n=(normals/norm[:,None]).astype('<f4')
    def accessor(arr,kind,target):
        data.extend(b'\0'*((-len(data))%4));off=len(data);raw=arr.tobytes();data.extend(raw)
        bv=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(raw),'target':target})
        a={'bufferView':bv,'componentType':5126 if arr.dtype.kind=='f' else (5123 if arr.dtype.itemsize==2 else 5125),'count':len(arr),'type':kind}
        if kind=='VEC3':a.update(min=arr.min(axis=0).tolist(),max=arr.max(axis=0).tolist())
        else:a.update(min=[int(arr.min())],max=[int(arr.max())])
        i=len(doc['accessors']);doc['accessors'].append(a);return i
    prim={'attributes':{'POSITION':accessor(v,'VEC3',34962),'NORMAL':accessor(n,'VEC3',34962)},
          'indices':accessor(f.astype('<u2' if len(v)<=65536 else '<u4').ravel(),'SCALAR',34963),'material':mat,'mode':4}
    mi=len(doc['meshes']);doc['meshes'].append({'name':name,'primitives':[prim]})
    ni=len(doc['nodes']);doc['nodes'].append({'name':name,'mesh':mi});doc['scenes'][doc.get('scene',0)]['nodes'].append(ni)
def build(api,lod,parts,gold,moves,contacts):
    original,payload=compact.unpack(BASE/PIN[lod][0]);doc=copy.deepcopy(original);data=bytearray(payload)
    changes_pos,ranges=repair.patch_positions(api,doc,data,moves)
    repair.check_patch(api,original,payload,doc,data,changes_pos,ranges)
    ids={x['name']:i for i,x in enumerate(doc['materials'])}
    append_geometry(doc,data,parts,ids['Branches_plum'],'R18_Connected_Branch_Supports_'+lod)
    append_geometry(doc,data,gold,ids['Golden_bark_veins'],'R18_Branch_Gold_Accents_'+lod)
    changes=[]
    for m in doc['materials']:
        name=m['name'];old=copy.deepcopy(m)
        if name=='Golden_bark_veins':
            m['emissiveFactor']=[.85,.38,.085];m['pbrMetallicRoughness']['roughnessFactor']=.65
        elif name.startswith('R17b_ShadowRose'):
            m['emissiveFactor']=[.035,.012,.020]
        elif name.startswith('Canopy_'):
            m['emissiveFactor']=[.035,.014,.021]
        if m!=old:changes.append({'name':name,'before':old,'after':copy.deepcopy(m)})
    dest=ROOT/NAMES[lod];compact.emit(dest,doc,data)
    saved,bin=compact.unpack(dest)
    repair.check_patch(api,original,payload,saved,bin,changes_pos,ranges)
    require(bin[:len(data)]==bytes(data),'serialized GLB payload mismatch')
    q=rig.audit_glb(dest);require(q['triangles']<=PIN[lod][4],'triangle cap exceeded')
    require(q['bytes']<=PIN[lod][1]*1.05,'5% byte increase guard exceeded')
    require(q['triangles']-PIN[lod][3]==sum(len(c['f']) for c in parts+gold) and q['triangles']-PIN[lod][3]<=repair.MAX_ADDED,'focused triangle accounting mismatch')
    raw=audit.parse(dest,q);require(raw['degenerateTriangles']==0,'degenerate triangle in R18')
    # Native reimport, actual bounds; keep previous scale/pivot and world extents.
    imported,_=audit.inspect_import(dest)
    reimport=repair.verify_import(api,moves,contacts)
    old=read(BASE/'final/R17B_FINAL_RESULT.json')['canonicalGLBs'][lod]
    require(np.allclose(imported['boundsYUpMeters'],old['boundsYUpMeters'],atol=.001,rtol=0),'R18 extents changed')
    return {**q,**filemeta(dest),'vertexRecords':raw['vertexRecordsAcrossPrimitives'],'primitiveCount':raw['primitiveCount'],
            'boundsYUpMeters':imported['boundsYUpMeters'],'rootNodes':imported['rootNodes'],'attributeLogicalBytes':raw['attributeLogicalBytes'],
            'degenerateTriangles':raw['degenerateTriangles'],'materialChanges':changes,'deltaTriangles':q['triangles']-PIN[lod][3],
            'deltaBytes':q['bytes']-PIN[lod][1],'budgetNote':'Rigid group translation + short indexed supports/accents only; at most 600 extra triangles, prior absolute caps and +5% bytes guard unchanged. Any increase needs SA acceptance.','originalBinPrefixExact':False,'unmodifiedBytesOutsideSelectedPositionsExact':True,'positionChanges':changes_pos,'reimportAttachmentCheck':reimport}
def main():
    pins()
    stage=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'build'
    require(stage=='build','R18 audited baseline frozen; use focused Build only')
    audit_path=ROOT/'attachment_audit.json'
    require(audit_path.is_file() and sha(audit_path)==repair.AUDIT_SHA,'R18 exact reviewed attachment_audit.json required')
    prior=read(audit_path)
    require(prior['baseline']==HEAD and prior['status']=='AUDIT_COMPLETE_REVIEW_REQUIRED' and set(prior['profiles'])==set(LODS),'native audit receipt mismatch')
    for name in ('validation.json','cycles_manifest.json','R18_Repair_Preview/preview_manifest.json'):
        stale=ROOT/name
        if stale.exists():stale.unlink()
    api=SimpleNamespace(**globals())
    results={};models={}
    for lod in LODS:
        bpy.ops.wm.open_mainfile(filepath=str(BASE/BLEND[0]))
        try:
            result,parts,gold,moves,contacts=repair.repair(api,lod,prior['profiles'][lod])
            results[lod]=result
            write(ROOT/'attachment_diagnostics.json',{'baseline':HEAD,'sourceAuditSHA256':repair.AUDIT_SHA,'profiles':results,'status':'IN_PROGRESS'})
            models[lod]=build(api,lod,parts,gold,moves,contacts)
            result['reimportAttachmentCheck']=models[lod]['reimportAttachmentCheck']
        except Exception as exc:
            write(ROOT/'attachment_diagnostics.json',{'baseline':HEAD,'sourceAuditSHA256':repair.AUDIT_SHA,'profiles':results,'failedProfile':lod,'error':str(exc),'status':'HOLD_REPAIR_FAILED'})
            raise
    write(ROOT/'attachment_diagnostics.json',{'baseline':HEAD,'sourceAuditSHA256':repair.AUDIT_SHA,'profiles':results,'status':'NATIVE_REPAIR_PROXY_PASS_VISUAL_REVIEW_REQUIRED'})
    write(ROOT/'validation.json',{'baseline':HEAD,'profiles':models,'status':'NATIVE_GLB_VALIDATION_PASS_EDITABLE_RENDER_PENDING','ownerArtGO':'PENDING','finalCycles':'HOLD_PENDING_FOCUSED_PREVIEW_REVIEW'})
    pins();print('R18_FOCUSED_BUILD_COMPLETE; PREVIEW_REQUIRED; FINAL_HOLD',flush=True)
if __name__=='__main__':main()
