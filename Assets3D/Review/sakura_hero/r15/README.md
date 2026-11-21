# Sakura Hero R15 — genuine implicit smooth-union branch prototype

**PR #1:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1, branch `assets/sakura-hero-r04-sa-review`. R14 is immutable baseline; this revision changes only the Sakura tree. **Zero paid tools, PR stays Draft, no merge or production approval.**

## R14 evidence reconciliation

SA review [#6004536603](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1#pullrequestreview-6004536603) independently checked original owner Blender 4.5.16 LTS Cycles: **3/3 cases, 21/21 PNG hashes, 32/32 ZIP-member SHA, two valid original .blend**. R14 technical Cycles PASS, ART PARTIAL, production NOT APPROVED. Its README/manifest/validation/handoff have been reconciled; original binaries remain `pending_owner_upload` to GitHub.

## P0: three actual fused parent/branch junctions

`sdf_smooth_union_forks.py` samples the original R14 twisted S-shaped trunk bark and the **three original primary branch centerlines [0,5,9]** into one signed-distance field; applies polynomial smooth-min (k=0.56m) and CPU marching cubes at 0.16m, then VTK windowed-sinc smoothing and topology-preserving decimation (~55%) ONLY to the joined woody component.

**Verified independently on local mesh:** 15,054 triangles/7,529 vertices, one connected surface, watertight, winding consistent, Euler=2, zero degenerates. This is a **true single implicit union**, not separate intersecting trunk+3 sleeves. Unfused secondary branch tubes, decorative knots and original root tubes still remain independent; the entire asset is **NOT** claimed watertight. Bark is resampled from R14 old-growth helical relief.

Twenty-three original gold fissure ribbons (414 vertices) are projected onto the new bark surface with 12mm flat surface offset to remain visible, preserving exact R14 gold PBR/emission. The largest projection is **1.083m**, hence local gold placement needs artistic review; these are **not raised cylindrical emissive wires**.

QUALITY petals have slightly varied radial rotation and nonplanar curl with the same **4 triangles/individual petal**, same layered crown density, warm pink low emissive and no mass explicit NORMAL buffers. **ECO byte-identical R14.**

| Asset | Tris | Vertices | GLB bytes | SHA256 |
|---|---:|---:|---:|---|
| R14 QUALITY | 181,314 | 224,395 | 4,877,460 | `ba3183c7b738dbd814b2b23cedc1f6da0470b13121882c116e1775154bda44f5` |
| **R15 QUALITY** | **187,368** | **227,360** | **4,985,692** | `9ad2dc4ceb807e0a60d89c8cbfdbcc26f09bd2ba190a1bb1ed09825be23f81ba` |
| ECO unchanged | 44,412 | 71,032 | 1,393,492 | `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` |

P0 local sculpt costs **+6,054 triangles (+3.34%) / +108,232 bytes (+2.22%)** versus R14; foliage triangle count not increased, no FPS conclusion.

## Executed checks vs open gates

**Executed**: GLB glTF2 real import, 11 QUALITY mesh/material, 4 doubleSided petal materials, R14/R15 exact PBR factor parity, 0 degenerate/nonfinite, no extra NORMAL attributes, watertight topology of joined 3-arm component, independent byte-identical clean rebuild QUALITY/ECO/OBJ. Real VTK 9.6.2 glTF physically based import and fixed IBL+3 lights render top/under/3-4/trunk, three junction closeups front/side/back, and all 3 portrait poses. **Not Cycles screenshots.** See `R15_SDF_TOPOLOGY_AUDIT.json` and `R15_VISUAL_GAP_ANALYSIS.md`.

**NOT RUN:** R15 actual Blender Cycles (owner Windows ZIP prepared), native Three.js GLTFLoader, RTX 3050 Ti/3060 + TikTok LIVE Studio FPS/VRAM. ART **PARTIAL**: SDF blending helps three sockets but shows triangles in closeups; other independent small branches remain. No production approval.

## Full/Medium/Close 9:16

Same cameras as R14, FOV 50° and common 9:16 sensor, geometry unchanged. FULL keeps 100% source vertices; MEDIUM **intentionally crops ~1.2201% of R15 vertices**, not a whole-tree claim; CLOSE is deliberately tighter. See `camera_contract_R15.json`.

## Free regeneration

```powershell
py -m pip install numpy scipy scikit-image vtk trimesh
$env:SAKURA_OUTPUT=(Get-Location).Path
py .\procedural_sakura_source.py
py .\validate_r15.py
```

Rebuild SHA consistency verified with Python 3.13, numpy 2.3.5, SciPy 1.17.0, skimage 0.26.0, trimesh 4.11.1, VTK 9.6.2. Cross-version OBJ/mesh byte determinism is not guaranteed.

## Owner Blender Cycles A/B

Unzip `Sakura_R15_Blender_Windows_Starter.zip` in a dedicated directory and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R15_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R15_blender.ps1 -Mode all -Samples 32 -Size 520
```

Full mode SHA-gates all 3 GLBs, renders **R14/R15/ECO, 10 fixed views each** including **three separate close fork angles** and FULL/MEDIUM/CLOSE portrait, with AgX 0EV, World 0.65 + 3 SUN lights, saves original editable R15 QUALITY/ECO .blend, case JSON and ZIP hashes. **R15 Cycles is PENDING actual owner output**. Binaries/VTK images have exact SHA handoff at `BINARY_HANDOFF.md`, not pushed to repository.
