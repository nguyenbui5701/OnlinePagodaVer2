"""Standalone zero-cost GLB sanity verifier. Does not claim Blender/Three.js/GPU validation."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
import trimesh

def check(p):
 data=p.read_bytes(); assert data[:4]==b'glTF' and int.from_bytes(data[4:8],'little')==2
 assert int.from_bytes(data[8:12],'little')==len(data)
 scene=trimesh.load(p,force='scene',process=False)
 geoms=list(scene.geometry.values())
 assert all(np.isfinite(g.vertices).all() for g in geoms)
 z=sum(int(np.count_nonzero(g.area_faces<=1e-12)) for g in geoms)
 assert z==0,f'{z} degenerate faces'
 petals=[g for n,g in scene.geometry.items() if 'Sakura_petal_' in n]
 assert len(petals)==4 and all(g.visual.material.doubleSided for g in petals)
 return {'file':p.name,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),
   'triangles':sum(len(g.faces) for g in geoms),
   'vertices':sum(len(g.vertices) for g in geoms),
   'meshCount':len(geoms),'materialCount':len(geoms),
   'bounds':scene.bounds.round(4).tolist(),
   'petalDoubleSided':True,'zeroAreaTriangles':z}

if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--folder',default='.')
 root=Path(a.parse_args().folder)
 print(json.dumps([check(root/'sakura_hero.glb'),check(root/'sakura_hero_eco.glb')],indent=2))
