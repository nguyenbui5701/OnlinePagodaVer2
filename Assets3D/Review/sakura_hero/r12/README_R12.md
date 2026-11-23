# Sakura Hero R12 — compact organic prototype (not production approved)

PR #1: https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1  
Branch: `assets/sakura-hero-r04-sa-review`  
Status: **R12 GLB geometry / VTK PBR tested; R12 Blender Cycles NOT RUN**. R10/R11 preserved.

## SA R11 evidence gate reconciled

SA independently reviewed 9/9 completed R11 Cycles A/B cases, 22 PNGs and both native .blend checksums. Palette-only R10 geometry with R11 color/emissive (`r10_palette_only.glb`) is lighter and convincingly equivalent in pink hue to R11 final. R11 7.60 MB heavy mesh is **not automatically superior**. R12 keeps R11 warm lower-emissive palette; drops explicit petal NORMAL arrays.

## Geometry changes

QUALITY: five subtly non-identical cupped petals, each unchanged **4 triangles/petal**, less flat cut-paper outer rim, interleaved upper/lower tiers and reduced dangling flowers. Bark/trunk: quality-only old-growth offset trunk curve, wider gnarly lower buttress, twisted multi-ring bark and branch tangent corrections; irregular roots. Golden ribbons remain in shallow bark *grooves*, not floating cylinder wires. ECO EXACT bytes as R10/R11.

## Actual exported metrics

| Metric | R10+R11 palette-only | R11 QUALITY | R12 QUALITY |
|---|---:|---:|---:|
| Triangles | 188,782 | 188,782 | **182,674** |
| Vertices | 235,142 | 235,142 | **226,267** |
| Mesh/material | 11/11 | 11/11 | 11/11 |
| GLB bytes | 5,096,532 | 7,599,884 | **4,916,248** |
| Explicit petal NORMAL | No | Yes | **No** |

R12 vs R11 QUALITY: **-3.235% triangles**, **-35.312% bytes**. ECO 44,412 triangles, 71,032 vertices, 10 materials, 1,393,492 B, SHA identical to R10/R11. Neither triangle reduction nor CPU Cycles proves FPS/VRAM in LIVE Studio.

## Rebuild on Windows (zero cost)

From this directory with Python 3.11+ and `numpy`, `trimesh`:

```powershell
py -m pip install numpy trimesh
$env:SAKURA_OUTPUT=(Get-Location).Path
py .\procedural_sakura_source.py
py .\validate_glb.py .\sakura_hero.glb .\sakura_hero_eco.glb
Get-FileHash .\sakura_hero.glb -Algorithm SHA256
```

For the exact reference bytes use the original ZIP: exporter dependency changes may affect byte hashes.

## Independent Cycles fixed-rig A/B — owner action

Extract `Sakura_R12_Blender_Windows_Starter.zip` **to a new directory**. It contains the 4 original GLBs (R10 palette-only, R11 final, R12 final and ECO), the checked source script and Blender validation launcher. Run from PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R12_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R12_blender.ps1 -Mode all -Samples 32 -Size 520
```

The script uses **Blender 4.5+ Cycles CPU, AgX, 0 EV, World 0.65 + 3 SUNs**, source GLB +Y to Blender +Z axes; FOV top 50°, under/3-4 44°, trunk 56°, plus 9:16 top crop. R12 Cycles **not executed** in the AI environment. Send `Sakura_R12_Blender_Evidence_Cycles.zip`; editable R12 QUALITY/ECO `.blend` created inside the result, if the run completes. Do not label Blender R12 pass before inspecting the outputs. `r10_palette_only` vs `r11_final` true R11 Cycles images are bundled for retrospective comparison only.

## Original PBR evidence and limitations

`PBR_Review/R10PAL_R11_R12_*.jpg` use same VTK native glTF PBR real-GLB imports, same gradient dusk IBL, same 3 directional lights, same 50/44/56° FOV. This is **not Blender Cycles R12**; both engines differ in IBL/energy units. Owner reference video at approximately 15 s and 33 s is not pixel-calibrated or rendered with fog/scene background. Art remains PARTIAL; native Three.js GLTFLoader, RTX 3050 Ti/3060 + LIVE Studio FPS/VRAM remain OPEN. No other V2 assets modified; PR stays Draft/not merged.
