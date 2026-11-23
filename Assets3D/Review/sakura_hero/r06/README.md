# Sakura Hero R06 — zero-cost PBR-first art prototype

**Status: geometry prototype / SA re-review; NOT approved for production.** Branch `assets/sakura-hero-r04-sa-review`, Draft PR #1. R04/R05 remain immutable. No paid asset generation; **0 VND paid-service cost**.

## Change over R05
- R05 QUALITY 290,060 triangles -> R06 148,193 (48.91% fewer); ECO 63,874 -> 32,609 (48.95% fewer). Triangle reduction does NOT predict FPS.
- Eliminated duplicate offset rear-petal polygons from the **delivered R06**. Petals retain `doubleSided=true` and PBR emissive factors. A/B test: `253,718` triangles if explicit duplicates used on same R06 geometry. All A/B visuals are imported GLBs, not generated images.
- Layered asymmetric pink/peach blossom lobes, larger flower scale, different crown spacing and irregular fan structure. More sweeping ancient trunk, longer asymmetric roots, broken golden bark ridges. Not a perfect match to 15s/33s source video.

## PBR truth gate (IMPORTANT)
Run `render_pbr_truth.py` against **actual exported GLBs**. This script refuses any imported non-PBR vtkProperty and never invokes `SetInterpolationToPhong`, `SetAmbient`, `SetDiffuse`, manual material substitutions or actor material overrides. It uses a reproducible synthetic equirectangular IBL environment plus 3 colored lights. Render JPG contact sheets show identical camera and light conditions for R05/R06 and R06 single/explicit petals.

- With **IBL ON** + same three scene lights: R05 and R06 underside flowers have fewer/lighter extreme black facets. The original dark-face complaint was partly missing illumination in the default VTK environment, **not proof that R05 GLB materials were invalid**.
- With **IBL OFF** (same 3 lights), black/dark facets reappear on R06; see `r06_pbr_under_noIBL.png`. Therefore **we do NOT claim unconditional PBR issue solved**, and SA must test actual Three.js GLTFLoader and Blender glTF materials under the intended environment.
- Explicit backface A/B looks similar but costs ~105,525 extra triangles. R06 production candidate keeps *single face + doubleSided*, because explicit triangles did not prove a shading improvement with tested lights.
- Generated GLB materials have true glTF 2.0 PBR (metallic 0, roughness .88), emissiveFactor and doubleSided. No external textures, no Phong screenshot substitution.

## Local steps
```powershell
py -m pip install numpy trimesh vtk pillow
$env:SAKURA_OUTPUT = (Get-Location).Path
py .\procedural_sakura_source.py
py .\render_pbr_truth.py .\sakura_hero.glb .\r06_pbr_under.png --view under
py .\render_pbr_truth.py .\sakura_hero_eco.glb .\r06_pbr_under_eco.png --view under
py .\render_pbr_truth.py .\sakura_hero.glb .\r06_pbr_under_noIBL.png --view under --no-ibl
# A/B optional diagnostic: generate alternative mesh with duplicate backs; do not overwrite actual R06
New-Item -ItemType Directory -Force .\ab_explicit
$env:SAKURA_OUTPUT = (Join-Path (Get-Location) 'ab_explicit')
py .\procedural_sakura_source.py --petal-mode explicit --quality-only
```

R06 two reference positions are `top` / `three_quarter` for ~15s and `trunk_33s` for thick root/ancient bark. Perspective camera with fixed view angle 44deg (trunk 56deg). Angles are **repeatable approximations**, not calibrated exact FOV from original TikTok clip.

## Open gates / limitations
- Blender is unavailable in current model runtime; no `.blend`, no Blender Material Preview test. Three.js GLTFLoader not tested. Real RTX 3050 Ti (ECO) + RTX 3060 (QUALITY) with LIVE Studio FPS/VRAM not tested.
- Canopy clumps remain somewhat round/faceted; golden traces can still read as strokes not textured bark. PBR outcome is lighting-dependent; do not approve production until renderer lighting is reproduced.
- GLB/OBJ/large screenshot files are NOT on GitHub unless owner subsequently uploads and hashes are verified. Check BINARY_HANDOFF.md.

## License/provenance
See LICENSE_AND_PROVENANCE.md. All geometry is original local procedural 3D; no third-party assets/paid API/Roblox meshes/TikTok UI copied.
