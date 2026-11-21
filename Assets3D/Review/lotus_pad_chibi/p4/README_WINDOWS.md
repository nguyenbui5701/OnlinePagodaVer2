# P0.4 free Blender/Cycles owner-run A/B

AI container has no Blender executable: **no P0.4 Cycles run, no editable .blend yet**. Download and unzip `P04_FEMALE_BLENDER_WINDOWS_STARTER.zip` to a clean folder. The ZIP includes actual exported P0.4 GLB and Blender Python and PowerShell scripts. Three SHA-locked input GLBs are required:

- P0.4 new actor: `meditator_female_ao_ba_ba_p04.glb`, SHA `586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09` (already in starter).
- P0.3 original from cloned PR #2: copy `Assets3D/Review/lotus_pad_chibi/p3/meditator_base.glb` into `p03_baseline/meditator_base.glb`, SHA `646842c7574976020f6583c4e18879c9bef012e5f31dc851589c0a1491786be0`.
- Frozen P0.2 leaf from PR #2: copy `Assets3D/Review/lotus_pad_chibi/p3/lotus_pad_01.glb` into `p02_baseline/lotus_pad_01.glb`, SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.

From PowerShell in the starter folder:

```powershell
New-Item -ItemType Directory -Force .\p03_baseline, .\p02_baseline | Out-Null
# Copy the two verified GLBs from your local repository as described above.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p04_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p04_blender.ps1 -Mode all -Samples 32 -Size 520
```

If Blender is not autodetected, add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` (adjust version). Launcher verifies SHA before Blender and fails on Python errors.

Full: 5 cases P03 actor, P04 actor, P03 pair with real leaf, P04 pair with real leaf, P04 six material-color swatches. Fixed camera/FOV, 3 SUNs, AgX/0EV, World .65, Cycles CPU/32 samples. P04 actor front/side/3⁄4/back, close placket/back-hair and ten idle samples, plus 9:16 pair medium/close. Creates `P04_Cycles_Evidence` PNG/JSON/stdout/stderr, SHA256 list and two new editable P04 `.blend` (actor and review-only pair). Original evidence ZIP must be returned to SA; **do not label Cycles PASS without checking it**. STOP before any male or integration work.
