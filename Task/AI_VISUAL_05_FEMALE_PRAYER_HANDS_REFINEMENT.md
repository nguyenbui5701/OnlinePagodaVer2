# AI VISUAL 05 — P0.5b Female Prayer Hands: Anatomical Chibi Palm-to-Palm Aesthetics, Both Poses

> **P0.5c successor and owner decision — 2026-11-22:** This P0.5b task is completed to owner-review stage: SA verified two GLBs and true Cycles sampling and posted [review #6009865513](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6009865513). P0.5b hand/finger shape improves substantially but **owner chose one further palm-orientation and natural contact pass**. Current task: [AI_VISUAL_06 — P0.5c](AI_VISUAL_06_FEMALE_PRAYER_PALM_ORIENTATION.md). Keep P0.5b immutable, no male/Codex/merge. The `p05_source_frozen.py` and `p04_source_frozen.py` files remain absent from the GitHub p5b checkout as of the reviewed HEAD; recover with exact hashes before asserting clean reproduction.


**Issued by:** SA | **Owner feedback:** 2026-11-22 | **Status:** ASSIGNED — FOCUSED ART REVISION / OWNER GATE OPEN.

**Mandatory Sakura procedure:** SA writes task → AI Visual produces independently executable real GLB + editable Blender source + Cycles evidence → SA inspects and independently verifies SHA/geometry/images on PR #2 → owner views and explicitly approves → only then next stage. Follow [Design/07 WORK_RULES](../Design/07_WORK_RULES.md) and [Design/15 Sakura task exemplar](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md). This task is the authoritative specification, not an unscoped “make the hands prettier” message.

## 1 — Role, objective, hard scope and STOP

**Assignee:** Independent AI Visual / Blender 3D Artist. **Goal:** surgically refine the **prayer-hands aesthetic** on BOTH existing female P0.5 poses:
- A: `cross_prayer` (cross-legged seated);
- B: `kneel_prayer` (kneeling on two knees).

The owner likes the overall female direction but says the joined/praying hands need an aesthetically better form. **This is a P0 owner-facing art blocker, not a conclusion that the uploaded GLBs/Cycles are fake or technically failed.** Do not model an entirely new person, male, outfit, hairstyle, pad, Sakura, scene, app or new pose.

**Preserve exactly unless measured clipping forces small local changes:** female face/identity, long rear hair, Vietnamese áo bà ba front/placket/buttons and six garment palettes, all existing P0.5 leg/knee/shin/feet geometry (both poses), unchanged lotus leaf, original +Y up / +Z facing, seat/Head/Nameplate/FX anchors and gentle idle. Only HAND/FINGER/THUMB/WRIST geometry and the **minimum** forearm/elbow/cuff adjustments are authorized. If a non-hand mesh must change, provide a focused diff plus reason and new independent test. Do not force-push or overwrite p5/p4 histories.

**STOP:** Once the two refined poses + evidence are handed off, STOP for **SA review then owner approval**. Do not produce the male task/assets; no Codex PR #3/#4, integration, GPU, LIVE or merge.

## 2 — Immutable GitHub HEAD and original P0.5 input checksums

- Repository https://github.com/nguyenbui5701/OnlinePagodaVer2
- Existing asset PR https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2
- Head branch `assets/lotus-pad-chibi-p0`
- **SA-inspected PR HEAD:** `a3673005d2c262bb8577c43335747e62d6dbce96`. Confirm HEAD before work; if changed, report divergence and inspect later commits before modifying anything.
- Input folder `Assets3D/Review/lotus_pad_chibi/p5/` (IMMUTABLE). New review/output folder **`Assets3D/Review/lotus_pad_chibi/p5b/`**. Do not overwrite `p5/`, `p4/`, `p3/` or `p2/`.
- **A / cross-legged:** `p5/meditator_female_cross_prayer_p05.glb`; manifest SHA256 `981ecf0b83378ce3fca7cd49db9473baac43238af3b5ee2fa857024ff66b57fd`; 338176 bytes; 13262 triangles / 6855 vertices / 9 meshes / 21 material definitions.
- **B / kneeling:** `p5/meditator_female_kneel_prayer_p05.glb`; manifest SHA256 `04a1d0e03e5186085118dd06d158dbba43e7180843895ed1661a03529040785e`; 352636 bytes; 14190 triangles / 7319 vertices / 9 meshes / 21 material definitions.
- P0.4 source reference SHA256 `586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09`; unchanged P0.2 lotus `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.
- Existing real Cycles paths: `p5/P05_Cycles_Evidence/cross_actor/cross_actor_hands_front_cycles.png`, `cross_actor_hands_side_cycles.png`, `kneel_actor/kneel_actor_hands_front_cycles.png`, `kneel_actor_hands_side_cycles.png`, and matched `cross_pair` / `kneel_pair` 9:16 shots. **Do not relabel these originals as new.**
- Baseline `P05_CAMERA_CONTRACT.json` for matched camera/FOV. Preserve no-hand comparisons to the extent the character/root has not changed.
- P0.5 manifest: 6 `KHR_materials_variants` for top/pants (same underlying geometry), `SeatRoot=[0,0,0]`, `HeadAnchor=[0,0.835,0.04]`, `NameplateAnchor=[0,1.335,0.03]`, `FXAnchor=[0.37,0.805,0.16]`, `sit_idle` and per-pose idle clips lasting 2 seconds / 17 frame samples. **All baseline numeric values are manifest claims until independently checked against actual binaries in this new run.**

## 3 — Required reading (in strict order)

1. [Design/07 Rules](../Design/07_WORK_RULES.md), [Design/15 Sakura prompt format](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md), [Design/14 zero-cost policy](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md).
2. [Design/11 3D pipeline](../Design/11_3D_ASSET_PRODUCTION_PIPELINE.md), [Design/13 integration contract](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/16 owner-gated work](../Design/16_P0_APPROVAL_AND_HANDOFF.md).
3. [Task/AI_VISUAL_04 P0.5](AI_VISUAL_04_FEMALE_PRAYER_POSES.md), [Task/AI_VISUAL_03 P0.4](AI_VISUAL_03_FEMALE_AO_BA_BA_LONG_HAIR.md), PR #2 latest SA review, *latest owner feedback focused on hand aesthetics*.
4. Actual PR #2 `p5/` manifest/validation/source/evidence, original two P0.5 GLBs and four owner-uploaded `.blend` review projects, real P05 Cycles case reports, camera contract, original `p5/P05_Cycles_Evidence/FILE_HASHES_SHA256.txt`. Study hand front/side and close 9:16 in **both** poses, not only a front screenshot.

**Source gap to resolve before editing:** At task issuance, the PR HEAD file list does **not** contain `p5/procedural_female_prayer_p05.py` or `p5/p04_source_frozen.py`, even though prior `BINARY_HANDOFF.md` lists these as owner-local pending. Recover the exact original source from the P0.5 owner handoff bundle and upload on PR #2 with exact hash; **do not fake reproducibility from screenshot**. Source availability is a blocker to claiming a reproducible surgical geometry change. If still unavailable, record BLOCKED and ask owner for the existing ZIP; keep all verified original binaries intact.

## 4 — SA findings grounded in ACTUAL owner Blender Cycles imagery

SA directly inspected images on the current PR HEAD, including:
- `cross_actor_hands_front_cycles.png`: clear hands-together gesture, but **four tall rectangular stick-like fingertip shapes**, bulky symmetrical palm/thumb wedges and a narrow mechanical-looking central seam; bottom of the hands visually competes with the áo bà ba buttons/placket.
- `cross_actor_hands_side_cycles.png`: fingers and palm profile look layered/flat, wrists are narrow with abrupt volume changes; thick sleeved forearms appear rigid where they meet the hands.
- `kneel_actor_hands_front_cycles.png` and `kneel_actor_hands_side_cycles.png`: essentially the **same hand geometry and the same art issue**, not a new failure of the kneeling legs.
- Full front and matched pair medium 9:16 show the character/poses remain legible, knee support plausibly distinct. This feedback **does not authorize rerendering all legs/pad or changing character identity**.

### Required actual fixes and falsifiable proof

| Priority | Problem | Physical 3D edit | Required objective proof |
|---|---|---|---|
| **P0** | Fingers resemble squared rods / comb teeth | Remodel into **shorter, gently tapered, rounded chibi finger shapes**, with soft individual fingertips and subtle differing finger lengths; retain meaningful separation but no exaggerated realistic anatomy | True GLB re-import hand front/3⁄4/side **MACRO** with P0.5 vs P0.5b same light/camera |
| **P0** | Palm/thumb lobes feel mechanically pasted-on | Create a coherent palm volume with natural thumb resting/interlocking at front edges; visibly two palms touching, **not a flat merged vertical slab or detached “leaf” pieces** | Front/side close images and documented palm-to-palm gap/contact, no floating |
| **P0** | Wrist-to-palm and sleeve transitions abrupt | Smooth wrist taper, natural forearm approach, rounded cuff edge and upper-arm elbow line; place hands comfortably in front of sternum without hiding face or clothing placket | 3/⁄4 close, side close, full torso medium image |
| **P0** | Similar issue in both poses | Apply the same revised prayer-hand design to both `cross_prayer` and `kneel_prayer`, adjusting only per-pose forearm/cuff intersections if necessary | Fixed-camera cross/kneel A/B hand images, plus 9:16 medium for BOTH |
| **P0** | Existing female look and pose must not regress | Finger/hand/forearm area only; keep legs, face, hair, buttons, colors, seat contact and anchors unchanged | Non-edited mesh vertex/index array equality or documented measured tolerances; updated SHA/mesh stats |
| **P1** | Visual quality at phone capture | At **720×1280 9:16**, prayer gesture must be recognizable without giant fingers or distracting sleeve volume; no finger merging into noise | Same-camera new medium + close 9:16 of both poses and original comparison |
| **P1** | No collision during idle | Check palm-to-palm contact; hand/thumb penetration, sleeve/wrist intersection, hands vs chin/chest and hair/arms at t=0/.5/1/1.5/2 sec | Numerical exact-mesh checks if available + visually marked close views; state `PROXY_ONLY` where exact collision is not tested |

**Look direction:** elegant, soft, humble Buddhist “chắp tay niệm Phật”, *stylized chibi hands* not realistic 3D adult hands. Prefer a **single conservative refined candidate**; if a key choice is ambiguous, offer optional A/B within the hand area only. Fingers gently aligned upward, palms comfortably pressed, no crossed arms/fists, and elbows relaxed with a softer arc than P0.5. Don't overcomplicate with nails, wrinkles or many extra joints.

## 5 — Phased independent execution

### Phase 1 — Audit P0.5 and write the change plan, NO geometry edits
- Verify latest PR HEAD, exact two source GLB bytes/SHA, four `.blend` review sources and original P0.5 hand images. Audit six palette mappings, original animation/anchors; record current hand geometry bounding boxes and exact mesh/submesh boundaries.
- Verify the owner-uploaded P0.5 Cycles case reports versus PNG bytes: source GLB SHA, per-image SHA, logs, empty stderr, and contact-sheet provenance; verify archive CRC if original ZIP is available. **Do NOT claim that a remote blob exists based solely on a stale `pending_owner_upload` text.**
- Write `p5b/P05B_PHASE_A_FINDINGS.md`: issue → baseline mesh/pose → focused change → how to prove → expected cost and limits. If required P0.5 builder source is absent, mark source recovery BLOCKER and do not regenerate unrelated geometry.

### Phase 2 — Build P0.5b hand-only revision for both female poses
- Use actual source/Blender to create two independently loadable exports:
  - `meditator_female_cross_prayer_p05b.glb`
  - `meditator_female_kneel_prayer_p05b.glb`
- Preserve original `p5` GLBs and all existing `.blend`. Supply editable new `.blend` source(s) and reproducible Blender/Python export script. **Do not model from a screenshot or modify baseline files**. Keep pose leg meshes truly unchanged (where measurable).
- Rebuild hands/fingers/thumb/wrists + minimum sleeve/forearm transitions; keep palm contact and fingers visually separated from both front and side. **Avoid hiding poor fingers behind áo cuffs or shifting the hands behind the body**.
- Preserve `cross_prayer`/`kneel_prayer` IDs, `sit_idle`, `cross_prayer_idle`, `kneel_prayer_idle` and all glTF anchors/6 color variants. If any anchor changes, document exact old/new local/world transforms and versioned compatibility migration.

### Phase 3 — Re-import real GLBs, test and Blender Cycles A/B
- Re-import **old P0.5 and new P0.5b** exported GLBs into Blender, under the **same exact P05_CAMERA_CONTRACT.json rig**, same samples, Cycles, AgX, EV, materials and garment palette. Confirm all actor and 9:16 shots are TRUE GLB renders, not concepts/VTK substituted as Cycles.
- For **each** pose generate:
  1. front hands MACRO (rounded fingers visible);
  2. left/right 3/4 hands MACRO;
  3. true side-profile MACRO (palm thickness and wrists);
  4. torso front + 3/4 with áo bà ba, hands readable;
  5. medium **720×1280 9:16** and close 9:16 on the **unchanged** lotus;
  6. five idle snapshots at t=0/.5/1/1.5/2 with hands/sleeves visible, plus side when interaction requires.
- **Critical matched A/B contact sheets:** P0.5 cross vs P0.5b cross macro, P0.5 kneel vs P0.5b kneel macro, and new cross vs kneel same angle; include a phone-scale reduced-preview to demonstrate gesture readability.
- Automated checks and genuine reports: glTF import PASS, SHA256/byte size of both GLB and source Blend, tris/vertices/meshes/materials, original/new mesh diff, six KHR material variant mappings, animation clip/duration, anchor values and 5 idle stages. Use exact contact/penetration methods or explicitly mark `PROXY_ONLY`.
- Provide actual Cycles PNGs, per-case JSON listing image bytes/SHA, stdout, stderr, per-file SHA list, evidence ZIP with CRC verification, original Blender source. Don't require new verification of an untouched P0.5 image unless needed for an identical-camera A/B; never invent new hashes.
- New portable tests should run **zero-cost** on local Blender, including a Windows PowerShell script with `--python-exit-code`, logs, fail-fast/hash check.

### Phase 4 — Commit to PR #2, binary handoff, STOP
- New directory `Assets3D/Review/lotus_pad_chibi/p5b/`: `README.md`, `asset_manifest.json`, `P05B_VALIDATION.json`, `P05B_PHASE_A_FINDINGS.md`, `BINARY_HANDOFF.md`, `P05B_CYCLES_AUDIT.md`, updated provenance, source builder and reproducible Blender/PowerShell runner, appropriate small preview/contact sheets.
- Owner may push large `GLB/BLEND/PNG/ZIP` if limits require it; every file must have exact target repo-relative path, byte count, SHA256 and truthful `pending_owner_upload` until remote hash is inspected. No fake “uploaded” state.
- Reconcile old `p5/BINARY_HANDOFF.md`, `README.md`, and `asset_manifest.json` `pending_owner_upload`, `P05_Cycles...PENDING_OWNER_RUN`, `source pending` assertions with verified **actual** remote files; if wanting P0.5 historical metadata correction, make an explicit additive audit note under p5b rather than altering prior evidence silently.
- Return exact new HEAD, PR #2 link, changed-file diff and artifact table, real Cycles before/after sheets, validation results, known limitations, owner-run commands, and `P05B_FEMALE_HAND_ART_OWNER_REVIEW_REQUIRED`. **STOP and await SA review followed by owner OK**.

## 6 — SA acceptance checklist

- [ ] On **both poses**, five-finger/chibi-appropriate hands are clearly palm-to-palm, with attractive rounded/tapered fingertips, proportionate thumbs and wrists, not rectangular rods or large pasted-on lobes.
- [ ] Contact is visible front/3/4/side; arm sleeve transitions look soft, shoulders not raised, hands not too high under chin and not blocking garment front.
- [ ] Actual hand-close matched P0.5→P0.5b Blender Cycles show improvement at same exposure/camera, plus 9:16 phone-readable medium of both.
- [ ] Hair, female identity, áo bà ba, all six colors, two leg poses, leaf, glTF IDs, idle 2s and original anchors preserved or any deviations versioned/validated.
- [ ] Per-asset real source/GLB/Blender, SHA/bytes/triangles/materials, original geometry diff and exact collision/idle evidence available for independent SA review.
- [ ] ZIP/PNG hashes and logs truthful; GitHub binary upload status verified and stale `NOT_RUN` metadata explicitly reconciled.
- [ ] Zero paid external services, PR #2 Draft; **NO male, NO Codex, NO integration, NO merge**.
- [ ] **SA review + explicit owner acceptance** before proceeding. If hands still visually awkward, mark **PARTIAL** and continue only hand refinement.

## 7 — AI Visual return format (Sakura style)

1. **SA finding → action → real evidence → result** table per P0/P1 issue.
2. Tools/version/licensing and actual paid cost; actual GLB source SHA/bytes/triangles/drawcalls/materials.
3. Exact new versioned folder, files and GitHub HEAD/PR, immutable source vs changed artifacts and owner-upload pending items.
4. Matched **real Blender Cycles** A/B hand macro (front + side) for both poses, 9:16, five idle phases, SHA list/ZIP CRC report.
5. Exact local owner Windows commands for Blender export/hash verification if required.
6. Open issues and final code **P05B_FEMALE_HAND_ART_OWNER_REVIEW_REQUIRED**. STOP; do NOT build male or restart Codex.
