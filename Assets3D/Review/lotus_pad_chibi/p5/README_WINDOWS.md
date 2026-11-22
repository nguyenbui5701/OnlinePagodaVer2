# P0.5 owner Windows Blender/Cycles — both FEMALE prayer poses

**Blender/Cycles NOT RUN in AI environment; `.blend` P0.5 NOT CREATED yet.** Download and unzip `P05_FEMALE_PRAYER_BLENDER_WINDOWS_STARTER.zip` into its own clean folder. This ZIP includes P0.4 original SHA-verified GLB in `p04_baseline/`, both new P0.5 GLBs, `blender_p05_cycles.py`, PowerShell launcher and `compose_p05_cycles_sheets.py`. No other asset or runtime is changed.

Copy exactly **ONE** frozen P0.2 lotus pad into `p02_baseline/lotus_pad_01.glb` from `Assets3D/Review/lotus_pad_chibi/p3/lotus_pad_01.glb` of your PR #2 checkout. The runner verifies the correct frozen lotus SHA-256 **`80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`** before rendering.

In PowerShell inside extracted starter:

```powershell
New-Item -ItemType Directory -Force .\p02_baseline | Out-Null
Copy-Item 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' .\p02_baseline\lotus_pad_01.glb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05_blender.ps1 -Mode all -Samples 32 -Size 520
```

Adjust your local repo path. If Blender is not auto-found, supply `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` (actual version/path). **Quick mode generates a small proof and clears old evidence; full mode always rebuilds a fresh evidence directory.** The launcher checks four SHA-pinned input GLBs first, uses Blender `--python-exit-code 97`, validates each PNG against its per-case JSON hash and exports original `P05_FEMALE_PRAYER_Blender_Cycles_Evidence.zip` with SHA list. It runs P0.4 original actor+pair, both P0.5 actor+pair and two palette cases. Real original P0.2 leaf imported and +Y .195 actor offset applied once. Fixed Cycles CPU/32 samples, AgX/0EV/World 0.65, three SUNs and matching cameras, front/left/right/back/3/4, detailed hand/knee, 9:16 FULL/MEDIUM/CLOSE. Both P0.5 have five idle time phases sampled front/right/back and six-color swatches. Four new editable Blender `.blend` (actor+pair per P0.5 pose) are created only by this run.

After the full run, make the requested six true Cycles contact sheets:

```powershell
py -m pip install pillow
py .\compose_p05_cycles_sheets.py
```

Send original `P05_FEMALE_PRAYER_Blender_Cycles_Evidence.zip`, four editable P0.5 `.blend` and `P05_Cycles_Contact_Sheets/` to SA for SHA/visual review. The artifact filenames/hashes do NOT exist until these commands complete successfully. **Do not call P05 Cycles PASS or approve female poses merely from the preliminary VTK PBR images.**
