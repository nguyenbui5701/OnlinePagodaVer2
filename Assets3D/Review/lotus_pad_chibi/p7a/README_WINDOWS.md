# P07a — Run original real GLB→Blender/Cycles A/B with 0 VND on Windows

**Must execute**: source-only Blender script and positive geometry ray checks are not real P07a Cycles proofs until Blender actually reimports GLB and generates original files. Require Blender **4.5.16 LTS or compatible**, PowerShell 5.1+, and a *full local checkout* of `assets/lotus-pad-chibi-p0` from PR #2 containing original P06c baseline GLB and original P02 lotus. **Do NOT edit p6c, p6b, female, Sakura, Codex or main.**

In `Assets3D/Review/lotus_pad_chibi/p7a/` run the actual Windows PowerShell commands:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p07a_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p07a_blender.ps1 -Mode all -Samples 32 -Size 520
```

If auto-detect fails, append `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with exact installed path. ALL removes previous QUICK evidence directory then builds original full evidence from scratch. On errors attach real `*_stdout.log` and `*_stderr.log` (do NOT fake/ignore failures). Inputs fail-fast SHA256 five frozen objects:
- P06c cross `c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4`;
- P06c kneel `38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad`;
- P07a cross `72c407bf3b6ae8a6edc8ed9a0e544168db7edcac379a8ea92b9677cceed00107`;
- P07a kneel `e7f86beb4cd43f899c57922c0e34c94020e93dc007c6b9f5094b2757363960da`;
- P02 lotus `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.

Eight cases: `p06c_cross_actor`, `p07a_cross_actor`, `p06c_cross_pair`, `p07a_cross_pair`, and same four for kneel. New versions save editable `meditator_p07a_cross_actor.blend`, `meditator_p07a_cross_pair.blend`, `meditator_p07a_kneel_actor.blend`, `meditator_p07a_kneel_pair.blend` inside `P07A_Cycles_Evidence/<case>/`. Real Cycles CPU32/AgX EV0/original 3 suns+world; original exact P06c hair shots + additional matching P06c/P07a ear/nape macro shots, 9:16 medium and close **720×1280** on frozen P02 lotus each pose; P07a original native idle 0/0.5/1/1.5/2s actor/phone frame. Skin-magenta debug only separately named `DIAGNOSTIC`; never substitutes for art PNG. Full per-case JSON contains actual Blender version, GLB SHA, camera samples, PNG/.blend bytes & hashes; PowerShell checks all image SHA and Blender exit code.

Only after full real run, source runner generates `P07A_Cycles_Evidence/FILE_HASHES_SHA256.txt` and `P07A_UNDERCUT_Blender_Cycles_Evidence.zip`, runs **actual `validate_p07a_zip_crc.py`** through Blender Python, and prints `[P07A_ZIP_CRC_PASS]` plus actual SHA. The presence of script is not CRC success. Owner must attach original archive and actual stdout/Blend for SA.

Optional independent Node22 regeneration of actual binaries (zero external Node modules) and full P07a glTF/ray checker:
```powershell
node .\build_male_undercut_p07a.mjs ..\p6c\meditator_male_cross_prayer_p06c.glb cross
node .\build_male_undercut_p07a.mjs ..\p6c\meditator_male_kneel_prayer_p06c.glb kneel
node .\validate_p07a_glb_rays.mjs
Get-FileHash .\meditator_male_cross_prayer_undercut_p07a.glb -Algorithm SHA256
Get-FileHash .\meditator_male_kneel_prayer_undercut_p07a.glb -Algorithm SHA256
```
These commands never overwrite P06c. Match output SHA with `asset_manifest.json`; unexpected mismatch means **STOP / DO NOT PUSH**.

Once REAL Cycles finish, owner push media on SAME PR branch (run in repo root):
```powershell
git switch assets/lotus-pad-chibi-p0
git add Assets3D/Review/lotus_pad_chibi/p7a/P07A_Cycles_Evidence/
git add Assets3D/Review/lotus_pad_chibi/p7a/P07A_UNDERCUT_Blender_Cycles_Evidence.zip
git add Assets3D/Review/lotus_pad_chibi/p7a/P07A_ZIP_CRC_stdout.log
git add Assets3D/Review/lotus_pad_chibi/p7a/P07A_ZIP_CRC_stderr.log
git commit -m "AI Visual 13 P07a owner genuine Cycles/Blender undercut A-B evidence"
git push origin assets/lotus-pad-chibi-p0
```
If zip exceeds PR practical limit, send original ZIP to SA/owner out-of-band with real SHA/bytes, and record `pending_owner_upload` rather than pretend present. No integration or merge. STOP SA review → owner explicit GO both poses. **No P0.7b side part**.
