# P0.4 — Windows original GLB Blender Cycles A/B

Unzip `P04_FEMALE_BLENDER_WINDOWS_STARTER.zip` into a clean folder, preferably under the PR checkout. Include `blender_p04_cycles.py`, `run_p04_blender.ps1`, **new** `meditator_female_ao_ba_ba_p04.glb`. Source baseline files are NOT bundled and MUST be copied unchanged from GitHub PR #2 or your checked-out `Assets3D/Review/lotus_pad_chibi/p3/`:

```powershell
New-Item -ItemType Directory -Force .\p03_baseline, .\p02_baseline | Out-Null
Copy-Item -LiteralPath 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\meditator_base.glb' -Destination '.\p03_baseline\meditator_base.glb'
Copy-Item -LiteralPath 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' -Destination '.\p02_baseline\lotus_pad_01.glb'
```

Adjust project path if different. SHA-256 checks are enforced by launcher. P0.3 original actor SHA `646842c7574976020f6583c4e18879c9bef012e5f31dc851589c0a1491786be0` and leaf SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p04_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p04_blender.ps1 -Mode all -Samples 32 -Size 520
```

If Blender not detected, supply `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with actual installed version.

Full mode creates **5 cases**: P03 actor, P04 actor, P03 seated pair with real P0.2 leaf, P04 seated pair, P04 six-color variants from same mesh. Fixed Cycles CPU 32 samples, AgX/0 EV/World 0.65/3 same Sun lights and same FOV/cameras for P03/P04, 5 idle phases front/back P04, true imported GLBs. Output `.blend` under `P04_Cycles_Evidence/p04_actor/` and `p04_pair/`, original full PNGs/JSON/stdout/stderr/hash list and ZIP. **This source does not claim it was executed until owner sends the generated files.**
