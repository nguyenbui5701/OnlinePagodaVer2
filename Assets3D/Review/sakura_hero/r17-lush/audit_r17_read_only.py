"""Read-only R16/R17 binary and Blender audit. Run inside Blender, no export/render/save."""
import bpy, hashlib, json, struct, collections, math
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parent
REPORT=json.loads((ROOT/'R17_BUILD_RESULT.json').read_text(encoding='utf-8'))
BASE=ROOT.parent/'r16'
TYPES={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
WIDTH={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
PROTECTED=('Trunk_bark','Branches_plum','Golden_bark')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def require(ok,msg):
    if not ok: raise RuntimeError(msg)
def parse(p,expected):
    raw=p.read_bytes()
    require(hashlib.sha256(raw).hexdigest()==expected['sha256'] and len(raw)==expected['bytes'],'SHA/size mismatch '+p.name)
    require(len(raw)>=20 and struct.unpack_from('<4sII',raw)==(b'glTF',2,len(raw)),'GLB header '+p.name)
    chunks={}; off=12
    while off<len(raw):
        require(off+8<=len(raw),'chunk header truncated')
        n,t=struct.unpack_from('<II',raw,off);off+=8
        require(n%4==0 and off+n<=len(raw) and t not in chunks,'chunk invalid')
        chunks[t]=raw[off:off+n];off+=n
    require(set(chunks)=={0x4e4f534a,0x004e4942},'JSON/BIN required')
    doc=json.loads(chunks[0x4e4f534a]); data=chunks[0x004e4942]
    require(len(doc['buffers'])==1 and 'uri' not in doc['buffers'][0] and 0<=len(data)-doc['buffers'][0]['byteLength']<=3,'buffer length')
    for v in doc.get('bufferViews',[]):
        require(v.get('buffer',0)==0 and 0<=v.get('byteOffset',0)<=v.get('byteOffset',0)+v['byteLength']<=doc['buffers'][0]['byteLength'],'bufferView outside BIN')
    def acc(i):
        a=doc['accessors'][i];require('sparse' not in a and 'bufferView' in a,'unsupported sparse accessor')
        v=doc['bufferViews'][a['bufferView']];dt=np.dtype(TYPES[a['componentType']]);w=WIDTH[a['type']]
        stride=v.get('byteStride',w*dt.itemsize);begin=a.get('byteOffset',0);count=a['count']
        require(count>0 and stride>=w*dt.itemsize and begin>=0 and begin+(count-1)*stride+w*dt.itemsize<=v['byteLength'],'accessor outside bufferView')
        result=np.ndarray((count,w),dtype=dt,buffer=data,offset=v.get('byteOffset',0)+begin,strides=(stride,dt.itemsize))
        require(np.isfinite(result).all(),'nonfinite accessor')
        return result
    for i in range(len(doc['accessors'])): acc(i)
    roles=collections.defaultdict(set); prims=[];tris=0;deg=0
    for mesh in doc['meshes']:
        for prim in mesh['primitives']:
            require(prim.get('mode',4)==4,'nontriangles')
            attrs=prim['attributes']; pos=acc(attrs['POSITION']);require(pos.shape[1]==3,'position shape')
            require(all(len(acc(i))==len(pos) for i in attrs.values()),'attribute count mismatch')
            for k,i in attrs.items(): roles[k].add(i)
            if 'indices' in prim:
                idx=acc(prim['indices']).ravel();roles['INDEX'].add(prim['indices'])
                require(idx.dtype.kind=='u','indices not unsigned')
            else:idx=np.arange(len(pos))
            require(len(idx)%3==0 and int(idx.max())<len(pos),'index outside position')
            tri=pos[idx.reshape(-1,3)].astype(np.float64);tris+=len(tri)
            deg+=int(np.count_nonzero(np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)<=1e-12))
            mi=prim.get('material');mat=doc.get('materials',[])[mi] if mi is not None else {}
            prims.append({'mesh':mesh.get('name'),'material':mat.get('name'),'triangles':len(tri),'vertexRecords':len(pos),'attributes':list(attrs),'doubleSided':mat.get('doubleSided',False),'alphaMode':mat.get('alphaMode','OPAQUE')})
    require(tris==expected['triangles'],'triangle mismatch')
    def logical(i):
        a=doc['accessors'][i];return a['count']*WIDTH[a['type']]*np.dtype(TYPES[a['componentType']]).itemsize
    return {'sha256':expected['sha256'],'bytes':len(raw),'triangles':tris,'degenerateTriangles':deg,'jsonChunkBytes':len(chunks[0x4e4f534a]),'binChunkBytes':len(data),'attributeLogicalBytes':{k:sum(logical(i) for i in ids) for k,ids in roles.items()},'uniqueReferencedAccessorBytes':sum(logical(i) for i in set().union(*roles.values())),'primitiveCount':len(prims),'vertexRecordsAcrossPrimitives':sum(x['vertexRecords'] for x in prims),'primitives':prims,'materials':doc.get('materials',[]),'textures':len(doc.get('textures',[])),'nodes':[{'name':n.get('name'),'translation':n.get('translation'),'rotation':n.get('rotation'),'scale':n.get('scale'),'matrix':n.get('matrix')} for n in doc.get('nodes',[])]}
def inspect_import(p):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(p))
    bpy.context.view_layer.update()
    bounds=[]; signatures=collections.defaultdict(collections.Counter); factors={}
    for o in bpy.context.scene.objects:
        if o.type!='MESH':continue
        mesh=o.data;mesh.calc_loop_triangles()
        verts=[]
        for v in mesh.vertices:
            w=o.matrix_world@v.co
            verts.append((w.x,w.z,-w.y)) # Blender to glTF Y-up
        coords=np.asarray(verts,dtype=np.float64)
        require(len(coords)>0 and np.isfinite(coords).all(),'import positions invalid')
        bounds.append((coords.min(axis=0),coords.max(axis=0)))
        for tri in mesh.loop_triangles:
            mat=mesh.materials[tri.material_index] if tri.material_index<len(mesh.materials) else None
            name=mat.name if mat else ''
            if not name.startswith(PROTECTED):continue
            # Triangle multiset, unordered vertices and 0.1 mm quantization. Near rounding
            # boundaries may produce mismatches: report, never silently pass.
            q=np.rint(coords[list(tri.vertices)]*10000).astype(np.int64)
            key=tuple(sorted(tuple(row) for row in q))
            signatures[name][key]+=1
            if name not in factors and mat and mat.use_nodes:
                n=next((x for x in mat.node_tree.nodes if x.type=='BSDF_PRINCIPLED'),None)
                if n:
                    factors[name]={k: (list(n.inputs[k].default_value) if hasattr(n.inputs[k].default_value,'__len__') else float(n.inputs[k].default_value)) for k in ('Base Color','Metallic','Roughness','Emission Color','Emission Strength') if k in n.inputs}
    require(bool(bounds) and bool(signatures),'missing imported meshes/protected materials')
    return {'boundsYUpMeters':[np.min([x[0] for x in bounds],axis=0).tolist(),np.max([x[1] for x in bounds],axis=0).tolist()],'protectedMaterialFactors':factors,'rootNodes':[{'name':o.name,'worldMatrix':[list(row) for row in o.matrix_world]} for o in bpy.context.scene.objects if o.parent is None]},signatures
def main():
    result={'reviewedHead':'36c9e327c37441a7c5406068f9aecd291e52d437','status':'OWNER_READ_ONLY_AUDIT_NOT_INDEPENDENT_SA','blender':bpy.app.version_string,'profiles':{},'limitations':['Triangle comparison ignores winding and uses quantized world coordinates; mismatch requires review.','Secondary contact proxy 45/68 not repaired or re-tested.','Logical accessor totals may overlap; BIN bytes are physical. No export, render or runtime GPU test.']}
    for lod in ('quality','eco'):
        old=REPORT['r16SourceVerified'][lod]; new=REPORT['r17'][lod]
        a=BASE/new['sourceR16'];b=ROOT/new['output']
        aa=parse(a,old);bb=parse(b,new)
        ia,sa=inspect_import(a);ib,sb=inspect_import(b)
        cmp={}
        for name in sorted(set(sa)|set(sb)):
            x=sa.get(name,collections.Counter());y=sb.get(name,collections.Counter())
            cmp[name]={'r16Triangles':sum(x.values()),'r17Triangles':sum(y.values()),'missingTriangles':sum((x-y).values()),'addedTriangles':sum((y-x).values()),'importedPBRExact':ia['protectedMaterialFactors'].get(name)==ib['protectedMaterialFactors'].get(name)}
        result['profiles'][lod]={'r16':{**aa,**ia},'r17':{**bb,**ib},'protectedGeometryComparison':cmp}
    blend=ROOT/REPORT['editableSource']['name'];require(sha(blend)==REPORT['editableSource']['sha256'] and blend.stat().st_size==REPORT['editableSource']['bytes'],'blend checksum')
    bpy.ops.wm.open_mainfile(filepath=str(blend))
    cols={}
    for lod in ('QUALITY','ECO'):
        c=bpy.data.collections.get('R17_'+lod+'_Editable')
        require(c is not None,'missing editable collection '+lod)
        meshes=[o for o in c.all_objects if o.type=='MESH']
        require(bool(meshes),'no editable meshes '+lod)
        cols[lod]={'meshes':len(meshes),'triangles':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons)}
        require(cols[lod]['triangles']==REPORT['r17'][lod.lower()]['triangles'],'editable triangle mismatch '+lod)
    result['editableSource']={'sha256':sha(blend),'opened':True,'collections':cols}
    result['protectedGeometryExactAtQuantization']=all(c['missingTriangles']==0 and c['addedTriangles']==0 and c['importedPBRExact'] for p in result['profiles'].values() for c in p['protectedGeometryComparison'].values())
    (ROOT/'R17_READ_ONLY_AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print('R17_READ_ONLY_AUDIT_COMPLETE; inspect degenerate counts, bounds and protected comparisons; no automatic SA PASS',flush=True)
if __name__=='__main__':main()
