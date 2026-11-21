# Sakura Hero R15 — hotfix for Windows Blender launcher

Two R14 name remnants were fixed: PowerShell now invokes blender_ab_validate_r15.py, and Blender Python selects the QUALITY .blend when the case equals r15_final.

Copy both scripts into your repository Assets3D/Review/sakura_hero/r15/ folder, replacing the same-named files. GLBs should remain unchanged.

Quick test:

powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R15_blender.ps1 -Mode quick -Samples 8 -Size 320

After quick success:

powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R15_blender.ps1 -Mode all -Samples 32 -Size 520

Expected: r14_baseline / r15_final for QUICK; three cases in ALL. The R15 quality file must be named sakura_hero_r15_quality.blend. Cycles has not been executed in this environment, so runtime success is not yet claimed.
