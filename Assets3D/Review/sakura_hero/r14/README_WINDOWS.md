# Sakura R14 free Blender Cycles owner run

Extract the complete Windows Starter archive in a separate folder. It includes exact R13 QUALITY, R14 QUALITY and unchanged ECO GLBs plus self-contained Blender Python and PowerShell scripts. Blender 4.5+ (free) recommended.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R14_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R14_blender.ps1 -Mode all -Samples 32 -Size 520
```

Pass `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` (actual installed location) if needed. Script SHA checks sources before any render. Uses `--python-exit-code 97`, native-stderr-safe PowerShell 5.1 handling, prints traceback tails upon failure, and never assigns `$HOME`.

Full: three cases, seven views each (top, under, 3/4, trunk, full 9:16, medium 9:16, close 9:16), 32 samples, 520x603 conventional or 520x924 portrait, Cycles CPU, AgX, 0 EV, World .65, 3 SUNs fixed, real imported glTF Principled materials unmodified. Output `Sakura_R14_Blender_Evidence_Cycles.zip`, editable R14 .blend sources in the archive, JSON/PNG/log/sha. **R14 Blender is NOT TESTED until owner runs and evidence is audited.**
