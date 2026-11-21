> **Verified update, 2026-11-21 (supersedes pre-owner-run checkpoints):** Blender 4.5.16 LTS Cycles CPU R12 completed: four cases, 20 PNGs, 34/34 ZIP hashes, original two .blend structures and SHA independently SA reviewed. **Technical Blender PASS; visual ART PARTIAL; production NOT APPROVED.** R12 original binary GitHub upload still `pending_owner_upload`. See [R12_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md](R12_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md). Native Three.js and GPU/LIVE Studio NOT RUN.\n\n# Sakura Hero R12 — controlled zero-cost geometry candidate

**PR #1:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1  
**Branch:** `assets/sakura-hero-r04-sa-review` · **Sakura only** · Draft · no production approval.

## Verified R11 basis
SA independently validated 9/9 owner Cycles A/B cases and 22/22 PNGs. The primary color fix is R11 reduced emission + warmer rose albedo. `r10_palette_only` showed color almost equivalent to R11 final without the large petal NORMAL cost. The stale R11 README, manifest, validation and handoff metadata were reconciled to mark Blender R11 executed, while binary `pending_owner_upload` remains unchanged.

## R12 new geometry
- QUALITY: truly altered asymmetric shallow-cupped floral geometry, 4 triangles per petal (single sheet + glTF doubleSided), fewer isolated dangling clusters and deeper bloom layering. No explicit glTF NORMAL attributes in 11-mesh, 11-material QUALITY.
- QUALITY-only bark: revised winding shaft and buttress radius, branch tangent paths, curved roots, flutes and embedded gold creases. Not an exact video 33s match and not a boolean-fused tree.
- ECO: exact checksum carry-forward from R10/R11, **never claim ECO redesign**.

| Asset | Triangles | Vertices | Bytes | SHA-256 |
|---|---:|---:|---:|---|
| QUALITY R12 | 182,674 | 226,267 | 4,916,248 | `0e1f656c74a3f7860cb640395d95cebdb852d7e1269f1463e04408aa6bc8bb25` |
| ECO R12 | 44,412 | 71,032 | 1,393,492 | `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` |

QUALITY R11 was 188,782 triangles and 7,599,884 bytes. R12 saves 6,108 triangles (3.235%) and 2,683,636 bytes (35.312%). No evidence of GPU FPS/VRAM improvement has been measured.

## Local source regeneration
```powershell
py -m pip install numpy trimesh
$env:SAKURA_OUTPUT=(Get-Location).Path
py .\procedural_sakura_source.py
py .\validate_glb.py .\sakura_hero.glb .\sakura_hero_eco.glb
```
Original ZIP exports are checksum-referenced; different trimesh versions can alter binary serializations.

## Blender Windows verification
Extract `Sakura_R12_Blender_Windows_Starter.zip`, open PowerShell in the extracted folder. It contains original exact R10 palette-only, R11 final, R12 QUALITY and ECO GLBs, scripts and reference camera/lighting rig:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R12_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R12_blender.ps1 -Mode all -Samples 32 -Size 520
```
Optional `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` if auto discovery fails.
The script verifies GLB SHA, imports PBR Principled materials, saves two actual editable R12 .blend files, produces 5 camera shots per case (including 9:16 aerial) and case JSON/logs. Same **Cycles CPU, AgX, 0 EV, World 0.65 + 3 SUNs**. Correct glTF Y-up → Blender Z-up axes. **Owner independently executed R12 Cycles on Windows; this separate AI environment has not rerendered**. Owner should upload `Sakura_R12_Blender_Evidence_Cycles.zip`.

## Final gates
VTK PBR 3-model shots are not Blender footage. See `R12_VISUAL_GAP_ANALYSIS.md`, `asset_manifest.json` and `BINARY_HANDOFF.md`. Native glTF/Three.js and owner RTX+LIVE Studio FPS/VRAM remain OPEN. Large binaries not committed; preserve R10/R11 original files.
