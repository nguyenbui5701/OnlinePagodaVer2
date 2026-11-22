# P0.7b — safe NEW ONLY Blender/Cycles handoff (Windows)

In the owner working copy of Draft PR #2, update `assets/lotus-pad-chibi-p0` using `git fetch origin` and `git pull --ff-only origin assets/lotus-pad-chibi-p0`; no branch resets or force pushes. Then:

```powershell
cd Assets3D/Review/lotus_pad_chibi/p7b
node .\build_male_sidepart73_p07b.mjs cross
node .\build_male_sidepart73_p07b.mjs kneel
.\run_p07b_blender.ps1 -Mode smoke -Samples 16 -Size 720
```

**STOP for visual inspection**: cross front/top/quarter/L-R/back and original lotus **720×1280 medium**, kneel hair front and original lotus medium. Inspect physical off-centre 7/3 vs frozen `../p7a1/P07A1_Cycles_Evidence/p06c_*` and owner-accepted `p07a1_*` refs. If side part indistinct, pale scalp shows, or ear/eye clip, **do not** run full; revise p7b hair first and request SA feedback. No old P Blender commands.

After smoke looks convincing, run:

```powershell
.\run_p07b_blender.ps1 -Mode all -Samples 32 -Size 720 -ArtSmokeAccepted
```

Runner executes exactly FOUR NEW cases `p07b_cross_actor`, `p07b_cross_pair`, `p07b_kneel_actor`, `p07b_kneel_pair`; imports real P07b GLB, original untouched P02 lotus (SHA locked) in pair, preserves P06c camera/light/AgX/EV. Outputs new 4 editable `.blend`, full hair front/top/L-R/3Q/back/lowback/ear, lotus 720×1280 medium+close, 5 idle times on new models, case_report.json, stdout/stderr, PNG SHA list, ZIP and actual CRC log. **Non-destructive:** preexisting evidence directory or ZIP causes STOP, not deletion. If Blender is not on PATH use `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'`.

Push ONLY new `p7b/P07B_Cycles_Evidence/`, `p7b/P07B_SIDE_PART_73_Blender_Cycles_Evidence.zip`, `p7b/P07B_ZIP_CRC_stdout.log` and stderr to the same feature branch; preserve original P folders. Large binary handling via owner Git LFS as appropriate; do not claim CRC unless execution completes. After upload STOP for SA review then owner acceptance; do not merge.
