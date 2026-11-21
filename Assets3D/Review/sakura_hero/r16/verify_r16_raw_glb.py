"""Standalone independent R15/R16 GLB topology check. Reads final binary bytes.
Zero cost: python -m pip install trimesh numpy.
Run with SHA-exact r15_quality.glb, sakura_hero.glb, sakura_hero_eco.glb
in the same directory. Does not import procedural generator or its reports.
"""
import hashlib, json
from pathlib import Path
import numpy as np
import trimesh

ROOT=Path(__file__).resolve().parent
SHA={
 'r15_quality.glb':'9ad2dc4ceb807e0a60d89c8cbfdbcc26f09bd2ba190a1bb1ed09825be23f81ba',
 'sakura_hero.glb':'c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c',
 'sakura_hero_eco.glb':'accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173'
}
def analyze(path):
 data=path.read_bytes()
 assert hashlib.sha256(data).hexdigest()==SHA[path.name],('GLB SHA mismatch',path)
 scene=trimesh.load(str(path),force='scene')
 bark=scene.geometry['Trunk_bark_plumblack']
 comps=bark.split(only_watertight=False)
 main=max(comps,key=lambda x:len(x.faces))
 f=np.asarray(main.faces,dtype=np.int64)
 edges=np.sort(np.concatenate((f[:,[0,1]],f[:,[1,2]],f[:,[2,0]])),axis=1)
 unique,counts=np.unique(edges,axis=0,return_counts=True)
 out={'name':path.name,'sha256':SHA[path.name],'bytes':len(data),
      'totalTriangles':sum(len(g.faces) for g in scene.geometry.values()),
      'totalVertices':sum(len(g.vertices) for g in scene.geometry.values()),
      'meshCount':len(scene.geometry),
      'fusedWood':{'triangles':len(main.faces),'vertices':len(main.vertices),
         'connectedComponents':len(main.split(only_watertight=False)),
         'watertight':bool(main.is_watertight),
         'consistentWinding':bool(main.is_winding_consistent),
         'euler':int(main.euler_number),
         'boundaryEdges':int(np.count_nonzero(counts==1)),
         'nonManifoldEdges':int(np.count_nonzero(counts>2))},
      'otherBarkParts':len(comps)-1,
      'independentBranchParts':len(scene.geometry['Branches_plum'].split(only_watertight=False)),
      'goldVertices':len(scene.geometry['Golden_bark_veins'].vertices),
      'nonfiniteVertices':sum(int(np.count_nonzero(~np.isfinite(g.vertices))) for g in scene.geometry.values())}
 return out

if __name__=='__main__':
 results={p:analyze(ROOT/p) for p in SHA}
 a=results['r15_quality.glb'];b=results['sakura_hero.glb'];eco=results['sakura_hero_eco.glb']
 assert a['fusedWood']['triangles']==15054 and b['fusedWood']['triangles']==20920
 assert b['fusedWood']['watertight'] and b['fusedWood']['consistentWinding']
 assert b['fusedWood']['connectedComponents']==1 and b['fusedWood']['euler']==2
 assert b['fusedWood']['boundaryEdges']==0 and b['fusedWood']['nonManifoldEdges']==0
 assert b['independentBranchParts']==68 and b['goldVertices']==286
 assert b['nonfiniteVertices']==0 and b['totalTriangles']==191288
 assert eco['totalTriangles']==44412
 print(json.dumps(results,indent=2))
 print('PASS: actual exported R16 GLB topology verified; full scene NOT globally welded.')
