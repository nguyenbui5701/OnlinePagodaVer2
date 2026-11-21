# Sakura R13 — Windows Blender Cycles evidence launcher

The package contains exact three GLBs: `r12_quality.glb`, `sakura_hero.glb` (R13 QUALITY), `sakura_hero_eco.glb` (identical R12 ECO), plus fixed Blender reference lighting rig and six-camera A/B script.

Install free Blender 4.5+ and open PowerShell in this extracted package folder. Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R13_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R13_blender.ps1 -Mode all -Samples 32 -Size 520
```

If not found, add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'`, adjusting version/path. Script validates SHA-256 before rendering, then calls Blender in background CPU Cycles. `all` mode overwrites prior quick evidence in `Blender_Evidence_R13` to avoid stale hash mixing. It writes `Sakura_R13_Blender_Evidence_Cycles.zip`; both editable `.blend` will be inside the evidence directory and normally inside ZIP (no `.blend1`). Send the ZIP; if upload size prevents it, send ZIP + the original `.blend` separately. Do not send an old R12 ZIP as R13 evidence.

- `r12_baseline` vs `r13_final`: same glTF import, AgX, exposure 0 EV, World strength 0.65, three SUN lights, 32 samples, camera/focal length/FOV/contrast identical.
- Views: `top`, `three_quarter`, `under`, `trunk_33s`, `hero_full_9x16` (all crown+roots), `hero_close_9x16` (close crop). 520×603 ordinary shots, 520×924 portrait.
- `eco_unchanged`: exact old GLB SHA, only verifies reproducible ECO rendering.

**Limit:** R13 rendering and art sign-off remain NOT RUN/PENDING until you actually execute this and submit generated images/logs. Native Three.js and runtime GPU tests are different gates. Paid services: none.
