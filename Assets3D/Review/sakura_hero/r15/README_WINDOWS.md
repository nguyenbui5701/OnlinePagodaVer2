# Sakura Hero R15 — FREE Windows Blender Cycles A/B

This ZIP includes original input source GLBs **R14 QUALITY**, **R15 QUALITY**, and **unchanged ECO** with SHA checks, Python Blender scene builder and PowerShell launcher. There is no Blender R15 PASS until you actually run these steps.

Open PowerShell inside the extracted ZIP folder (not the original r14 directory):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R15_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R15_blender.ps1 -Mode all -Samples 32 -Size 520
```

Optional `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` adjusted to the actual installed version. R15 script uses Blender `--python-exit-code 97`, captures true stdout/stderr, avoids Windows PowerShell 5.1 `$HOME` conflict and does not false-pass on Python exceptions.

**Full run:** 3 cases x 10 fixed views, including `fork_front`, `fork_side`, `fork_back` on **R14 and R15 under EXACT SAME camera/FOV/lighting/exposure**, plus top/under/three-quarter/trunk/full/medium/close portrait. Blender 4.5.16 LTS CPU Cycles, AgX 0EV, World 0.65 + three Sun lights, 32 samples, 520x603 conventional / 520x924 portrait. Import actual GLBs preserving Principled PBR material values. ECO source SHA unchanged.

Output: `Sakura_R15_Blender_Evidence_Cycles.zip` plus editable `Blender_Evidence_R15/r15_final/sakura_hero_r15_quality.blend`, `Blender_Evidence_R15/eco_unchanged/sakura_hero_r15_eco.blend`. Send original ZIP/.blend to AI Visual/SA for exact independent SHA, completion marker and visual check. If blender.exe writes a traceback, send its `*_stderr.log`. The launcher clears previous quick evidence directory for a clean full run.

**No paid services. No impact on V1, people, Event Engine, lotus, live application. No merge.**
