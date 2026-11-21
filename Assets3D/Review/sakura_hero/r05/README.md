# Sakura Hero R05 — Zero-Cost Geometry Prototype

**Status:** `pending_owner_upload` / **NOT SA APPROVED FOR PRODUCTION**. This revision addresses the independent SA review of R04 on [PR #1](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1). R04 remains intact in sibling `r04/`.

## Video goals and changes
- `chuav2.mp4` ~15s aerial: more luminous peach/blush/pink flower color, 8 irregular broad crown fans and layered lobe depth; avoid one solid wallpaper canopy.
- ~33s under tree: broader asymmetrical trunk/major roots with curved heavy boughs, stronger gold bark-vein geometry.
- R04 dark double-sided triangles: R05 includes explicit back-facing petal geometry separated in depth; petals remain `doubleSided=true`, peach/glow emissive factors increased, 3D ellipsoidal canopy cores preserve warm inner surfaces and gaps.

**Important:** R05 is not a perfect match. Petals are still faceted. VTK's PBR import without environment lighting remains dull/dark; the gallery uses **VTK Phong/ambient override** on the **same imported R05 GLB** to inspect intended palette. This is not evidence of Three.js PBR success.

## Exact geometry (checked with trimesh imported GLB)
| | QUALITY | ECO |
|---|---:|---:|
| Triangles | 290,060 | 63,874 |
| Vertices | 458,817 | 93,949 |
| Mesh/material groups | 11 | 10 |
| Bytes | 8,971,236 | 1,887,408 |
| GLB SHA-256 | `fabe3eae4eb6efb37ed4ed185dda55a124638a63dfcf05b6ce8eb5685b6555d8` | `2ab6357a63d1c6b827b795b998ebdb0b6008d716544c9daa04e17a22a656521b` |

QUALITY bounds (X,Y,Z) approx. 27.3309 × 22.6931 × 26.5596 m. Pivot `[0,0,0]`, `+Y` up, `1 unit = 1 meter`; actual roots can lie below pivot. All materials internal, no textures or animations.

## Rebuild from REAL editable mesh source (Windows PowerShell)
Only free Python packages `numpy`, `trimesh`. Source is `procedural_sakura_source.py` and produces both GLBs plus editable OBJ.
```powershell
py -m pip install numpy trimesh
$env:SAKURA_OUTPUT = (Get-Location).Path
py .\procedural_sakura_source.py
Get-FileHash .\sakura_hero.glb -Algorithm SHA256
Get-FileHash .\sakura_hero_eco.glb -Algorithm SHA256
```
For screenshots, use `py -m pip install vtk pillow` and `py .\render_from_glb.py`, which loads the GLB with VTK and renders 4 true camera positions. The render helper may require a graphics/display backend. Byte-level reproducibility across platforms/library versions is NOT guaranteed: **SHA values refer to the exact R05 binaries generated and packaged**, not every later rebuild.

## Truthful validation and scope
- **PASS as local mesh prototype:** glTF2 magic, trimesh import, materials, geometry counts, multiple camera poses in VTK.
- **OPEN:** Blender import / proper `.blend` source unavailable, Three.js GLTFLoader/true PBR not tested, dark underside in default VTK PBR, FPS/VRAM alongside TikTok LIVE Studio on 3050 Ti 4GB and 3060 8GB not tested.
- **ZERO COST:** original Python/trimesh + VTK, **0 VND paid services**. No purchased assets, paid 3D API, or third-party mesh. GLB and PNG/JPG are **NOT on GitHub until owner upload**.
- SA is asked to critique R05 **as prototype**, not approve runtime integration; Codex remains responsible for renderer and camera only.

See `BINARY_HANDOFF.md` for exact pending files and `R05_VISUAL_GAP_ANALYSIS.md` for comment-by-comment response.
