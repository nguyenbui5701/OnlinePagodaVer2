# Windows 0 VND Blender/Cycles owner run — P05 vs P05b hand A/B

**Blender/Cycles P05b NOT executed by AI container; new editable `.blend` not yet created.** Extract `P05B_FEMALE_HANDS_BLENDER_WINDOWS_STARTER.zip` to a clean folder; it includes both old P05 GLBs (SHA-pinned) in `p5_baseline/`, both NEW P05b GLBs, Blender Python, launcher and manifest.

**Required frozen leaf**: copy **ONLY** `Assets3D/Review/lotus_pad_chibi/p3/lotus_pad_01.glb` from your PR #2 checkout into `p02_baseline/lotus_pad_01.glb` alongside the runner. SHA256 must be `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b6be09`.

```powershell
New-Item -ItemType Directory -Force .\p02_baseline | Out-Null
Copy-Item 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' .\p02_baseline\lotus_pad_01.glb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05b_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05b_blender.ps1 -Mode all -Samples 32 -Size 520
```

Adjust repo and `-BlenderPath` to your Blender executable, e.g. `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'`. **SHA checked before rendering; real exit code and each PNG SHA/bytes checked after.** Full mode overwrites earlier quick evidence. Blender 4.5+ Cycles CPU, AgX / 0EV, three identical SUN lamps / World .65, same P05 original views/lighting; additional left/right hand 3/4 and torso cameras. Original P05 and new P05b input GLBs are re-imported for every case, not re-generated or displayed as concept. Pair cases include exact frozen P0.2 leaf +Y placement ONCE.

8 cases: `p05_cross_actor`, `p05b_cross_actor`, `p05_kneel_actor`, `p05b_kneel_actor`, their four corresponding `pair` cases. 2 new actor cases additionally render 5 imported animation stages × front/side hands. Portraits `medium_9x16`, `close_9x16` are **720×1280** when full mode uses any size ≤720; actor macro uses your `-Size` (default 520). New four `.blend` created only for P05b cross/kneel actor+pair. The `P05B_Cycles_Evidence` folder contains case_report.json, PNGs, logs, `FILE_HASHES_SHA256.txt`; a full evidence ZIP is produced.

**SA review of original ZIP+4 `.blend` required before art OK.** Some original P05 text files were normalized when uploaded; baseline Cycles 8 case stdout and selected original PNG SHA were SA-reviewed but NOT all archive members independently reaudited. Keep separate reports. Do not merge.
