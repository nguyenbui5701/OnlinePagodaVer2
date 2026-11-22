# OnlinePagodaVer2 — AI Visual 12 / P06c Male Scalp Coverage Fix

**PR #2 Draft**, baseline `9ff521549af8b8f1449579a4c7fd7ab6021c7e94`; versioned output folder `Assets3D/Review/lotus_pad_chibi/p6c/`; exact task [AI_VISUAL_12](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/main/Task/AI_VISUAL_12_MALE_HAIR_SCALP_COVERAGE_P06C.md), [SA P06b FAIL review](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6011459874).

Two actual **GLB 2.0** files generated and uploaded:
- `meditator_male_cross_prayer_p06c.glb` **589,656 B**, SHA256 **`c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4`**, 18,380 triangles / 9,469 vertices / 10 meshes.
- `meditator_male_kneel_prayer_p06c.glb` **456,072 B**, SHA256 **`38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad`**, 18,420 triangles / 9,485 vertices / 9 meshes.

**Only GLB mesh 6 hair POSITION/NORMAL changed**. Real ray–triangle old B6 head/skin coverage: 87/1586 shell samples and 90/567 swept layer vertices penetrating skin; new C: **0/1591**, **0/567**. Matched 43×39 ray samples front/top/right 3/4/left/right/back all new `skinFirst=0`; see `P06C_SCALP_COVERAGE_REPORT.json`. Hair still 1672 vertices/3080 triangles with original 3 styled sweeps, no extra draw call, 21 materials and 6 variants unchanged. All nonhair glTF accessor bytes, animation samplers/anchors, source P06b 2s/17-key, eyebrow data and original hair face indices bit-exact. Cross and kneel hair buffers are identical. No old p6a/p6b, female, pad or Sakura changes.

**Reproducible hair sculpt:** `build_male_scalp_p06c.mjs` from exact SHA-locked original B6 binaries; independent full ray validation script `validate_p06c_scalp_rays.mjs`. **Authoring Blender source** `blender_p06c_cycles.py` with scene export to original editable .blend, matching P06b Cycles old/new A/B; owner PowerShell runner `run_p06c_blender.ps1` + CRC validator `validate_p06c_zip_crc.py`.

**Truthful handoff:** No Blender executable available in this AI runtime, so P06c real Cycles PNG, editable .blend and ZIP have NOT been created; these are **PENDING_OWNER_RUN** (not PASS). This means visual hair aesthetics/continuous physical collision remain pending SA/owner review. Instructions in `README_WINDOWS.md`, binary status in `BINARY_HANDOFF.md`.

**STOP `P06C_MALE_HAIR_SCALP_COVERAGE_OWNER_REVIEW_REQUIRED`**. No Codex, integration, GPU/LIVE, merge. SA checks genuine Blender pictures and owner explicitly accepts both male prayer poses.
