"""Zero-cost P0.5d surgical exported-GLB patch; preserves frozen P0.5c byte buffer.
Only reveal ONE right-side (screen-right) instep under a tiny local trouser cuff tuck.
No dependency on missing upstream P04/P05 procedural scripts: the SHA-locked,
SA-reviewed P0.5c binary itself is the immutable geometric source of truth.
All original GLB buffers/accessors for nine meshes, palettes, animation and anchors
are retained verbatim except the local pants POSITION/NORMAL accessor; sandal untouched.
One tiny exposed skin instep submesh is a new SeatRoot child (not UpperBodyBreath).
The original P0.5c cross is NEVER overwritten. Kneel NEVER read or exported.
"""
from pathlib import Path
import math,struct,hashlib,json,copy
import numpy as np
import trimesh

ROOT=Path(__file__).resolve().parent
OLD=ROOT/'p05c_baseline/meditator_female_cross_prayer_p05c.glb'
NEW=ROOT/'meditator_female_cross_prayer_p05d.glb'
BASE_SHA='1da8c12982165cf57e2ef678013cdd57b67bba7fd6c08e2979c267599d35e5bf'
POSE='cross_prayer'


def sha(b):return hashlib.sha256(b).hexdigest()
def parse(blob):
    assert blob[:4]==b'glTF' and struct.unpack_from('<I',blob,4)[0]==2
    ln,typ=struct.unpack_from('<II',blob,12);assert typ==0x4e4f534a
    j=json.loads(blob[20:20+ln]);off=20+ln
    bn,t=struct.unpack_from('<II',blob,off);assert t==0x004e4942
    return j,blob[off+8:off+8+bn]
def pack(j,b):
    j['buffers'][0]['byteLength']=len(b)
    text=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode('utf8')
    text+=b' '*((-len(text))%4);b+=b'\0'*((-len(b))%4)
    return b'glTF'+struct.pack('<II',2,12+8+len(text)+8+len(b))+struct.pack('<II',len(text),0x4e4f534a)+text+struct.pack('<II',len(b),0x004e4942)+b

def arr(j,b,index):
    a=j['accessors'][index];view=j['bufferViews'][a['bufferView']]
    type_map={'VEC3':3,'SCALAR':1};comps=type_map[a['type']]
    dtype={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']]
    return np.frombuffer(b,dtype=dtype,count=a['count']*comps,
                         offset=view.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],comps).copy()

def add(j,b,values,typ,component=5126):
    array=np.ascontiguousarray(values,dtype={5126:'<f4',5125:'<u4',5123:'<u2'}[component])
    while len(b)%4:b+=b'\0'
    loc=len(b);b+=array.tobytes();idx=len(j['bufferViews'])
    j['bufferViews'].append(dict(buffer=0,byteOffset=loc,byteLength=array.nbytes))
    index=len(j['accessors']);access=dict(bufferView=idx,componentType=component,count=len(array),type=typ)
    if typ=='VEC3':access.update(min=np.min(array,axis=0).astype(float).tolist(),max=np.max(array,axis=0).astype(float).tolist())
    j['accessors'].append(access)
    return b,index

def make():
    original=OLD.read_bytes();assert sha(original)==BASE_SHA
    j,b=parse(original)
    oldj=copy.deepcopy(j);oldb=b
    # Sculpt ONLY the seam-sized trouser region above the already present
    # cross-leg ankle. This shallow smooth fabric tuck reveals skin instep as a
    # CONTIGUOUS region instead of isolated through-fabric specks. All other
    # vertices/triangles and upper-body GLB binary accessors remain identical.
    pant=j['meshes'][0]['primitives'][0]
    old_pants_pos=arr(j,b,pant['attributes']['POSITION'])
    ppos=old_pants_pos.copy()
    px,py,pz=old_pants_pos.T
    local=np.exp(-((px-.138)/.055)**2-((py-.068)/.050)**2-((pz-.341)/.065)**2)
    affected=np.flatnonzero(local>.08)
    ppos[affected,2]-=.025*local[affected]
    pant_faces=arr(j,b,pant['indices'])[:,0].reshape(-1,3)
    pmesh=trimesh.Trimesh(vertices=ppos,faces=pant_faces,process=False)
    assert np.all(pmesh.area_faces>1e-10)
    old_norm=arr(j,b,pant['attributes']['NORMAL'])
    n_new=old_norm.copy()
    faces_changed=np.any(np.isin(pant_faces,affected),axis=1)
    changed_norm_ids=np.unique(pant_faces[faces_changed].reshape(-1))
    n_new[changed_norm_ids]=pmesh.vertex_normals[changed_norm_ids]
    b,ppidx=add(j,b,ppos,'VEC3')
    b,pnidx=add(j,b,n_new,'VEC3')
    pant['attributes']['POSITION']=ppidx
    pant['attributes']['NORMAL']=pnidx
    # The original 84-vertex sandal-trim mesh (including both tucked soles) is
    # completely FROZEN. Its front-side part intersects the hidden root of the
    # instep under the original trouser cuff, but is not stretched or recolored.
    # This keeps the established P0.5c shoe/sandal styling intact.
    # Small skin-toned instep, one continuous closed capsule, physically OVERLAPS
    # the original attached cuff and the unchanged tucked sandal sole. No toenail/toes.
    # Subdivision 2 = only 320 triangles, 162 vertices; one additional draw mesh.
    skin=trimesh.creation.icosphere(subdivisions=2,radius=1.0)
    fv=skin.vertices.copy();fv[:,0]=.140+fv[:,0]*.034+fv[:,2]*.002
    fv[:,1]=.045+fv[:,1]*.018-fv[:,2]*.024
    fv[:,2]=.285+fv[:,2]*.070
    foot_mesh=trimesh.Trimesh(vertices=fv,faces=skin.faces,process=False)
    assert foot_mesh.is_watertight and foot_mesh.is_winding_consistent
    b,ii=add(j,b,skin.faces.astype('<u4').reshape(-1,1),'SCALAR',5125)
    b,pi=add(j,b,fv,'VEC3');b,ni=add(j,b,foot_mesh.vertex_normals,'VEC3')
    mesh_id=len(j['meshes'])
    j['meshes'].append(dict(name='skin_rose_cream_SeatRoot_exposed_instep_p05d_mesh',primitives=[dict(attributes=dict(POSITION=pi,NORMAL=ni),indices=ii,material=3,mode=4)]))
    seat=next(i for i,x in enumerate(j['nodes']) if x.get('name')=='SeatRoot')
    node=len(j['nodes']);j['nodes'].append(dict(name='skin_rose_cream_SeatRoot_exposed_instep_p05d_object',mesh=mesh_id))
    j['nodes'][seat]['children'].append(node)
    j.setdefault('extras',{})['P05d']={
        'revision':'p5d','pose':'cross_prayer','baselineSha256':BASE_SHA,
        'scope':'one skin instep concealed under existing sandal/pant at root + tiny local pant cuff sculpt; no other edits',
        'source':'Exact SA-reviewed P0.5c raw GLB + deterministic local vertex patch (source script)',
        'newSeatRootFootMesh':'skin_rose_cream_SeatRoot_exposed_instep_p05d_mesh',
        'frozenP05cKneelSha256':'a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac',
        'gate':'P05D_FEMALE_CROSS_FOOT_OWNER_REVIEW_REQUIRED'}
    raw=pack(j,b);NEW.write_bytes(raw)
    return {'sha256':sha(raw),'bytes':len(raw),
            'triangles':sum(len(m.faces) for m in trimesh.load(NEW,force='scene').geometry.values()),
            'sandalUnchanged':True,'pantsLocalizedVertexIds':affected.astype(int).tolist(),'pantsNormalVertexIds':changed_norm_ids.astype(int).tolist(),
            'newFootSkinTriangles':len(skin.faces),'newFootSkinBounds':np.round(foot_mesh.bounds,6).tolist(),
            'oldBinViewsOriginalArraysRemainAvailable':True,
            'oldBufferViewsUnchanged':oldj['bufferViews']==j['bufferViews'][:len(oldj['bufferViews'])],
            'oldAnimationsUnchanged':oldj['animations']==j['animations']}
if __name__=='__main__':
    res=make();(ROOT/'P05D_BUILD_METRICS.json').write_text(json.dumps(res,indent=2)+'\n');print(json.dumps(res,indent=2))
