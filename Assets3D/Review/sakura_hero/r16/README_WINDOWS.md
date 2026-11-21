# Sakura Hero R16 — owner Windows Blender Cycles validation

**Requires free Blender 4.5+ and PowerShell 5.1+.** Input files in this package are SHA-exact R15 QUALITY, R16 QUALITY and unchanged ECO GLB. The launcher checks hashes first and calls the correct R16 script (`blender_ab_validate_r16.py`) with `--python-exit-code 97`. It preserves native stdout/stderr logs even if PowerShell 5.1 treats Blender stderr as an error.

Extract ZIP to its own folder, open PowerShell in that folder and run:

```
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R16_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R16_blender.ps1 -Mode all -Samples 32 -Size 520
```

Optional `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with real installed path. Quick tests R15/R16 and 5 cameras (fork front/side/back, under, trunk). Full tests R15/R16/ECO on **10 matched views/case** including TOP, three-quarter, FULL/MEDIUM/CLOSE portrait. It uses real glTF Principled materials, **Cycles CPU 32 samples, AgX 0EV, World .65 and 3 SUNs**, same FOV, lighting and camera per case; generates `Sakura_R16_Blender_Evidence_Cycles.zip`, JSON SHA reports, PNGs and original R16 editable `sakura_hero_r16_quality.blend`/`sakura_hero_r16_eco.blend`.

**R16 Blender has not been run in the AI environment; submission of real owner output required for technical Cycles PASS.** Preserve evidence ZIP and both original BLEND files, do not send only screenshots. R15 owner Cycles already passed and does not need to be rerun separately.
