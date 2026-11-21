# Sakura Hero R13 Windows Blender Cycles proof

Use only the free Blender 4.5+ application. The starter ZIP contains exact SHA-pinned three GLBs: `r12_quality.glb` (baseline), `sakura_hero.glb` (R13), `sakura_hero_eco.glb` (R12 ECO unchanged), `blender_ab_validate_r13.py`, reference lighting rig and launcher.

Extract to a dedicated Windows folder and run:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R13_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R13_blender.ps1 -Mode all -Samples 32 -Size 520
```
If Blender cannot be auto-found, add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with your actual path. Both runs SHA-check source GLBs. Full mode clears the previous quick evidence folder to avoid stale hashes and renders **6 poses each**: `top`, `three_quarter`, `under`, `trunk_33s`, `hero_full_9x16` and `hero_close_9x16`. Standard shots 520×603; portrait 520×924. Same Cycles CPU 32 samples, AgX 0 EV, World 0.65 + SUNs (2.10, 1.05, .72), same glTF materials/no Phong overrides.

Outputs: `Sakura_R13_Blender_Evidence_Cycles.zip` containing JPEG? **No — original PNGs**, JSON reports, stdout/stderr logs, SHA list, and two editable R13 QUALITY/ECO .blend (no .blend1). Send the archive for independent SA review; optionally send .blend separately. **The script has not been executed on this AI environment.** The 9:16 full frame keeps all R12/R13 projected vertices; close is intentionally cropped.
