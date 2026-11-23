"""Independent P0.5c/P0.5d original exported GLB structural audit, stdlib+numpy.
The full independent geometry/pants/foot contact validator is in the owner source ZIP.
Zero Cycles claims. Run from p5d in a checkout with original p5c binary present.
"""
from pathlib import Path
import json,struct,hashlib
import numpy as np
R=Path(__file__).resolve().parent
old=R/'p05c_baseline/meditator_female_cross_prayer_p05c.glb'
if not old.is_file():old=R.parent/'p5c/meditator_female_cross_prayer_p05c.glb'
new=R/'meditator_female_cross_prayer_p05d.glb'
def checksha(path,sha):
    b=path.read_bytes();assert hashlib.sha256(b).hexdigest()==sha,path
    return b
def parse(b):
    assert b[:4]==b'glTF' and struct.unpack_from('<II',b,4)==(2,len(b))
    n,tag=struct.unpack_from('<II',b,12);assert tag==0x4e4f534a
    j=json.loads(b[20:20+n]);k=20+n
    ln,t=struct.unpack_from('<II',b,k);assert t==0x004e4942
    return j,b[k+8:k+8+ln]
def acc(j,b,i):
    a=j['accessors'][i];v=j['bufferViews'][a['bufferView']]
    dim={'VEC3':3,'SCALAR':1}[a['type']]
    dtype={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']]
    return np.frombuffer(b,dtype=dtype,count=a['count']*dim,
       offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,dim).copy()
ba=checksha(old,'1da8c12982165cf57e2ef678013cdd57b67bba7fd6c08e2979c267599d35e5bf')
bb=checksha(new,'0f169e427cc70bc0b5b744db935c4de4ecac356ef3fc8a1113812a5bf0780e44')
a,ab=parse(ba);b,binb=parse(bb)
assert binb[:len(ab)]==ab
assert len(a['meshes'])==9 and len(b['meshes'])==10 and a['materials']==b['materials'] and len(b['materials'])==21
assert a['extensions']['KHR_materials_variants']==b['extensions']['KHR_materials_variants']
assert a['animations']==b['animations'] and len(b['animations'])==2
assert len(b['nodes'])==len(a['nodes'])+1 and b['nodes'][-1]['mesh']==9
for i in range(9):
    pa=a['meshes'][i]['primitives'][0];pb=b['meshes'][i]['primitives'][0]
    assert a['meshes'][i]['name']==b['meshes'][i]['name']
    assert np.array_equal(acc(a,ab,pa['indices']),acc(b,binb,pb['indices']))
    for at in ('POSITION','NORMAL'):
        x=acc(a,ab,pa['attributes'][at]);y=acc(b,binb,pb['attributes'][at])
        if i: assert np.array_equal(x,y),(i,at)
        elif at=='POSITION':
            moved=np.where(np.linalg.norm(x-y,axis=1)>1e-8)[0]
            assert len(moved)==54
            assert np.max(np.linalg.norm(x-y,axis=1))<.021
for ani in a['animations']:
    s=ani['samplers'][0]
    assert len(acc(a,ab,s['input']))==17
    for key in ('input','output'):
        assert np.array_equal(acc(a,ab,s[key]),acc(b,binb,s[key]))
print('PASS original GLB SHA, 8 unchanged meshes, 54 local pants vertices, raw idle/palettes, +1 SeatRoot foot')
print('NOT_RUN Blender Cycles / exact foot vs lotus collision / GPU / owner art')
