# Sakura R09 — owner-operated Blender/Cycles PBR checkpoint (no R10 yet)

**Purpose:** independently import and render the EXACT reviewed R09 QUALITY and ECO GLBs, validate imported glTF Principled materials, produce editable .blend source and return provenance-rich logs, PNGs and JSON for AI Visual and SA. This is a supplementary validation file OUTSIDE the immutable `r09/` revision, not a new geometry asset.

**Status:** NOT RUN HERE (Blender is unavailable in the AI environment). No Blender PASS, Three.js PASS, GPU FPS claim or production approval.

- Branch: `assets/sakura-hero-r04-sa-review`
- Reviewed geometry commit: `37a4fab9e0ab4ac85da62dcb63a82cf4076ed358`
- Original script: `../r09/blender_import_validate.py`
- Launcher: `run_sakura_R09_blender.ps1`
- Official free Blender: https://www.blender.org/releases/4-5/ (4.5 LTS recommended for this R09 script; other versions unverified).

## Input files and SHA-256

Both files must sit BESIDE the launcher and original Blender script:

| Filename | Bytes | SHA-256 |
|---|---:|---|
| `sakura_hero.glb` | 5028124 | `e68a479a2ea4705d711702e015ef290c72757cca107a261913d4988d5ae9bbc8` |
| `sakura_hero_eco.glb` | 1393492 | `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` |

Do not substitute regenerated GLBs with mismatched checksums. AI Visual separately delivered a standalone Windows ZIP that groups the two original GLBs, original Blender script, this launcher and `README_WINDOWS.md`.

## PowerShell from the extracted standalone ZIP folder

Open File Explorer in the folder, type `powershell` into the address bar, Enter.

First do a fast single-preset smoke test:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R09_blender.ps1 -Variant quality -Samples 8 -Size 320
```

Then run full both-variant test with documented Cycles CPU dusk lighting:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R09_blender.ps1 -Variant all -Samples 32 -Size 520
```

If auto-detection fails, supply the **actual** Blender executable path:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R09_blender.ps1 -BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe' -Variant all -Samples 32 -Size 520
```

This launcher checks original model SHA-256 and byte sizes **before launching Blender**; aborts on mismatch, invokes `blender_import_validate.py` with `--background --factory-startup --python-exit-code 3`, saves logs, checks expected PNG/JSON/.blend outputs and source report hashes.

## Expected outputs

- `Blender_Evidence_R09/QUALITY/sakura_hero_r09_quality.blend`
- `Blender_Evidence_R09/ECO/sakura_hero_r09_eco.blend`
- `Blender_Evidence_R09/QUALITY/r09_quality_*_blender_cycles.png` (top, 3/4, under, trunk)
- `Blender_Evidence_R09/ECO/r09_eco_*_blender_cycles.png` (top, 5 aerial positions, 3/4, under, trunk)
- `Blender_Evidence_R09/{QUALITY,ECO}/r09_*_blender_report.json`
- `Blender_Evidence_R09/blender_{quality,eco}_{stdout,stderr}.log`
- `Sakura_R09_Blender_Evidence.zip` (screenshots/JSON/logs ONLY; no large .blend).

**Owner returns:** the small evidence ZIP and both .blend files, or if failed, stdout/stderr logs + screenshot of error. AI Visual will compare same-engine screenshots, inspect discrepancies and fix script if needed before any R10 geometry revision.

## Controlled light and acceptance boundary

The original R09 Blender script uses `CYCLES` CPU, original glTF-imported Principled materials without a Phong override, a world color `(.69,.47,.60)` / strength `0.65`, three Sun lights (key/rim/lower-fill), 0 EV exposure, perspective views including top FOV 50°, under 44°, trunk 56°. Its Cycles sky/light values are **not numerically equal** to the prior VTK image-based-lighting environment.

A successful run demonstrates reproducible Blender import/render at this lighting setup, **not** visual acceptance, native Three.js parity, 4GB/8GB VRAM/FPS or TikTok LIVE Studio readiness. Do not merge PR #1 or mark any pending binary as uploaded simply because an owner-run ZIP exists.

**No R04–R09 asset/source files modified. R10 not yet created. Paid services: 0 VND.**
