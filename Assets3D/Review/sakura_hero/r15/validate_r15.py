"""R15 glTF and true local union gate; no Blender/Three.js claims."""
from pathlib import Path
import hashlib,struct,json,sys,os
import numpy as np
import trimesh

BASE=Path(__file__).parent
EXPECTED_R14='ba3183c7b738dbd814b2b23cedc1f6da0470b13121882c116e1775154bda44f5'
EXPECTED_ECO='accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def audit(path):
 b=Path(path).read_bytes()
 assert b[:4]==b'glTF' and struct.unpack_from('<I',b,4)[0]==2 and struct.unpack_from('<I',b,8)[0]==len(b)
 length=struct.unpack_from('<I',b,12)[0]
 g=json.loads(b[20:20+length].decode())
 scene=trimesh.load(path,force='scene')
 meshes=list(scene.geometry.values());trs=sum(len(x.faces) for x in meshes);vtx=sum(len(x.vertices) for x in meshes)
 deg=sum(int(np.count_nonzero(x.area_faces<=1e-11)) for x in meshes)
 nonfinite=sum(int(np.count_nonzero(~np.isfinite(x.vertices))) for x in meshes)
 materials={m['name']:m for m in g['materials']}
 attribNormals=sum('NORMAL' in p['attributes'] for m in g['meshes'] for p in m['primitives'])
 return {'sha256':sha(path),'bytes':len(b),'triangles':trs,'vertices':vtx,'degenerate':deg,'nonfinite':nonfinite,
   'meshes':len(g['meshes']),'materials':len(g['materials']),'normalAttributes':attribNormals,'petalDoubleSided':all(v.get('doubleSided') for k,v in materials.items() if k.startswith('Sakura_petal')), 'bounds':np.round(scene.bounds,5).tolist(),
   'materialFactors':{k:{key:v.get(key) for key in ('pbrMetallicRoughness','emissiveFactor','doubleSided')} for k,v in materials.items()},
   'trunkComponents':sorted(({'faces':len(c.faces),'watertight':c.is_watertight,'euler':c.euler_number} for c in scene.geometry['Trunk_bark_plumblack'].split(only_watertight=False)),key=lambda c:-c['faces'])}

if __name__=='__main__':
 files={'r14':BASE/'r14_quality.glb','r15':BASE/'sakura_hero.glb','eco':BASE/'sakura_hero_eco.glb'}
 records={k:audit(v) for k,v in files.items()}
 assert records['r14']['sha256']==EXPECTED_R14
 assert records['eco']['sha256']==EXPECTED_ECO
 assert records['r15']['degenerate']==0 and records['r15']['nonfinite']==0
 assert records['r15']['petalDoubleSided'] and records['r15']['normalAttributes']==0
 assert records['r14']['materialFactors']==records['r15']['materialFactors']
 assert records['r15']['meshes']==11 and records['eco']['meshes']==10
 # The historical root tubes are still independent; the FIRST trunk comp is
 # genuinely watertight and has >15k tris, consisting of trunk + 3 main arms.
 assert records['r15']['trunkComponents'][0]['watertight'] and records['r15']['trunkComponents'][0]['euler']==2
 assert records['r15']['trunkComponents'][0]['faces']==15054
 assert records['r15']['trunkComponents'][1]['faces']<2000
 assert records['eco']['triangles']==44412
 summary={'records':records,'deltaQualityVsR14':{key:records['r15'][key]-records['r14'][key] for key in ('triangles','vertices','bytes')},
 'r14R15PBRMaterialIdentical':True,'ECOCarryForward':True,'joinedTrunkAndThreeArms':True,
 'blenderR14OwnerSA':'PASS_3_CASE_21_PNG_32_ZIP_SHA','blenderR15':'NOT_RUN',
 'threeJsNative':'NOT_RUN','gpuLiveStudioFPSVRAM':'NOT_RUN','art':'PARTIAL',
 'productionApproved':False}
 (BASE/'R15_VALIDATION.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
 print(json.dumps({k:{key:rec[key] for key in ('sha256','bytes','triangles','vertices','degenerate','meshes','normalAttributes')} for k,rec in records.items()},indent=2))
 print('QUALITY_DELTA',summary['deltaQualityVsR14'])
