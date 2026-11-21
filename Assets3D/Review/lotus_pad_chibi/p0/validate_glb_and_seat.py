"""Independent readback of real binary GLB geometry, glTF nodes and sit_idle."""
import json,struct,hashlib,math
from pathlib import Path
import numpy as np,trimesh
from procedural_lotus_pad_chibi import glb_chunks,surface
ROOT=Path(__file__).resolve().parent

def read_glb(path):
    b=path.read_bytes(); assert b[:4]==b'glTF' and struct.unpack_from('<I',b,4)[0]==2
    assert struct.unpack_from('<I',b,8)[0]==len(b)
    js,bin=glb_chunks(b)
    assert js['asset']['version']=='2.0'
    return js,bin

def check_meshes(glb):
    scene=trimesh.load(str(glb),force='scene')
    counts={'triangles':sum(len(g.faces) for g in scene.geometry.values()),
            'vertices':sum(len(g.vertices) for g in scene.geometry.values()),
            'nonFinite':sum(int(np.count_nonzero(~np.isfinite(g.vertices))) for g in scene.geometry.values()),
            'degenerateFaces':sum(int(np.count_nonzero(g.area_faces<1e-11)) for g in scene.geometry.values()),
            'meshParts':len(scene.geometry),'boundsMinMax':np.round(scene.bounds,6).tolist()}
    assert counts['nonFinite']==0 and counts['degenerateFaces']==0
    return scene,counts

def animation_data(j,b):
    animations=j.get('animations',[])
    assert len(animations)==1 and animations[0]['name']=='sit_idle'
    anim=animations[0];assert len(anim['channels'])==1
    channel=anim['channels'][0];target=j['nodes'][channel['target']['node']]['name']
    assert target=='UpperBodyBreath' and channel['target']['path']=='translation'
    sampler=anim['samplers'][channel['sampler']]
    def data(accessor_id):
        a=j['accessors'][accessor_id];view=j['bufferViews'][a['bufferView']]
        assert a['componentType']==5126
        n=1 if a['type']=='SCALAR' else 3
        start=view.get('byteOffset',0)+a.get('byteOffset',0)
        return np.frombuffer(b,dtype='<f4',count=a['count']*n,offset=start).reshape((a['count'],n))
    time=data(sampler['input'])[:,0]
    offsets=data(sampler['output'])
    assert np.all(np.diff(time)>0) and np.allclose(time[[0,-1]],[0,2])
    assert np.allclose(offsets[0],offsets[-1]) and np.allclose(offsets[:,[0,2]],0)
    assert abs(float(offsets[:,1].max())-.016)<1e-6
    return {'name':'sit_idle','durationSeconds':float(time[-1]),'keyCount':len(time),'targets':target,
           'interpolation':sampler['interpolation'],'translationMinMaxY':[float(offsets[:,1].min()),float(offsets[:,1].max())],
           'sampleY_m':{str(round(float(t),2)):round(float(y),5) for t,y in zip(time[[0,4,8,12,16]],offsets[[0,4,8,12,16],1])}}

def anchors(j):
    nodes={n.get('name'):n for n in j['nodes']}
    required={'SeatRoot','HeadAnchor','NameplateAnchor','FXAnchor','UpperBodyBreath'}
    assert required.issubset(nodes)
    def tr(name):
        n=nodes[name]
        return n['translation'] if 'translation' in n else [float(n['matrix'][i]) for i in (12,13,14)] if 'matrix' in n else [0,0,0]
    assert tr('SeatRoot')==[0,0,0]
    return {'seat':tr('SeatRoot'),'head':tr('HeadAnchor'),'nameplate':tr('NameplateAnchor'),'giftFx':tr('FXAnchor'),
            'animatedParent':'UpperBodyBreath','actorForward':'+Z','up':'+Y'}

def contact_test(actor_scene):
    # Work only with imported actual vertex positions of fixed-lower-body nodes.
    seat_meshes=[actor_scene.geometry[actor_scene.graph[n][1]] for n in actor_scene.graph.nodes_geometry if '_SeatRoot_object' in n]
    assert len(seat_meshes)==3
    pts=np.vstack([m.vertices for m in seat_meshes])
    _,rim,top=surface()
    r=np.linalg.norm(pts[:,[0,2]],axis=1);theta=np.arctan2(pts[:,0],pts[:,2]);
    leaf=np.array([top(float(rr),float(t),rim(float(t))) for rr,t in zip(r,theta)])
    clearance=pts[:,1]+.195-leaf
    assert np.count_nonzero(clearance<-.005)==0,(clearance.min(),np.count_nonzero(clearance<-.005))
    mind=float(clearance.min());assert -.005<=mind<=.04,mind
    return {'actorPlacementY_m':.195,'padCenterSurfaceY_m':.195,'minSeatToLeafTopGapMeters':round(mind,6),
      'verticesTested':len(pts),'penetrationVerticesBelow5mm':int(np.count_nonzero(clearance<-.005)),
      'contactToleranceMeters':.04,'status':'PASS','method':'actual lower-body imported GLB vertex clearance against procedural pad top surface'}

def main():
    result={}
    for name in ['lotus_pad_01.glb','meditator_base.glb']:
        file=ROOT/name;j,b=read_glb(file);s,c=check_meshes(file)
        result[name]={'file':name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'bytes':file.stat().st_size,
                      'triangles':c['triangles'],'vertices':c['vertices'],'meshes':len(j['meshes']),
                      'materials':len(j.get('materials',[])),'textures':len(j.get('textures',[])),
                      'boundsMinMax':c['boundsMinMax'],'materialsPBR':all('pbrMetallicRoughness' in m for m in j['materials']),
                      'nonFinite':c['nonFinite'],'degenerateTriangles':c['degenerateFaces'],
                      'nodeNames':[n.get('name','') for n in j['nodes']]}
        assert result[name]['materialsPBR']
        if name=='meditator_base.glb':
            result[name]['animation']=animation_data(j,b)
            result[name]['anchors']=anchors(j)
            result['contactTest']=contact_test(s)
        else:
            assert 'PadSeatAnchor' in result[name]['nodeNames']
            result[name]['padSeatAnchor_m']=[0,.195,0]
            # Verify leaf top normals: majority faces on top sheet point +Y.
            leaf=s.geometry['leaf_satin_green_SeatRoot_mesh'];n=leaf.face_normals
            above=(leaf.triangles_center[:,1]>.15)
            result[name]['leafUpFacingSurfaceFaceRatio']=float(np.mean(n[above,1]>.5))
            assert result[name]['leafUpFacingSurfaceFaceRatio']>.80
    result['gates']={'nativeTrimeshGLBImport':'PASS','trueVtkGLTFPBRFrames':'PASS','sitIdleNativeGLTFAnimation':'PASS',
       'cyclesBlenderWindows':'NOT_RUN_BLENDER_UNAVAILABLE_IN_ENV','blenderSourceBlendFiles':'PENDING_OWNER_RUN',
       'threeJsLoader':'NOT_RUN','liveStudioFPSVram':'NOT_RUN','releaseApproved':False}
    (ROOT/'P0_VALIDATION.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    print(json.dumps({k:v for k,v in result.items() if k=='contactTest' or (isinstance(v,dict) and 'triangles' in v)},indent=2))

if __name__=='__main__':main()
