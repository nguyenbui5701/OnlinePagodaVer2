# P0.5c — actual Blender Cycles SHA-locked A/B

Extract `P05C_FEMALE_PALMS_BLENDER_WINDOWS_STARTER.zip` into a clean folder. It contains both old P0.5b and new P0.5c GLBs, Blender Python source, PowerShell runner and original camera contract. The ONLY additional input is the frozen P0.2 leaf copied to `p02_baseline/lotus_pad_01.glb` from checked-out PR #2 `Assets3D/Review/lotus_pad_chibi/p3/lotus_pad_01.glb`, SHA256 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.

```powershell
New-Item -ItemType Directory -Force .\p02_baseline | Out-Null
Copy-Item 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' .\p02_baseline\lotus_pad_01.glb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05c_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05c_blender.ps1 -Mode all -Samples 32 -Size 520
```

Adjust local repository and optional `-BlenderPath`. Full reimports old+new REAL GLBs for two poses × actor/pair (8 cases); fixed P05 camera, AgX 0EV, world .65, SUN3, Cycles CPU32 samples; actor macros front / left 3/4 / right 3/4 / side / torso, 720×1280 phone medium/close on original lotus and five idle stages. Creates 4 new p05c editable Blender source .blend and exact case PNG/JSON/log/SHA/ZIP `P05C_FEMALE_HANDS_Blender_Cycles_Evidence.zip`. Do not call Cycles PASS before actual owner run and independent SA evidence validation.
