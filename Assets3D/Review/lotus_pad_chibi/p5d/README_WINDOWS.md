# Windows Blender P0.5d same-camera Cycles A/B — cross-legged ONLY

Extract the provided `P05D_FOOT_BLENDER_WINDOWS_STARTER.zip` into a clean directory containing:

- `p05c_baseline/meditator_female_cross_prayer_p05c.glb` — SHA `1da8c12982165cf57e2ef678013cdd57b67bba7fd6c08e2979c267599d35e5bf`.
- `meditator_female_cross_prayer_p05d.glb` — SHA `0f169e427cc70bc0b5b744db935c4de4ecac356ef3fc8a1113812a5bf0780e44`.
- **Owner must copy** original unchanged `Assets3D/Review/lotus_pad_chibi/p3/lotus_pad_01.glb` from checked-out PR #2 into `p02_baseline/lotus_pad_01.glb` — SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.
- `blender_p05d_cycles.py`, `run_p05d_blender.ps1`.

```powershell
New-Item -ItemType Directory -Force .\p02_baseline | Out-Null
Copy-Item 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' .\p02_baseline\lotus_pad_01.glb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05d_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05d_blender.ps1 -Mode all -Samples 32 -Size 520
```

Adjust the repository path to your checkout, specify `-BlenderPath <full blender.exe>` if needed. All **three original GLB SHA-256s** are verified before Cycles starts. FULL clears previous quick evidence and runs four cases: original cross actor, revised cross actor, old pair with REAL frozen pad, new pair with REAL frozen pad. Uses fixed P05c shared lights/cameras AgX 0EV World 0.65, 32 samples. Actor foot macros front/left-right 3/4/side; pair front/side/quarter/720×1280 medium and close; new actor renders two foot macros at 5 idle times. True new .blend will be saved for revised actor and review-only pair; original baseline .blend remains in earlier p5c evidence untouched. Creates `P05D_Cycles_Evidence/` with PNG/JSON/stdout/stderr/file SHA list and `P05D_FEMALE_FOOT_Blender_Cycles_Evidence.zip` for SA.

**No Blender/Cycles PASS until this actually executes, owner sends original evidence, and SA verifies hashes/visuals.** Do not rerun kneel, merge PR or start male/Codex.
