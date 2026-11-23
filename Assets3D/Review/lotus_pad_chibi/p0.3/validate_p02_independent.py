"""Independent p0.1 vs p0.2 ACTUAL GLB readback and analytic 2D triangulated seat contact.
Only the model files are inputs, no producer's geometry functions imported.
"""
from pathlib import Path
import json,hashlib,struct
import numpy as np,trimesh
from scipy.spatial import cKDTree
ROOT=Path(__file__).resolve().parent
SHA01={'lotus_pad_01.glb':'0c80e5d4b2590716fdf9a985340fe2446af7ecc056727a03b82a3997db52bba5',
       'meditator_base.glb':'f4e184b57046ad442183931bf9fd2f6d7953000ea07270458e291f627f787d2b'}
ANCHORS={'SeatRoot':[0,0,0],'HeadAnchor':[0,.835,.04], 'NameplateAnchor':[0,1.335,.03], 'FXAnchor':[.37,.805,.16]}

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def glb_json(path):
 b=path.read_bytes();assert b[:4]==b'glTF' and struct.unpack_from('<II',b,4)==(2,len(b))
 n,typ=struct.unpack_from('<II',b,12);assert typ==0x4e4f534a
 return json.loads(b[20:20+n].decode()),b

def mesh_stats(path):
 js,data=glb_json(path);sc=trimesh.load(str(path),force='scene')
 names={n.get('name'):n for n in js['nodes']};assert len(sc.geometry)>0
 tris=sum(len(x.faces) for x in sc.geometry.values());verts=sum(len(x.vertices) for x in sc.geometry.values())
 mat={m['name']:m for m in js['materials']}
 if path.name=='meditator_base.glb':
  for key,pos in ANCHORS.items():
   assert key in names,key
   n=names[key]
   t=n.get('translation',[n.get('matrix',[0]*16)[i] for i in (12,13,14)] if 'matrix' in n else [0,0,0])
   assert np.allclose(t,pos,atol=1e-6),(key,t,pos)
  assert 'UpperBodyBreath' in names
  assert len(js.get('animations',[]))==1 and js['animations'][0]['name']=='sit_idle'
  anim=js['animations'][0];assert len(anim['channels'])==1
  ch=anim['channels'][0]
  assert js['nodes'][ch['target']['node']]['name']=='UpperBodyBreath'
  assert ch['target']['path']=='translation'
  sampler=anim['samplers'][0]
  def arr(idx):
   a=js['accessors'][idx];v=js['bufferViews'][a['bufferView']]
   n=1 if a['type']=='SCALAR' else 3
   # one embedded GLB BIN chunk; guaranteed copied verbatim from exporter
   jlen=struct.unpack_from('<I',data,12)[0];off=20+jlen+8
   return np.frombuffer(data,dtype='<f4',count=a['count']*n,offset=off+v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],n)
  ts=arr(sampler['input'])[:,0];ys=arr(sampler['output'])
  assert len(ts)==17 and np.allclose([ts[0],ts[-1]],[0,2])
  assert abs(ys[:,1].max()-.016)<1e-6 and np.allclose(ys[0],ys[-1])
 else:
  assert 'PadSeatAnchor' in names
  assert np.allclose(names['PadSeatAnchor'].get('translation',[0,.195,0]),[0,.195,0])
 return {'sha256':sha(path),'bytes':len(data),'triangles':tris,'vertices':verts,'meshes':len(js['meshes']),
         'materials':len(js['materials']),'textures':len(js.get('textures',[])),
         'nonfinite':sum(int(np.count_nonzero(~np.isfinite(x.vertices))) for x in sc.geometry.values()),
         'degenerate':sum(int(np.count_nonzero(x.area_faces<1e-11)) for x in sc.geometry.values()),
         'boundsMinMax':np.round(sc.bounds,6).tolist(),
         'animClips':[x['name'] for x in js.get('animations',[])],
         'nodeNames':[x.get('name') for x in js['nodes']]},sc

def actor_contact(pad,actor):
 """P02 exported GLB lower body vertices vs direct imported triangle barycentric top leaf."""
 leaf=pad.geometry['leaf_satin_green_SeatRoot_mesh']
 tri=np.asarray(leaf.triangles);faces=np.asarray(leaf.face_normals)
 mask=faces[:,1]>.3;upper=tri[mask]
 mid=upper[:,:, [0,2]].mean(axis=1)
 tree=cKDTree(mid)
 # lower-body geometry specified by actual imported original asset parent nodes
 parts=[]
 for node in actor.graph.nodes_geometry:
  if '_SeatRoot_object' not in node:continue
  matrix,geometry=actor.graph[node]
  vertices=trimesh.transform_points(actor.geometry[geometry].vertices,matrix)
  parts.append(vertices)
 pts=np.concatenate(parts)
 assert len(pts)==658,len(pts)
 distances=[];no_triangle=0
 for v in pts:
  xz=v[[0,2]]
  _,indices=tree.query(xz,k=35)
  ys=[]
  for idx in np.atleast_1d(indices):
   t=upper[idx];p0,p1,p2=t[:,[0,2]]
   denom=(p1[0]-p0[0])*(p2[1]-p0[1])-(p2[0]-p0[0])*(p1[1]-p0[1])
   if abs(denom)<1e-12:continue
   a=((xz[0]-p0[0])*(p2[1]-p0[1])-(p2[0]-p0[0])*(xz[1]-p0[1]))/denom
   b=((p1[0]-p0[0])*(xz[1]-p0[1])-(xz[0]-p0[0])*(p1[1]-p0[1]))/denom
   if a>=-1e-5 and b>=-1e-5 and a+b<=1.00001:
    ys.append(float(t[0,1]+a*(t[1,1]-t[0,1])+b*(t[2,1]-t[0,1])))
  if not ys:no_triangle+=1;continue
  distances.append(float(v[1]+.195-max(ys)))
 assert no_triangle==0,('unmatched leaf triangles',no_triangle)
 below5=int(np.count_nonzero(np.array(distances)<-.005))
 assert below5==0,below5
 return {'actorPlacementY':.195,'padCenterSeatY':.195,'vertexSamples':len(pts),'matchedTopTriangles':len(distances),
         'minGapM':min(distances),'maxGapM':max(distances),'penetrationsMoreThan5mm':below5,
         'method':'Actual imported GLB triangle barycentric surface height vs exact imported lower body vertex positions; no generator surface formula'}

if __name__=='__main__':
 results={}
 for revision,sub in [('p01',ROOT/'p01_baseline'),('p02',ROOT)]:
  data={}
  for fname in ['lotus_pad_01.glb','meditator_base.glb']:
   metrics,sc=mesh_stats(sub/fname)
   if revision=='p01':assert metrics['sha256']==SHA01[fname]
   assert metrics['nonfinite']==0 and metrics['degenerate']==0
   data[fname]=metrics
   if fname.startswith('lotus_'):pad=sc
   else:actor=sc
  data['independentSeatContact']=actor_contact(pad,actor)
  results[revision]=data
 results['compared']={'sameCoordinatesAndNamedAnchors':True,'sameSitIdle':True,
                      'totalTriangleDelta':sum(results['p02'][f]['triangles']-results['p01'][f]['triangles'] for f in SHA01),
                      'ECOorLODCreated':False,'ownerVisualApproval':'PENDING',
                      'BlenderCyclesP02':'NOT_RUN', 'nativeThreeJs':'NOT_RUN', 'runtimeGPU':'NOT_RUN'}
 (ROOT/'P02_INDEPENDENT_GLB_VALIDATION.json').write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n')
 print(json.dumps({'p01contact':results['p01']['independentSeatContact'],'p02contact':results['p02']['independentSeatContact'],
  'deltaTri':results['compared']['totalTriangleDelta']},indent=2))
