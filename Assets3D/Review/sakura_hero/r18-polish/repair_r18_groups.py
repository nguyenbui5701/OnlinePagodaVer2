"""R18 focused relocation, audit-pinned. No indiscriminate welding or rebuild.
Translate all vertices of each verified hanging group; retain its existing faces,
normals/material assignment. Short indexed supports only, fixed triangle budget.
"""
import copy, math
import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree

AUDIT_SHA='d1bd1bc8d914893e6c98b96b00553191b0497dd548e982c44979af7a42c20baa'
EXPECTED={'quality':(5,8,31,13),'eco':(10,6,12,2)}
MAX_ADDED=600

def material(c):
    return c['obj'].split('.')[0]
def key(v):
    return tuple(np.rint(np.asarray(v)*100000).astype(np.int64))
def normalized_id(s):
    ob,n=s.rsplit(':',1)
    return ob.split('.')[0]+':'+n
def move(c,delta,a):
    out=dict(c);out['v']=c['v']+delta
    out['lo']=out['v'].min(axis=0);out['hi']=out['v'].max(axis=0)
    out['center']=(out['lo']+out['hi'])*.5;out['tree']=a.bvh(out)
    return out
def short_tube(a,start,end,radius,sides):
    d=a.unit(end-start);axis=np.array([0.,0.,1.]) if abs(d[2])<.93 else np.array([1.,0.,0.])
    u=a.unit(np.cross(d,axis));v=np.cross(d,u)
    xyz=[];faces=[]
    for center,rr in ((start,radius),(end,radius*.72)):
        for i in range(sides):
            th=2*math.pi*i/sides
            xyz.append(center+rr*(u*math.cos(th)+v*math.sin(th)))
    for i in range(sides):
        j=(i+1)%sides;faces.extend(((i,j,i+sides),(j,j+sides,i+sides)))
    for i in range(1,sides-1):
        faces.extend(((0,i+1,i),(sides,sides+i,sides+i+1)))
    # Quantize to actual GLB float32 precision BEFORE checking intersection.
    xyz=np.array(xyz,dtype=np.float32).astype(np.float64);f=np.array(faces,dtype=np.int64)
    c={'v':xyz,'f':f,'lo':xyz.min(axis=0),'hi':xyz.max(axis=0),'count':len(f)}
    c['tree']=a.bvh(c);return c
def connector(a,parent,child,sides,radius,max_gap):
    if a.touching(parent,child):return None
    gap,cp,pp,_=a.nearest(child,[parent])
    a.require(gap<=max_gap,'R18 bounded connector gap '+child['id']+' '+str(gap))
    # Try a finite set of actual surface directions and burial depths; every
    # successful support must intersect BOTH actual surfaces at float32 precision.
    pairs=[(cp,pp)]
    for pt in (child['v'][child['f']].mean(axis=1)):
        q,_,_,dist=parent['tree'].find_nearest(Vector(pt))
        if q is not None and dist<=max_gap:pairs.append((pt,np.array(q)))
    pairs=sorted(pairs,key=lambda x:float(np.linalg.norm(x[0]-x[1])))[:12]
    for x,y in pairs:
        d=x-y
        if np.linalg.norm(d)<1e-7:continue
        d=a.unit(d)
        for ext in (.04,.08,.14):
            for scale in (1.,1.5,2.):
                c=short_tube(a,y-d*ext,x+d*ext,radius*scale,sides)
                if a.touching(c,parent) and a.touching(c,child):return c
    raise RuntimeError('R18_CONTACT_NOT_PROVEN '+parent['id']+' -> '+child['id'])
def verified(c,row,a):
    a.require(c['count']==row['triangles'] and np.allclose([c['lo'],c['hi']],row['boundsBlenderMeters'],rtol=0,atol=2e-5),
              'R18 audit component drift '+row['id'])
def anchor_candidates(parent,preferred):
    # Existing mesh face centroids (on the real surface), plus exact audited point.
    pts=np.concatenate((np.asarray(preferred).reshape(1,3),parent['v'][parent['f']].mean(axis=1)),axis=0)
    return pts
def repair(a,lod,prior):
    ns,nf,norn,nisolated=EXPECTED[lod]
    col=a.bpy.data.collections.get('R17b_'+lod.upper()+'_Editable')
    a.require(col is not None,'missing baseline editable collection')
    col.hide_viewport=False;a.bpy.context.view_layer.update()
    objs=[o for o in col.all_objects if o.type=='MESH']
    a.require(sum(len(p.vertices)-2 for o in objs for p in o.data.polygons)==a.PIN[lod][3],'editable count mismatch')
    wood=[];flowers=[]
    for o in objs:
        if o.name.startswith(('Trunk_bark','Branches_plum')):
            for c in a.components(o):c['tree']=a.bvh(c);wood.append(c)
        elif o.name.startswith(('Sakura_petal_pink','Sakura_petal_blush')):
            flowers.extend(c for c in a.components(o) if c['hi'][2]<12.7 and c['count'] in (10,20))
    byid={c['id']:c for c in wood+flowers}
    root=byid[prior['root']]
    # Source bark_knots() uses 5 rings x 4 sides + center caps =40 triangles.
    # These short decorative grain ridges are not structural branches.
    ornaments=[c for c in wood if material(c)=='Branches_plum' and c['count']==40]
    a.require(len(ornaments)==norn,'R18 ornament signature mismatch')
    ornament_ids={c['id'] for c in ornaments}
    structural=[c for c in wood if c['id'] not in ornament_ids]
    rooted=a.closure(root,structural)
    stems=[byid[row['id']] for row in prior['drapedStems']]
    a.require(len(stems)==ns and all(a.draped(c) for c in stems),'draped signature mismatch')
    for c,row in zip(stems,prior['drapedStems']):verified(c,row,a)
    stem_ids={c['id'] for c in stems}
    missing=[c for c in structural if c['id'] not in rooted and c['id'] not in stem_ids]
    a.require(not missing,'R18 genuine non-draped structural gaps need review '+str([c['id'] for c in missing]))
    isolated=[row for row in prior['attachmentFindings'] if row['id'] in ornament_ids]
    a.require(len(isolated)==nisolated,'ornament audit count mismatch')
    for row in isolated:verified(byid[row['id']],row,a)
    groups={c['id']:[] for c in stems}
    seen=set()
    # Center-to-low-end-envelope assignment agrees with exact source flower counts;
    # the former nearest-surface assignment mixed adjacent QUALITY clusters.
    for row in prior['lowFlowerFindings']:
        c=byid[row['id']];verified(c,row,a)
        a.require(c['id'] not in seen,'duplicate flower component');seen.add(c['id'])
        stem=min(stems,key=lambda s:float(np.linalg.norm(c['center']-s['lo'])))
        groups[stem['id']].append(c)
    a.require(len(seen)==ns*nf and set(seen)=={c['id'] for c in flowers},'unattributed low flower component')
    for name,cs in groups.items():
        a.require(len(cs)==nf and all(sum(material(x)==m for x in cs)==nf//2 for m in ('Sakura_petal_pink','Sakura_petal_blush')),'flower ownership mismatch '+name)
    oldg={x['id']:x for x in prior['attachmentFindings'] if x['kind']=='draped_twig'}
    a.require(set(oldg)==stem_ids,'missing measured hanging groups')
    parents=[c for c in structural if c['id'] in rooted and material(c)=='Branches_plum' and c['count']>40 and c['hi'][2]>10.5]
    moves=[];parts=[];gold=[];rows=[];contacts=[];placed=[]
    sides=4 if lod=='quality' else 3
    for stem in stems:
        row=oldg[stem['id']];verified(stem,row,a)
        # All original gaps are >1m. Move the whole group together; never draw
        # a 3-6m artificial rod. Deduplicate anchor sites and keep groups apart.
        preferred=np.asarray(row['parentPoint']);child=np.asarray(row['childPoint'])
        choices=[]
        for parent in parents:
            q,_,_,_=parent['tree'].find_nearest(Vector(preferred))
            if q is None:continue
            pts=anchor_candidates(parent,q)
            if parent['id']==row['parent']:pts=np.concatenate((preferred.reshape(1,3),pts))
            for pt in pts:
                if not 10.6<=pt[2]<=17.0 or np.linalg.norm(pt[:2])<3.:continue
                delta=pt+np.array([0.,0.,-.18])-child
                center=stem['center']+delta
                if np.linalg.norm(delta)>8.0 or any(np.linalg.norm(center-prev)<1.8 for prev in placed):continue
                # Prefer audited parent, keep the nearest feasible point.
                score=float(np.linalg.norm(pt-preferred))+(0. if parent['id']==row['parent'] else .75)
                choices.append((score,parent,pt,delta))
        a.require(bool(choices),'R18 no separated parent anchor '+stem['id'])
        _,parent,pt,delta=min(choices,key=lambda x:x[0])
        moved=move(stem,delta,a);placed.append(moved['center'])
        support=connector(a,parent,moved,sides,.038,.40)
        if support is not None:
            support['id']='R18_support_'+str(len(parts));parts.append(support)
            contacts.append((support,parent,moved))
            # Tiny offset patch follows one existing side face of the short support;
            # does not introduce free-floating decorative gold tubes.
            tri=support['v'][support['f'][0]]
            n=a.unit(np.cross(tri[1]-tri[0],tri[2]-tri[0]))
            mid=tri.mean(axis=0);v=(mid+(tri-mid)*.55+n*.0015)
            gold.append({'v':v,'f':np.array([[0,1,2]],dtype=np.int64)})
        else:contacts.append((None,parent,moved))
        moves.append((stem,moved))
        flower_rows=[]
        for old in groups[stem['id']]:
            petal=move(old,delta,a)
            # Actual same group moved as one rigid translation; no normal edits.
            petal_support=connector(a,moved,petal,sides,.013,.95)
            if petal_support is not None:
                petal_support['id']='R18_support_'+str(len(parts));parts.append(petal_support)
            contacts.append((petal_support,moved,petal));moves.append((old,petal))
            flower_rows.append({'id':old['id'],'fix':petal_support['id'] if petal_support else 'DIRECT_BVH_CONTACT'})
        rows.append({'id':stem['id'],'oldParent':row['parent'],'newParent':parent['id'],
          'oldGapMeters':row['gapMetersVertexToSurface'],'childPoint':row['childPoint'],'parentPoint':row['parentPoint'],
          'newAnchor':pt.tolist(),'deltaBlenderMeters':delta.tolist(),'newBoundsBlenderMeters':[moved['lo'].tolist(),moved['hi'].tolist()],
          'fix':support['id'] if support else 'DIRECT_BVH_CONTACT','flowers':flower_rows})
    total=sum(len(c['f']) for c in parts+gold)
    a.require(total<=MAX_ADDED,'R18 focused added triangle budget exceeded')
    result={'root':root['id'],'woodComponents':len(wood),'rootedStructuralCount':len(structural),
      'structuralCount':len(structural),'ornamentalReliefCount':len(ornaments),'ornamentalIsolatedPreserved':isolated,
      'drapedStems':prior['drapedStems'],'attachmentFindings':rows,'flowerCount':ns*nf,
      'relocatedComponents':len(moves),'addedTrianglesPlannedActual':total,'unresolved':[],
      'method':'Exact audit component signatures; rigid group translations, separated real parent anchors, short indexed supports with measured BVH contact. Decorative bark preserved, not declared structural. Native GLB reimport contact check required.'}
    return result,parts,gold,moves,contacts

def patch_positions(a,doc,data,moves):
    """Patch only selected POSITION float32 triples in the new GLB copy.
    Existing primitives/indices/normals stay intact, accessor min/max updated.
    Coordinate matching is fail-closed, including full vertex coverage.
    """
    groups={}
    for old,new in moves:
        target=groups.setdefault(material(old),{})
        for x,y in zip(old['v'],new['v']):
            k=key(x)
            a.require(k not in target or np.allclose(target[k],y,atol=1e-6,rtol=0),'ambiguous vertex movement')
            target[k]=y
    changed=[];used=set();ranges=[]
    for mesh in doc['meshes']:
        for prim in mesh['primitives']:
            name=doc['materials'][prim['material']]['name']
            if name not in groups:continue
            i=prim['attributes']['POSITION'];acc=doc['accessors'][i];view=doc['bufferViews'][acc['bufferView']]
            a.require(name not in used and acc['componentType']==5126 and acc['type']=='VEC3' and 'sparse' not in acc,'unsupported original position layout '+name)
            a.require(sum(p['attributes'].get('POSITION')==i for m in doc['meshes'] for p in m['primitives'])==1,'shared POSITION accessor')
            used.add(name)
            offset=view.get('byteOffset',0)+acc.get('byteOffset',0);stride=view.get('byteStride',12)
            a.require(stride>=12 and offset+(acc['count']-1)*stride+12<=len(data),'position accessor range')
            xyz=np.ndarray((acc['count'],3),dtype='<f4',buffer=data,offset=offset,strides=(stride,4))
            hits=set();count=0
            for j in range(len(xyz)):
                x,y,z=map(float,xyz[j]);k=key((x,-z,y))
                if k not in groups[name]:continue
                v=groups[name][k]
                xyz[j]=(v[0],v[2],-v[1]);hits.add(k);count+=1;ranges.append((offset+j*stride,offset+j*stride+12))
            a.require(hits==set(groups[name]),'incomplete selected POSITION mapping '+name+' '+str(len(hits))+'/'+str(len(groups[name])))
            acc['min']=xyz.min(axis=0).tolist();acc['max']=xyz.max(axis=0).tolist()
            changed.append({'material':name,'accessor':i,'vertexRecords':count,'uniqueSelectedCoordinates':len(hits)})
            del xyz
    a.require(used==set(groups),'missing original material position')
    # Guard against aliased data: changed POSITION bytes must not overlap any
    # other accessor's occupied byte records, including interleaved attributes.
    changed_ids={x['accessor'] for x in changed}
    from bisect import bisect_left
    ordered=sorted(ranges);starts=[x[0] for x in ordered]
    sizes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};widths={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
    for i,acc in enumerate(doc['accessors']):
        if i in changed_ids:continue
        a.require('sparse' not in acc and 'bufferView' in acc and acc['type'] in widths,'unsupported original accessor in alias guard')
        view=doc['bufferViews'][acc['bufferView']];n=sizes[acc['componentType']]*widths[acc['type']]
        base=view.get('byteOffset',0)+acc.get('byteOffset',0);stride=view.get('byteStride',n)
        if not ordered or base>=ordered[-1][1] or base+(acc['count']-1)*stride+n<=ordered[0][0]:continue
        for j in range(acc['count']):
            start=base+j*stride;end=start+n;k=bisect_left(starts,end)-1
            a.require(k<0 or ordered[k][1]<=start,'selected POSITION aliases other accessor '+str(i))
    return changed,ranges

def check_patch(a,original,payload,doc,data,changes,ranges):
    expected=copy.deepcopy(original)
    for row in changes:
        i=row['accessor'];expected['accessors'][i]['min']=doc['accessors'][i]['min'];expected['accessors'][i]['max']=doc['accessors'][i]['max']
    a.require(all(doc[k][:len(expected[k])]==expected[k] for k in ('accessors','bufferViews','meshes','nodes')),'original structure changed outside moved position bounds')
    last=0
    for start,end in sorted(ranges):
        a.require(start>=last and payload[last:start]==data[last:start],'unapproved binary modification')
        last=end
    a.require(payload[last:]==data[last:len(payload)],'unapproved trailing binary modification')

def same_vertices(a,x,y):
    if x['count']!=y['count']:return False
    if not np.allclose([x['lo'],x['hi']],[y['lo'],y['hi']],atol=3e-5,rtol=0):return False
    for u,v in ((x['v'],y['v']),(y['v'],x['v'])):
        tree=KDTree(len(v))
        for i,p in enumerate(v):tree.insert(Vector(p),i)
        tree.balance()
        if any(tree.find(Vector(p))[2]>3e-5 for p in u):return False
    return True

def verify_import(a,moves,contacts):
    # audit.inspect_import leaves the actual independently imported R18 scene open.
    objs=[o for o in a.bpy.context.scene.objects if o.type=='MESH']
    names={material(c) for old,c in moves}|{material(parent) for _,parent,_ in contacts}
    actual={};support=[]
    for o in objs:
        name=o.name.split('.')[0]
        if name in names or name.startswith('R18_Connected_Branch_Supports'):
            for c in a.components(o):
                c['tree']=a.bvh(c)
                if name.startswith('R18_Connected_Branch_Supports'):support.append(c)
                else:actual[normalized_id(c['id'])]=c
    def lookup(expected):
        c=actual.get(normalized_id(expected['id']))
        a.require(c is not None and same_vertices(a,expected,c),'R18 reimport component mismatch '+expected['id'])
        return c
    for _,new in moves:lookup(new)
    used=set()
    for bridge,parent,child in contacts:
        x,y=lookup(parent),lookup(child)
        if bridge is None:a.require(a.touching(x,y),'R18 reimport direct contact lost');continue
        candidates=[(i,c) for i,c in enumerate(support) if i not in used and same_vertices(a,bridge,c)]
        a.require(len(candidates)==1,'R18 reimport support identity mismatch '+bridge['id'])
        i,c=candidates[0];used.add(i)
        a.require(a.touching(c,x) and a.touching(c,y),'R18 reimport endpoint contact lost '+bridge['id'])
    a.require(len(used)==len(support),'R18 unexplained support geometry')
    return {'relocatedComponentsVerified':len(moves),'contactEdgesVerified':len(contacts),'supportComponentsVerified':len(used),'status':'NATIVE_REIMPORT_CONTACT_PROXY_PASS'}
