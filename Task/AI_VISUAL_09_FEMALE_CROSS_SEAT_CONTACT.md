# AI VISUAL 09 — P0.5f Female Cross-Legged Natural Seated Contact on Lotus

**Issued by:** Solution Architect (SA), 2026-11-22 · **Status:** ASSIGNED — FEMALE CROSS-LEGGED SEAT-CONTACT MICRO-POLISH ONLY / OWNER GATE OPEN.

**Nonnegotiable workflow:** **SA giao task → AI Visual produces real editable Blender + true GLB + Blender Cycles → SA independently verifies source/bytes/images on PR → owner approves → only then new stage.** Read [Design/07 — WORK_RULES](../Design/07_WORK_RULES.md) and follow [Design/15 — Sakura prompt style](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md). This is a standalone, independently executable production task with verifiable evidence, NOT a generic request to "make the avatar sit lower."

## 1. Role / owner direction / precise scope / STOP

**Role:** Independent AI Visual / Blender 3D specialist, not Codex.

**Owner observation from ORIGINAL uploaded Blender Cycles** \`p05e_cross_pair_pair_side_cycles.png\`: the P0.5e female chibi cross-legged pose **now looks broadly good**, including the improved natural-looking foot and waist garment continuity, **but still feels as though the seated body floats slightly rather than settling its weight fully onto its lotus seat**. Owner wishes **one small additional correction** for believable sitting contact — *without* redoing the already approved visual character or whole pose.

**Objective:** Locate and remove ONLY the residual perceptual/physical contact issue in the cross-legged seated pose. Crucially distinguish:
- **A. Torso / pelvis / upper-thigh-to-crossed-leg connection** (the clothed seated body rests on the folded legs, not necessarily buttocks directly on the leaf); and
- **B. Actual support of crossed legs, knees, folded feet and underside of trousers against the unchanged lotus top surface**.

A dark patch in the image is not by itself a proven physical air gap. **DO NOT assume merely lowering global Y solves the issue**: the leaf top is curved, support regions are local, and lowering can cause penetration or violate the seat anchor. Diagnose using REAL exported GLB and leaf triangles, actual original seat transform, and matched camera shots. Make the **smallest localized adjustment** required to give a convincing weight-bearing silhouette from the owner's exact side viewpoint.

**Frozen / NO REWORK:** P0.5e improved foot+ankle silhouette and local trouser cuff; completed blouse/waist continuity and no-background-hole during 0..16mm UpperBodyBreath; P0.5c praying palms/fingers and upper face/arms/eyes, long loose back hair, Vietnamese áo bà ba visual design/buttons, six color variants, two existing 2-second/17-key idle clip values and anchor semantics, original P0.2 lotus pad and Sakura R16. **Kneeling P0.5c is 100% frozen: no second kneeling GLB, no modification, no new animation.**

**Allowed minimum:** local SeatRoot hip/upper-pants underside, cross-legged thigh/folded trouser contact shape, limited lower waist garment integration only if diagnosis proves need, and **at most** a small explicitly measured pose-to-pad placement correction **outside the source animation**, if necessary and proven safe. Avoid arbitrary world offsets or global scale. **No mandatory numerical displacement is authorized before baseline measurements.** If change to seat root/placement would break named anchors / pad contract, choose a localized mesh fix or document migration for SA decision rather than silently applying it.

**Hard STOP:** On producing genuine P0.5f GLB, editable Blender and real Cycles, STOP for SA review + explicit owner visual OK. **No male build, Codex PR #3/#4, renderer, Event Engine, integration, GPU/LIVE Studio tests or merge.** Other female features remain provisionally visually accepted; P0.5f is only a micro-seat-contact gate.

## 2. Repo / exact PR and reviewed HEAD / frozen source and checksum references

- Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2
- Existing AI Visual PR #2 (Draft, no merge): https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2
- Branch: \`assets/lotus-pad-chibi-p0\`
- **SA-observed PR HEAD at issue:** \`5118dbd532347103ec5e84e2a22b88f63617dda5\` (owner push \`d09eb29..5118dbd\`). Check again BEFORE changing anything. If HEAD moved, inspect full changed files and report previous/current; never force-push, reset, or overwrite owner evidence.
- **Immutable baseline:** \`Assets3D/Review/lotus_pad_chibi/p5e/\`. DO NOT modify p5e/, p5d/, p5c/ files, original images or hashes.
- **New versioned output ONLY:** \`Assets3D/Review/lotus_pad_chibi/p5f/\`.
- **Baseline cross GLB now remotely present on PR:** \`p5e/meditator_female_cross_prayer_p05e.glb\`, **574,048 B**, SHA256 recorded in P05E case reports/manifest **\`0829edde73666460c457267672e344a61443ee2c882319998d5b84a359f81367\`**; 17,752 triangles / 9,084 vertices / 10 meshes / 21 material definitions / 6 \`KHR_materials_variants\`. Before invoking builder, independently \`Get-FileHash\` / \`sha256sum\` the ACTUAL checked-out file.
- **Frozen original kneeling** \`p5c/meditator_female_kneel_prayer_p05c.glb\`, SHA256 \`a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac\` (439,244 B). **NO re-export.**
- **Frozen lotus pad** \`lotus_pad_01.glb\` P0.2 SHA256 \`80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9\` (262,108 B). P0.5e bundle also has \`p5e/p02_baseline/lotus_pad_01.glb\`. Verify bytes/hash independently; no new pad model or changed lotus vertices.
- **P0.5e source:** \`p5e/P05E_CANONICAL_SOURCE.zlib.b64\` + \`restore_p05e_source.py\` recover deterministic cross generator, whose raw output source/GLB SHA are documented in [P05E_SOURCE_REPRO_AUDIT](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/5118dbd532347103ec5e84e2a22b88f63617dda5/Assets3D/Review/lotus_pad_chibi/p5e/P05E_SOURCE_REPRO_AUDIT.md). The plain source may need restoration; do not claim the original entire P04/P05 historical generation chain is fully reproducible. A P0.5f incremental, GLB-pinned modification can be separately reproducible.
- **Actual owner Cycles evidence now on PR:** \`p5e/P05E_Cycles_Evidence/p05e_cross_pair/p05e_cross_pair_pair_side_cycles.png\` (case_report claims **356,631 B**, SHA256 **\`51a93a08d047017dd9ad926d80f8002b09f47bc8d0fe594b6303e1eed295ee77\`**), plus pair front/quarter/9:16, actual \`.blend\` actor/pair, per-case reports and logs. **Presence and case-report hashes do not automatically mean SA independently verified all 152 files or ZIP CRC**. The README/validation retain pre-owner-run statuses \`PENDING_OWNER_RUN\` despite upload; an additive dated audit must distinguish current verified remote bytes from historical status. Keep old evidence unchanged.
- Original pair camera contract: \`p5e/P05E_CAMERA_CONTRACT.json\` (e.g., \`pairSide\`: camera (2.75,0.62,0.43), look-at (0,0.45,0), FOV 42°). Match this exactly for P0.5e-vs-P0.5f A/B. Original five idle stages t=0, .5, 1, 1.5, 2.0 seconds; upper-body breath +Y = 0/8/16/8/0mm, retained.
- **Coordinate convention:** glTF2 +Y up, +Z forward, meters. Named \`SeatRoot\`, \`HeadAnchor\`, \`NameplateAnchor\`, \`FXAnchor\`, \`UpperBodyBreath\`. \`PadSeatAnchor=[0,0.195,0]\` is an attachment convention, NOT proof the curved lotus provides actual support. Record exact actor-to-pad transforms from original paired Blender scene; no double-add anchor.

## 3. Required reading, in this exact order

1. [Design/07 Rules](../Design/07_WORK_RULES.md), [Design/15 Sakura example](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md), [Design/14 zero cost](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md).
2. [Design/11 asset pipeline](../Design/11_3D_ASSET_PRODUCTION_PIPELINE.md), [Design/13 GLB/anchor contract](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/16 owner gate](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 execution order](00_P0_EXECUTION_ORDER.md).
3. [Task/AI_VISUAL_08 P0.5e](AI_VISUAL_08_FEMALE_CROSS_FOOT_WAIST_CONTINUITY.md), [SA review P0.5d #6010466650](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6010466650), P0.5e README + updated owner screenshot/feedback “ok ổn, nhưng ... nên cho nhân vật ngồi hẳn xuống thay vì còn hở 1 xíu”.
4. Actual PR #2 p5e/ \`meditator_female_cross_prayer_p05e.glb\`, original p5e \`.blend\` actor/pair, P05E camera contract, Blender Cycles real PNG/case JSON/stdout/stderr, \`P05E_VALIDATION.json\`, \`asset_manifest.json\`, canonical generator/restorer and frozen exact P02 leaf GLB.
5. User's attached SIDE screenshot in this SA conversation (owner focal reference); if unavailable to AI Visual from GitHub, use the **exact original p5e side Cycles path** above with SHA and the latest SA/PR comment. The original video \`chuav2.mp4\` may inform style ONLY if accessible; do not invent frames.

## 4. Grounded SA findings → physical fix → falsifiable proof (P0/P1)

**Grounded owner art assessment:** \`P0.5e\` looks broadly improved and is **provisionally accepted visually**, but the owner highlights one **remaining perceived sitting/contact gap from side**. **Do not label this automatically a verified pad-to-body penetration or physically measured air gap before geometry inspection.**

| Priority | Observation / invariant | Action | Reviewer-checkable evidence |
|---|---|---|---|
| **P1 art GOAL** | Cross-legged body feels slightly lifted rather than settled on lotus in owner's exact side shot | Trace actual support of torso→folded legs→leaf; adjust ONLY local bottom thigh/hip trouser surface or validated small placement correction so the character appears naturally seated with a grounded load-bearing silhouette | Matched P0.5e/P0.5f real Blender Cycles **original SIDE**, low-SIDE both sides, underside 3/4, normal full/front 3/4, and 720×1280 9:16 medium; owner screenshot overlay / highlighted gap |
| **P0 geometry diagnosis** | A dark silhouette might be waist, contact or lighting | Distinguish **A: upper body-to-crossed legs** vs **B: cross-legs-to-curved leaf** vs lighting-only. Measure actual localized surfaces in common world-space after all parent transforms | P05F_SEAT_CONTACT_REPORT.json: gap/proxy distances per region, local support patches, contact transforms, before/after at five time stages |
| **P0 preserve prior repair** | P0.5e fixed a large waist view-through hole through breathing | Preserve existing blouse lower hem/hip underlayer and 0-background waist ray-window result; do not reopen waist seam or break 16mm breath | Repeat focused low-side waist test t=0/.5/1/1.5/2, screenshot + ray/test report; no need to rerender unrelated full P0.5e suite |
| **P0 preserve pose/identity** | Foot, hands, face/hair, áo bà ba and kneeling accepted baseline | Keep existing foot/instep anatomy and crossed silhouette, all hands/face/hair/upper garments/buttons/materials, six colors, named anchors, idle curves and original kneel GLB identical | Raw glTF buffer/accessor comparisons by unchanged mesh regions + animation samplers and material mappings; frozen kneel SHA |
| **P0 no collision** | Moving seat down may sink legs/feet into leaf or stretch cloth | Find physical support of **two or more appropriate folded-leg/pants/foot underside patches**, with realistic local contact and no obvious intersection. Document whether contact means adjacent, slight fabric compression or detectable penetration | Actual leaf-triangle raycasts/closest surface (or clearly labelled PROXY_ONLY), show colored contact-point map, before/after numerical min/max and collision flags |
| **P1 budget/compatibility** | Tiny art adjustment should not inflate draw calls | Prefer no new meshes/materials; record any changed SeatRoot actor-to-pad matrix and compatibility with future viewer registry/camera | Exact bytes/SHA/tris/verts/mesh/material count, small diff, placement-transform note, no fabricated RTX FPS |
| **P0 proof integrity** | Owner needs real technical artifacts, not a still-shot trick | Reimport raw GLB plus leaf into Blender, same camera/light/AgX/0EV/32 samples, 5 idle frames | Per-case original PNG hashes/bytes, logs, Blender .blend, documented ZIP CRC and exact baseline reference |

**Decision tree before editing:** (a) If gap is **shirt/hip-to-legs**, adjust only the lower hem/upper hip overlap; (b) if gap is **legs-to-pad**, adjust local support/leg underside or a measured seat attachment transform; (c) if numeric contact already exists but silhouette reads floating due to shading, make a **minimal legitimate garment/under-thigh shape correction** instead of arbitrary root Y offset or visual-only shadow darkening. Record which is true. **Do not force buttocks to directly contact the leaf** in a cross-legged pose where thighs/shins are intended supports.

**Acceptable visual result:** The avatar looks weighted and comfortable on the lotus with a natural compressed trouser line/seat patch, while keeping the serene chibi prayer posture. No visible “air stripe” or implausible hover from the owner's side shot; no foot disappearing inside the leaf, no garment crumpling into a thick disk and no unnatural leg shortening. Avoid a flat circular collider, underside sticker, unmotivated smooth blob or simply moving the camera to hide the artifact.

## 5. Four execution phases — SAME rigorous Sakura cadence

### Phase 1 — inspect baseline and test WHERE the tiny gap actually is
- Read actual PR HEAD and p5e binary source/report, Blender paired scene and original P02 leaf; verify SHA256 of both inputs and original actor-to-pad transform. Capture exact original side shot/camera at t=0, and compare t=.5/1/1.5/2 to decide whether the gap oscillates with breathing.
- Compute sampled real glTF actor-lotus world transforms; raycast and/or nearest-triangle distances for the underside of crossed pants/legs/feet **to the TRUE curved lotus top surface** in relevant X/Z support regions, and for torso/pants only if visibly implicated. Report minimum/median/95th percentile where meaningful, negative penetration depths if reliable, support-point IDs and camera-projected gap in original side shot. **Nearest-vertex ONLY → \`PROXY_ONLY\`**.
- Create \`p5f/P05F_PHASE_A_FINDINGS.md\` with **owner observation → verified gap class A/B/shading → measured cause → exact local mesh/seat transform edit proposed → expected Cycles and numeric acceptance**. Do not start remodeling until this report makes clear whether body contact or leaf contact needs correction.
- Freeze actual p5e hand/foot/hair/face/six variants/waist; don't rerun known-passing old P0.5e Cycles solely to inflate evidence.

### Phase 2 — build ONE very small P0.5f cross-leg seat-contact candidate
- Export **ONLY \`p5f/meditator_female_cross_prayer_p05f.glb\`** and genuinely editable Blender source (actor+paired review). Use the exact SHA-locked p5e raw GLB and unchanged P02 lotus as reference, with deterministic incremental source. The P0.5e canonical source restorer can help reproduce; report genuinely missing dependencies if any.
- If contact fix is a tiny local lower-trouser/hip mesh shift or roundness, keep exact foot, hands, upper blouse, hair, animation sampler arrays; explain local vertex indices and changed bounding box. If a placement transform is required instead, distinguish **actor GLB geometry** from **Blender pair-seat placement** and deliver an explicit versioned \`seatPlacement\` record; do NOT silently bake an arbitrary Y shift into \`SeatRoot\` or change glTF animation/root contracts. A placement-only fix may legitimately keep **the actor GLB SHA unchanged**; document this honestly, and still provide a reproducible p5f paired scene and placement evidence rather than force a fake geometry change for a new filename.
- Preserve both original idle clips (2s / 17 samples, same channel paths) and original UpperBodyBreath +16mm; retain correct material/6 color variant mappings. No new kneeling pose, no face/hair/hand/foot redesign, no leaf deformation.
- Before Blender, independently verify touched mesh POSITION/NORMAL/index ranges and untouched region equality; identify any new padding/support patches and their triangles/bytes. No paid tools; no V1 modification.

### Phase 3 — genuine GLB + original lotus Blender/Cycles A/B and five-frame seat check
- Re-import **both original P0.5e and new P0.5f actual exported GLBs** with the real SHA-locked P02 lotus GLB into Blender under exactly the SAME scene origin, seat transform, P05E_CAMERA_CONTRACT original pairSide and true low side/underside camera. **DO NOT adjust camera/lighting to make only the new version look more seated.**
- Main owner view: matched **\`pairSide\`** A/B with a highlighted local gap/seat patch; require right + left true side and *lowered camera looking slightly upward*, 3/4 both directions, full front/back and an under-side diagnostic for invisible penetration. Keep original P05e camera as first criterion.
- Genuine on-lotus **720×1280 9:16 medium and close**, plus a neutral same-angle actor-only profile if needed to disambiguate waist vs pad. Label special cutaways/hidden leaf screenshots DIAGNOSTIC and never substitute them for normal pair renders.
- At t=0.0, .5, 1.0, 1.5, 2.0 sec, record actual **foot/pants-to-pad contact** and **shirt-to-hip/leg overlap**, side and low side, using the 0/8/16/8/0mm UpperBodyBreath profile. No background-visible hole, underskirt clipping, floating thighs or penetrating leaf at any frame.
- Machine report \`P05F_SEAT_CONTACT_REPORT.json\`: exact transform (leaf and actor), original/new local support-patch geometry IDs, old/new surface distance distribution, actor-leaf penetration evidence (exact/proxy distinction), screen-space gap region if measurable, animation sampled transforms, art regression flags. **A global minY difference or one screenshot alone is NOT contact proof.** No magic fixed threshold imposed before measuring real mesh scale and camera pixels; justify tolerance from actual geometry and phone-size legibility.
- Deliver paired new Cycles images with actual per-PNG SHA+bytes, proper \`case_report.json\`, stdout/stderr, \`.blend\` editable source, all-files \`FILE_HASHES_SHA256.txt\`, a real ZIP with CRC checks and a Windows PowerShell runner that propagates Blender failures via \`--python-exit-code\`. If owner needs to run it, label \`PENDING_OWNER_RUN\` until original evidence exists. VTK previews are NOT Cycles.
- Validate real glTF2 9/10 meshes as applicable, tris/bytes/materials/6 color variants, unchanged kneeling SHA, and named anchors/sit_idle/cross_prayer_idle keyframes. No all-image ZIP/Blend hash claims without actually reading the bytes.

### Phase 4 — GitHub PR #2 versioned evidence handoff and stop
- Commit **new only \`Assets3D/Review/lotus_pad_chibi/p5f/\`** small README, P05F_PHASE_A_FINDINGS.md, P05F_SEAT_CONTACT_REPORT.json, asset_manifest.json, P05F_VALIDATION.json, P05F_CAMERA_CONTRACT.json, P05F_CYCLES_AUDIT.md, BINARY_HANDOFF.md, LICENSE_AND_PROVENANCE.md, actual deterministic exporter, Blender runner and Windows \`run_p05f_blender.ps1\`. Do NOT overwrite \`p5e/\` or original images/ZIP.
- Upload new big GLB/Blender/PNG/ZIP via owner where needed, listing actual measured exact bytes and SHA256 and correct repo-relative target paths. Mark \`pending_owner_upload\` until remote bytes independently verified; use a **dated additive \`P05F_BASELINE_REMOTE_AUDIT.md\`** to reconcile older pre-owner upload metadata in P05e with real remote files and what SA has/has not independently rehashed.
- Deliver exact branch/new PR HEAD, changed paths, old/new contact metrics, same-camera low side/front/9:16 Cycles A/B, source and license/cost, Windows upload/verification steps, all OPEN/PARTIAL/NOT_RUN items. Keep PR #2 Draft, no merge.
- **STOP** until SA explicitly reviews actual new GLB + Cycles and owner decides whether P0.5f seated contact is satisfactory.

## 6. Acceptance checklist (strict technical-vs-owner separation)

- [ ] **Owner side-view** P0.5f looks convincingly seated/grounded: no remaining perceptual gap and no heavy-looking rigid padding. Both sides and under-3/4 consistent.
- [ ] Identify and substantiate whether the old issue was torso/pants, trouser/lotus, both or shading; actual support patches and before/after numeric evidence, not a guessed global -Y offset.
- [ ] Real lotus, not plane: folded thighs/legs/feet have plausible support and no visible sinking/clipping across five idle timestamps.
- [ ] P0.5e improved **foot anatomy** and **waist hem continuity through +16mm breathing** still PASS; original female face/hair/áo bà ba six palettes/prayer hands unchanged.
- [ ] Kneeling P0.5c GLB and original lotus SHA unchanged; \`sit_idle\`/\`cross_prayer_idle\` 2s/17 samples and anchor node semantics intact, or explicitly versioned justified placement override.
- [ ] Genuine imported output GLB + editable .blend, real Cycles same-camera side/low-side/9:16 A/B, per-case JSON/log/hash/ZIP CRC and source provenance are actually produced or truthfully pending owner-run.
- [ ] No extra male, Codex, integration, GPU/LIVE or merge; zero-cost workflow.
- [ ] Final \`P05F_FEMALE_CROSS_SEAT_CONTACT_OWNER_REVIEW_REQUIRED\` until SA review then **explicit owner OK**. If significant floating remains, return ART_PARTIAL; if penetration remains, CONTACT_PARTIAL.

## 7. Required AI Visual response format (Sakura)

1. **SA finding → measured cause → surgical change → numeric contact proof → actual Cycles A/B → PASS/PARTIAL/NOT_RUN**.
2. Real Blender/tool versions and paid cost (0 VND if verified); source provenance and license.
3. New cross GLB **actual SHA-256/bytes/triangles/meshes/materials**, whether byte-identical to baseline if placement-only, exact old/new actor+lotus transforms and local support-patch metrics, hands/foot/waist/idle/anchors/six variants preservation and frozen kneel SHA.
4. Genuine original/new paired Cycles: owner SIDE view, both low-side viewpoints, under-3/4, 720x1280 9:16, five idle frames, original .blend and ZIP/CRC/SHA/raw logs.
5. Feature branch + full new HEAD/PR link, committed docs/source and owner-upload pending list plus Windows PowerShell reproducibility steps.
6. Risks/unknowns and final status **\`P05F_FEMALE_CROSS_SEAT_CONTACT_OWNER_REVIEW_REQUIRED\`**; STOP for independent SA review and owner artistic approval. No next phase automatically.

**Success is natural seated support in the exact owner camera, not a lower root coordinate for its own sake.**