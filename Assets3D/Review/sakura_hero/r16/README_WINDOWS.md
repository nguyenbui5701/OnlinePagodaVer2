# Sakura R16 — original 10-view Blender Cycles owner validation

Extract the full `Sakura_R16_Blender_Windows_Starter.zip` in a new Windows folder. It contains exact `r15_quality.glb`, `sakura_hero.glb` (R16) and unchanged `sakura_hero_eco.glb`. The PS1 checks all three SHA-256 **before** calling Blender; never assigns reserved PowerShell `$HOME`, requests `--python-exit-code 97`, captures full stderr/stdout and will fail if the underlying Python raises an exception.

Run in PowerShell:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R16_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R16_blender.ps1 -Mode all -Samples 32 -Size 520
```
If auto-detect fails, add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with your actual executable.

Quick mode tests R15 baseline/R16 final at fork_front, fork_side, fork_back, under, trunk_33s (5 views/case). Full tests R15/R16/ECO with identical 10 cameras and lighting (incl. FULL–MEDIUM–CLOSE 9:16): same native glTF Principled materials, Cycles CPU/AgX/0 EV/World 0.65/three SUNs, 32 samples, 520×603 regular and 520×924 vertical.

Expected `Sakura_R16_Blender_Evidence_Cycles.zip` contains SHA list, source GLB checksums, case JSON, PNGs and logs; two original editable `sakura_hero_r16_quality.blend` and `sakura_hero_r16_eco.blend` created under R16 evidence directories. **These output files do not exist before owner executes Blender.** Send exact evidence ZIP and original .blend for independent SA review; R16 Cycles has not been run or approved.
