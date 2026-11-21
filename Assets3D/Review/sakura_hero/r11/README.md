# Sakura Hero R11 — controlled material/geometry art prototype

**PR:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1; branch `assets/sakura-hero-r04-sa-review`. Sakura tree only, zero cost; NOT approved for production. R04–R10 preserved.

## SA R10 decision used
Review #6003449385 confirms real Blender 4.5.16 LTS Cycles CPU import/render PASS for R10 QUALITY/ECO; owner-supplied original two .blend bytes independently hashed and parsed. It does NOT mean R10 appearance or native Three.js passed. Cycles showed nearly-white pink QUALITY aerial, sharp petals and tubular branches.

## R11 delta
- **QUALITY colors:** less pale, warmer/lower-albedo four petal materials; petal PBR emissive factors reduced from `[.30,.17,.18]` to `[.045,.018,.024]`. Canopy core emission similarly reduced from `[.20,.09,.12]` to `[.025,.01,.014]`. Blender lighting and exposure are NOT changed for the main R10/R11 A/B.
- **QUALITY geometry:** replace spiky lip with a curved oval fan using EXACT same 4 triangle faces/petal; reduce exaggerated outer-lobe warp and edge petal scale; encode native glTF NORMAL on all four petal materials with verified orientation; selective bark flute amplitude tweak while retaining recessed gold fissures. Branch junctions and roots remain stylized, NOT final art.
- **ECO unchanged:** byte-identical R10/R09 ECO, validated SHA. No global polygon increase.
- **Cost caveat:** NORMAL attributes add ~2.5 MB to QUALITY GLB (+49.133%) despite same triangles/vertices. This memory/bandwidth tradeoff needs owner GPU/Three.js review; do not claim FPS benefit.

## Independent A/B matrix
For exact light/camera/exposure parity, *test original glTF files* with `blender_ab_validate_r11.py` using `run_sakura_R11_blender.ps1`.
- R10 original; R10 emissive-only changed; R10 albedo-only changed; R10 both changed (palette-only)
- R11 geometry+normal-only under R10 material settings; R11 final; ECO unchanged
- Two separate controls on **R10 original**: Blender Standard vs AgX; 75% world-and-sun intensity vs original dusk rig

A/B diagnostic GLBs use unchanged mesh positions/faces and verified material changes. No Photoshop or post-render color correction. `build_ab_diagnostics.py` regenerates them.

## Rebuild free 3D geometry locally
```powershell
py -m pip install numpy trimesh vtk pillow
$env:SAKURA_OUTPUT=(Get-Location).Path
py .\procedural_sakura_source.py
py .\build_ab_diagnostics.py
py .\validate_glb.py .\sakura_hero.glb .\sakura_hero_eco.glb
```
The A/B builder expects R10 original GLB in sibling `..\r10\sakura_hero.glb`. Using the original supplied binary rather than a new exporter is important for exact checksums.

## Cycles checkpoint — executed and verified for R11 (commands preserved for reproduction)
Extract `Sakura_R11_Blender_AB_Windows_Starter.zip`, open PowerShell in its folder:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R11_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R11_blender.ps1 -Mode all -Samples 32 -Size 520
```
Launcher first verifies all input SHA-256s. Then imports actual GLBs in Blender 4.5+, uses Cycles CPU and the *same* 50° top / 44° under / 44° three-quarter / 56° trunk cameras. It saves a real editable `.blend` for R11 QUALITY and unchanged ECO. See `R11_BLENDER_AB_CONTRACT.md`. Submit `Sakura_R11_Blender_Evidence_AB.zip` plus both `.blend` files separately. The quick test does **not** include every diagnostic condition; use `-Mode all` for full matrix.

## Visual proof status
Native VTK PBR on actual GLB: **executed** and images in `PBR_Review` compare four controlled combinations. R11 richer rose color in this rig, but flower sheets can read as larger flat tiles, so genuine Blender images have now been inspected: color improves, but petal tiles remain hard and art is PARTIAL. Referenced video ~15s/~33s is not camera-calibrated; scene fog and petals are external to this tree asset.

No Blender R11, native Three.js glTFLoader test, RTX 3050 Ti/3060 GPU + LIVE Studio benchmark or production acceptance claimed. PR remains DRAFT.

## Verified post-execution status (supersedes historical pre-run wording)

**2026-11-21 post-execution correction:** Owner and SA independently verified Blender 4.5.16 LTS Cycles CPU R11 A/B: 9/9 cases completed, 22/22 PNGs matching case reports, 50/50 physical ZIP members matching SHA list; 32 spp, 520×603, AgX 0 EV, World strength 0.65, three Sun lights except isolated controls. Original standalone QUALITY .blend: 15,303,787 bytes, SHA-256 `f5f871d1c2b6c8cab7d687f844c3eed021c60d66f0e94fe497a5c9ad839451ea`; ECO .blend: 3,936,772 bytes, SHA-256 `71a8c3b9346c008bbce383eef2daaebdf7d3139d6cab518cac2f0ca918c68edb`. Blender import/render and file structure PASS; **art PARTIAL, Three.js/GPU/production NOT APPROVED**. Large GLB/OBJ/media listed here remain `pending_owner_upload` unless exact bytes are verified on GitHub. Blender evidence originally supplied in owner's ZIP and .blend attachments, not uploaded by this revision. See `R11_BLENDER_CYCLES_AB_OWNER_EVIDENCE_AUDIT.md`.
