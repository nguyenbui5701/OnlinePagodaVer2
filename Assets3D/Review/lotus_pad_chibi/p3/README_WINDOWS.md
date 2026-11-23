# P0.3 Windows Blender/Cycles hair and portrait A/B

Zero-cost Blender 4.5+ on Windows. Extract the owner ZIP into a clean directory containing the four exact SHA-locked GLBs: `p02_baseline/lotus_pad_01.glb`, `p02_baseline/meditator_base.glb`, `lotus_pad_01.glb` (SAME P0.2 leaf), `meditator_base.glb` (NEW P0.3 hair). Do NOT copy old P0.1 binaries here.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p03_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p03_blender.ps1 -Mode all -Samples 32 -Size 520
```

If Blender is not auto-discovered add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` (adjust version). Uses PowerShell stderr capture and Blender `--python-exit-code 97`, so a true Python error cannot accidentally be marked PASS. **Full clears quick evidence directory before running**. Output `P03_LOTUS_CHIBI_Blender_Cycles_AB_Evidence.zip` with PNGs/JSONs/logs/SHA list, and two editable p0.3 `.blend` projects saved under actor/pair cases. The pair `.blend` is review-only, not a third runtime asset. The P0.2 leaf `.blend` already exists as owner saved source on PR; do not overwrite.

Use original unmodified GLB materials, fixed Cycles CPU/AgX 0EV/World 0.65 and 3 fixed SUN lamps; matching p0.2/p0.3 views and resolutions. **These results do not exist until owner runs Blender and provides original outputs.** Native Three.js, FPS and hardware gates are separate and NOT RUN. PR Draft, no merge.
