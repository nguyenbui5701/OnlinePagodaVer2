# P0.5f Free Blender Cycles owner-run — A/B actual GLBs and P0.2 lotus

Extract `P05F_FEMALE_SEAT_BLENDER_WINDOWS_STARTER.zip` into its **own folder**. Unlike older tasks, **all three SHA-locked actual GLBs are INCLUDED**:
- `p05e_baseline/meditator_female_cross_prayer_p05e.glb` 574048B SHA `0829edde73666460c457267672e344a61443ee2c882319998d5b84a359f81367`
- `meditator_female_cross_prayer_p05f.glb` 574608B SHA `3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4`
- `p02_baseline/lotus_pad_01.glb` 262108B SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`

Run from PowerShell in extracted directory:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05f_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05f_blender.ps1 -Mode all -Samples 32 -Size 520
```

If needed add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` adjusted to actual installed Blender. Mode all deletes quick evidence and runs 4 cases old/new actor & old/new true-lotus pair with EXACT original owner `pair_side` camera and identical lights/AgX EV0/World .65. Produces old/new low-side, front, 9:16 720×1280 phone and five idle samples t=0/.5/1/1.5/2. It also creates original **p05f actor and review-only pair .blend** only on successful Blender execution. The output `P05F_FEMALE_SEAT_Blender_Cycles_Evidence.zip` includes true PNG/JSON/logs/SHA list; send it and both .blend to SA for independent validation.

**Important**: P0.5f Blender Cycles NOT_RUN in AI container; do not report PASS until owner supplies exact source PNG and SA checks them. PR remains Draft / no male, Codex or integration.
