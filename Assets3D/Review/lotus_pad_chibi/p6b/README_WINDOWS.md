# P0.6b zero-cost Windows runbook: NEW male hair Blender + original Cycles A/B

Require existing full branch checkout `assets/lotus-pad-chibi-p0` and Blender 4.5.x+ on Windows. Work inside `Assets3D/Review/lotus_pad_chibi/p6b`. Original two male P06a and P02 lotus binaries are already in sibling folders; PowerShell **hash-checks** both baseline files, both new P06b files and lotus. No paid tools.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p06b_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p06b_blender.ps1 -Mode all -Samples 32 -Size 520
```
Add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` if Blender is not autodetected. Quick produces 4 cases with front/left/right/back/top quick hair diagnostics and lotus phone shot. Full overwrites quick folder and produces all views listed in `P06B_CAMERA_CONTRACT.json`, real matched existing P06a hair front/left/right/back/top/quarter and 9:16 medium+close on lotus, extra L/R 3q and low-back, plus t=0/.5/1/1.5/2 original animation frames. No rerender unchanged P06a body/hand/seat.

Four genuine `.blend` editable files, case_report.json, PNG, per-case stdout/stderr and hash manifests are generated ONLY after successful Blender execution. The runner generates a ZIP and **actually executes ZIP CRC verification in Blender Python** via `validate_p06b_zip_crc.py`; printed `[P06B_ZIP_CRC_PASS]` / ZIP SHA exists only after that. If verification fails, preserve stderr and report BLOCKED, never fake evidence. Existing original P06a owner Cycles remain available in `../p6a/P06A_Cycles_Evidence`; match exact names in `P06B_HAIR_STYLE_COMPARISON.md`.

Optional independent Node22 same-source reproduction on real P06a binary:
```powershell
node .\build_male_hair_p06b.mjs ..\p6a\meditator_male_cross_prayer_p06a.glb cross
node .\build_male_hair_p06b.mjs ..\p6a\meditator_male_kneel_prayer_p06a.glb kneel
Get-FileHash .\meditator_male_cross_prayer_p06b.glb -Algorithm SHA256
Get-FileHash .\meditator_male_kneel_prayer_p06b.glb -Algorithm SHA256
```
Expected hashes: cross `d6add5fdd5ec7122c24aee774c1ea10cc0588643842c891e334ffd30c60ce4cb`; kneel `db78a1b26bff1cd2dced82d4ed4d4255280cfb6eb3db3ea2dd5ab5b5674c0701`. This builder refuses input SHA mismatch. It never overwrites source P06a files.

**STOP:** SA reviews original new Cycles, editable Blender, raw A/B and hair/ear/temple look → owner approves BOTH male poses or requests hair-only corrections. No Codex, GPU/LIVE, integration or merge.
