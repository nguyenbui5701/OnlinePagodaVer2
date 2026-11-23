# P06c actual GLB binary / pending original Blender evidence handoff

**New real GLB2 binary files uploaded to Draft PR #2 in this p6c commit** (not owner-pending):
1. `Assets3D/Review/lotus_pad_chibi/p6c/meditator_male_cross_prayer_p06c.glb` — **589,656 bytes**, **SHA256 `c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4`**, 18,380 triangles, 9,469 vertices, 10 meshes, 21 materials.
2. `Assets3D/Review/lotus_pad_chibi/p6c/meditator_male_kneel_prayer_p06c.glb` — **456,072 bytes**, **SHA256 `38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad`**, 18,420 triangles, 9,485 vertices, 9 meshes, 21 materials.

Only hair mesh #6 buffers POSITION/NORMAL changed, exactly same source indices. Two P06c hair buffer arrays POS/NORM/INDICES byte-identical, all nonhair primitives/source animation/6 palettes/anchor JSON unchanged. Original P06b male GLBs are SHA-pinned and untouched. Reproducible source `build_male_scalp_p06c.mjs`, independent actual-skin ray test `validate_p06c_scalp_rays.mjs`.

**Only the following binary outputs are pending actual Blender Windows execution** (do not invent SHA, size, ZIP CRC or claim they exist):
- `p6c/P06C_Cycles_Evidence/p06c_cross_actor/meditator_p06c_cross_actor.blend`, `p6c/P06C_Cycles_Evidence/p06c_cross_pair/meditator_p06c_cross_pair.blend`
- `p6c/P06C_Cycles_Evidence/p06c_kneel_actor/meditator_p06c_kneel_actor.blend`, `p6c/P06C_Cycles_Evidence/p06c_kneel_pair/meditator_p06c_kneel_pair.blend`
- Targeted before/after `p06b_*_cycles.png` and `p06c_*_cycles.png` for front/top/right 3/4/left/right/back, plus both P02-lotus 720×1280 9:16 medium+close.
- `P06C_Cycles_Evidence/FILE_HASHES_SHA256.txt`, eight original case JSON/logs, original `p6c/P06C_MALE_HAIR_Blender_Cycles_Evidence.zip`, verified original CRC log `p6c/P06C_ZIP_CRC_stdout.log`.

Owner executes `run_p06c_blender.ps1` with `-Mode quick` then `-Mode all -Samples 32 -Size 520` from p6c folder (instructions `README_WINDOWS.md`). Actual owner can push media on the same `assets/lotus-pad-chibi-p0` branch; if ZIP too big send original ZIP separately with **ACTUAL** SHA/bytes and target repo path. Keep status pending_owner_upload until PR rechecked; never rewrite p6b, old female, P02 lotus or Sakura.

**Final gate** `P06C_MALE_HAIR_SCALP_COVERAGE_OWNER_REVIEW_REQUIRED`. SA reviews actual new GLBs/editable .blend/Cycles→ owner explicitly decides both male poses; no Codex, integration, GPU/LIVE or merge.
