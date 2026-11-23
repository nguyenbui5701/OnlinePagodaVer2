"""Independent P0.2/P0.3 real exported GLB hair-only, sit_idle, anchor, seat audit.
Requires numpy, trimesh, scipy. Does not import the procedural generator.
"""
from pathlib import Path
import hashlib,json,struct
import numpy as np
import trimesh
from validate_p02_independent import glb_json,mesh_stats,actor_contact

ROOT=Path(__file__).resolve().parent
PAD_SHA="80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9"
P02_ACTOR_SHA="83009fab6f4f00730260ef70dcd4d8605b2c634bc99f1fd6e34a1030833abd4c"
P03_ACTOR_SHA="646842c7574976020f6583c4e18879c9bef012e5f31dc851589c0a1491786be0"

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def animation_data(path):
 j,b=glb_json(path)
 offset=20+struct.unpack_from('<I',b,12)[0]+8
 a=j['animations'][0];sam=a['samplers'][0]
 def data(i):
  access=j['accessors'][i];view=j['bufferViews'][access['bufferView']]
  n=1 if access['type']=='SCALAR' else 3
  return np.frombuffer(b,dtype='<f4',count=access['count']*n,
       offset=offset+view.get('byteOffset',0)+access.get('byteOffset',0)).reshape(access['count'],n).copy()
 return a,j['nodes'][a['channels'][0]['target']['node']]['name'],data(sam['input']),data(sam['output'])

def check():
 pad0=ROOT/'p02_baseline/lotus_pad_01.glb';pad1=ROOT/'lotus_pad_01.glb'
 old=ROOT/'p02_baseline/meditator_base.glb';new=ROOT/'meditator_base.glb'
 assert sha(pad0)==sha(pad1)==PAD_SHA
 assert sha(old)==P02_ACTOR_SHA and sha(new)==P03_ACTOR_SHA
 stats={}
 for tag,pad,actor in [('p02',pad0,old),('p03',pad1,new)]:
  p,ps=mesh_stats(pad);a,asc=mesh_stats(actor)
  assert p['degenerate']==a['degenerate']==0
  assert p['nonfinite']==a['nonfinite']==0
  stats[tag]={'pad':p,'actor':a,'contact':actor_contact(ps,asc)}
 a,an,times,values=animation_data(old)
 b,bn,ts,vs=animation_data(new)
 assert a['name']==b['name']=='sit_idle'
 assert an==bn=='UpperBodyBreath'
 assert np.array_equal(times,ts) and np.array_equal(values,vs)
 scene0=trimesh.load(str(old),force='scene')
 scene1=trimesh.load(str(new),force='scene')
 assert scene0.geometry.keys()==scene1.geometry.keys()
 diff=[]
 for key in scene0.geometry:
  x,y=scene0.geometry[key],scene1.geometry[key]
  if not(np.array_equal(x.faces,y.faces) and np.array_equal(x.vertices,y.vertices)):
   diff.append(key)
 assert diff==['hair_blue_black_UpperBodyBreath_mesh'],diff
 oldj,_=glb_json(old);newj,_=glb_json(new)
 m0={m['name']:m for m in oldj['materials']}
 m1={m['name']:m for m in newj['materials']}
 assert m0.keys()==m1.keys()
 assert all(m0[k]==m1[k] for k in m0 if k!='hair_blue_black')
 assert stats['p03']['actor']['triangles']==8724
 assert stats['p03']['pad']['triangles']==10648
 result={'status':'PASS_REAL_GLTF_TEST_NO_BLENDER_CYCLES_CLAIM',
   'p02ActorSha256':sha(old),'p03ActorSha256':sha(new),
   'padByteIdenticalP02':True,'changedMeshes':diff,
   'unchangedNonHairGeometryMaterials':True,
   'identicalSitIdle17Keys2Seconds':True,
   'seat':stats['p03']['contact'],
   'newTriangles':8724,'p03Blender':'NOT_RUN','ownerArt':'PENDING'}
 print(json.dumps(result,indent=2))
 return result

if __name__=='__main__':check()
