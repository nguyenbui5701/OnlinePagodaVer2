# P0.5f Windows Blender/Cycles actual A/B (zero cost)

Unzip **`P05F_FEMALE_SEAT_BLENDER_WINDOWS_STARTER.zip`** to a clean folder. Unlike older iterations, **all three SHA-locked original GLBs are included**, including the unmodified real P0.2 lotus. Layout:

- `p05e_baseline/meditator_female_cross_prayer_p05e.glb` — 574,048 bytes / SHA `0829edde73666460c457267672e344a61443ee2c882319998d5b84a359f81367`
- `meditator_female_cross_prayer_p05f.glb` — 574,608 bytes / SHA `3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4`
- `p02_baseline/lotus_pad_01.glb` — 262,108 bytes / SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`

Use PowerShell within the extracted directory:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05f_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05f_blender.ps1 -Mode all -Samples 32 -Size 520
```

Adjust `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` if Blender cannot autodetect. Full **deletes quick evidence** before recording fresh 4-case run. Original `pair_side` is EXACTLY (2.75,.62,.43) looking at (0,.45,0), FOV42°, same old/new. Added seat-low cameras are also fixed across both; views below the unmodified opaque lotus show primarily leaf underside and are diagnostic only. True Blender Cycles CPU, AgX EV0, 3 suns, 32 samples, 720×1280 9:16. Five idle stages 0/.5/1/1.5/2 use original imported 17-key action. P0.5f source `.blend` files are created inside `P05F_Cycles_Evidence/p05f_cross_actor/` and `p05f_cross_pair/`, each **only after real Blender execution**. The pair is for review only, not a runtime asset.

The runner checks SHA inputs, true PNGs against case JSON, Blender exit codes, and writes original logs plus `FILE_HASHES_SHA256.txt` and `P05F_FEMALE_SEAT_Blender_Cycles_Evidence.zip`. Send **ZIP plus both new `.blend`** to SA. Do NOT claim Cycles pass or owner art signoff until SA independently reviews actual outputs. PR #2 remains Draft.
