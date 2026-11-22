# AI VISUAL 07 — P0.5d Female Cross-Legged Foot Visibility Micro-Polish

**SA issued:** 2026-11-22. **Status:** ASSIGNED — FEMALE CROSS-LEGGED POSE ONLY. **Owner:** overall female P0.5c art temporarily accepted; one remaining small foot visibility refinement.

**Mandatory workflow: SA assigns an independent versioned task → AI Visual produces real editable Blender source + GLB + Cycles → SA verifies actual artifacts on PR → owner approves → only then next phase.** Follow Design/07_WORK_RULES.md and the phase/evidence structure in Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md. This is the full authoritative standalone assignment, not a vague instruction to “make the feet prettier”.

## 1. Role, scope, exact objective, and STOP

**Role:** Independent AI Visual / Blender artist; NOT Codex.

**Single change authorized:** Refine only the female **cross-legged prayer** pose. The folded trousers and lower legs currently look like one dark interlocked oval; owner suggests exposing a **small, tastefully visible foot tip or instep** (mu bàn chân / đầu bàn chân) to make it look anatomically natural and recognizably cross-legged. Deliver one conservative candidate; decide from actual geometry whether **one exposed foot** or small visible portions of **both** give the most natural silhouette. The foot must appear attached to the correct lower leg, tucked naturally under the opposite folded leg; no extra floating flesh-colored blobs, overly realistic toes, giant long feet or camera tricks. Keep cute modest stylized chibi proportions.

**P0 FROZEN:** The two palms-together praying hands already refined in P0.5c; arms, sleeves, torso, áo bà ba top/placket/buttons, face, long loose back hair, six garment color variants, body scale and anchors, original 2-second 17-key idle, unchanged P0.2 lotus and Sakura R16. The female **kneeling** P0.5c asset is fully frozen and must NOT be rebuilt or re-exported.

**Allowed edits:** CROSS-LEGGED pose only; minimal ankle/foot/instep mesh and adjacent trouser cuff, fabric fold and/or sandal trim where required. Preserve overall folded knee contour. If shared mesh requires editing, show exact altered vertex IDs/bounds; upper-body hand vertices MUST remain equal to original. No full pants redesign. No added pose, unrelated hair/clothing edit, camera/framing change, V1, renderer or Event Engine work.

**STOP/GATE:** On completing the single new cross GLB and true Cycles handoff, STOP for SA review, then owner aesthetic approval. No male character, no Codex PR #3/#4, no integration, GPU/LIVE test, or merge. This final micro-polish does NOT revoke provisional owner acceptance of other female art.

## 2. Repo, PR, immutable HEAD baseline, hashes and new path

- Repository: https://github.com/nguyenbui5701/OnlinePagodaVer2
- Existing AI Visual PR #2: https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2
- Branch: assets/lotus-pad-chibi-p0. PR is Draft/unmerged.
- **Exact SA-reviewed HEAD for baseline:** bdb171b82d9ceb8d72bc42ac0ece64cecf4be166. Before making changes, verify HEAD; if changed, inspect both commits and do not overwrite other work.
- Latest SA review: https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6010091090
- **Immutable baseline:** Assets3D/Review/lotus_pad_chibi/p5c/
- **New revision ONLY:** Assets3D/Review/lotus_pad_chibi/p5d/ (old files, source evidence and hashes must not be overwritten).

**Grounded, independently verified P0.5c original binaries:**

| Pose | Source filename in p5c | SHA-256 | Bytes | Triangles |
|---|---|---|---:|---:|
| **Cross-legged** — surgical baseline | meditator_female_cross_prayer_p05c.glb | 1da8c12982165cf57e2ef678013cdd57b67bba7fd6c08e2979c267599d35e5bf | 424784 | 16864 |
| **Kneeling** — byte-identical frozen reference only | meditator_female_kneel_prayer_p05c.glb | a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac | 439244 | 17792 |

Current cross GLB has 9 meshes, 21 material definitions, six KHR_materials_variants, SeatRoot, UpperBodyBreath, HeadAnchor, NameplateAnchor, FXAnchor, sit_idle and cross_prayer_idle (2s, 17 samples). All upper-body hands/animations must survive unchanged.

Unchanged P0.2 lotus GLB SHA-256 80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9, 262108 bytes. Lotus PadSeatAnchor [0,0.195,0] is a scene convention, **not** proof of foot contact with the leaf.

**Existing source reproduction gap:** Current p5c source code includes procedural_female_palms_p05c.py and restore_frozen_sources.py, but its pinned original p04_source_frozen.py and p05_source_frozen.py and compressed .zlib.b64 payloads were absent on the reviewed branch, as was validate_p05c_independent.py. Do not claim clean GitHub-checkout reproduction until actual originals are recovered and verified:
- p04_source_frozen.py: SHA-256 b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2.
- p05_source_frozen.py: SHA-256 e6f7d06d3a3c78d055c6510d61d009a6bca877f03cd1c1323ee5602dcc633ad9.
Owner-uploaded editable original .blend may be used to implement the tiny change if real provenance/editable export are demonstrated; a model reconstructed from screenshots is NOT an acceptable substitute.

## 3. Required reading in exact order

1. Design/07_WORK_RULES.md and Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md; Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md.
2. Design/11_3D_ASSET_PRODUCTION_PIPELINE.md, Design/13_3D_EVENT_INTEGRATION_CONTRACT.md, Design/16_P0_APPROVAL_AND_HANDOFF.md and Task/00_P0_EXECUTION_ORDER.md.
3. Task/AI_VISUAL_06_FEMALE_PRAYER_PALM_ORIENTATION.md; most recent PR #2 SA review https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6010091090; exact owner feedback: female temporarily approved, crossed legs over-intertwined, modest foot exposure desired.
4. PR #2 current P0.5c raw GLBs, real editable Blender, asset_manifest.json, P05C_VALIDATION.json, P05C_Cycles_Evidence, camera contract, source-chain reports. The original owner chuav2.mp4 can inform style only if actually available; don't invent frames.
5. Inspect the P0.5c cross-legged FULL front/three-quarter/side and 720x1280 medium Cycles against the actual exported glTF. No concept PNG as proof.

## 4. SA findings: specific change and objective evidence

Owner's observation is **P1 aesthetic polish, not a new P0 technical failure**. Regressions are P0 blockers.

| Priority | Actual issue / invariant | Required physical edit | Testable evidence |
|---|---|---|---|
| P1 art | Folded trouser loop hides both feet, making posture slightly unnatural | Expose modest instep/foot tip at plausible ankle position. Choose one or both feet based on real leg overlap. | Exact same-camera old/new GLB front, left & right three-quarter, true side, foot macro; annotating actual changed part |
| P0 preservation | P0.5c prayer hands and upper body now accepted | NEVER change palms, fingers, skin in upper body, sleeves, hair, face, top/placket, buttons, palettes, root and 2s/17-key idle | Real GLB per-mesh and, when needed, region-specific accessor/vertex equality; identical animation sampler arrays and named anchors |
| P0 kneel freeze | Kneeling already looks good | NO new kneel GLB and NO changes under p5c | Original kneel SHA unchanged; no newly committed kneeling variant |
| P0 geometry/contact | Newly revealed foot might float, penetrate fabric or lotus, or connect to wrong leg | Connect ankle-to-foot, drape pants naturally, preserve lotus position and crossed-leg support | Front/side macro at idle times 0, .5, 1, 1.5, 2 sec; foot-to-pant/pad contact and penetration checks; mark proxy-only when appropriate |
| P1 9:16 | A small difference could disappear in LIVE capture | Foot visible in at least one ordinary medium/full angle, without zoom or unnatural lighting; do not let it dominate the serene prayer pose | Real Cycles 720x1280 medium and close before/after at SAME cameras/exposure; reduced-phone-size preview |
| P1 efficiency | More mesh can increase crowd geometry cost | Reuse approved skin/sandal materials, minimal vertices, no hyper-detailed toenails | Exact GLB bytes, vertices, tris, mesh/material counts and changed triangles vs P0.5c |

**Visual constraints:** A small warm-skin-toned visible upper instep or neat toe silhouette from under the pant hem is the goal if the existing model indicates bare skin; if current shoe/sandal styling is visible in original source, **preserve its established look instead of inventing bare feet**. One visible foot and the other partly tucked is acceptable if the posture is more natural. Don't fake visibility by recoloring trouser polygons or adding detached face patches.

## 5. Phase-based independent execution (Sakura cadence)

### Phase 1 — inspect and plan WITHOUT full remodeling
- Verify exact current PR HEAD and source hashes; load actual P0.5c cross and kneel assets. Confirm original lower-leg mesh structure: ao_ba_ba_pants_SeatRoot_mesh, sandal_trim_SeatRoot_mesh, and whichever skin mesh contains any hidden foot vertices. DO NOT assume bare feet already exist.
- Identify left/right foot/ankle, current crossed-leg topology, cuff edge, supported seat/lotus position, camera angles and exact planned local change. If you must add a foot submesh, explain why existing hidden geometry cannot be revealed.
- Write p5d/P05D_PHASE_A_FINDINGS.md with **SA issue → precise mesh/vertex region → intended silhouette → test camera → expected geometry/bytes delta** and original source provenance. Report missing sources explicitly as SOURCE_BLOCKED, rather than claiming clean regeneration.

### Phase 2 — build the ONE new cross-legged GLB
- Create only p5d/meditator_female_cross_prayer_p05d.glb with a real editable Blender source (.blend), and a reproducible Blender/Python exporter. Do not export another kneel. Original kneel is referenced by its pinned P0.5c SHA.
- Reveal foot tip/instep with minimal ankle/foot/cuff edits, keeping original cross-legged posture and leaf contact. No changes to prayer palms, upper-body skin, sleeve/front or camera. If a mesh spans skin hands and foot, compare their exact vertex index region so unchanged hands are proven, not assumed.
- Preserve P0.5c six variants, all materials except a justified reused foot-skin material, anchors, idle clips and sampler arrays. Any unavoidable difference outside allowed lower-body mesh region is a documented failure requiring correction.
- Tools zero-cost (Blender + local open-source Python). No paid generation endpoint, unlicensed 3D assets or fabricated benchmarks.

### Phase 3 — verify EXPORTED GLB, matched real Cycles A/B and contact
- REIMPORT the actually exported new GLB and the pinned P0.5c GLB into Blender for same-camera SAME LIGHT, FOV, AgX 0 EV, original 32 samples. Do not present procedural preview or concept art as a Blender-imported GLB test.
- **Cross actor-only required:** front full, left three-quarter, right three-quarter, true left/right side, and foot/knee MACRO front/three-quarter/side. One diagnostic close view can show attachment geometry but must be labeled DIAGNOSTIC and cannot replace matched shots.
- **Cross on original lotus required:** front, side/waterline, three-quarter, **720×1280 9:16 medium** and **9:16 close**; compare at least front, side, and medium with the P0.5c original. The foot should be detectable at normal size in at least one front/3⁄4 shot, not only giant macro.
- **Idle:** check times t=0,0.5,1,1.5,2 seconds. Foot must remain attached, not float, and not visibly intersect trousers or lotus in any checked frame. Record actual mesh/triangle collision method. If only nearest vertex/visual proxy is used, label PROXY_ONLY, not exact zero-penetration.
- Deliver concise **P0.5c vs P0.5d same-angle contact sheets**: one full character 4-view A/B, one foot close-up/9:16 A/B. Don't rerun unchanged kneel or all prior passed hand Cycles.
- Validate new real binary glTF2 import, **SHA-256, bytes, tris/vertices/meshes/materials, material variants, node/anchor matrices, animation names/17-keyframe arrays**, and exact untouched upper-body skin-hand geometry. Include changed mesh regions/vertex-count/bounds, foot-to-pad/contact measurements and any regression.
- Produce real editable Blender file, actual new Cycles PNGs, per-case JSON containing SHA/bytes and camera/lighting details, stdout+stderr, FILE_HASHES_SHA256.txt, true ZIP with CRC results and a Windows PowerShell runner passing Blender --python-exit-code. A nonexistent binary, unrun Blender job or unverified ZIP MUST be marked NOT_RUN/PENDING, never PASS.

### Phase 4 — versioned PR #2 handoff and STOP
- Commit only p5d/ new small source/docs/scripts to existing feature branch, **not main**: README.md, P05D_PHASE_A_FINDINGS.md, asset_manifest.json, P05D_VALIDATION.json, P05D_CYCLES_AUDIT.md, BINARY_HANDOFF.md, LICENSE_AND_PROVENANCE.md, Blender/Python exporter and Windows launcher, with suitable sample contact images where possible.
- Large new GLB/.blend/PNG/ZIP may be owner-uploaded later to precise paths, with SHA-256 and exact bytes. Until verified on remote branch, label **pending_owner_upload** and specify owner PowerShell Get-FileHash checks. Never silently overwrite p5c, p5b or the kneel model.
- P0.5c metadata may still say pre-owner-run NOT_RUN despite actual uploaded Cycles and GLB. If correction is needed, add **dated append-only baseline audit** in p5d with precise evidence and unverified parts; no rewriting the historical Cycles proof.
- Return **exact new HEAD and PR link**, changed vs frozen paths, one new cross GLB and editable Blender source, real A/B Cycles proof, before/after SHA/geometry/contact table, owner uploads and unresolved blockers. **STOP for SA review then owner acceptance.** No merge.

## 6. GO/NO-GO acceptance checklist

- [ ] Cross-legged female shows **subtle, believable instep / foot tip** from normal front or 3/4; no long feet, excessive bare skin or obvious glued-on patch.
- [ ] Correct ankle to lower-leg attachment, natural trouser drape, stable leaf support and no visually obvious contact/clipping problem at five idle times.
- [ ] **P0.5c prayer hands remain unchanged** in actual GLB geometry; face, hair, áo bà ba upper garment, six colors, anchors, animation arrays intact.
- [ ] **Original P0.5c kneeling GLB byte-identical, no new kneel build or file**, previous version directories frozen.
- [ ] One actual new glTF2 GLB, original editable Blender source, matched Blender Cycles A/B foot/full/9:16, numeric metadata and SHA/bytes, true pass/fail evidence.
- [ ] GitHub checkout reproducibility verified from source dependencies or openly recorded as BLOCKED; no paid services, no unmeasured GPU claims.
- [ ] PR #2 stays Draft. **No male, Codex, integration or merge** before separate owner direction.

**Final status until the owner says OK to the revised feet:** P05D_FEMALE_CROSS_FOOT_OWNER_REVIEW_REQUIRED. Technical PASS or SA preference alone is NOT owner acceptance.

## 7. Mandatory AI Visual handoff format

1. **SA observation → exact mesh edit → photographic Cycles A/B → numerical test → PASS/PARTIAL/NOT_RUN**.
2. Tool/Blender versions, asset licensing and actual paid cost (0 VND if true).
3. Full new cross GLB path, SHA-256, bytes/verts/triangles/meshes/materials; precise lower-body diff, unchanged hands/animations/anchors/colors; frozen kneeling original SHA.
4. Matched front/3⁄4/side foot macro and **720x1280 9:16** Cycles A/B contact sheets; five idle frame checks, per-file evidence checksums, ZIP CRC and editable .blend.
5. PR #2 feature branch, exact new HEAD, committed source/docs, owner upload commands/status and outstanding limitations.
6. Final state **P05D_FEMALE_CROSS_FOOT_OWNER_REVIEW_REQUIRED**, then STOP and request SA/owner review.

**This task is ONE cross-foot micro-polish only.**