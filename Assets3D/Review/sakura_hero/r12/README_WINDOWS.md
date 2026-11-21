# Sakura R12 — Blender Cycles quality A/B, owner Windows

SHA-256 is checked automatically before any render. The inputs are original R10 palette-only, R11 final, R12 quality and unchanged ECO GLBs. Real 3D import uses glTF materials. Keep R10/R11 source folders untouched.

Open PowerShell in this extracted folder and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R12_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R12_blender.ps1 -Mode all -Samples 32 -Size 520
```

If Blender is not automatically detected, add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with your actual path. The launcher does not use the reserved PowerShell `$HOME` variable.

Outputs are in `Blender_Evidence_R12` and `Sakura_R12_Blender_Evidence_Cycles.zip`, including two editable `.blend` sources for QUALITY/ECO. Send ZIP (and .blend separately if needed). Same Cycles CPU AgX 0EV, world 0.65, 3-SUN fixed rig, glTF+Y-to-Blender+Z axes, matched 50/44/56 FOV, plus 9:16 top framing. The AI environment could not execute Blender R12; PASS is pending your real logs and images.
