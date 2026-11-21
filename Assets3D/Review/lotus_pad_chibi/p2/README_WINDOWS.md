# P0-02 — Windows Blender 4.5+ Cycles A/B (zero paid tools)

Extract `P02_LOTUS_CHIBI_BLENDER_AB_WINDOWS.zip` into a dedicated folder. It contains **four exact GLBs**: `p01_baseline/lotus_pad_01.glb`, `p01_baseline/meditator_base.glb`, and p0.2 `lotus_pad_01.glb`, `meditator_base.glb`; plus `blender_cycles_ab_p02.py` and `run_p02_blender.ps1`.

Open Windows PowerShell 5.1 in extracted folder and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p02_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p02_blender.ps1 -Mode all -Samples 32 -Size 520
```

If Blender is not auto-detected, add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` to the end. The launcher pins all four source GLB SHA-256, requests `--python-exit-code 97`, captures Blender stdout/stderr and stops if a case fails; does not mask errors under PowerShell 5.1.

Expected full A/B: **6 cases** (pad/actor/pair × p01/p02), with 3 fixed pad views each, 4 actor views + 5 original idle timepoints each, and 4 seated pair views (front/3-4/**medium 9:16**/**tight close 9:16**) each. Six same-camera pairs plus real animation samples; Cycles CPU, 32 samples, AgX, **0 EV**, fixed World 0.65 and identical 3 SUN lamps. Saves original editable **p0.2** `.blend`: `lotus_pad_01_p02.blend`, `meditator_base_p02.blend`, `lotus_chibi_pair_review_p02.blend` (review only); `P02_LOTUS_CHIBI_Blender_Cycles_AB_Evidence.zip` contains PNG, JSON, logs and exact file hashes. Do not call p0.2 Cycles PASS until owner actually runs it.

The original p0.1 owner `.blend` and Cycles ZIP from SA review are distinct, already technically PASS; they are not overwritten. Do not copy a prior Sakura/p0.1 evidence ZIP into p0.2. The script only creates Blender source **after owner execution**.
