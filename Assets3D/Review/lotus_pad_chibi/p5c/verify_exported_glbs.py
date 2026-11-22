"""Independent P0.5b versus P0.5c true exported GLB audit (stdlib + numpy + trimesh).
Run after owner has uploaded both P0.5c GLBs into this p5c directory.
For detailed contact sampling use validate_p05c_independent.py in source ZIP.
"""
from pathlib import Path
import hashlib,json,struct,numpy as np,trimesh
HERE=Path(__file__).resolve().parent
PAIRS=[
 ('cross_prayer','81e8548cf6e46d9f5ff60c7bdf342ac1857015140e7d06d67dbd9284054137fd','1da8c12982165cf57e2ef678013cdd57b67bba7fd6c08e2979c267599d35e5bf',16864),
 ('kneel_prayer','533b84cba69332107ea25c57ed952b76c8276d4971a558496e4caf7aea400e9f','a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac',17792)]
def read(path,expected):
 b=path.read_bytes()
 assert hashlib.sha256(b).hexdigest()==expected,('SHA256',path)
 assert b[:4]==b'glTF' and struct.unpack_from('<II',b,4)==(2,len(b))
 n,t=struct.unpack_from('<II',b,12);assert t==0x4e4f534a
 j=json.loads(b[20:20+n]);pos=20+n
 size,t=struct.unpack_from('<II',b,pos);assert t==0x004e4942
 return j,b[pos+8:pos+8+size]
def arr(j,b,i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']]
 kind={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']]
 dtype={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']]
 off=v.get('byteOffset',0)+a.get('byteOffset',0)
 return np.frombuffer(b,dtype=dtype,count=a['count']*kind,offset=off)
for pose,sha_old,sha_new,tris in PAIRS:
 old=HERE.parent/'p5b'/f'meditator_female_{"cross" if pose=="cross_prayer" else "kneel"}_prayer_p05b.glb'
 new=HERE/f'meditator_female_{"cross" if pose=="cross_prayer" else "kneel"}_prayer_p05c.glb'
 A,ba=read(old,sha_old);B,bb=read(new,sha_new)
 assert len(A['meshes'])==len(B['meshes'])==9 and len(B['materials'])==21
 assert A['materials']==B['materials'] and A['extensions']['KHR_materials_variants']==B['extensions']['KHR_materials_variants']
 count=0
 for x,y in zip(A['meshes'],B['meshes']):
  a=x['primitives'][0];b=y['primitives'][0]
  assert np.array_equal(arr(A,ba,a['indices']),arr(B,bb,b['indices']))
  if x['name']!='skin_rose_cream_UpperBodyBreath_mesh':
   for t in ('POSITION','NORMAL'):
    assert np.array_equal(arr(A,ba,a['attributes'][t]),arr(B,bb,b['attributes'][t]))
   count+=1
 assert count==8
 for a,b in zip(A['animations'],B['animations']):
  assert a['name']==b['name']
  for fld in ('input','output'):
   assert np.array_equal(arr(A,ba,a['samplers'][0][fld]),arr(B,bb,b['samplers'][0][fld]))
 assert {n['name']:n for n in A['nodes'] if n.get('name')}['HeadAnchor']=={n['name']:n for n in B['nodes'] if n.get('name')}['HeadAnchor']
 sa=trimesh.load(old,force='scene');sb=trimesh.load(new,force='scene')
 assert sum(len(x.faces) for x in sa.geometry.values())==sum(len(x.faces) for x in sb.geometry.values())==tris
 hands=[m for m in sb.geometry['skin_rose_cream_UpperBodyBreath_mesh'].split(only_watertight=False) if .42<m.bounds[0,1] and m.bounds[1,1]<.65 and m.bounds[0,2]>.29 and len(m.faces)>1500]
 assert len(hands)==2 and all(m.is_watertight for m in hands)
 l,r=sorted(hands,key=lambda m:m.centroid[0]);assert l.vertices[:,0].max()<r.vertices[:,0].min()
 print('[P05C REAL GLB PRESERVATION PASS]',pose,'triangles',tris,'unaltered meshes',count,'hand gap M',r.vertices[:,0].min()-l.vertices[:,0].max())
print('Independent GLB structure PASS; Blender Cycles still separate owner gate')
