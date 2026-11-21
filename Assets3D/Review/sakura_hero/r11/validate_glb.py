"""Read-only structural validation for Sakura GLB; requires trimesh+numpy."""
import argparse, hashlib, json, os, struct
from pathlib import Path
import numpy as np
import trimesh

def collect(path):
 p=Path(path)
 blob=p.read_bytes()
 if len(blob)<20 or blob[:4]!=b'glTF':raise AssertionError('Not a binary glTF')
 magic,version,decl=struct.unpack_from('<4sII',blob,0)
 if version!=2 or decl!=len(blob):raise AssertionError('GLB2 header/length invalid')
 chunks=[];idx=12;payload=None
 while idx+8<=len(blob):
  sz,typ=struct.unpack_from('<I4s',blob,idx);idx+=8
  if idx+sz>len(blob):raise AssertionError('GLB chunk boundary invalid')
  if typ==b'JSON':payload=json.loads(blob[idx:idx+sz])
  chunks.append({'type':typ.decode('ascii','replace'),'bytes':sz});idx+=sz
 if idx!=len(blob) or payload is None:raise AssertionError('GLB JSON not found')
 s=trimesh.load(str(p),force='scene',process=False)
 geoms=list(s.geometry.values())
 if not geoms:raise AssertionError('No 3D meshes')
 verts=sum(len(m.vertices) for m in geoms);tris=sum(len(m.faces) for m in geoms)
 degenerate=0;nonfinite=0
 for g in geoms:
  v=np.asarray(g.vertices);f=np.asarray(g.faces)
  nonfinite+=int((~np.isfinite(v)).sum())
  a=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
  degenerate+=int(np.count_nonzero(np.linalg.norm(a,axis=1)<2e-12))
 if nonfinite or degenerate:raise AssertionError('Geometry has invalid vertices or zero area triangles')
 names=[m.get('name','') for m in payload.get('materials',[])]
 petals=[m for m in payload.get('materials',[]) if 'Sakura_petal_' in m.get('name','')]
 if len(petals)<4 or not all(m.get('doubleSided') is True for m in petals):raise AssertionError('Petals not doubleSided')
 if any(m.get('alphaMode')=='MASK' for m in petals):raise AssertionError('Unexpected alpha cutout')
 return {'filename':p.name,'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest(),
  'glTFVersion':version,'triangles':tris,'vertices':verts,'meshCount':len(geoms),
  'materialCount':len(payload.get('materials',[])),'materialNames':names,
  'boundsMin':np.round(s.bounds[0],4).tolist(),'boundsMax':np.round(s.bounds[1],4).tolist(),
  'boundsMeters':np.round(s.extents,4).tolist(),
  'degenerateFaces':degenerate,'nonfiniteVertices':nonfinite,
  'petalDoubleSided':True,'petalTriMeshCount':len(petals),
  'texturesInGLTF':len(payload.get('textures',[])),
  'imagesInGLTF':len(payload.get('images',[])),
  'animations':len(payload.get('animations',[])),'chunks':chunks}
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('files',nargs='+');ap.add_argument('--out');args=ap.parse_args()
 data=[collect(x) for x in args.files]
 print(json.dumps(data,indent=2,ensure_ascii=False))
 if args.out:Path(args.out).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
