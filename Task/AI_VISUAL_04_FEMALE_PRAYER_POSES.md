# AI VISUAL 04 — P0.5 Female Prayer Poses: Refined Cross-Legged Knees & Kneeling on Lotus

**SA issued:** 2026-11-22 | **Assignee:** AI Visual 3D artist | **Status:** ASSIGNED — FEMALE ART ONLY / OWNER POSE APPROVAL PENDING

**Mandatory Sakura workflow:** SA assigns a detailed versioned task → AI Visual creates real editable source, GLB and matched Blender Cycles evidence → SA verifies files and reviews PR → owner approves visuals → only then a new phase. Follow Design/07 and Design/15. This is the authoritative self-contained task, not an optional idea list.

## 1. Role, objective, STOP and scope

Only refine the existing female chibi and create TWO distinct prayer pose variants:

- **A — cross-legged prayer:** improve the owner-criticized current knee / crossed-leg geometry and trouser folds so left and right knees, thighs, tucked legs and feet read as one natural chibi seated posture; BOTH hands pressed palm-to-palm in prayer (chắp tay niệm Phật), fingers facing upward at chest, shoulders relaxed, elbows natural.
- **B — kneeling prayer:** NEW pose on BOTH knees, lower legs/shins folded backward, feet below/behind torso, upright balanced body; BOTH palms together at the chest, in same gentle Buddhist prayer gesture. Must be visibly different from the cross-legged variant in front/side/back.

**P0 preserve:** Owner likes overall P0.4 female áo bà ba and long loose hair (to back/waist), calm face, scale, six independent apparel color palettes, unchanged P0.2 lotus leaf, Sakura R16 art freeze. Improve only legs/knees, arms/hands, pose-dependent garment folds and hair drape needed to avoid collisions. Do not recreate entire body.

**STOP:** No male character (male gets a separate task only AFTER owner approves BOTH female poses). Codex PR #3/#4, integration, GPU, LIVE, other scene assets and ALL merges remain ON HOLD. PR #2 stays Draft. Do not silently equate a render PASS with owner art approval.

## 2. Repo, PR, exact baseline and new version paths

- Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2
- Existing PR #2: https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2
- Branch: assets/lotus-pad-chibi-p0
- **Observed PR HEAD at task creation:** 6894dcdd60e5c03a638824950419015e7634fe00. Verify HEAD before editing and report if changed.
- **Immutable source:** Assets3D/Review/lotus_pad_chibi/p4/
- **New P0.5 ONLY:** Assets3D/Review/lotus_pad_chibi/p5/ . Do not replace p2/p3/p4 source, GLB, Blender evidence, reports or hashes.
- P0.4 female GLB according to current PR #2 manifest / Cycles report: meditator_female_ao_ba_ba_p04.glb; 244348 bytes; SHA256 **586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09**; 9718 triangles, 5063 vertices, 9 meshes, 21 material definitions (including alternatives).
- Frozen lotus leaf GLB by p4 manifest: SHA256 **80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9**; 262108 bytes, 10648 triangles. DO NOT CHANGE or re-export leaf.
- The current PR file list contains the P0.4 Cycles PNGs, reports, two Blender review projects and GLB. Older P04_VALIDATION / manifest may still say Blender NOT_RUN / source NOT_CREATED. Check actual owner files and log/SHA independently before changing these stale fields. SA has NOT certified all original P0.4 uploaded bytes in this task issuance.
- Pose/asset contract: glTF2, +Y up, +Z female forward, 1 unit = 1m, SeatRoot originally [0,0,0], HeadAnchor [0,0.835,0.04], NameplateAnchor [0,1.335,0.03], FXAnchor [0.37,0.805,0.16], PadSeatAnchor [0,0.195,0]. Existing sit_idle 2 seconds, 17 keyframes. Preserve semantics; measure and document any pose-specific new local anchor offsets and parent transforms. Do not apply +0.195m twice.

## 3. Required reading in order

1. Design/07_WORK_RULES.md and Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md (style and PR/handoff).
2. Design/11_3D_ASSET_PRODUCTION_PIPELINE.md, Design/13_3D_EVENT_INTEGRATION_CONTRACT.md, Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md, Design/16_P0_APPROVAL_AND_HANDOFF.md.
3. Task/AI_VISUAL_03_FEMALE_AO_BA_BA_LONG_HAIR.md, Task/AI_VISUAL_02_ART_REFINEMENT_AND_OWNER_GATE.md, latest review/comments on PR #2, owner's latest feedback: crossed legs/knees ugly; clasp hands in this pose; add kneeling prayer pose.
4. PR #2 actual p4 source, asset_manifest, P04_VALIDATION, P04_Cycles_Evidence original GLB and original editable Blender project. Inspect current HEAD, especially the two source meshes and animation hierarchy. Use video chuav2.mp4 only if the actual reference is accessible; do not invent unseen frames.

## 4. SA Findings → actionable fix → verifiable evidence

| Priority | Issue | Required physical change | Required proof |
|---|---|---|---|
| P0 | Crossed knees/legs not aesthetic | Two coherent knee volumes, smooth thigh-to-shin transition, folded/tucked feet and natural loose-pants folds; avoid intersecting tubes, detached knee spheres, sharp implausible folds | P0.4 vs P0.5 crossed front, both sides, 3/4, knee close-up, matched camera/lights |
| P0 | Hands currently not prayer gesture | Both palms close together, upright fingers, wrists aligned, centered in front of chest; arms/sleeves follow, elbows relaxed; no fused mittens, crossed forearms or floating hands | Two dedicated hand close-ups front and side, full body front/3/4 and 9:16 |
| P0 | Missing kneeling pose | Both knees physically support on lotus, shins/feet folded back, stable torso and correct praying hands; visually distinct from crossed pose | Kneel front, side, rear, 3/4, knee+pad contact close-up |
| P0 | Identity and garments must remain | Reuse P0.4 face, Vietnamese áo bà ba, six selectable color slots, long loose female hair; only deform costume/hair for poses | Controlled P0.4→P0.5 body/material comparison, back-hair and garment images |
| P0 | Pose-specific collision | Check interpenetration hand-hand, hand-sleeve, sleeve-chest, knees-trousers, long hair-back/arms and knees/shins/feet-lotus at animation frames | Numerical/surface checks and Cycles from multiple views, exact limitations reported |
| P1 | Stable runtime asset contract | Separate poseId and actual actor anchors, compatibility notes if kneeling changes stature, two importable GLBs or reviewed equivalent | GLB node/animation/anchor manifest and independent import test |
| P1 | Geometry / crowd budget | Do not copy separate geometry for each of six colors; quantify pose GLB bytes, triangles, drawcalls/material variants vs baseline | Exact measured table, no invented FPS or VRAM claims |

**Pose geometry guidance:** Keep the stylized chibi anatomy (not realistic adult anatomy). In crossed pose, show both knee contours clearly without a bulky amorphous lump. In kneeling pose, knees contact near center support, lower legs sweep backward and the torso remains vertical; avoid an accidental crouch/squat. Both hands must really look like two hands pressed together to pray.

**Leaf/contact guidance:** With the P0.2 leaf immutable, the kneeling contact patches may be DIFFERENT from the cross-legged sitting contact. Measure actual imported mesh against pad top surface and declare each pose's root-to-pad transform, support patches and any floating/penetration. The numeric pad Y=.195 alone is NOT collision evidence.

## 5. Phased execution — mandatory

### Phase 1 — audit and preserve the current source
- Verify PR HEAD, source GLB hashes, P0.4 Blender source, animation channels, body/legs/hand mesh layout, material variant extension and named anchors. Do not assume an editable skeleton exists; report whether pose editing uses mesh modeling, Blender armature, custom pivots or procedural transforms.
- Write P05_PHASE_A_FINDINGS.md with findings, current model components, exact expected edits and A/B proof, explicitly preserving P0.4 plus the frozen leaf. Reconcile stale P0.4 evidence claims only if original byte hashes, report and logs confirm the owner run.

### Phase 2 — create true P0.5 female pose assets
- Create independent reviewable GLBs **meditator_female_cross_prayer_p05.glb** and **meditator_female_kneel_prayer_p05.glb** plus original editable .blend source(s) and reproducible Blender/Python exporter. Both must represent SAME approved female character.
- If appropriate, share one source rig/body/material organization, export fixed static pose plus named idle per asset. Suggested clips: cross_prayer_idle, kneel_prayer_idle. For both, document real clip duration, keyframe counts and whether existing P0.4 sit_idle was preserved/retargeted. A static pose MUST be labeled STATIC / ANIMATION_PENDING, not falsely described as animated.
- Preserve six reusable áo bà ba palette variants by validated KHR_materials_variants mappings (or equivalent documented material-slot approach); color variants must not duplicate geometry. Record compatibility of colors in both GLBs, no runtime code.
- Work with plain Blender/local Python/free licensed assets only. External paid calls = 0 VND.

### Phase 3 — exported GLB import and Blender Cycles proof
- Re-import ACTUAL exported GLBs into Blender (not just source mesh render). Use identical camera, FOV, lighting, world exposure/AgX/sample settings for comparison: P0.4 original crossed vs P0.5 crossed, and P0.5 crossed vs P0.5 kneeling.
- **For EACH pose, actor images:** front, left-side, right-side, rear, three-quarter, hand close front, hand close side, knees/feet close front and side.
- **For EACH pose, seated on untouched lotus:** front, three-quarter, side at waterline, 9:16 FULL (whole actor and leaf), 9:16 MEDIUM (readable hands, face and torso), 9:16 CLOSE (praying hands, face, knee pose); identify intentionally clipped leaf if any.
- Sample t=0.0, .5, 1.0, 1.5, 2.0 sec for BOTH poses; inspect hands/arms, hair/back, knees/pad, áo bà ba hem and camera/anchor stability. Add side/rear frames where collision requires.
- A/B contact sheets REQUIRED: (1) old P0.4 crossed vs new P0.5 crossed focus on knees+hands, (2) P0.5 crossed vs kneeling front/side/3/4, (3) both poses sitting on lotus in vertical 9:16. Also at least one six-color sheet and proof both variants support six choices.
- Generate P05_VALIDATION.json listing actual SHA256, bytes, triangles, vertices, mesh/material/texture count, bounds, exact node names and poseId, animation clips/frame samples, measured pad/knee/shin contact, hand/hair/garment collision method & evidence, variant mappings and any unsupported features.
- Supply real Blender Cycles PNGs, per-case case_report.json (source hashes, exact per-PNG SHA+bytes, cameras, Blender version, samples), stdout and stderr for each case, FILE_HASHES_SHA256.txt and zipped evidence with CRC validation and original .blend files. **Never invent these checksums or claim Cycles PASS before the owner/local Blender run exists.**
- Collision status must distinguish exact mesh-vs-mesh check from nearest-vertex approximation. Missing exact check = COLLISION_PROXY_ONLY, not "perfectly intersection-free".

### Phase 4 — GitHub PR #2 handoff and STOP
- Commit p5 small source/docs: README.md, P05_PHASE_A_FINDINGS.md, asset_manifest.json, P05_VALIDATION.json, COLOR_VARIANTS.md (if changed), LICENSE_AND_PROVENANCE.md, BINARY_HANDOFF.md, reproducible Blender/PowerShell scripts and evidence summary.
- Real GLB / Blender / large PNG/ZIP may be owner-uploaded later: give precise target paths within p5, SHA256, file sizes and PowerShell Get-FileHash commands; mark pending_owner_upload until byte-verified from GitHub. Preserve p4 original; never force push, modify main from AI Visual, or merge PR.
- Report the current PR HEAD, changed files, source/renderer/test evidence, paid cost, owner tasks and open problems. **STOP for SA review and owner visual decision.**

## 6. Pass/fail checklist (owner visual gate)

- [ ] Crossed seated version has attractive separate knee contours, folded feet and natural trouser silhouette; hands truly palm-to-palm in front of chest.
- [ ] Kneeling version visibly kneels on BOTH knees with feet/shins folded behind; hands similarly prayer-like and body balanced, without unrealistic crouch.
- [ ] Same P0.4 female áo bà ba / waist-length loose hair / face, six palettes, scale/anchors preserved or per-pose changes justified with transforms.
- [ ] Both GLBs actually import, editable Blender exists, pose/idle names and frame verification truthful.
- [ ] Both pose contact and clipping at 5 animation phases measured/reviewed, with no hidden hair/sleeve/hand penetration at front/side/back shots.
- [ ] True matched Cycles evidence, source SHA256/bytes/geometry, baseline/new contact sheets and 9:16 images available.
- [ ] PR #2 remains Draft, only AI Visual female work, 0 VND external cost; no male, Codex or merge.

**Gate:** If one pose fails, mark it PARTIAL and revise that pose only. Even if technical checks pass, final P0.5 status = P05_FEMALE_POSE_OWNER_VISUAL_REVIEW_REQUIRED until **owner explicitly accepts BOTH female poses**. Only afterward may SA create a SEPARATE male task; any resumption of Codex requires distinct owner approval.

## 7. Required handoff response format (Sakura-style)

1. SA finding → physical edit → proof/status per P0/P1 item.
2. Exact tools, Blender version and external paid cost.
3. Complete file list / SHA256 / bytes / triangle counts / named pose and six color-variant maps, original vs changed.
4. Matched actual Blender Cycles A/B comparison sheets (knees, praying hands, kneel profile, two portrait scenes) and ZIP SHA/CRC report.
5. Exact PR #2 new HEAD, branch, small-file GitHub commit status, large owner upload list and actual Windows run/check commands.
6. Open issues, BLOCKED/NOT_RUN truthfulness and final status **P05_FEMALE_POSE_OWNER_VISUAL_REVIEW_REQUIRED**. No self-approval; stop.
