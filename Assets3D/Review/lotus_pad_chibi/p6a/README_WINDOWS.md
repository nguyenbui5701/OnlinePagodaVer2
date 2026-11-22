# P0.6a Windows Blender Cycles: independent male/female two-pose A/B

**Status before Windows run: NOT_RUN / no new P0.6a Cycles PNG, .blend, logs or ZIP exist.** The file and all commands here are repeatable code/instructions, not proof of execution.

Work in a full checkout of branch `assets/lotus-pad-chibi-p0`, in folder `Assets3D/Review/lotus_pad_chibi/p6a`. Required original inputs are already in sibling `../p5f/`, `../p5c/`, and `../p5f/p02_baseline/`. Fail-fast verifies exact five GLB file SHA-256 values, including new male cross **c684934ff2ceb8da08265fcc8304f2684255f144dc7df94819f007c5e803cb61** and male kneel **9aad5f3f4d1b84d0a9ffb2cda3bc01b39ece676318ba883e417f7337e9d2251e**.

Use PowerShell:

```powershell
cd 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p6a'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p06a_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p06a_blender.ps1 -Mode all -Samples 32 -Size 520
```

If autodetection fails add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` (adjust actual installed version). Each run **replaces that mode's P06A_Cycles_Evidence folder**, so send only the final `all` ZIP.

**Quick**: 8 comparable baseline female/male cases, actor and original lotus pair, two poses, 8 samples 320px. **All**: same 8 cases with front/side/3⁄4/backs, **separately labeled short hair front/left/right/back/quarter/top**, hands and foot macros, true 720×1280 medium/close 9:16, five original imported idle time stamps 0/0.5/1/1.5/2. Plus two male six-palette rendering cases. Exact existing P05f/P05c pair_side and other camera contract, 3 fixed Cycles suns, AgX EV0 and World0.65. **No camera or lighting adjustment between male and female.**

Expected newly generated .blend source files after actual run:
- `p6a/P06A_Cycles_Evidence/male_cross_actor/meditator_male_cross_actor_p06a.blend`
- `p6a/P06A_Cycles_Evidence/male_kneel_actor/meditator_male_kneel_actor_p06a.blend`
- optional review-pair .blend `male_cross_pair/meditator_male_cross_pair_p06a.blend` and `male_kneel_pair/meditator_male_kneel_pair_p06a.blend`.

Original evidence ZIP: `p6a/P06A_MALE_TWO_POSE_Blender_Cycles_Evidence.zip`. PowerShell validates input GLB bytes/SHA and every real PNG/BLEND report SHA; case stderr/stdout preserved. Owner/SA must rehash artifacts, test ZIP CRC and review actual geometry/lighting before PASS. Do not treat a PNG drawn by VTK or AI as Blender proof.

**Gate:** `P06A_MALE_TWO_POSE_OWNER_REVIEW_REQUIRED`. Only after real Cycles and SA review may owner approve both male poses. No Codex, no integration, no GPU/LIVE, no merge.
