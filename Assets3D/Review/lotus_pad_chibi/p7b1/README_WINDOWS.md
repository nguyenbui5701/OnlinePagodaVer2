# P07b1 real Cycles handoff — Windows PowerShell (non-destructive)

Original PR #2 stays Draft. Target branch `assets/lotus-pad-chibi-p0`. In local checkout at repository root:
```powershell
git fetch origin
git switch assets/lotus-pad-chibi-p0
git pull --ff-only origin assets/lotus-pad-chibi-p0
cd Assets3D/Review/lotus_pad_chibi/p7b1
node .\validate_p07b1_glb.mjs
.\run_p07b1_blender.ps1 -Mode smoke -Samples 16 -Size 720
```
Both GLBs and the original P0.2 lotus **MUST SHA-match** runner before any render. Blender 4.5.16 LTS is prior owner reference; free Blender 4.5+ CPU supported. If `blender.exe` not on PATH, use `-BlenderPath "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"` with the actual installed path.

**Mandatory cheap art gate:** open all new `P07B1_Smoke_Evidence/` images, particularly cross front/top/left3Q/right3Q and original lotus 720×1280 medium and kneel front + medium. Compare existing P06c, accepted P07a1 and ART PARTIAL P07b Cycles; don't execute any older P Blender. If 7/3 does NOT look different without labels, if exposed skin at part/hairline or ear/collar clipping, **STOP** and report to SA; do not run full.

After genuine art smoke acceptance ONLY:
```powershell
.\run_p07b1_blender.ps1 -Mode all -Samples 32 -Size 720 -ArtSmokeAccepted
```
Exactly **FOUR new real GLB→Cycles cases**: `p07b1_cross_actor`, `p07b1_cross_pair`, `p07b1_kneel_actor`, `p07b1_kneel_pair`. Source Blender `blender_p07b1_cycles.py` always imports the actual exported new GLBs; pairs import original SHA-pinned `p5f/p02_baseline/lotus_pad_01.glb`. Full new-only output: `P07B1_Cycles_Evidence/` with four `.blend` editable scenes, PNGs, case_report.json, image+blend hashes and stdout/stderr; original lotus 720×1280 medium/close; 5 idle frames 0/.5/1/1.5/2.0s; `P07B1_SIDE_PART_73_Blender_Cycles_Evidence.zip` and real `P07B1_ZIP_CRC_stdout.log` + stderr.

**Safe protocol:** existing target output folder/ZIP/log => STOP instead of deletion or silent overwrite. Historical `p6c/`, `p7a1/`, `p7b/` unchanged; no older Blender calls, Codex/integration/merge. Upload only new P07b1 evidence to same Draft PR (Git LFS for large binaries if needed). Then **STOP FOR SA RE-REVIEW AND OWNER ART ACCEPTANCE**.
