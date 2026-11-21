# Windows Blender 4.5+ REAL P0.4/P0.5 female prayer Cycles owner run

AI model container has **no Blender**; local evidence only includes native VTK actual GLB PBR, not Cycles. Download `P05_FEMALE_PRAYER_BLENDER_WINDOWS_STARTER.zip` containing two SHA-verified P0.5 GLBs and original P0.4 GLB in `p04_baseline/`, plus the free Blender Python source and SHA-gated PowerShell script.

**One missing prerequisite:** copy the unmodified frozen P0.2 lotus binary from checked-out PR #2 `Assets3D/Review/lotus_pad_chibi/p3/lotus_pad_01.glb` to `p02_baseline/lotus_pad_01.glb` in the extracted Starter. This MUST hash to `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.

```powershell
New-Item -ItemType Directory -Force .\p02_baseline | Out-Null
Copy-Item 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' .\p02_baseline\lotus_pad_01.glb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05_blender.ps1 -Mode all -Samples 32 -Size 520
```

Adjust the repository drive/path and optionally use `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'`. The PowerShell script hashes **all 4 original input GLBs**, uses Blender `--python-exit-code 97` and captures stdout/stderr. Full mode performs **8 cases**: p04_actor, cross_actor, kneel_actor, p04_pair, cross_pair, kneel_pair, cross_palette, kneel_palette. **Same fixed Cycles CPU, 32 samples, AgX/0EV, world 0.65, 3 SUN lights and FOV**; actor fronts, left/right, rear, 3/4, hand/knee close; with TRUE unchanged lotus pair front, side/waterline, quarter, FULL/MEDIUM/CLOSE 9:16. For EACH new pose includes five idle phases front/right/rear and six palette colors. Four actual new .blend actor/pair source projects saved by owner only when scripts finish.

Runner creates `P05_FEMALE_PRAYER_Blender_Cycles_Evidence.zip`, per-case `case_report.json` with each original PNG byte/SHA, raw stdout/stderr and `FILE_HASHES_SHA256.txt`. For matched **original Cycles contact sheets**, run:

```powershell
py -m pip install pillow
py .\compose_p05_cycles_sheets.py
```

Send original ZIP and four .blend plus contact sheet output to SA. Quick is only for smoke checks and full deletes/replaces quick evidence. **Blender PASS is forbidden before full outputs and independent review. P05 owner approval of BOTH poses required; no merge or male.**