# AI VISUAL 08 — P0.5e Female Cross-Legged Instep & Waist Continuity Fix

**Issued by:** SA, 2026-11-22 | **Status:** ASSIGNED — TWO P0 ART BLOCKERS, FEMALE CROSS-LEGGED ONLY | **Owner gate:** OPEN

**Mandatory Sakura sequence:** SA assigns task → AI Visual delivers genuine GLB + editable Blender source + real Cycles → SA independently reviews exact evidence on PR → owner approves → only then next phase. Follow Design/07_WORK_RULES.md and Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md. This is the standalone executable task, NOT generic advice to “improve the feet” or to hide an error using a camera.

## 1. Role, exact scope, objectives, and hard STOP

**Role:** Independent AI Visual / Blender 3D artist, NOT Codex. Owner rejected two precise visual aspects of P0.5d:

**BLOCKER A — Unnatural foot:** The new beige foot appears as a small round pebble in P0.5d front, and a pointed detached wedge in 3/4/side close. Owner wants a small **recognizable chibi foot/instep**, with credible ankle connection and toe direction under the folded trouser cuff, not simply a skin-tone dot.

**BLOCKER B — Disconnected torso / crossed legs:** A dark see-through gap under the lower áo bà ba hem makes the upper body appear to float above folded trousers in side/low-angle views. This existed already in P0.5c, as matched Cycles proves, and becomes more apparent from slightly below. The upper and lower body must look visually continuous throughout the original breathing animation.

**One revised asset only:** female CROSS-LEGGED prayer pose P0.5e. Keep the kneeling female P0.5c exactly unchanged. Only alter foot, adjacent ankle/cuff/fold, and the minimum under-shirt/waist/hip junction needed to close the gap.

**Freeze all other art/contracts:** P0.5c palms/fingers/wrists, sleeves except the localized LOWER hem if needed, face, long hair, body scale, áo bà ba style/buttons/upper placket, six color variants, entire kneeling asset, frozen lotus pad, Sakura R16, SeatRoot/HeadAnchor/NameplateAnchor/FXAnchor, two idle clips and original 2s/17-sample breathing. Do not make a new person, move the global model, change camera, alter animation to conceal a defect, build a male, touch Codex PR #3/#4 or merge.

**STOP:** Produce P0.5e real assets/evidence then STOP for SA review → owner visual approval. Technical PASS is not artistic approval.

## 2. Repo, PR, exact reviewed baseline, hashes, immutable paths

- Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2
- Existing feature PR #2 (DRAFT): https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2
- Branch: assets/lotus-pad-chibi-p0
- **SA-reviewed PR HEAD:** e34eee82afafbcb174e71f710e6e630b59a784f0. Recheck HEAD before changes; if moved, inspect new commits, no force-push/reset.
- **Latest SA review:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6010466650
- **Immutable baseline folder:** Assets3D/Review/lotus_pad_chibi/p5d/
- **New work/output only:** Assets3D/Review/lotus_pad_chibi/p5e/
- Never overwrite original P0.5c, P0.5d, kneel or lotus data.

**Independently verified original GLB bytes & SHA-256:**

| Actor | GLB | Bytes | SHA-256 | Triangles |
|---|---|---:|---|---:|
| Cross P0.5d (working baseline) | p5d/meditator_female_cross_prayer_p05d.glb | 471252 | 0f169e427cc70bc0b5b744db935c4de4ecac356ef3fc8a1113812a5bf0780e44 | 17184 |
| Cross P0.5c (inherited-gap reference) | p5c/meditator_female_cross_prayer_p05c.glb | 424784 | 1da8c12982165cf57e2ef678013cdd57b67bba7fd6c08e2979c267599d35e5bf | 16864 |
| Kneel P0.5c (FROZEN, NO REBUILD) | p5c/meditator_female_kneel_prayer_p05c.glb | 439244 | a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac | 17792 |

P0.5d: 10 meshes, 21 material definitions, six KHR_materials_variants and two 2-second 17-key idle clips. Frozen lotus P0.2 SHA256 80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9 (262108B).

**REAL owner Cycles proof, identical to owner-uploaded screenshots:**
- SIDE (356675B, SHA256 0c5ae8dc30a25607e3b8dfa4e2bb4e000ea7e236b1dedf3faf4bdac6494a1b92):
https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/e34eee82afafbcb174e71f710e6e630b59a784f0/Assets3D/Review/lotus_pad_chibi/p5d/P05D_Cycles_Evidence/p05d_cross_pair/p05d_cross_pair_pair_side_cycles.png
- FRONT (360105B, SHA256 8e7e64dae02ac8130ff5eec9f0281e1e35e4899fd6e6fed9c5924cc7d121d413):
https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/e34eee82afafbcb174e71f710e6e630b59a784f0/Assets3D/Review/lotus_pad_chibi/p5d/P05D_Cycles_Evidence/p05d_cross_pair/p05d_cross_pair_pair_front_cycles.png
- Inherited side gap P0.5c matched:
https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/e34eee82afafbcb174e71f710e6e630b59a784f0/Assets3D/Review/lotus_pad_chibi/p5d/P05D_Cycles_Evidence/p05c_cross_pair/p05c_cross_pair_pair_side_cycles.png

Original P0.5d editable Blender, Cycles logs, source and GLB are on PR #2; exact GitHub binary hash of P0.5d independently verified, 4/4 Blender case stdout completed and 4/4 stderr empty. Full ZIP CRC and both >1MB Blend raw SHA are NOT YET INDEPENDENTLY VERIFIED by SA: keep this limitation explicit.

## 3. Required reading in order

1. Design/07_WORK_RULES.md; Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md; Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md.
2. Design/11_3D_ASSET_PRODUCTION_PIPELINE.md; Design/13_3D_EVENT_INTEGRATION_CONTRACT.md; Design/16_P0_APPROVAL_AND_HANDOFF.md; Task/00_P0_EXECUTION_ORDER.md.
3. Task/AI_VISUAL_07_FEMALE_CROSS_LEGGED_FOOT_VISIBILITY.md and exact SA review URL in §2. Owner screenshot critique: "bàn chân chưa đạt thẩm mỹ; khi nhìn ngang từ dưới thấy khoảng trống giữa thân trên và thân dưới."
4. Exact GitHub P0.5d original GLB, procedural_female_cross_foot_p05d.py, validate_p05d_checkout.py, asset_manifest.json, P05D_VALIDATION.json, P05D_Cycles_Evidence actor/pair original PNGs, actual owner-pushed .blend source and 32-sample Cycles case reports/logs. P0.5c identical-camera side original as comparison.
5. Original chuav2.mp4 only if truly accessible; don't infer unobserved visual details.

## 4. Grounded SA Findings and falsifiable acceptance criteria

**A — Foot geometry root cause (verified in source):** P0.5d creates a 162-vertex / 320-triangle skin-tone foot from trimesh.creation.icosphere(subdivisions=2), stretched into a capsule, then shifts 54 trouser-cuff vertices locally by up to 20.382mm. P0.5d validation lists vertex-to-pants ~3.11mm and vertex-to-original-sandal ~2.84mm as PROXY_ONLY, not proof of continuity/welding. Actual full/front and macro Cycles show a rounded beige plug on screen-right and a tiny pointed wedge from side.

**Required fix:** Sculpt a restrained, natural ankle–instep–toe profile with an identifiable foot direction continuous with the corresponding folded shin. Respect original chibi scale and modest coverage, soften the trouser hem around the emerging foot, keep the other tucked foot in place. Avoid a second floating skin ellipsoid, giant bare foot, five photoreal toes, toe nails or a trouser-colored fake foot. State true ankle starting coordinates / ankle-to-toe vector, vertices/tris, actual garment connection method and material used. If two meshes are used for foot/leg, prove their visible join is continuous from front/3/4/side and do not mislabel separate intersecting meshes "physically welded".

**B — Torso gap root cause (verified on raw P0.5d GLB):**
- ao_ba_ba_pants_SeatRoot_mesh (1538 vertices): **actual maximum vertex Y 0.2525152564m**.
- ao_ba_ba_top_UpperBodyBreath_mesh (924 vertices): **actual minimum vertex Y 0.2670008540m**.
- Their global Y-ranges are strictly separated at rest by **at least 0.0144856m (14.49mm)**; this is not a local surface distance but a guaranteed global vertical separation.
- Actual sit_idle and cross_prayer_idle move UpperBodyBreath **+Y from 0 to +0.016m**, while SeatRoot/pants remain still. At peak t≈1s, the lower bound on separation between these two meshes is therefore **30.49mm**.
- P0.5c same-camera SIDE already shows a background-visible gap; not a newly introduced P0.5d issue.

**Required fix:** Locally extend/refine the LOWER áo bà ba hem and/or add a tasteful concealed hip/waist connecting fabric/underlayer with accurate material, normal orientation, hierarchy, and gentle folds so the body appears continuous **throughout breathing**. Preserve collar, buttons, classic áo bà ba silhouette, full shoulder/face/hair/hands. If bridge moves with UpperBodyBreath, give enough Y/XZ overlap at the maximum +16mm motion, without punching into pants; if anchored at SeatRoot, keep a graceful join across both extremes. Do not lower the entire upper body, change animation or anchors, introduce a thick black filler plug, paint darkness over the gap, move the camera or create a one-frame fix.

**Proof must go beyond AABB Y overlap:** After adding geometry, report the relevant waist/hip local surface placement and a low-side/underside ray-visibility/contact test. Plain minY <= maxY is necessary but not sufficient; prove NO visible background slit for front/side/under-side 3/4 and 5 idle samples.

| Priority | Issue | Required change | Independent proof |
|---|---|---|---|
| P0 visual | Foot like a tiny pebble/point | Real ankle/instep/rounded toe direction from correct crossed shin | Matched P0.5d→P0.5e actual GLB Cycles front, left/right 3/4, true side + foot macros; standard-view readability |
| P0 visual/animation | Upper torso floats over crossed legs | Small natural waist / lower shirt hem connection covering original 14.49–30.49mm guaranteed gap across 2s idle | Matched SIDE and **LOW-ANGLE UPWARD SIDE** before/after, both sides + under-3/4, at t=0/.5/1/1.5/2 |
| P0 preserve | Hands, upper garment design, face and hair accepted | Preserve original prayer hand geometry, hair, face, torso and buttons above localized waist repair; no new rig changes | Actual glTF accessor-by-region comparison, exact 6 material variant maps, same anchor transforms/17-key idle |
| P0 frozen kneel | Original P0.5c kneel accepted | Never generate another kneel GLB | No changed p5c files/new kneel; reference frozen kneel SHA |
| P0 pad contact | Foot may clip pants/leaf or appear floating | Verify foot–cuff and foot–pad support, without moving seat/root/lotus | Numeric triangle/raycast or labeled PROXY_ONLY + side/under-side real Cycles |
| P1 crowd | Avoid bloated extra meshes | Reuse original materials, minimal geometry; justify extra triangles/draw calls | Exact old/new bytes, tris, meshes and material counts |
| P1 9:16 | Tiny instep may be unreadable | Clearly recognizable foot in normal front/3/4 medium without dominating figure | Matched 720x1280 medium+close phone-size comparison |

## 5. Mandatory independent phases (Sakura)

### Phase 1 — audit exact GLBs, original Cycles and source/hierarchy
- Check current PR HEAD and P0.5d / P0.5c SHA. Inspect raw imported GLB + original editable Blender, the P0.5d icosphere foot and both P0.5d/P0.5c matched photos.
- Map upper/lower shirt/hip geometry in world-space under SeatRoot vs UpperBodyBreath; calculate old waist separation at five animation times, actual local X/Z gap and original low-angle/background leakage. Measure ankle/shin/cuff and exposed foot placement. Do NOT assume a static visual stitch works through breathing.
- Deliver p5e/P05E_PHASE_A_FINDINGS.md with two separate rows issue→cause→minimal mesh change→camera/measurement proof, original file hashes and source status. Preserve p5d folder.

### Phase 2 — build ONE P0.5e cross-legged revision
- Export p5e/meditator_female_cross_prayer_p05e.glb only, with editable .blend actor+pair projects and deterministic builder script. Reuse the sha-locked original p5d GLB (or P0.5c source with equivalent proof) as geometry baseline. Do not require unavailable P04/P05 builder chain to claim this incremental P0.5e build is reproducible.
- Resculpt just foot/ankle/cuff and lower shirt hem / waist underlayer. Make the shirt/pants visually connect naturally with positive overlap through 0..+16mm breathing. Do not alter other legs, face/hair/upper button area/hands/6 colors, frozen lotus or original kneel. New material only if justified, preferably reuse original.
- Test changed mesh/vertex bounding boxes and data. The original sit_idle and cross_prayer_idle must remain **2s/17 keys byte-exact** (unless owner separately changes requirements, not authorized here).

### Phase 3 — real exported GLB, Cycles A/B and dynamic underside test
- Re-import **actual** exported old P0.5d and new P0.5e GLBs into Blender. Match previous camera/light/FOV/AgX 0EV/32 samples and actual frozen lotus. Render actual Cycles, not merely VTK/procedural preview.
- Required unchanged-camera actor/lotus shots: **front, both 3/4, true left/right side, back, foot macro front/3/4/side, 9:16 medium and close at 720x1280**. Compare original P0.5d and new P0.5e at same pose time.
- **New diagnostic cameras (required, in addition):** LEFT under-side view aimed UP at waist, RIGHT under-side view aimed UP, under-3/4 or under-back, and a waist close-up. Record exact camera position/look-at/FOV in P05E_CAMERA_CONTRACT.json. A no-lotus version is allowed only as clearly labeled geometry diagnostic; normal pair proof must retain lotus. At least one OLD vs NEW low-angle comparison is essential.
- **Mandatory animation times:** t=0.0,0.5,1.0,1.5,2.0s. Show waist continuity from side and below and foot placement from front/side at each point. Specifically t=1.0 should exercise maximum +16mm UpperBodyBreath lift. No background hole, popping, foot clipping or disappearing waist seam at any point.
- Quantify new true shirt minY, pants maxY at all times, local waist join distances / ray-visibility, foot-to-ankle/pants/lotus adjacency, exact surface collision if possible; if approximate use PROXY_ONLY. **An AABB global overlap alone is not enough to pass.**
- Create concise BEFORE/AFTER contact sheets: (A) foot front/3/4/side; (B) waist SIDE+LOW-SIDE t=0 and t=1; (C) 9:16 medium full on lotus. Include real new .blend, GLB, PNG sha256/bytes, case_report.json, stdout/stderr, FILE_HASHES_SHA256.txt, ZIP/CRC. Blender --python-exit-code Windows runner must propagate errors; no false PASS when owner run missing.
- Independently check glTF2 header, exact SHA256 & bytes, geometry/meshes/material variants/anchors and animation, unchanged approved hand/face/hair mesh arrays (except localized lower hem if needed). Report each actual changed mesh/vertex region.

### Phase 4 — GitHub versioned handoff and SA/owner STOP
- On existing PR #2 asset branch only, commit new p5e/ small README.md, P05E_PHASE_A_FINDINGS.md, P05E_CAMERA_CONTRACT.json, asset_manifest.json, P05E_VALIDATION.json, P05E_CYCLES_AUDIT.md, BINARY_HANDOFF.md, LICENSE_AND_PROVENANCE.md, reproducible source scripts and Windows runner. Keep all previous p5d/p5c files unchanged.
- Owner may push large GLB/BLEND/Cycles/ZIP to exact p5e/ paths with original SHA/byte metadata. Mark pending_owner_upload or PENDING_OWNER_RUN until actual GitHub remote binary exists and is hash-verified. Prior p5d manifest still has stale pre-owner-run statuses; create a **dated additive p5e/P05E_BASELINE_REMOTE_AUDIT.md** with what SA actually verified, not an ungrounded modification of historical reports.
- Report exact PR HEAD, diff, source hashes, old/new technical/visual comparison, remaining blockers and true upload state; PR title can be updated to reflect p5e if feasible. No merge.

## 6. SA GO / NO-GO checklist

- [ ] New exposed foot reads as a modest natural **ankle–instep–toe** continuation from folded shin from normal front and 3/4; NO visible beige pebble or pointed detached wedge.
- [ ] Original waist hole **no longer visible** in old failing true-side and NEW low-side/under-side views at all five idle times including peak breathing; not hidden by framing.
- [ ] Upper/lower garment junction is visually natural and credible, with documented local overlap/contact evidence; unchanged authentic áo bà ba style.
- [ ] P0.5c praying hands, face, hair, 6 color variants, seat/head/nameplate/FX anchors and original 2-second 17-key animations still match baseline.
- [ ] No changed original kneeling GLB; no lotus/other stage edits.
- [ ] Actual binary cross GLB + editable Blender source, Cycles same-camera A/B from true reimport including low-angle waist and 9:16, SHA256/bytes/geometry, per-case logs+ZIP CRC supplied; source status truthful.
- [ ] No paid tools, no male, Codex, integration, GPU/LIVE testing or merge.

**Final state until SA then owner explicitly approve both fixes:** P05E_FEMALE_CROSS_FOOT_WAIST_OWNER_REVIEW_REQUIRED.

## 7. Required Sakura-format response

1. Two rows of **SA finding → precise mesh/rig edit → numerical measurements → real Cycles A/B → PASS/PARTIAL/NOT_RUN** (foot and waist separately).
2. Tool/Blender versions, source provenance/licenses, paid-cost statement (0 VND if true).
3. Exact PR branch, new HEAD, versioned files and SHA256/bytes/tris/meshes/materials, changed vertex/mesh bounds, untouched hand/face/hair/animation/6 colors/anchors and frozen kneel SHA.
4. Authentic .blend + real Cycles **foot and low-angle waist** comparisons at five idle times, ZIP/PNG/log/CRC checks, original 9:16, numeric contact vs PROXY_ONLY evidence.
5. Any source or owner-upload remaining blockers and exact PowerShell owner-run/verify instructions.
6. Final status P05E_FEMALE_CROSS_FOOT_WAIST_OWNER_REVIEW_REQUIRED, STOP for SA review and owner acceptance. **No male / Codex / merge.**