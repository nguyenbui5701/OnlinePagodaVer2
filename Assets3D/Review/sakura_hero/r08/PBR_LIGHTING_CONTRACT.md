# R08 — PBR review lighting / cross-renderer acceptance contract

## What WAS actually tested
- The actual exported R08 QUALITY/ECO GLB, re-imported by `vtk.vtkGLTFImporter`; imported actor properties asserted to be `Physically based rendering`. Materials from GLB remain unchanged.
- **Image Based Lighting ON:** synthetic environment texture 256×128, vertical colors sky `[216,181,195]`, middle `[172,132,165]`, ground `[124,98,142]` (8-bit RGB). Enables VTK environment texture and IBL.
- Three fixed scene lights: `(22,40,26)` intensity `1.25` RGB `(1,.84,.82)`; `(-18,23,-15)` intensity `.65` RGB `(1,.76,.89)`; `(6,3,18)` intensity `.84` RGB `(1,.74,.83)`, all aimed approximately at `(0,9,0)`. Third light is lower fill.
- Perspective cameras from unchanged `render_pbr_truth.py`:
  - `top`: position `(3,54,10)`, target `(0,13.5,0)`, up `(0,0,-1)`, vertical FOV **50°**
  - `under`: position `(3,4.8,18.5)`, target `(0,11.9,0)`, up `(0,1,0)`, vertical FOV **44°**
  - `three_quarter`: position `(31,25,31)`, target `(0,11.6,0)`, FOV **44°**
  - `side`: position `(32,14,2)`, target `(0,11,0)`, FOV **44°**
  - `trunk_33s`: position `(4.8,4,11.5)`, target `(0,6.6,0)`, FOV **56°**
- GLB viewport backgrounds are synthetic pink dusk, **not baked into GLB**. FOV approximates original reference; original movie does not provide camera calibration.
- Comparison screenshots R07/R08 are taken with identical VTK code, lighting, FOV, framing and 420×480 resolution. A dark underside under IBL OFF does NOT by itself prove bad PBR or bad normals.

## What is still OPEN — final SA gate
- No Blender binary available in this session, no EEVEE/Cycles Material Preview run; no `.blend`.
- No native Three.js GLTFLoader or other INDEPENDENT glTF renderer parity demonstrated. The availability of Chromium alone does not establish glTF PBR validation.
- On owner's PC, import both GLBs into free Blender. Set both previews under equivalent dusk environment + key/rim/bounce sources; capture front, top, under, 3/4 with fixed exposure/color management. Then compare in a second glTF renderer, documenting exposure, environment, backface and artifact differences.
- Do not claim 3050 Ti 4GB or RTX 3060 8GB sustained FPS without LIVE Studio + renderer profiling. No shader/PBR integration requested from Codex here.
