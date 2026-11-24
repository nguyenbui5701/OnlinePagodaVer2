"""R18 focused native Blender authoring; only R18 directory is writable.
Baseline editable is opened for actual component analysis. Compact GLB patch
preserves original buffers and adds indexed, surface-anchored wood supports.
No automatic replacement, decimation or regeneration of the accepted crown.
"""
import hashlib,json,math,sys,struct,copy
from pathlib import Path
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
def analyze(lod,repair=False):
    col=bpy.data.collections.get('R17b_'+lod.upper()+'_Editable')
    require(col is not None,'missing editable collection '+lod)
    col.hide_viewport=False;bpy.context.view_layer.update()
    objects=[o for o in col.all_objects if o.type=='MESH']
    count=sum(len(poly.vertices)-2 for o in objects for poly in o.data.polygons)
    require(count==PIN[lod][3],'baseline editable triangle mismatch '+lod)
    wood=[];flowers=[]
    for o in objects:
        if o.name.startswith(('Trunk_bark','Branches_plum')):
            for c in components(o):
                c['tree']=bvh(c);wood.append(c)
        elif o.name.startswith('Sakura_petal'):
            # Only low flower components near original draped stems are considered;
            # ordinary canopy cards are deliberately excluded.
            for c in components(o):
                if c['hi'][2]<12.7 and c['count'] in (10,20):flowers.append(c)
    root=max((c for c in wood if c['obj'].startswith('Trunk_bark')),key=lambda c:c['count'])
    rooted=closure(root,wood)
    stems=[c for c in wood if draped(c)]
    require(len(stems)==(5 if lod=='quality' else 10),'Unexpected draped stem count; inspect baseline before edits: '+str(len(stems)))
    # Small original bark knots/seam relief are not structural branch members.
    structural=[c for c in wood if c['obj'].startswith('Branches_plum') or (c['obj'].startswith('Trunk_bark') and max(c['hi']-c['lo'])>1.8)]
    gaps=[];added=[];gold=[];unresolved=[]
    for c in structural:
        if c['id'] in rooted:continue
        parents=[x for x in wood if x['id'] in rooted and x['hi'][2]>c['lo'][2]-.8 and not draped(x)]
        if not parents:
            unresolved.append({'component':c['id'],'reason':'no rooted parent at suitable elevation'});continue
        pts=top_band(c) if draped(c) else c['v']
        gap,a,b,parent=nearest(c,parents,pts)
        info={**summary(c),'kind':'draped_twig' if draped(c) else 'woody_component','parent':parent['id'],'gapMetersVertexToSurface':float(gap),'childPoint':a.tolist(),'parentPoint':b.tolist()}
        gaps.append(info)
        if not repair:continue
        if gap>4.5 or gap<1e-6:
            unresolved.append({**info,'reason':'gap outside bounded repair; manual inspection required'});continue
        direction=unit(a-b)
        # Starting inside parent; short overlap into child. Actual intersections
        # checked below, not inferred merely from a distance threshold.
        rad=.060 if draped(c) else min(.22,max(.055,.15*min(sorted(c['hi']-c['lo'])[1:])))
        support=tube(b-direction*min(.22,rad*2),a+direction*min(.13,rad),rad,6 if lod=='quality' else 5)
        support['id']='R18_support_'+str(len(added));support['tree']=bvh(support)
        if not touching(support,parent) or not touching(support,c):
            unresolved.append({**info,'reason':'support triangle overlap not established at both ends'});continue
        added.append(support);wood.append(support);rooted=closure(root,wood)
        info.update({'fix':support['id'],'parentIntersection':True,'childIntersection':True,'trianglesAdded':support['count']})
        # Thin warm inlaid-looking ribbon on the same new branch surface,
        # only on larger woody repairs, not on tiny hanging stems.
        if not draped(c) and gap>.25:
            n=6 if lod=='quality' else 5
            vv=support['v'];ribbon=[]
            for j in range(4):
                row=vv[j*n:(j+1)*n];a0=row[0];a1=row[1];mid=(a0+a1)*.5
                outward=unit(mid-row.mean(axis=0))*.003
                ribbon.extend([mid+(a0-mid)*.25+outward,mid+(a1-mid)*.25+outward])
            ff=[(2*j,2*j+1,2*j+2) for j in range(3)]+[(2*j+1,2*j+3,2*j+2) for j in range(3)]
            gold.append({'v':np.array(ribbon),'f':np.array(ff,dtype=np.int64)})
    flowerRows=[]
    # Original petal fans share center after analysis welding. Retain ordinary
    # disconnected petals; check only the known low hanging group envelope.
    for c in flowers:
        nearby=[s for s in stems if np.linalg.norm(c['center']-s['v'][np.argmin(s['v'][:,2])])<1.35]
        if not nearby:
            unresolved.append({**summary(c),'reason':'low flower component not attributed to known draped stem; review manually'})
            continue
        c['tree']=bvh(c)
        gap,a,b,parent=nearest(c,nearby)
        info={**summary(c),'parent':parent['id'],'gapMetersVertexToSurface':float(gap)}
        flowerRows.append(info)
        if not repair or gap<=.045:continue
        if parent['id'] not in rooted or gap>.95:
            unresolved.append({**info,'reason':'flower support outside bounded rooted stem'});continue
        direction=unit(a-b)
        s=tube(b-direction*.035,a+direction*.018,.018,5)
        s['id']='R18_flower_support_'+str(len(added));s['tree']=bvh(s)
        if not touching(s,parent):
            unresolved.append({**info,'reason':'flower support does not intersect rooted stem'});continue
        # A two-sided petal sheet may not intersect the tube if its terminal
        # contact is tangent. Require measured overlap rather than assume.
        if not touching(s,c):
            unresolved.append({**info,'reason':'flower support does not intersect flower sheet'});continue
        added.append(s);info.update({'fix':s['id'],'parentIntersection':True,'flowerIntersection':True,'trianglesAdded':s['count']})
    return {'root':root['id'],'woodComponents':len(wood),'rootedStructuralCount':sum(c['id'] in rooted for c in structural),
            'structuralCount':len(structural),'drapedStems':list(map(summary,stems)),
            'attachmentFindings':gaps,'lowFlowerFindings':flowerRows,'unresolved':unresolved,
            'method':'Triangle BVH intersections and coordinate-weld component graph; not manifold weld or solid containment proof. Near/tangent contacts and original ornamental seams require visual review.'},added,gold
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
def build(lod,parts,gold):
    original,payload=compact.unpack(BASE/PIN[lod][0]);doc=copy.deepcopy(original);data=bytearray(payload)
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
    require(bin[:len(payload)]==payload and all(saved[k][:len(original[k])]==original[k] for k in ('accessors','bufferViews','meshes','nodes')),'baseline mesh data changed')
    q=rig.audit_glb(dest);require(q['triangles']<=PIN[lod][4],'triangle cap exceeded')
    require(q['bytes']<=PIN[lod][1]*1.05,'5% byte increase guard exceeded')
    raw=audit.parse(dest,q);require(raw['degenerateTriangles']==0,'degenerate triangle in R18')
    # Native reimport, actual bounds; keep previous scale/pivot and world extents.
    imported,_=audit.inspect_import(dest)
    old=read(BASE/'final/R17B_FINAL_RESULT.json')['canonicalGLBs'][lod]
    require(np.allclose(imported['boundsYUpMeters'],old['boundsYUpMeters'],atol=.001,rtol=0),'R18 extents changed')
    return {**q,**filemeta(dest),'vertexRecords':raw['vertexRecordsAcrossPrimitives'],'primitiveCount':raw['primitiveCount'],
            'boundsYUpMeters':imported['boundsYUpMeters'],'rootNodes':imported['rootNodes'],'attributeLogicalBytes':raw['attributeLogicalBytes'],
            'degenerateTriangles':raw['degenerateTriangles'],'materialChanges':changes,'deltaTriangles':q['triangles']-PIN[lod][3],
            'deltaBytes':q['bytes']-PIN[lod][1],'budgetNote':'Only bounded supports/accents; any increase from R17B needs SA acceptance. No blanket re-export or normal duplication.','originalBinPrefixExact':True}
def main():
    pins()
    stage=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'audit'
    require(stage in ('audit','build'),'use audit or build')
    results={};models={}
    if stage=='build':
        prior=read(ROOT/'attachment_audit.json')
        require(prior['baseline']==HEAD and prior['status']=='AUDIT_COMPLETE_REVIEW_REQUIRED','native audit must precede repair')
        require(set(prior['profiles'])==set(LODS),'missing profile audit')
        for name in ('validation.json','cycles_manifest.json'):
            stale=ROOT/name
            if stale.exists():stale.unlink()
    for lod in LODS:
        if stage=='audit':
            path=BASE/PIN[lod][0];q=rig.audit_glb(path)
            require(q['triangles']==PIN[lod][3],'baseline triangle mismatch')
            imported,_=audit.inspect_import(path)
            require(imported['rootNodes'],'native baseline import missing root')
        # The accepted editable is the actual source for component extraction.
        bpy.ops.wm.open_mainfile(filepath=str(BASE/BLEND[0]))
        result,parts,gold=analyze(lod,repair=stage=='build');results[lod]=result
        if stage=='audit':result['nativeGLBImport']={'triangles':q['triangles'],'boundsYUpMeters':imported['boundsYUpMeters'],'sha256':q['sha256']}
        if stage=='build':
            write(ROOT/'attachment_diagnostics.json',{'baseline':HEAD,'profiles':results,'status':'IN_PROGRESS'})
            require(not result['unresolved'],'R18 unresolved attachments; see attachment_diagnostics.json; no final render')
            require(result['rootedStructuralCount']==result['structuralCount'],'R18 structural connectivity incomplete')
            models[lod]=build(lod,parts,gold)
    write(ROOT/('attachment_audit.json' if stage=='audit' else 'attachment_diagnostics.json'),
          {'baseline':HEAD,'profiles':results,'status':'AUDIT_COMPLETE_REVIEW_REQUIRED' if stage=='audit' else 'NATIVE_REPAIR_PROXY_PASS_VISUAL_REVIEW_REQUIRED'})
    if stage=='build':write(ROOT/'validation.json',{'baseline':HEAD,'profiles':models,'status':'NATIVE_GLB_VALIDATION_PASS_EDITABLE_RENDER_PENDING','ownerArtGO':'PENDING'})
    pins();print('R18_'+stage.upper()+'_COMPLETE',flush=True)
if __name__=='__main__':main()
