# P06b exact binary + editable Blender/Cycles owner handoff

**New GLBs in this p6b commit (not pending owner upload):**
- `Assets3D/Review/lotus_pad_chibi/p6b/meditator_male_cross_prayer_p06b.glb` **589264 B** / SHA256 `d6add5fdd5ec7122c24aee774c1ea10cc0588643842c891e334ffd30c60ce4cb` / 18380 triangles.
- `Assets3D/Review/lotus_pad_chibi/p6b/meditator_male_kneel_prayer_p06b.glb` **455680 B** / SHA256 `db78a1b26bff1cd2dced82d4ed4d4255280cfb6eb3db3ea2dd5ab5b5674c0701` / 18420 triangles.

**Not created/NOT_RUN by this AI environment, must actually render on owner Windows:** `p6b/P06B_Cycles_Evidence/p06b_cross_actor/meditator_p06b_cross_actor.blend`, `p6b/P06B_Cycles_Evidence/p06b_cross_pair/meditator_p06b_cross_pair.blend`, `p6b/P06B_Cycles_Evidence/p06b_kneel_actor/meditator_p06b_kneel_actor.blend`, `p6b/P06B_Cycles_Evidence/p06b_kneel_pair/meditator_p06b_kneel_pair.blend`, PNGs, JSON reports, stdout/stderr, original `p6b/P06B_MALE_HAIR_Blender_Cycles_Evidence.zip` and `p6b/P06B_ZIP_CRC_stdout.log`. Do not fabricate hashes or CRC before files exist.

Owner on Windows checkout PR branch must run from folder p6b:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p06b_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p06b_blender.ps1 -Mode all -Samples 32 -Size 520
```
Full mode verifies all original/new GLB SHA, actual Blender exit codes, PNG/Blend bytes/SHA, writes logs/FILE_HASHES_SHA256.txt, builds ZIP, and runs actual `validate_p06b_zip_crc.py` under Blender Python; fails if ZIP CRC or four cases missing. Save actual ZIP SHA printed from full run.

Then at repo root owner may push only actual new evidence (not frozen p6a):
```powershell
git switch assets/lotus-pad-chibi-p0
git add Assets3D/Review/lotus_pad_chibi/p6b/P06B_Cycles_Evidence/
git add Assets3D/Review/lotus_pad_chibi/p6b/P06B_MALE_HAIR_Blender_Cycles_Evidence.zip
git add Assets3D/Review/lotus_pad_chibi/p6b/P06B_ZIP_CRC_stdout.log
git commit -m "AI Visual P06b genuine Blender Cycles and editable evidence"
git push origin assets/lotus-pad-chibi-p0
```
If ZIP is too large, send it and its actual SHA out of band for owner/SA handoff, leaving GitHub manifest state `pending_owner_upload` until physically committed and verified. Never merge, force-push, modify female/lotus/p6a or mark male approved without owner.
