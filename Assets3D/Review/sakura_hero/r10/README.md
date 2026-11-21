# Sakura Hero R10 — AI Visual zero-cost candidate

**Branch** `assets/sakura-hero-r04-sa-review` | **PR #1** Draft | **production NOT APPROVED**. R04–R09 are immutable.

The owner uploaded genuine Blender 4.5.16 LTS AXES V2 evidence for **R09**, including 16 Cycles CPU renders and 2 editable .blend files. Both files match SHA from Blender reports. Independent PBR/material import gate passed for **R09 under the stated Cycles dusk rig**; it does not prove the separate R10 mesh was imported or that Three.js runtime is correct.

## R10 art scope
- QUALITY petal lip geometrically widened and tips shortened: **4 triangles/petal unchanged**. Lower upper-surface curvature changes reduce triangle-like specular facets without a Phong override. Still imperfect at close-up.
- QUALITY canopy lobe-axis extremes and surface radial noise moderated for less jagged boundary without adding overall flower density; layering retained.
- QUALITY bark mesh has 73 longitudinal rings × 58 radial sides (R09 54×46) to resolve stronger but natural low-frequency knots and curled grain. Buttress roots have non-uniform taper. Gold remains **recessed geometry strips** attached to original bark, NOT fluorescent cylinders.
- ECO source generation runs R09 baseline geometry byte-for-byte. **Same ECO GLB SHA is intentional and valid because content is identical**, not a claim of a modified ECO.

## Measured R09 → R10

| Preset | Triangles | Vertices | Mesh/materials | File bytes | SHA-256 |
|---|---:|---:|---:|---:|---|
| QUALITY | 188,782 | 235,142 | 11/11 | 5,096,052 | `ac4322fb00475d0dde3334a375fca0e0094715583edf7f6460b30a9139b1e273` |
| ECO | 44,412 | 71,032 | 10/10 | 1,393,492 | `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` |

QUALITY +3,756 triangles (+2.03%) vs R09; ECO unchanged. No FPS inference. Real glTF 2.0 GLBs verified through trimesh and native VTK PBR importer, with non-finite/zero-area checks and `doubleSided` petal materials.

## Regenerate on Windows (no payments)
````powershell
py -m pip install numpy trimesh vtk pillow
$env:SAKURA_OUTPUT=(Get-Location).Path
py .\procedural_sakura_source.py
py .\validate_glb.py .\sakura_hero.glb .\sakura_hero_eco.glb
````

## Independent Blender checkpoint for **R10**, not yet run
The owner should use the included `run_sakura_R10_blender.ps1` alongside the original two R10 GLBs and `blender_import_validate_r10.py`. Run in the extracted R10 package:
````powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R10_blender.ps1 -Variant all -Samples 32 -Size 520
````
The launcher checks the exact SHA/bytes of each model, imports GLB and Principled materials, uses Cycles CPU with dusk world and 3 sun lamps, transforms +Y glTF coordinates to Blender +Z camera axes, and renders eight repeatable views per preset. The user must send resulting `Sakura_R10_Blender_Evidence_AxesV2.zip` and both `.blend` files separately. The VTK and Cycles rigs are different and **must not be pixel-compared across renderers**.

## SA visual verdict gate
Comparative VTK R09/R10 top/under/trunk/three-quarter images (PBR, no Phong override) are in `PBR_Review/`. R10 does **NOT yet convincingly match** the ~15s airy soft hero canopy or ancient bark ~33s. The softening is incremental; do not approve final art from this bundle. Owner GPU + TikTok LIVE Studio and native Three.js remain open.

## Binary branch handoff
`BINARY_HANDOFF.md` gives exact filename, bytes, SHA, branch path and `pending_owner_upload` for GLB/OBJ/images. No binary has been pushed to GitHub by AI Visual.
