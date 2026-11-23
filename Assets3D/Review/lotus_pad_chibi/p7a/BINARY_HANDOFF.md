# P07a original binary handoff — exact actual hashes and pending media

New real `p7a/` GLB2 files **already created and uploaded**, not `pending_owner_upload`:
- `Assets3D/Review/lotus_pad_chibi/p7a/meditator_male_cross_prayer_undercut_p07a.glb`, **590,124 bytes**, actual SHA256 `72c407bf3b6ae8a6edc8ed9a0e544168db7edcac379a8ea92b9677cceed00107`, 18,380 triangles / 9,469 vertices /10 meshes.
- `Assets3D/Review/lotus_pad_chibi/p7a/meditator_male_kneel_prayer_undercut_p07a.glb`, **456,540 bytes**, actual SHA256 `e7f86beb4cd43f899c57922c0e34c94020e93dc007c6b9f5094b2757363960da`, 18,420 triangles / 9,485 vertices /9 meshes.

Both based EXCLUSIVELY on SHA-pinned accepted immutable `../p6c/` male files. New only undercut hair, no other body/eyebrow/glTF/material/clip/variant diffs. Strict executable `validate_p07a_glb_rays.mjs` verifies actual decoded input-output binary.

**Media is NOT yet present (actual Blender unavailable in this AI environment):**
- `p7a/P07A_Cycles_Evidence/p07a_cross_actor/meditator_p07a_cross_actor.blend`
- `p7a/P07A_Cycles_Evidence/p07a_cross_pair/meditator_p07a_cross_pair.blend`
- `p7a/P07A_Cycles_Evidence/p07a_kneel_actor/meditator_p07a_kneel_actor.blend`
- `p7a/P07A_Cycles_Evidence/p07a_kneel_pair/meditator_p07a_kneel_pair.blend`
- `p7a/P07A_Cycles_Evidence/{p06c,p07a}_{cross,kneel}_{actor,pair}/` same-camera actual PNG, five idle frames, case_report.json, stdout/stderr
- `p7a/P07A_UNDERCUT_Blender_Cycles_Evidence.zip`
- `p7a/P07A_ZIP_CRC_stdout.log`, `p7a/P07A_ZIP_CRC_stderr.log`.

**DO NOT INVENT sizes, SHA or CRC for media before owner runs Blender and produces them.** The P07a source scripts `blender_p07a_cycles.py`, `run_p07a_blender.ps1`, `validate_p07a_zip_crc.py` are committed and designed to produce/measure them. Owner instructions and push commands are `README_WINDOWS.md`.

Owner must allow SA independent review of real GLB + Cycles + animated 9:16 and physical scalp tests, then explicitly approve BOTH poses. **STOP P07A_MALE_UNDERCUT_SA_REVIEW_REQUIRED**; no 7/3, Codex, integration, GPU/LIVE or merge.
