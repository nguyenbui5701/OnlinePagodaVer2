"""Independent 2-slot glTF P0.4 six-variant contract verifier (stdlib only)."""
from pathlib import Path
import hashlib, struct, json
p=Path(__file__).resolve().parent/"meditator_female_ao_ba_ba_p04.glb"
assert p.is_file(),"Copy real GLB here from the owner handoff ZIP"
b=p.read_bytes()
assert b[:4]==b"glTF" and struct.unpack_from("<I",b,4)[0]==2
assert hashlib.sha256(b).hexdigest()=="586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09"
n=struct.unpack_from("<I",b,12)[0];g=json.loads(b[20:20+n])
assert g["asset"]["version"]=="2.0"
assert len(g["extensions"]["KHR_materials_variants"]["variants"])==6
assert len(g["meshes"])==9 and len(g["materials"])==21
material_names={i:m["name"] for i,m in enumerate(g["materials"])}
mapped={}
for m in g["meshes"]:
 for pr in m["primitives"]:
  base=material_names.get(pr.get("material"),"")
  if base in ("ao_ba_ba_top","ao_ba_ba_pants"):
   entries=pr["extensions"]["KHR_materials_variants"]["mappings"]
   assert len(entries)==6
   assert sorted(x["variants"][0] for x in entries)==list(range(6))
   mapped[base]=True
assert set(mapped)=={"ao_ba_ba_top","ao_ba_ba_pants"}
print("PASS: original SHA/GLB, one mesh hierarchy, 6 material variants per 2 slots; Three.js runtime not yet tested")
