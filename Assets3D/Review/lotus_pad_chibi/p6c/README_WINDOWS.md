# P06c Windows: eight real old P06b/new P06c Blender Cycles A/B + editable source + ZIP CRC

**CURRENT STATUS: PENDING_OWNER_RUN / no newly created P06c Cycles, .blend or ZIP in this AI runtime.** Use Blender 4.5.16 LTS (free) on a full checkout of PR #2 branch `assets/lotus-pad-chibi-p0`. Open PowerShell in `Assets3D/Review/lotus_pad_chibi/p6c/`, then:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p06c_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p06c_blender.ps1 -Mode all -Samples 32 -Size 520
```

If Blender isn't autodetected, pass `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` (use your actual path). **All** removes quick output folder before generating original full-size evidence; do not send quick as final art proof.

The runner verifies **five SHA-256 input GLBs**: frozen old P06b cross `d6add5f...`, old P06b kneel `db78a1b...`, new P06c cross `c9d1513...`, new P06c kneel `38e47f...`, P02 lotus `80f572c...`. It runs **eight TRUE GLB Blender reimport cases**, pairing old/new actor and same original lotus, four male pose/version pairs. It renders at original SAME camera/FOV/lights/AgX 0EV:
- Both poses before and after from hair **front, top, right 3⁄4, left, right, back, quarter**, supplemental left3⁄4 and low-back, plus normal actor view.
- Before/after frozen lotus **720×1280 portrait medium and close** for both poses.
- Imported native 17-sample 2s idle at t=0/.5/1/1.5/2 for NEW P06c actor/pair (not the unchanged P06b suite).
- Separately tagged `DIAGNOSTIC_only_skin_magenta` views from actual same GLB after normal Cycles art renders; this alters Blender diagnostic material only, never source GLB or art evidence; old-v-new magenta reveals skin clipping if any.

After **actually executing successfully** it produces `P06C_Cycles_Evidence/` with PNG, per-case `case_report.json`, stdout/stderr, `FILE_HASHES_SHA256.txt` and **FOUR newly editable actual Blender `.blend` projects** for P06c actor and pair cross/kneel. Each file has measured real byte-size/hash in report; runner independently checks every PNG/.blend SHA. Original P06b .blend already exists and is not rewritten. The runner then builds `P06C_MALE_HAIR_Blender_Cycles_Evidence.zip`, executes `validate_p06c_zip_crc.py` inside Blender Python and verifies **eight** cases and ZIP CRC. Actual printed log `P06C_ZIP_CRC_stdout.log` and ZIP SHA are valid only after success.

**Reproducible source/coverage separately** (Node.js 22+ stdlib):
```powershell
node .\build_male_scalp_p06c.mjs ..\p6b\meditator_male_cross_prayer_p06b.glb cross
node .\build_male_scalp_p06c.mjs ..\p6b\meditator_male_kneel_prayer_p06b.glb kneel
node .\validate_p06c_scalp_rays.mjs cross
node .\validate_p06c_scalp_rays.mjs kneel
Get-FileHash .\meditator_male_cross_prayer_p06c.glb -Algorithm SHA256
Get-FileHash .\meditator_male_kneel_prayer_p06c.glb -Algorithm SHA256
```
Expected output SHA: cross `c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4`; kneel `38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad`. Source old hashes are fail-locked. This script writes only filenames in `p6c/`.

**Owner upload after success**, repo root (or send original ZIP out of band if oversized):
```powershell
git switch assets/lotus-pad-chibi-p0
git add Assets3D/Review/lotus_pad_chibi/p6c/P06C_Cycles_Evidence/
git add Assets3D/Review/lotus_pad_chibi/p6c/P06C_MALE_HAIR_Blender_Cycles_Evidence.zip
git add Assets3D/Review/lotus_pad_chibi/p6c/P06C_ZIP_CRC_stdout.log
git add Assets3D/Review/lotus_pad_chibi/p6c/P06C_ZIP_CRC_stderr.log
git commit -m "AI Visual P06c owner actual Cycles A/B and editable Blender evidence"
git push origin assets/lotus-pad-chibi-p0
```

**STOP for SA review + explicit owner approval BOTH male poses.** No merge, Codex, integration or GPU/LIVE Studio. A zero in finite ray tests is not proof of continuous collision or visual acceptance.
