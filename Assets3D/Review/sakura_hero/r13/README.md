> **Post-execution status (2026-11-21):** SA independently verified owner R13 Blender/Cycles **3/3 cases and 18/18 PNGs PASS**, plus two original `.blend` files and 29/29 archived SHA checks. **ART PARTIAL; production NOT APPROVED**; GitHub large binaries remain `pending_owner_upload`. This supersedes the historical pre-run checklist below. See [R13_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md](R13_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md).

# Sakura Hero R13 — old-growth sculpt and 9:16 full-tree test

**PR #1:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1 · Branch `assets/sakura-hero-r04-sa-review` · zero-cost · **DRAFT / NOT PRODUCTION APPROVED**.

## Baseline and R12 evidence

SA review #6004186709 independently confirmed the owner's original **Blender 4.5.16 Cycles CPU R12**: 4/4 cases, 20/20 PNG checksums, 34/34 ZIP member SHA-256s and original two `.blend` files. R12's quality asset remains the preferred warm, compact baseline. R12 README, manifest, validation and handoff were updated to show **owner Cycles PASS**, while the large binary files remain `pending_owner_upload` on GitHub. See `r12/R12_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md`.

## R13 actual changes

- **QUALITY trunk:** larger asymmetrical S-bend; low-frequency helical displacement of actual bark vertices; 11 local radial branch collars deformed into the continuous trunk surface; root buttress collars under roots, altered root taper/curve and gentler branch exit tangents. **Not a watertight Boolean union**; secondary tubular branches can still intersect and need artistic review. Golden strips remain in geometry grooves, never raised luminous wire geometry.
- **QUALITY blossom:** preserve R12 layered lobes and R11 warm/reduced-emissive palette, keep **4 triangles per single-sheet petal** and `doubleSided`; round tip outline gently with the same vertex count; reduce detached hanging flower groups 11→7. No explicit petal `NORMAL` arrays.
- **ECO:** byte-for-byte unchanged R12 SHA. No ECO improvement claimed and no density inflation.

| Asset | Triangles | Vertices | Mesh/material | Bytes | SHA-256 |
|---|---:|---:|---|---:|---|
| R12 QUALITY baseline | 182,674 | 226,267 | 11/11 | 4,916,248 | `0e1f656c74a3f7860cb640395d95cebdb852d7e1269f1463e04408aa6bc8bb25` |
| R13 QUALITY | 181,694 | 224,909 | 11/11 | 4,888,192 | `5e03020ac3160d6746b96715254e37290d140a1e7b3cee00708a105d2955e840` |
| R13 ECO (R12 reused) | 44,412 | 71,032 | 10/10 | 1,393,492 | `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` |

QUALITY −980 triangles (−0.54%), −1,358 vertices (−0.60%) and −28,056 bytes (−0.57%) versus R12. No verified FPS/VRAM impact.

## 9:16 hero camera contract

`camera_contract_R13.json` and `fit_hero_camera.py` use all vertex positions in the actual **R12 and R13 GLBs** and a shared perspective camera: position (24.6415,38.8250,54.1391), target (0.15,12.4,0), vertical FOV 50°, 9:16, 14% normalized-device-coordinate edge margin. Max horizontal NDC magnitudes 0.8600 (R12) / 0.8598 (R13); **all vertices in full-tree portrait frame**. The older `hero_close_9x16` deliberately uses the R12 top camera and **crops** left/right as a detail shot. Same pose and rig for each R12/R13 comparison; no per-case auto zoom.

## Executed tests here

Original GLB import `trimesh`, glTF 2.0 + petal material attributes, zero-area/NaN checks and clean byte-exact rebuild of GLB QUALITY/ECO plus OBJ: **PASS**. VTK native glTF PBR (synthetic dusk IBL + 3 scene lights, no Phong override) executed on actual R12/R13 GLBs for top, under, trunk 33s, 3/4 and both 9:16 poses. R13 trunk is visually more swept, but flower edge/tile silhouette and branch junctions remain **ART PARTIAL**. Owner video 15s/33s comparisons are camera approximations, not calibrated image matches.

**R13 Blender Cycles has NOT been executed** in this environment: use Windows package and send `Sakura_R13_Blender_Evidence_Cycles.zip` with actual `.blend` files. Do not confuse verified R12 Cycles with unexecuted R13. Native Three.js GLTFLoader and RTX 3050 Ti/RTX 3060 with TikTok LIVE Studio FPS/VRAM **NOT RUN**, production **NOT APPROVED**.

## Free regeneration and Windows verification

```powershell
py -m pip install numpy trimesh vtk pillow
$env:SAKURA_OUTPUT=(Get-Location).Path
py .\procedural_sakura_source.py
py .\validate_glb.py .\sakura_hero.glb .\sakura_hero_eco.glb
```

Extract `Sakura_R13_Blender_Windows_Starter.zip` into its own folder. Open PowerShell there:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R13_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R13_blender.ps1 -Mode all -Samples 32 -Size 520
```

`-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` is supported if Blender isn't detected. The script SHA-verifies three source GLBs, imports actual Principled materials, uses **Cycles CPU, AgX 0 EV, World 0.65, SUN KEY 2.10/RIM 1.05/LOWER 0.72** and the corrected Y-up→Z-up coordinates. Full mode makes 6 camera PNGs/case (including full-tree and close 9:16), JSON/log/hash manifest and editable R13 QUALITY/ECO `.blend`. **R13 Cycles PASS must wait for real owner output.**
