"""Independent P0.5 original GLB structural/SHA test — Python standard library only.
Does not test Blender, actual lotus collision or runtime; these remain OWNER_PENDING.
"""
from pathlib import Path
import hashlib, json, struct
ROOT=Path(__file__).resolve().parent
ASSETS={
  "cross_prayer": ("meditator_female_cross_prayer_p05.glb", "981ecf0b83378ce3fca7cd49db9473baac43238af3b5ee2fa857024ff66b57fd"),
  "kneel_prayer": ("meditator_female_kneel_prayer_p05.glb", "04a1d0e03e5186085118dd06d158dbba43e7180843895ed1661a03529040785e"),
}
REQUIRED={"SeatRoot","UpperBodyBreath","HeadAnchor","NameplateAnchor","FXAnchor"}
PALETTES=["pastel_lilac","blush_rose","sage_green","sky_blue","warm_cream","terracotta"]
for pose,(filename,expected) in ASSETS.items():
    path=ROOT/filename
    raw=path.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==expected, filename
    assert raw[:4]==b"glTF" and struct.unpack_from("<II",raw,4)==(2,len(raw)), filename
    size,typ=struct.unpack_from("<II",raw,12)
    assert typ==0x4E4F534A
    data=json.loads(raw[20:20+size])
    assert data["asset"]["version"]=="2.0"
    assert len(data["meshes"])==9 and len(data["materials"])==21 and not data.get("textures")
    assert REQUIRED.issubset(n.get("name") for n in data["nodes"])
    names={a["name"] for a in data["animations"]}
    assert names=={"sit_idle",pose+"_idle"}
    for animation in data["animations"]:
        channel=animation["channels"][0]
        assert data["nodes"][channel["target"]["node"]]["name"]=="UpperBodyBreath"
        assert channel["target"]["path"]=="translation"
    assert [x["name"] for x in data["extensions"]["KHR_materials_variants"]["variants"]]==PALETTES
    mappings=[]
    for mesh in data["meshes"]:
        for primitive in mesh["primitives"]:
            ext=primitive.get("extensions",{}).get("KHR_materials_variants")
            if ext:mappings.append(ext["mappings"])
    assert len(mappings)==2
    assert all(len(m)==6 and sorted(x["variants"][0] for x in m)==list(range(6)) for m in mappings)
    print("PASS_SHA_GLTF2_SIX_VARIANTS_AND_DUAL_IDLE",pose,len(raw),expected)
print("EXACT_PAD_COLLISION_AND_BLENDER_CYCLES_NOT_CHECKED")
