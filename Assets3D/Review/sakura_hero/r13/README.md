# Sakura Hero R13 — old-growth sculpt and 9:16 full-tree test

**PR:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1 — branch `assets/sakura-hero-r04-sa-review`. **Draft / Sakura ONLY / Zero cost / NOT production-approved.**

## R12 baseline
SA review [#6004186709](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1#pullrequestreview-6004186709) independently checked original R12 owner-run Blender 4.5.16 LTS Cycles CPU evidence: 4/4 cases, 20/20 PNG, 34/34 ZIP SHA, both .blend binary SHA and valid structure. R12 was art PARTIAL. Its documentation now records R12 Cycles technical PASS while original binary GitHub upload remains pending.

## Actual R13 QUALITY sculpt
1. S-curve ancient trunk shaft, two direction reversals, local collars displaced into the original continuous bark surface around 11 main branch attachment points and 11 buttress roots. Stronger physically modeled helical wood grain, different root curves/tapers and slower branch departure. Gold remains surface-coplanar with recessed bark grooves, not raised emissive tubes. **Branches still intersect; not a watertight Boolean union.**
2. Four-triangle-per-petal cupped arc softened at tip. Same R12 multiple blossom tiers and preserved warm R11 palette / reduced emission. Detached twig flowers reduced from 11 clusters to 7; no explicit glTF NORMAL buffers, no blanket density increase.
3. ECO exact R12 carry-forward, no claimed ECO art improvement.

| Asset | Triangles | Vertices | Mesh/material | GLB bytes | SHA-256 |
|---|---:|---:|---|---:|---|
| R12 QUALITY | 182,674 | 226,267 | 11/11 | 4,916,248 | `0e1f656c74a3f7860cb640395d95cebdb852d7e1269f1463e04408aa6bc8bb25` |
| R13 QUALITY | **181,694** | **224,909** | 11/11 | **4,888,192** | `5e03020ac3160d6746b96715254e37290d140a1e7b3cee00708a105d2955e840` |
| R13 ECO | 44,412 | 71,032 | 10/10 | 1,393,492 | `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` |

QUALITY saves 980 triangles (0.54%), 1,358 vertices (0.60%) and 28,056 bytes (0.57%) versus R12. NO FPS inference.

## Two separate 9:16 cameras
- `hero_full_9x16` uses the same math-fitted perspective for R12 and R13: Y-up position (24.6415058544, 38.8250457903, 54.1391182045), target (0.15,12.4,0), vertical FOV 50°, 9:16. All crown/root vertices fit inside horizontal NDC ±0.86 (14% margin). The whole wide tree necessarily occupies less portrait height.
- `hero_close_9x16` uses R12 top position (3,54,10), target (0,13.5,0), FOV 50° and intentionally crops canopy edges for petal detail. Same setup for each model, no per-case zoom. Camera derivation and exact projected extent in `camera_contract_R13.json` and `fit_hero_camera.py`.

## Executed vs pending evidence
- **EXECUTED:** genuine exported GLB imported into trimesh and VTK native PBR, zero nonfinite/degenerate geometry, glTF doubleSided and no NORMAL attributes, byte-identical clean rebuild of both GLBs and OBJ. Matched VTK synthetic dusk IBL + 3 lights render top/under/3/4/trunk/full+close 9:16.
- **PREVIOUSLY EXECUTED:** R12 owner-run Blender Cycles, independently reviewed by SA.
- **NOT EXECUTED FOR R13:** Blender Cycles comparison (Windows script included), native Three.js GLTFLoader, RTX 3050 Ti/3060 with TikTok LIVE Studio FPS/VRAM. R13 artistic quality remains PARTIAL, not production-approved. VTK shots are not Blender screenshots, and video 15/33s is not camera-calibrated.

## Regenerate for free
```powershell
py -m pip install numpy trimesh
$env:SAKURA_OUTPUT=(Get-Location).Path
py .\procedural_sakura_source.py
py .\validate_glb.py .\sakura_hero.glb .\sakura_hero_eco.glb
```

## Owner Windows Blender Cycles
Extract the supplied `Sakura_R13_Blender_Windows_Starter.zip` and open PowerShell there:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R13_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R13_blender.ps1 -Mode all -Samples 32 -Size 520
```
The launcher SHA-checks R12 QUALITY, R13 QUALITY and unchanged ECO then renders six fixed views per case under Blender Cycles CPU, AgX 0EV, World 0.65 and 3 SUNs, and saves R13 .blend files and case reports. **R13 Blender evidence is pending the owner's actual run.** Binary/media handoff is `BINARY_HANDOFF.md`; GitHub upload statuses remain pending.
