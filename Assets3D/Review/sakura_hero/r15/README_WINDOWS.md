# Sakura R15 — free Windows Blender/Cycles proof

Extract the provided starter ZIP into a new folder with `r14_quality.glb`, `sakura_hero.glb` (R15 QUALITY), `sakura_hero_eco.glb` (unchanged), `run_sakura_R15_blender.ps1` and `blender_ab_validate_r15.py`.

Run PowerShell in that extracted folder:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R15_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R15_blender.ps1 -Mode all -Samples 32 -Size 520
```

If Blender not auto-detected, append `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` (adjust executable path). The SHA-gated launcher preserves actual Blender native stderr/stdout and uses `--python-exit-code 97`; it will not falsely PASS if Python fails.

**10 shared cameras/case:** top, under, three_quarter, trunk_33s, fork_front, fork_side, fork_back, hero_full_9x16, hero_medium_9x16 (deliberately clips outer crown), hero_close_9x16. Three cases `r14_baseline`, `r15_final`, `eco_unchanged`. Cycles CPU 32 samples, AgX 0 EV, World strength .65 and 3 identical Sun lights, same PBR import, 520×603 regular and 520×924 portrait. QUICK runs the three fork shots + top + medium for R14 and R15.

Outputs `Sakura_R15_Blender_Evidence_Cycles.zip`, JSON/PNG/logs/SHA list, editable `sakura_hero_r15_quality.blend` and `sakura_hero_r15_eco.blend` inside evidence folders. Submit originals for SA audit. **No Blender R15 PASS exists before actual owner execution.** No paid services or unrelated application changes.
