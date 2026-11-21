# Sakura Hero R14 — Blender Windows A/B launcher

Extract this ZIP into a new folder. It contains exact original R13 QUALITY, actual R14 QUALITY and unchanged ECO GLBs, SHA-gated PowerShell launcher and a self-contained Blender Python render script. Blender 4.5+ free edition recommended.

From Windows PowerShell in this folder:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R14_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R14_blender.ps1 -Mode all -Samples 32 -Size 520
```

If executable auto detection fails use `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with your actual path. Script does not overwrite reserved `$HOME`; native Blender stderr is captured without PowerShell 5.1 masking a Python traceback. `--python-exit-code 97` preserves failure status. On failure the script prints stdout/stderr tails.

Full mode: 3 cases (`r13_baseline`, `r14_final`, `eco_unchanged`) × 7 views each (top, under, three-quarter, trunk_33s, full 9:16, medium 9:16, close 9:16), 32 samples, 520px width. Cycles CPU + AgX, exposure 0 EV, fixed World .65, Sun keys 2.10/1.05/.72, glTF Principled nodes unchanged. It writes `Sakura_R14_Blender_Evidence_Cycles.zip`, with two new `.blend` sources and case reports. Send ZIP for independent checksum/visual evaluation. Do NOT say Blender R14 PASS until outputs are actually inspected.
