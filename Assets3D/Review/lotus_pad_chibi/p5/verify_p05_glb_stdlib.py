"""P0.5 standalone SHA + glTF2 + 6 palettes + dual idle alias verification.
Uses only Python stdlib; does NOT claim Blender/Cycles or collision PASS.
"""
from pathlib import Path
import hashlib,json,struct
ROOT=Path(__file__).resolve().parent
ASSETS={
 'cross_prayer':('meditator_female_cross_prayer_p05.glb','981ecf0b83378ce3fca7cd49db9473baac43238af3b5ee2fa857024ff66b57fd'),
 'kneel_prayer':('meditator_female_kneel_prayer_p05.glb','04a1d0e03e5186085118dd06d158dbba43e7180843895ed1661a03529040785e')}
REQUIRED={'SeatRoot','UpperBodyBreath','HeadAnchor','NameplateAnchor','FXAnchor'}
for pose,(name,expected) in ASSETS.items():
 p=ROOT/name;data=p.read_bytes();h=hashlib.sha256(data).hexdigest()
 assert h==expected,(name,h,expected)
 assert data[:4]==b'glTF' and struct.unpack_from('<II',data,4)==(2,len(data))
 jlen,t=struct.unpack_from('<II',data,12);assert t==0x4e4f534a
 gltf=json.loads(data[20:20+jlen]);assert gltf['asset']['version']=='2.0'
 assert len(gltf['meshes'])==9 and len(gltf['materials'])==21
 assert len(gltf.get('textures',[]))==0
 assert REQUIRED<={n.get('name') for n in gltf['nodes']}
 assert set(a['name'] for a in gltf['animations'])=={'sit_idle',pose+'_idle'}
 for a in gltf['animations']:
  assert gltf['nodes'][a['channels'][0]['target']['node']]['name']=='UpperBodyBreath'
 assert [x['name'] for x in gltf['extensions']['KHR_materials_variants']['variants']]==[
 'pastel_lilac','blush_rose','sage_green','sky_blue','warm_cream','terracotta']
 mapped=[]
 for mesh in gltf['meshes']:
  for primitive in mesh['primitives']:
   if primitive.get('extensions',{}).get('KHR_materials_variants'):
    mapped.append(primitive['extensions']['KHR_materials_variants']['mappings'])
 assert len(mapped)==2
 for mappings in mapped:
  assert len(mappings)==6 and sorted(x['variants'][0] for x in mappings)==list(range(6))
 print('GLTF2_SHA_PALETTE_ANCHORS_ANIM_PASS',pose,p.stat().st_size,h)
print('OWNER_CYCLES_AND_EXACT_PAD_COLLISION_NOT_RUN_IN_THIS_CHECK')
