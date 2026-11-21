"""Local original binary checksum gate. Requires only Python stdlib.
Run from P0.4 source bundle extraction, after owner copied the baseline leaf.
Never claim Blender PASS from this source-only verifier.
"""
from pathlib import Path
import hashlib, json, struct
ROOT=Path(__file__).parent
FILES={
 "meditator_female_ao_ba_ba_p04.glb":"586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09",
 "p03_baseline/meditator_base.glb":"646842c7574976020f6583c4e18879c9bef012e5f31dc851589c0a1491786be0",
 "p02_baseline/lotus_pad_01.glb":"80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9",
}
for name,expected in FILES.items():
    p=ROOT/name
    if not p.is_file():raise FileNotFoundError(f"pending baseline/manual copy: {p}")
    data=p.read_bytes();actual=hashlib.sha256(data).hexdigest()
    assert actual==expected,(name,expected,actual)
    assert data[:4]==b"glTF" and struct.unpack_from("<I",data,4)[0]==2
    n=struct.unpack_from("<I",data,12)[0]
    gltf=json.loads(data[20:20+n])
    assert gltf["asset"]["version"]=="2.0"
    print("GLB SHA PASS",name,len(data),"meshes",len(gltf["meshes"]))
print("ALL THREE ORIGINAL GLB INPUT HASHES PASS — Cycles/owner art still PENDING")
