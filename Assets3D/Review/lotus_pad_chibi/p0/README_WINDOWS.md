# P0-01 Windows Blender 4.5+ / Cycles

Unzip the supplied starter ZIP. It contains two SHA-pinned real GLBs, `blender_cycles_validate_and_save.py` and `run_p0_blender.ps1`. Install only free Blender.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p0_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p0_blender.ps1 -Mode all -Samples 32 -Size 520
```

Or add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with the actual path.

Quick: render joint preview with three views and save `lotus_chibi_seated_review.blend`. Full: import/save separate `lotus_pad_01.blend` and `meditator_base.blend`, create paired review project and render actual Cycles front/side/back/top, water-level, 9:16, anchor debug and `sit_idle` time slices. Script checks SHA inputs, uses true glTF PBR with Cycles CPU, AgX, 0EV, fixed scene lights, and stops if Blender fails to import animation/nodes. Stores reports/logs/hash list and ZIP.

**The producing AI environment cannot run Blender. These evidence files are not claimed to exist until owner actually runs the package.**
