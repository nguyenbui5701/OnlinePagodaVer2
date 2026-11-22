# AI VISUAL 06 — P0.5c Female Prayer Palm-to-Palm Orientation & Contact Refinement

> **Successor P0.5d foot-only polish — 2026-11-22:** SA inspected owner-uploaded P0.5c real GLBs and Cycles and posted [review #6010091090](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6010091090); owner **temporarily accepts P0.5c female hand/body art**. New and only active [AI_VISUAL_07](AI_VISUAL_07_FEMALE_CROSS_LEGGED_FOOT_VISIBILITY.md) asks for a tiny visible foot/instep in **cross-legged** pose; **do not modify P0.5c palms or kneeling**. Full clean-room source handoff of P0.5c is still a separate technical item. No male/Codex/merge until owner gate.


**SA issued:** 2026-11-22 · **Owner decision:** one more *small* female prayer-hand art pass · **State:** ASSIGNED / FEMALE VISUAL OWNER GATE OPEN.

**Follow the successful Sakura process, with no shortcuts: SA task → AI Visual genuine, editable 3D + two GLBs + Blender Cycles → SA independent GLB/Cycles/PR review → owner visual OK → only then next phase.** This is the authoritative versioned task; follow [Design/07 Rules](../Design/07_WORK_RULES.md) and [Design/15 Sakura prompt exemplar](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md). Do NOT treat a conceptual image, render-only screenshot or prose summary as a tested 3D deliverable.

## 1. Role, objective, locked scope and hard STOP

**Role:** AI Visual / Blender 3D artist, not Codex.

**Owner requested:** One focused pass, **P0.5c**, because P0.5b's softer fingers/wrists look significantly better but the hands in front and three-quarter Cycles images still appear as **two separate upright palm faces arranged side by side**, not one *chắp tay niệm Phật* gesture with the **two palm surfaces facing toward each other and resting gently together**.

**Exactly two female variants to amend:**
- `cross_prayer`: woman seated cross-legged on the preserved lotus;
- `kneel_prayer`: same woman kneeling on both knees, on the same lotus.

**Authorized geometry ONLY:** local hand/palm plane orientation and mutual position, thumb relation, finger overlap/contour, wrist transition and **only if needed** a minimal wrist-to-cuff/last sleeve segment adjustment. This is a *palm orientation and relationship* refinement, **not** a rebuild of P0.5b hands, not a redesign of the poses.

**Freeze:** same female face and proportions, long back hair, recognizable Vietnamese áo bà ba top/trousers and six color palettes, legs/knees/feet in BOTH poses, unchanged P0.2 lotus, Sakura R16; original `sit_idle`/pose-specific idle and named glTF anchors; same review camera contract, exposure and lighting. **No edits to assets in `p5/` or `p5b/`.**

**STOP/GATE:** Once P0.5c files and evidence are handed off, STOP for SA review then owner approval of BOTH female poses. **NO male model/task, Codex PR #3/#4, scene integration, performance/LIVE tests, unrelated meshes or any merge.** Owner's choice to *refine further* is not final female signoff.

## 2. Repo, branch, immutable reviewed HEAD, baseline hashes & new paths

- Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2
- Existing asset PR #2: https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2
- Asset branch: `assets/lotus-pad-chibi-p0`
- **SA-verified PR HEAD at assignment:** `4c8762912024866778dfe1f39f50ca77ccc26744`. Re-check HEAD before edits; if changed, report both SHAs and inspect differences, no rebasing away owner work or force push.
- Latest actual SA P0.5b review: https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6009865513
- **Immutable source baseline folder:** `Assets3D/Review/lotus_pad_chibi/p5b/` (P0.5b). Keep original `p5/`, `p4/` and lotus evidence untouched.
- **New revision only:** `Assets3D/Review/lotus_pad_chibi/p5c/`.

**Baselines independently verified from *actual PR #2 binary bytes*, not just metadata:**

| Pose | P0.5b file in `p5b/` | Exact size | Exact SHA-256 | Triangles |
|---|---|---:|---|---:|
| Cross-legged | `meditator_female_cross_prayer_p05b.glb` | **424,628 B** | `81e8548cf6e46d9f5ff60c7bdf342ac1857015140e7d06d67dbd9284054137fd` | **16,864** |
| Kneeling | `meditator_female_kneel_prayer_p05b.glb` | **439,088 B** | `533b84cba69332107ea25c57ed952b76c8276d4971a558496e4caf7aea400e9f` | **17,792** |

Both are real glTF2 GLBs with 9 meshes, 21 material definitions, 6 `KHR_materials_variants` colors, named `SeatRoot`, `HeadAnchor`, `NameplateAnchor`, `FXAnchor`, `UpperBodyBreath`; 2-second / 17-key `sit_idle` plus `cross_prayer_idle` or `kneel_prayer_idle`. SA compared original P0.5 vs P0.5b binary accessor bytes: 7/9 meshes unchanged (knees, feet, hair, eyes, blush, placket, buttons), and idle arrays were identical. This unchanged preservation is required for P0.5c as well.

Frozen lotus P0.2 SHA256: `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9` (262,108 B). Keep exactly same real geometry and actor seat transform convention; don't double-add `PadSeatAnchor=[0,0.195,0]`.

**Existing source restriction:** `p5b/procedural_female_hands_p05b.py` exists and explicitly imports `p05_source_frozen.py` (SHA `e6f7d06d3a3c78d055c6510d61d009a6bca877f03cd1c1323ee5602dcc633ad9`) and `p04_source_frozen.py` (SHA `b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2`). At this reviewed HEAD, these two dependency files **are NOT in the PR checkout**; recover byte-identical originals from the owner-supplied source bundle and put them in the new `p5c/` self-contained builder, or explicitly block clean reproduction. Never invent replacement source from images.

**Existing 3D evidence:** real P0.5b Cycles `p5b/P05B_Cycles_Evidence/` with old/new actor+pair, hand macros and five idle phases. Eight case stdout logs recorded `P05B_CYCLES_COMPLETED` and eight stderr files were empty. SA verified four new hand PNG SHA values and looked at front/side/left-right 3⁄4 plus both 9:16 pair views. However **full ZIP CRC and raw SHA of the four .blend files were NOT independently checked by SA**; record that limitation, don't reclassify as full PASS.

## 3. Required reading — actual sources in order

1. [Design/07 WORK_RULES](../Design/07_WORK_RULES.md), [Design/15 Sakura example](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md), [Design/14 zero-cost/asset policy](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md).
2. [Design/11 3D asset pipeline](../Design/11_3D_ASSET_PRODUCTION_PIPELINE.md), [Design/13 glTF/anchor contract](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/16 current art gate](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 execution order](00_P0_EXECUTION_ORDER.md).
3. [Task/AI_VISUAL_05](AI_VISUAL_05_FEMALE_PRAYER_HANDS_REFINEMENT.md), [Task/AI_VISUAL_04](AI_VISUAL_04_FEMALE_PRAYER_POSES.md) and latest SA **P0.5b Review #6009865513** on PR #2.
4. **Actual remote PR #2 HEAD:** `p5b/README.md`, `asset_manifest.json`, `P05B_VALIDATION.json`, `P05_CAMERA_CONTRACT.json`, `procedural_female_hands_p05b.py`, both real GLBs, four real editable .blend files, Cycles case JSON/logs and original PNGs.
5. Use owner's authentic video/reference only if available; do not invent precise frames or hand anatomy from an unavailable video. Treat actual P0.5b front/3⁄4/side Cycles as priority A/B reference.

## 4. Grounded SA Findings: physical change → required falsifiable evidence

**P0.5b real achievements to PRESERVE (PASS):** Fingers look softer, rounded and more natural; wrists and sleeves more continuous; both avatars are readable in 9:16. The **only new owner-facing refinement request** is improved *palm-to-palm gesture orientation*.

**Crucial geometry insight:** The P0.5b builder `one_soft_hand(sign)` mirrors X and produces independent watertight hand shells. Its previous reported **2.0613 mm X-plane / ~2.0667 mm nearest-vertex gap is a PROXY**, not proof that the facing regions of the palms rest together anatomically. In current front/3⁄4 images, broad outward-looking palm surfaces visually read as two upright hands, not prayer hands face-to-face. Do not blindly rotate both meshes around world X/Y/Z by the same guessed angle. First measure **local hand/palm coordinate frames, true surface directions, and camera projection** to determine what must rotate or reshape. A numerical inward orientation by itself is not enough if the visible silhouette still looks wrong.

| Priority | SA observation | Focused required physical action | Explicit proof / fail condition |
|---|---|---|---|
| **P0** | Palm faces appear upright/side-by-side instead of joining | Position/rotate or subtly resculpt palms **toward one another** in local hand wrist coordinates; maintain two distinct hands with credible palm-facing direction and gentle pressure | Same-camera GLB-reimport **front + left/right 3⁄4 + true side** macro; provide measured palm normal directions and labeled palm-contact regions |
| **P0** | Visible central seam/gap reads as air between the hands | Establish plausible **contact patch** (not just two nearest vertex tips). Reduce excessive visible gap without fused geometry or intersecting lobes | Report minimum distance/overlap **between actual facing palm surfaces** and contact-zone position; mark exact-mesh tested vs vertex proxy. No claim of contact based only on global x-plane gap |
| **P0** | Thumb edges can make hands seem open instead of praying | Adjust thumb resting, finger tilt and small inward curvature only as needed so palms press together and digits align naturally, preserving P0.5b soft finger shape | Front/3⁄4/side with unobstructed thumbs, finger direction and realistic wrist angle; no new squared or oversized fingers |
| **P0** | Both poses must share the same improvement | Apply the same prayer gesture standard in `cross_prayer` and `kneel_prayer`, with minimum pose-specific cuff/wrist compensation | Identical lighting/camera comparison for both poses, 9:16 on lotus and independent GLB exports |
| **P0** | Frozen body and animation cannot regress | Keep legs/knees/feet, hair, face, áo bà ba buttons/placket, six colors, pad, original root/anchors and all idle data exactly as currently reviewed; no camera tricks | Raw glTF accessor **array equality for every non-hand mesh** (or exact documented exceptional cuff edit); identical animation timestamps/values, anchor translations and material variant maps |
| **P1** | Small gesture must read on TikTok LIVE format | Adjust hand silhouette enough to clearly look praying in 720×1280 medium and close, not just under macro zoom | Actual Cycles 9:16 medium + close for BOTH poses with unchanged framing |
| **P1** | Existing hand mesh already adds ~3,602 tris over P0.5 | Prefer transform/light resculpt without further mesh inflation; **target total triangles no higher than P0.5b**. If unavoidable for clean contact, justify any increase and provide a lightweight/LOD alternative | Exact triangles/bytes/verts per pose with per-hand cost; no invented GPU/FPS |
| **P1** | Idle may expose wrist/palm clipping | Check 5 old animation stages t=0,0.5,1.0,1.5,2.0 s, both poses with hand-chin, hand-hand, cuff-hand, hair-arm relationships | Real imported GLB frame proofs and collision method, status `EXACT` / `PROXY_ONLY` as appropriate |

**Practical contact criterion (engineering target, not forced aesthetic threshold):** For the small facing region, aim for **visually continuous palm contact without a discernible gap at phone scale**. If using measurable surface gap, target contact separation ≈0–1.5 mm at several real palm-facing points, **without triangle penetration**; if Blender/SDF discretization makes a nonzero buffer necessary, disclose the achieved tolerance and render evidence. Simply reporting a 0-mm x-axis AABB gap or globally interpenetrating two hands is **NOT** sufficient. Describe palm surface normals and how the facing patches oppose each other; distinguish each hand's outer back vs inner palm. Do not hide the issue by shifting hands behind each other or turning the whole avatar away from camera.

## 5. Mandatory phase plan (Sakura style, no unproven PASS)

### Phase 1 — Baseline/source inspection and measured P0.5c plan
- Pull PR #2 at exact current HEAD; inspect both P0.5b GLBs as actual binary, original current builder, original Blender source and `p5b/P05B_Cycles_Evidence/`. Record old/new SHA, original contact proxy (2.0613 mm) and actual hand frames/surface facing normals from geometry, not guesswork.
- Reproduce P0.5b from recovered original source chain (clean folder): `p04_source_frozen.py`, `p05_source_frozen.py`, `procedural_female_hands_p05b.py`. **Must report reproducible byte-identical GLB SHA** before modifying the procedure. If this cannot run due missing original files, mark `SOURCE_BLOCKED`, request original files, and do NOT claim reproducibility.
- Write `p5c/P05C_PHASE_A_FINDINGS.md` with P0/P1, actual palm plane/normal data, source-level precise change list, target contact measurement procedure, unchanged-mesh budget, expected visual A/B.
- Reuse unchanged old P0.5b Cycles evidence; **do not rerun entire old P0.5 pipeline** unless same-camera A/B requires it.

### Phase 2 — Surgical P0.5c two-pose build
- Create real `p5c/meditator_female_cross_prayer_p05c.glb` and `p5c/meditator_female_kneel_prayer_p05c.glb`, distinct independently loadable GLB2 artifacts, with editable source Blender and deterministic `procedural_female_palms_p05c.py` (or a similarly named documented builder).
- Pose A and B must reuse original untouched character, crossed/kneeling leg geometry, hair, outfit, materials, scales and idle; only hand facing, relative position and optional local thumb/wrist/cuff geometry may change. Preserve named `cross_prayer_idle`, `kneel_prayer_idle`, `sit_idle`, 17 keyframes over 2 seconds.
- Create a single **conservative candidate**, not many unverified options. Keep hand geometry watertight and two separate connected hand shells, naturally touching/near touching along palm region; do not fuse hands into one object, and do not introduce finger/nail overdetail.
- Preserve both 6-color material variants as material mapping only, no duplicated meshes. Avoid touching frozen `p5b/` files.
- Tool costs zero: Blender + free local Python/trimesh/NumPy/scikit-image/VTK allowed. No paid generators/services or unlicensed 3D asset substitution.

### Phase 3 — Independent GLB, contact and matched real Blender Cycles
- Reimport the ACTUAL output GLBs (not the still-open in-memory procedural geometry) in Blender and glTF parser. Measure both palm facing surface normals, nearest distance across facing contact patches and penetration/contact using actual triangles if possible. If using vertex/ray/SDF proxy, label `PROXY_ONLY`; no unsupported `NO_INTERSECTION` claim.
- Verify glTF header, GLB bytes + SHA256, actual material mapping and six `KHR_materials_variants`, anchors, named clips, 2s/17 keys, bounding boxes and all mesh accessor arrays. Compare with P0.5b **7 previously untouched meshes byte-for-byte** plus face/legs/garment unchanged. Any sleeve/cuff movement must have explicit measured delta and reason.
- **Required Cycles A/B for EACH pose**, in exactly the *same camera, lights, FOV, AgX/0EV, 32-sample baseline*: (i) hands front macro; (ii) left 3/4 and right 3/4 macro; (iii) true hand side/profile macro; (iv) torso front and 3/4; (v) 9:16 medium **720×1280** and close on exact frozen lotus. Comparison must show **P0.5b before vs P0.5c after**, not two different camera rigs. Include one neutral open-camera view of the hand contact/inner palms for geometry audit, explicitly labeled **DIAGNOSTIC**, not to replace the required matched comparisons.
- **Idle:** t=0, .5, 1.0, 1.5, 2.0 s for both poses. Minimum front and side close hands at each time; require no visible palm separation, finger crossing, sleeve clipping, face/chin penetration. If old pose clip is unchanged, its original verified baseline data can be reused; actual new frames must be rendered.
- **Proof package:** actual Blender Cycles PNGs, old/new hand A/B contact sheets, 9:16 preview, original new `.blend` actor + pair files per pose, per-case `case_report.json` with actual GLB/PNG/blend bytes and SHA, actual stdout/stderr, `FILE_HASHES_SHA256.txt`, evidence ZIP with verifiable CRC, and `P05C_VALIDATION.json` with geometry/contact/animation/manifest diff. Any Blender/GLB test not run must be `NOT_RUN` and must NOT receive a PASS.
- Provide runnable Windows PowerShell owner command `run_p05c_blender.ps1`, exact repo-relative inputs and SHA-locked required old GLBs/pad. Use fail-on-exit and `--python-exit-code`; capture logs, report actual Blender version, no fabricated GPU FPS or LIVE Studio testing.

### Phase 4 — GitHub handoff / PR #2 STOP
- Commit new **`Assets3D/Review/lotus_pad_chibi/p5c/`** documentation/source: `README.md`, `P05C_PHASE_A_FINDINGS.md`, `asset_manifest.json`, `P05C_VALIDATION.json`, `PALM_CONTACT_REPORT.json`, `P05C_CYCLES_AUDIT.md`, `BINARY_HANDOFF.md`, `LICENSE_AND_PROVENANCE.md`, exporter and Windows runner scripts. Keep prior version directories immutable.
- Push small reproducible **source dependencies** to correct versioned location (with known SHA); if needed, owner later pushes large GLB/BLEND/Cycles/ZIP. For every file provide target path, original bytes and SHA-256, truthful `pending_owner_upload` until the exact GitHub binary is inspected. Do not replace true original evidence with a changed/cropped image or status-only report.
- P0.5b `README`/manifest currently still contain **pre-owner-run `NOT_RUN/pending` metadata** while remote P0.5b original GLBs, Cycles images/logs, Blend and ZIP do exist. Add an **append-only dated `P05C_BASELINE_REMOTE_AUDIT.md`** distinguishing verified bytes/contents from ZIP/Blend still not fully rehashed; do not silently rewrite baseline histories.
- Return **exact feature branch / new HEAD / PR URL**, diff and files, verified SHA/bytes/triangles/material counts/animations, palm-plane normals/contact report and real Cycles side/front/3⁄4/9:16 comparisons, exact owner-upload pending list, Windows reproduction commands and outstanding risks. **STOP**; SA reviews before owner decides. PR #2 remains Draft; no merge.

## 6. SA acceptance checklist / GO–NO GO

- [ ] **Both** poses visibly show soft fingers preserved from P0.5b, *actual two palms facing each other*, gently resting against one another, not two flat front-facing vertical hands, not fused into one block.
- [ ] **Front AND left/right 3/4 AND side** all read unmistakably as `chắp tay niệm Phật` without changing camera or obscuring palm relationship.
- [ ] Palm-contact patch / normal directions / gap or penetration status measured and disclosed honestly (`EXACT` or `PROXY_ONLY`); no invisible gaps hidden by perspective.
- [ ] All original cross-legged/kneeling legs, pad, áo bà ba, 6 material colors, long hair, face, named anchors, glTF2 contract and 2s/17-keyframe animations preserved. No change to unrelated source geometry.
- [ ] Real binary new GLB per pose; SHA/bytes/triangles/materials and imported mesh/animation diff. New editable Blender files are genuine; matched REAL Blender Cycles evidence, case reports/logs and owner-run hash/ZIP CRC evidence available.
- [ ] Current P0.5b source dependency gap fixed, or accurately identified as blocking clean regeneration. No claim of green full repro without exact dependency files.
- [ ] No invented benchmark; external paid cost `0 VND`; PR #2 remains Draft and all Codex/male/merge work paused.
- [ ] **SA independent review then OWNER explicit approval of BOTH female poses**. If palm relationship still looks wrong from any important angle, mark `ART_PARTIAL` and do not initiate male task.

**Final required state:** `P05C_FEMALE_PALM_ART_OWNER_REVIEW_REQUIRED` (even if all engineering tests pass). Never write `OWNER_APPROVED` yourself.

## 7. Required AI Visual return (self-contained Sakura handoff)

1. `SA issue → precise mesh/transforms edited → reproducible measurements → actual Cycles A/B → PASS/PARTIAL/NOT_RUN` for every P0/P1.
2. Tool versions and genuinely free-source/license/cost evidence.
3. Both new GLBs: exact SHA256, bytes, triangles/verts/meshes/materials, original mesh diff, palm normals and true contact measurements or `PROXY_ONLY`, unchanged palette/animation/anchor evidence.
4. Actual editable `.blend` + matched Blender Cycles front/left-right 3⁄4/side/9:16; per-file SHA, logs and ZIP CRC, unchanged P0.5b comparison references.
5. Feature branch, exact GitHub HEAD/PR link, small-file commits, binary upload state, Windows commands, blockers and specific decision requested of owner.
6. **STOP at `P05C_FEMALE_PALM_ART_OWNER_REVIEW_REQUIRED`**. No male/Codex/integration/merge until separate owner permission.

**SA gate:** This round exists *only* because the owner selected one final palm-orientation polish pass. It does not authorize any other pipeline activity.
