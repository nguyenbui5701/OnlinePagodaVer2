"""AI Visual 16 / R17b: one layered-crown candidate, preview first.

Run in Blender 4.5.16+. Reads exact frozen R16 and previously reviewed R17.
Writes ONLY r17b/preview/. No full Cycles or final asset publication in this stage.
Original R16 GLB primitives/accessors/binary payload are preserved verbatim;
only canopy/petal material factors (ECO) and new indexed floral primitives are added.
"""
import copy
import hashlib
import json
import math
import random
import struct
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

HERE=Path(__file__).resolve().parent
PARENT=HERE.parent
sys.dont_write_bytecode=True
sys.path.insert(0,str(PARENT))
import author_r17_blender as rig
import audit_r17_read_only as audit

PREVIEW=HERE/'preview'
REVIEWED='8381da2c19da01e8270f0f41283eabd5c4d16a46'
BUILD=json.loads((PARENT/'R17_BUILD_RESULT.json').read_text(encoding='utf-8'))
PRIOR=json.loads((PARENT/'R17_READ_ONLY_AUDIT.json').read_text(encoding='utf-8'))
TAU=2*math.pi
GOLDEN=2.399963229728653
LODS=('quality','eco')
NAMES={'quality':'sakura_hero_r17b.glb','eco':'sakura_hero_r17b_eco.glb'}
VIEWS=('hero_full_9x16','hero_wide_water_9x16','under_crown_9x16')
WIDTH,HEIGHT,SAMPLES=360,640,8
TONES=[
    ('ShadowRose',(.46,.16,.27),(.009,.002,.004)),
    ('WarmRose',(.73,.30,.43),(.018,.005,.009)),
    ('PetalPink',(.89,.48,.59),(.025,.009,.014)),
    ('PeachBlush',(.96,.66,.61),(.029,.012,.014)),
]
ECO_PALETTE={
    'Canopy_depth_rose':(.45,.19,.30),
    'Canopy_rose':(.62,.30,.42),
    'Canopy_peach':(.73,.40,.46),
    'Sakura_petal_warm_rose':(.73,.31,.43),
    'Sakura_petal_pink':(.87,.49,.60),
    'Sakura_petal_blush':(.92,.61,.66),
    'Sakura_petal_cream':(.95,.72,.66),
}

def require(ok,msg):
    if not ok: raise RuntimeError(msg)
def hashbytes(data): return hashlib.sha256(data).hexdigest()
def sha(p): return hashbytes(p.read_bytes())
def read_json(p): return json.loads(p.read_text(encoding='utf-8'))
def write_json(p,data): p.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
def pinned(lod,revision):
    if revision=='r16':
        path=PARENT.parent/'r16'/BUILD['r17'][lod]['sourceR16']
        info=BUILD['r16SourceVerified'][lod]
    else:
        path=PARENT/BUILD['r17'][lod]['output']
        info=BUILD['r17'][lod]
    require(path.is_file() and path.stat().st_size==info['bytes'] and sha(path)==info['sha256'],
            'R17B_PINNED_INPUT_MISMATCH '+str(path))
    return path
def unpack(path):
    raw=path.read_bytes()
    require(len(raw)>=28 and struct.unpack_from('<4sII',raw)==(b'glTF',2,len(raw)),'invalid GLB '+path.name)
    n,t=struct.unpack_from('<II',raw,12)
    require(t==0x4e4f534a and 20+n+8<=len(raw),'invalid JSON chunk')
    doc=json.loads(raw[20:20+n])
    bn,bt=struct.unpack_from('<II',raw,20+n)
    require(bt==0x004e4942 and 28+n+bn==len(raw),'invalid BIN chunk')
    payload=raw[28+n:]
    require(len(doc['buffers'])==1 and 'uri' not in doc['buffers'][0] and
            0<=len(payload)-doc['buffers'][0]['byteLength']<=3,'unsupported original buffer layout')
    require(not doc.get('skins') and not doc.get('animations'),'unexpected skin/animation')
    return doc,payload
def emit(path,doc,data):
    doc['buffers'][0]['byteLength']=len(data)
    js=json.dumps(doc,separators=(',',':'),ensure_ascii=True).encode()
    js+=b' '*((-len(js))%4)
    data=bytes(data)+b'\0'*((-len(data))%4)
    total=12+8+len(js)+8+len(data)
    path.write_bytes(struct.pack('<4sII',b'glTF',2,total)+
        struct.pack('<II',len(js),0x4e4f534a)+js+
        struct.pack('<II',len(data),0x004e4942)+data)

def canopy_cores(path):
    """Derive actual lobe anchors from connected components of original canopy core meshes."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    cores=[]
    for ob in sorted(bpy.context.scene.objects,key=lambda o:o.name):
        if ob.type!='MESH' or not ob.data.materials: continue
        if not all(m and m.name.startswith('Canopy_') for m in ob.data.materials): continue
        mesh=ob.data
        parents=list(range(len(mesh.vertices)))
        def find(a):
            while parents[a]!=a:
                parents[a]=parents[parents[a]]
                a=parents[a]
            return a
        for edge in mesh.edges:
            a,b=map(find,edge.vertices)
            if a!=b:parents[b]=a
        groups={}
        for v in mesh.vertices:
            w=ob.matrix_world@v.co
            groups.setdefault(find(v.index),[]).append((w.x,w.z,-w.y))
        for group in groups.values():
            if len(group)<12: continue
            xyz=np.array(group,dtype=np.float64)
            low=xyz.min(axis=0);high=xyz.max(axis=0);center=(low+high)*.5
            if not (13.0<center[1]<26.0 and max(high-low)>0.2): continue
            cores.append({'center':center,'axes':(high-low)*.5,'vertices':len(group)})
    require(20<=len(cores)<=200,'R17B_CORE_COMPONENTS_UNEXPECTED '+str(len(cores)))
    return cores

def angle_distance(a,b):return abs((a-b+math.pi)%TAU-math.pi)
def radial(theta):return np.array((math.cos(theta),0.,math.sin(theta)))
def theta_of(p):return math.atan2(p[2],p[0])
def norm(v):
    n=float(np.linalg.norm(v));require(n>1e-12,'zero vector')
    return v/n

def layout(cores,lod):
    """30 anchored lobes: 16 scalloped outer shoulders, 8 inter-lobe bridges, 6 draped skirts.
    Leave two alternating low windows plus the central trunk/branch sightline.
    No unanchored point scatter and no solid new canopy hull.
    """
    rng=random.Random(17801 if lod=='quality' else 17802)
    anchors=[]
    for i in range(16):
        th=TAU*i/16
        valid=[c for c in cores if angle_distance(theta_of(c['center']),th)<math.pi/6 and np.linalg.norm(c['center'][[0,2]])>4.]
        require(bool(valid),'R17B_EMPTY_CROWN_SECTOR '+str(i))
        a=max(valid,key=lambda c: np.linalg.norm(c['center'][[0,2]])+.65*c['axes'][0]-.7*angle_distance(theta_of(c['center']),th))
        anchors.append(a)
    out=[]
    def add(kind,center,axes,theta,anchor,sector):
        require(center[1]-axes[1]>12.8,'new flowers below protected branch window')
        require(np.linalg.norm(center[[0,2]])>4.0,'new cluster invades central trunk window')
        out.append({'layer':kind,'center':center,'axes':np.array(axes),'theta':theta,'anchor':anchor.copy(),'sector':sector})
    for i,a in enumerate(anchors):
        th=TAU*i/16; c=a['center'];rv=radial(th);tv=radial(th+math.pi/2)
        # Larger radial reach and alternating tall/low shoulders create a visibly scalloped silhouette.
        center=c+rv*(1.05+.35*(i%3))+tv*rng.uniform(-.30,.30)
        center[1]+=(-.65,.40,1.05,-.30)[i%4]
        center[1]=max(16.0,min(23.3,center[1]))
        add('outer',center,(1.68+rng.random()*.38,1.20+rng.random()*.48,1.90+rng.random()*.48),th,c,i)
    for i in range(0,16,2):
        a,b=anchors[i]['center'],anchors[(i+1)%16]['center']
        th=TAU*(i+.5)/16
        c=(a+b)*.5+radial(th)*.55
        c[1]=max(16.2,min(22.8,c[1]+(.55 if i%4==0 else -.55)))
        # Bridge contiguous neighbors, without closing all windows.
        add('bridge',c,(1.62,1.30,2.16),th,(a+b)*.5,i)
    for i in (1,3,6,9,11,14):
        a=anchors[i]['center'];th=TAU*i/16
        c=a+radial(th)*.45;c[1]=max(15.1,min(18.6,a[1]-2.05))
        add('skirt',c,(1.52,1.12,1.85),th,a,i)
    require(len(out)==30,'unexpected layer count')
    return out

def make_geometry(clusters,lod):
    rng=random.Random(17811 if lod=='quality' else 17812)
    # 30*76*20 = 45,600 QUALITY, 30*46*10 = 13,800 ECO.
    # Original triangles plus additions = 236,888 / 58,212 (<250k/60k).
    count=76 if lod=='quality' else 46
    groups={}
    for k,cluster in enumerate(clusters):
        center,axes,theta=cluster['center'],cluster['axes'],cluster['theta']
        layer=cluster['layer']
        r=radial(theta);t=radial(theta+math.pi/2);up=np.array((0.,1.,0.))
        for j in range(count):
            y=1-2*(j+.5)/count
            phi=(j*GOLDEN+k*.71+rng.uniform(-.10,.10))%TAU
            hor=math.sqrt(max(0,1-y*y))
            d=np.array((math.cos(phi)*hor,y,math.sin(phi)*hor))
            warp=1+.09*math.sin(phi*3+k*.7)+.07*math.cos(y*4+phi*5)
            depth=(.90,1.04,1.12,1.0)[j%4]
            offset=(r*d[0]*axes[0]+up*d[1]*axes[1]+t*d[2]*axes[2])*warp*depth
            pos=center+offset
            normal=norm(r*d[0]/axes[0]+up*d[1]/axes[1]+t*d[2]/axes[2])
            normal=norm(normal+.18*np.array([rng.uniform(-1,1),rng.uniform(-1,1),rng.uniform(-1,1)]))
            # Shadow rose underside, saturated mid-layer, light warm tips. No white/emission wash.
            probs=(.42,.40,.15,.03) if normal[1]<-.30 else ((.15,.38,.35,.12) if normal[1]<.35 else (.06,.25,.43,.26))
            tone=rng.choices(range(4),weights=probs)[0]
            key=(layer,tone)
            vertices,faces=groups.setdefault(key,([],[]))
            u=norm(np.cross(np.array((0.,1.,0.)) if abs(normal[1])<.92 else np.array((0.,0.,1.)),normal))
            v=norm(np.cross(normal,u))
            size=rng.uniform(1.02,1.38) if lod=='quality' else rng.uniform(1.15,1.56)
            rot=rng.random()*TAU
            for n in range(5):
                ang=rot+TAU*n/5+rng.uniform(-.045,.045)
                direction=u*math.cos(ang)+v*math.sin(ang)
                tangent=-u*math.sin(ang)+v*math.cos(ang)
                s=size*rng.uniform(.87,1.09)
                base=pos+normal*.012*s
                left=pos+s*(direction*.34-tangent*.225+normal*.07)
                right=pos+s*(direction*.34+tangent*.225+normal*.07)
                tip=pos+s*(direction*.62+normal*.16)
                if lod=='quality':
                    l2=pos+s*(direction*.54-tangent*.18+normal*.145)
                    r2=pos+s*(direction*.54+tangent*.18+normal*.145)
                    points=(base,left,l2,tip,r2,right)
                else:points=(base,left,tip,right)
                start=len(vertices);vertices.extend(points)
                for m in range(1,len(points)-1):
                    faces.append((start,start+m,start+m+1))
    result={}
    for key,(vertices,faces) in groups.items():
        xyz=np.asarray(vertices,dtype='<f4')
        idx=np.asarray(faces,dtype=np.int64)
        tri=xyz[idx].astype(np.float64)
        cross=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])
        require(np.isfinite(xyz).all() and (np.linalg.norm(cross,axis=1)>1e-9).all(),'degenerate new petal')
        normals=np.zeros_like(xyz,dtype=np.float64)
        for col in range(3):np.add.at(normals,idx[:,col],cross)
        length=np.linalg.norm(normals,axis=1)
        require((length>1e-12).all(),'invalid new vertex normal')
        normals=(normals/length[:,None]).astype('<f4')
        index_dtype='<u2' if len(xyz)<=65536 else '<u4'
        result[key]=(xyz,normals,idx.astype(index_dtype))
    return result

def build_candidate(lod,source):
    original,payload=unpack(source)
    doc=copy.deepcopy(original);data=bytearray(payload)
    cores=canopy_cores(source);clusters=layout(cores,lod);geo=make_geometry(clusters,lod)
    changed=[]
    if lod=='eco':
        for mat in doc['materials']:
            name=mat.get('name')
            if name not in ECO_PALETTE:continue
            pbr=mat['pbrMetallicRoughness'];before=copy.deepcopy(mat)
            pbr['baseColorFactor']=[*ECO_PALETTE[name],1.0]
            # Reduced emissive wash restores lit/shaded depth, not removal of normals.
            mat['emissiveFactor']=[.027,.009,.014] if name.startswith('Sakura_petal_') else [.012,.004,.007]
            changed.append({'name':name,'before':before,'after':copy.deepcopy(mat)})
        require(len(changed)==len(ECO_PALETTE),'unexpected ECO palette names')
    mat_ids=[]
    for name,rgb,em in TONES:
        mat_ids.append(len(doc['materials']))
        doc['materials'].append({'name':'R17b_'+name,'doubleSided':True,'alphaMode':'OPAQUE',
            'pbrMetallicRoughness':{'baseColorFactor':[*rgb,1.],'metallicFactor':0.,'roughnessFactor':.86},
            'emissiveFactor':list(em)})
    def append_accessor(arr,kind,target):
        data.extend(b'\0'*((-len(data))%4))
        off=len(data);raw=arr.tobytes();data.extend(raw)
        bv=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(raw),'target':target})
        ct=5126 if arr.dtype.kind=='f' else (5123 if arr.dtype.itemsize==2 else 5125)
        if kind=='SCALAR':arr=arr.reshape(-1)
        accessor={'bufferView':bv,'byteOffset':0,'componentType':ct,'count':len(arr),'type':kind}
        if target==34962 and kind=='VEC3':
            accessor['min']=arr.min(axis=0).tolist();accessor['max']=arr.max(axis=0).tolist()
        elif kind=='SCALAR':
            accessor['min']=[int(arr.min())];accessor['max']=[int(arr.max())]
        i=len(doc['accessors']);doc['accessors'].append(accessor)
        return i
    primitive_stats=[]
    for layer in ('outer','bridge','skirt'):
        primitives=[]
        for tone in range(4):
            if (layer,tone) not in geo:continue
            xyz,normals,idx=geo[layer,tone]
            pa=append_accessor(xyz,'VEC3',34962)
            na=append_accessor(normals,'VEC3',34962)
            ia=append_accessor(idx,'SCALAR',34963)
            primitives.append({'attributes':{'POSITION':pa,'NORMAL':na},'indices':ia,'material':mat_ids[tone],'mode':4})
            primitive_stats.append({'layer':layer,'tone':TONES[tone][0],'vertices':len(xyz),'triangles':len(idx),'positionBytes':xyz.nbytes,'normalBytes':normals.nbytes,'indexBytes':idx.nbytes})
        mesh_index=len(doc['meshes']);doc['meshes'].append({'name':'R17b_'+layer+'_'+lod,'primitives':primitives})
        node_index=len(doc['nodes']);doc['nodes'].append({'name':'R17b_'+layer+'_'+lod,'mesh':mesh_index})
        doc['scenes'][doc.get('scene',0)]['nodes'].append(node_index)
    # Preserve original arrays, transforms, geometry and indices exactly, and all non-canopy materials.
    for key in ('accessors','bufferViews','meshes','nodes'):
        require(doc[key][:len(original[key])]==original[key],'original JSON prefix changed '+key)
    for i,m in enumerate(original['materials']):
        if lod!='eco' or m.get('name') not in ECO_PALETTE:
            require(doc['materials'][i]==m,'protected original material changed '+str(m.get('name')))
    require(bytes(data[:len(payload)])==payload,'original BIN prefix changed')
    require(doc['scenes'][doc.get('scene',0)]['nodes'][:len(original['scenes'][original.get('scene',0)]['nodes'])]==original['scenes'][original.get('scene',0)]['nodes'],'original scene root changed')
    dest=PREVIEW/NAMES[lod]
    emit(dest,doc,data)
    saved,saved_bin=unpack(dest)
    require(saved_bin[:len(payload)]==payload,'serialized original BIN changed')
    require(all(saved[k][:len(original[k])]==original[k] for k in ('accessors','bufferViews','meshes','nodes')),'serialized original primitives changed')
    basic=rig.audit_glb(dest)
    cap=250000 if lod=='quality' else 60000
    extra=sum(x['triangles'] for x in primitive_stats)
    require(basic['triangles']==BUILD['r16SourceVerified'][lod]['triangles']+extra and basic['triangles']<=cap,'candidate triangle budget')
    raw=audit.parse(dest,basic)
    require(raw['degenerateTriangles']==0,'candidate degenerate triangle count')
    imported,signatures=audit.inspect_import(dest)
    original_audit=PRIOR['profiles'][lod]['r16']
    require(imported['protectedMaterialFactors']==original_audit['protectedMaterialFactors'],'protected imported PBR mismatch')
    for name,tri in signatures.items():
        expected=sum(x['triangles'] for x in original_audit['primitives'] if x['material']==name)
        require(sum(tri.values())==expected,'protected imported triangle count '+name)
    require(set(signatures)==set(original_audit['protectedMaterialFactors']),'protected material groups missing')
    require(abs(imported['boundsYUpMeters'][0][1]-original_audit['boundsYUpMeters'][0][1])<1e-6,'waterline changed')
    return {'file':dest.name,**basic,'sha256':sha(dest),
        'boundsYUpMeters':imported['boundsYUpMeters'],'rootNodes':imported['rootNodes'],
        'sourceCoreCount':len(cores),'clusters':[{'layer':c['layer'],'sector':c['sector'],'center':c['center'].tolist(),'axes':c['axes'].tolist(),'anchor':c['anchor'].tolist()} for c in clusters],
        'addedFlowers':len(clusters)*(76 if lod=='quality' else 46),'addedTriangles':extra,
        'preservation':{'sourceBinPrefixSHA256':hashbytes(payload),'candidateBinPrefixSHA256':hashbytes(saved_bin[:len(payload)]),'originalPrimitivesAccessorsNodesExact':True,'originalNonCanopyMaterialsExact':True,'protectedImportedPBRExact':True,'protectedTriangleCountsExact':True,'note':'Original triangle winding, indices, transforms and attributes preserved byte-for-byte in original prefix; no new trunk, roots or gold. R16 45/68 proxy not repaired.'},
        'ecoMaterialChanges':changed,'primitiveStats':primitive_stats,
        'attributeLogicalBytes':raw['attributeLogicalBytes'],'binChunkBytes':raw['binChunkBytes'],
        'jsonChunkBytes':raw['jsonChunkBytes'],'vertexRecordsAcrossPrimitives':raw['vertexRecordsAcrossPrimitives'],
        'priorR17Bytes':BUILD['r17'][lod]['bytes'],'priorR17VertexRecords':PRIOR['profiles'][lod]['r17']['vertexRecordsAcrossPrimitives'],
        'degenerateTriangles':raw['degenerateTriangles']}

def box_corners(bounds):
    low,high=bounds
    return [Vector((x,-z,y)) for x in (low[0],high[0]) for y in (low[1],high[1]) for z in (low[2],high[2])]
def camera(view,pose=None):
    if pose is None:
        rig.set_camera(view)
        return bpy.context.scene.camera
    eye,target,up,fov=pose
    eye=Vector(eye);target=Vector(target);up=Vector(up)
    d=(target-eye).normalized();right=d.cross(up).normalized();true_up=right.cross(d).normalized()
    mat=Matrix(((right.x,true_up.x,-d.x),(right.y,true_up.y,-d.y),(right.z,true_up.z,-d.z)))
    cam=bpy.data.cameras.new('R17b_Matched_'+view);obj=bpy.data.objects.new('R17b_Matched_'+view,cam)
    bpy.context.scene.collection.objects.link(obj);obj.location=eye;obj.rotation_euler=mat.to_quaternion().to_euler()
    cam.type='PERSP';cam.sensor_fit='VERTICAL';cam.lens=cam.sensor_height/(2*math.tan(math.radians(fov)/2))
    cam.clip_start=.05;cam.clip_end=500;bpy.context.scene.camera=obj
    return obj
def view_bounds(obj,corners):
    bpy.context.view_layer.update()
    uv=[world_to_camera_view(bpy.context.scene,obj,p) for p in corners]
    require(all(p.z>0 for p in uv),'camera behind geometry')
    return [min(p.x for p in uv),max(p.x for p in uv),min(p.y for p in uv),max(p.y for p in uv)]
def fit_poses(bounds):
    corners=box_corners(bounds)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene;scene.render.resolution_x=WIDTH;scene.render.resolution_y=HEIGHT;scene.render.resolution_percentage=100
    poses={}
    for view,eye_yup,target_yup,fov in (
        ('hero_full_9x16',(45,50,80),(0,12.8,0),50),
        ('hero_wide_water_9x16',(0,12,70),(0,11.6,0),58)):
        eye=rig.to_blender(eye_yup);target=rig.to_blender(target_yup);direction=(eye-target).normalized()
        distance=(eye-target).length
        for _ in range(25):
            pose=(list(target+direction*distance),list(target),[0,0,1],fov)
            obj=camera(view,pose)
            lo,hi,bot,top=view_bounds(obj,corners)
            if min(lo,bot)>=.045 and max(hi,top)<=.955:break
            distance*=1.08
        else:raise RuntimeError('R17B_FULL_WIDE_FRAME_FAILED '+view)
        poses[view]={'poseBlender':pose,'unionProjectedBounds':[lo,hi,bot,top]}
    return poses
def preview_render(paths,results,poses,union):
    rows=[]
    for lod in LODS:
        for rev in ('r16','r17','r17b'):
            model=paths[lod][rev]
            rig.render_setup(model)
            scene=bpy.context.scene
            scene.cycles.samples=SAMPLES;scene.cycles.seed=1708
            scene.render.resolution_x=WIDTH;scene.render.resolution_y=HEIGHT
            scene.render.resolution_percentage=100
            for view in VIEWS:
                obj=camera(view,poses[view]['poseBlender'] if view in poses else None)
                if view in poses:
                    a,b,c,d=view_bounds(obj,box_corners(union))
                    require(min(a,c)>=.044 and max(b,d)<=.956,'matched full/wide crop '+view)
                name=f'{lod}_{rev}_{view}_preview.png'
                dest=PREVIEW/name
                scene.render.filepath=str(dest)
                bpy.ops.render.render(write_still=True)
                require(dest.is_file() and dest.stat().st_size>100,'missing native preview '+name)
                rows.append({'file':name,'profile':lod,'revision':rev,'view':view,
                    'bytes':dest.stat().st_size,'sha256':sha(dest),'modelSHA256':sha(model),
                    'width':WIDTH,'height':HEIGHT,'samples':SAMPLES,'renderer':'Blender Cycles CPU',
                    'cameraMatrix':[list(x) for x in obj.matrix_world]})
                print('R17B_PREVIEW_SAVED',name,flush=True)
    require(len(rows)==18,'preview count')
    return rows

def main():
    PREVIEW.mkdir(exist_ok=True)
    marker=PREVIEW/'preview_manifest.json'
    # A failed rerun must not leave an apparently current success manifest.
    if marker.exists():marker.unlink()
    paths={lod:{rev:pinned(lod,rev) for rev in ('r16','r17')} for lod in LODS}
    print('R17B_FROZEN_R16_R17_SHA_PASS',flush=True)
    results={}
    for lod in LODS:
        results[lod]=build_candidate(lod,paths[lod]['r16'])
        paths[lod]['r17b']=PREVIEW/NAMES[lod]
        print('R17B_CANDIDATE_BUILD',lod,results[lod]['bytes'],results[lod]['triangles'],flush=True)
    bounds=[results[lod]['boundsYUpMeters'] for lod in LODS]+[PRIOR['profiles'][lod][rev]['boundsYUpMeters'] for lod in LODS for rev in ('r16','r17')]
    union=[np.min([b[0] for b in bounds],axis=0).tolist(),np.max([b[1] for b in bounds],axis=0).tolist()]
    poses=fit_poses(union)
    images=preview_render(paths,results,poses,union)
    write_json(marker,{'reviewedHead':REVIEWED,'status':'R17B_PREVIEW_READY_OWNER_SA_VISUAL_REVIEW_PENDING',
        'blenderVersion':bpy.app.version_string,'resolution':[WIDTH,HEIGHT],'samples':SAMPLES,
        'lighting':'original R17 render_setup, identical 3 SUNs, AgX None, EV0, render-only water',
        'candidate':results,'unionBoundsYUp':union,'fixedCameras':poses,'images':images,
        'sourceHashes':{lod:{rev:sha(p) for rev,p in a.items()} for lod,a in paths.items()},
        'limits':['18 real quick preview images only; no final .blend or 720x1280 evidence yet.','Under-crown intentional close framing. Full/wide adjusted once from union bounds, shared across all revisions/profiles.','No runtime ring/water/RTX/LIVE evidence. No SA independent binary verification.'],
        'gate':'R17_SA_ART_REVIEW_REQUIRED','ownerArtGO':'PENDING'})
    print('R17B_PREVIEW_COMPLETE 18 PNG; STOP BEFORE FINAL CYCLES',flush=True)
if __name__=='__main__':main()
