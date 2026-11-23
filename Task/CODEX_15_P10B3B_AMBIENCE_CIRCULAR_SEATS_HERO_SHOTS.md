# CODEX 15 — P1.0-B3B Rich Ambient FX + Circular Lotus Pads + Two Real Hero Camera Shots

> **SA TASK PREPARED / NOT ACTIVE YET — 2026-11-23.** Second non-overlapping workstream in [Design 27](../Design/27_P10B3_LIVE_PRESENCE_BUBBLES_AMBIENCE_RING_LAYOUT_TREE.md). **DO NOT START until CODEX 14 P10B3A reaches formal SA Tech PASS + Owner UI Visual GO**, and SA pins its actual reviewed HEAD. This requirement prevents conflicting changes to the same Viewer camera/scene/UI. No automatic merge. **STOP \`P10B3B_SA_REVIEW_REQUIRED\`** after one independent new stacked Code PR.

## 1. Role/scope/objective/STOP

**Codex/AI Code only:** from the approved CODEX14 Viewer, add:
- more original fireflies/glowing motes, petals and falling leaves at the Sakura AND localized around existing seated visual pads,
- a subtle localized smoky/foggy layer by the original blessing-tree trunk,
- an opt-in concentric ring layout for pre-positioned original P02 lotus pads (initially **12 total visual slots with only 3 actual-capable Engine seats**),
- **two real animated camera route sections**, HERO_TOP_RING and HERO_WIDE_TREE_REFLECTION, that remain safe during gift focus and cinematic return.

**Do NOT generate/rewrite R16 geometry, new Sakura R17 GLBs, additional human models, TikTok images/icons, new rose petals meshes, additional real participants or new domain seat capacity.** Use existing fixed verified GLBs, original Three.js shader/particle runtime and camera. No V1, TikTok provider/GPU/Studio tests or merges. Original six user screenshots are intent references only, NOT assets.

**Exact source prerequisite:** [PR #15](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/15) at \`f22033b5a6f9bc7e34208d0ddcdf40ce2c0c1282\` is the inherited source before CODEX14. **CODEX15 does NOT branch from PR #15 now**: its actual base is the future **CODEX14 SA-reviewed immutable HEAD, presently unknown**. SA must explicitly re-pin in this task/PR comment before Codex branches; do not invent a commit SHA. CODEX14 branch is proposed \`feature/v2-p10b3a-presence-bubbles\`, and this work should be a new stacked feature branch targeting that branch after it has passed review.

## 2. Must read in order

1. [Design/07 Work Rules](../Design/07_WORK_RULES.md), [Design/14 Zero Cost](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16 Owner decisions](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 execution order](00_P0_EXECUTION_ORDER.md).
2. **[Design 27 Track B](../Design/27_P10B3_LIVE_PRESENCE_BUBBLES_AMBIENCE_RING_LAYOUT_TREE.md)**; [Design/10 ECO/QUALITY](../Design/10_GRAPHICS_PROFILES.md), [Design/13 seat/world anchors](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/17 reference shots](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md), [Design/21 source actors](../Design/21_P012D_CHARACTER_DIVERSITY_CONTRACT.md), [Design/23 shot QA](../Design/23_P014_SEVEN_SHOT_PARITY_AND_QA_CONTRACT.md).
3. [P0.14 PR #14 accepted seven-shot technical review](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14#pullrequestreview-6019006145), [PR #15 capture-only SA review](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/15#pullrequestreview-6022198865), and **actual approved CODEX14 PR/source/test/evidence at later SA pinned HEAD**. Do not change CODEX14 UI bubbles or protocol.
4. At approved new baseline inspect \`apps/v2-viewer/src/{ambient-fx,fx-profiles,lighting,main,community-layout,seat-scene,community-batches,botanical-layout,camera,slice-camera,twilight,water,asset}.ts\`, original accepted R16 \`sakura-r16.json\`, P02/actor/botanical source manifests and actual 720×1280 prior WebGL shots. No source uploaded real video frames in repo; don't fake TikTok screenshots.

## 3. P0 grounded baseline and constraints

- Existing original \`createAmbientFx\` uses a **single pooled Points shader** with total ECO **91** (motes 48 / petals 36 / leaves 7) and QUALITY **183** (94 / 74 / 15), moving mainly around tree. R16 trunk has global fog only; no localized smoke.
- Accepted \`communitySlots(seed,treeX,treeZ)\` is **three hero slots + nine staggered decorative slots**. Existing 3 real seats \`seat-1,seat-2,seat-3\`; the rest cannot become real by simply moving pads. Engine camera/focus must resolve real \`seatId→world transform\` and stay correct for both male P07b1/female P05f. Any provider blocked state from PR #15 remains offline.
- Existing \`createCinematicRoutes\` is a continuous 40s seeded four-route director; P0.14 approval included a fast aerial→gift approach. New tracks must NOT recreate the P0.14 QA-only static under-tree view as if it were already deployed; only a real \`shots=hero\` route counts.
- Artist GLB R16, P02, botanicals and avatars are checksum-verified immutable; any actual increased canopy mesh is **AI Visual 16 R17** separate scope. New effects can increase perceived light/volume but cannot claim a new R17 silhouette.

## 4. Phased implementation

### Phase A — freeze input and baseline A/B proof
- Wait until SA provides **actual CODEX14 new HEAD** and Owner UI GO. New separate branch/worktree from exactly that SHA, new PR targeting the approved CODEX14 branch. Do not edit CODEX14 branch.
- Run latest baseline tests/build (not a guessed count) and native scene captures for ECO/QUALITY with all new options OFF. Record original 12 transforms, source GLB hashes, 3 true seats, original 40s route/gift focus and unchanged UI bubble visibility.
- Define independent opt-in \`ambience=rich\`, \`seats=rings\`, \`shots=hero\` switches. OFF should be pixel-identical to the new accepted CODEX14 baseline at fixed pose/seed/time; do not turn them on by default in LIVE or DEMO before Owner GO.

### Phase B — richness with bounded GPU impact
- Expand existing deterministic ambient pool with source-driven ECO/QUALITY budgets **initial upper proposals ECO 128 / QUALITY 320 total original points** (including original motes/petals/leaves and new seat-area allocation), not forced performance targets. Use seed and slot positions; keep shadow/name/face/gift visibility priority, age/staleness and render order clear. Prefer one existing Points batch with a few extra typed attributes; avoid per-frame allocations and needless extra materials/drawcalls.
- Add constrained near-trunk mist using original shader/transparent pooled primitives or existing fog/profile knobs; slight vertical band around root/branch, not an opaque wall or a paid smoke texture. Validate actual world Y bounds and bark visibility, dark silhouette, golden vein readable; don't redraw R16 geometry. Limit alpha overdraw by camera distance and profile.
- Preserve old P0.13 gift ring/sparks timing and original accepted color schemes; if new particle density overlaps bubble text/avatar or negative gift focus, suppress/cull local emitter deterministically instead of moving trusted label.

### Phase C — honest concentric rings and actual camera routes
- Implement \`seats=rings\`: **12 original P02 pad instances/slots**, distributed in 2–3 concentric rings around the actual tree world anchor with a stable seed/ID mapping and recorded radii. Existing authoritative \`seat-1/2/3\` remain only three potential true actors; remaining 9 are **empty pads or non-authoritative anonymous decorative audience**, not ghost LIVE participants. Initial proposed pattern inner 3 / middle 4 / outer 5 is **illustrative only**, adapt radii after actual 3D collision and camera proof.
- Validate actual trunk/root proximity, pad-to-pad separation, pad-to-bloom/bud clearance, P05f/P07b1 seat contact, waterline, camera/gift line-of-sight, and no occlusion of real seat identity; maintain source asset hashes. Use deterministic layout ID map, no Engine protocol/seat capacity changes and no shifting during a connected session without controlled reset.
- Add \`HERO_TOP_RING\` and \`HERO_WIDE_TREE_REFLECTION\` as **real in-motion camera routes** (opt-in \`shots=hero\`), with genuine 720×1280 low/top/wide original shots. Preserve loop end/start seam, active gift FIFO/return, correct P0.9 ray clearances and no new unapproved high-speed jump. Test slow paths, 2×40s loops, prior fast approach and focus on ring-positioned seat actors. If R16 crown is not lush enough like image #6, report art gap rather than make fake 3D canopy inside Codex.

### Phase D — tests/evidence, measured cost, isolated PR + STOP
- Actual 720×1280 ECO/QUALITY WebGL screenshots and timestamped frame sequences, three seeds 9/71/1337, \`ambience=off/on\`, old/rings, original/hero camera, before/after trunk mist and low/aerial/tree/wide gift. **≥12 original native visual shots/profile** spanning ring top, wide reflection, seated chat/gift priority and four reference older camera shots. Explicit true video/continuous sequence only if actually captured; never use screenshot generated by image AI as 3D runtime proof.
- All latest Event/Viewer tests/builds plus unit/QA ring collision/radii, virtual-time deterministic particle paths, source art checksums, P02 contact both actor models, camera safeFrustum/camera seams/gift return, gift FIFO, actual 3 real seats and 9 decorative/empty slots, context loss/restore and cleanup. Run 85s idle, 66s capacity/gifts/community at 3 seeds, plus two 40s loops.
- Same-host performance **ECO and QUALITY baseline OFF vs ON** under matched camera/time/seed: browser/ANGLE software versus true NVIDIA device, frame p50/p95/p99/long stalls, drawcalls/triangles/geo/materials/textures, overdraw proxy, JS heap, context restored GL errors. Current GPU P10A is **deferred**, no physical RTX pass or Studio stability claim. Reduce particles/profile density if regression is measurable; do not hide visual actors or cheat frame sampling.
- Deliver \`apps/v2-viewer/P10B3B.md\`, source/shot config and screenshots SHA index, exact new PR HEAD and script list verified in package.json, any art blocker \`R17_LUSH_TREE_ART_DEFERRED\` and 0 VND provenance. **Only \`apps/v2-viewer/**\` paths** in new code PR (no Event Engine edits, no new meshes/art files, V1 or old branches).
- **STOP \`P10B3B_SA_REVIEW_REQUIRED\`** → SA technical and native image review → separate Owner ring/camera/tree-atmosphere Visual GO. After Owner GO, SA may commission AI Visual R17 if genuine crown geometry still misses image #6.

## 5. Future optional capacity change (NOT this phase)

A **separate SA-locked Event Engine seat capacity/identity/LOD/rate-performance task** is required before >3 actual active viewers can occupy rings simultaneously. Do not silently change \`maxAvatars=3\` or equate 12 total pads with 12 real online people; Owner's requested pre-laid rings can still be displayed honestly with 3 actual and 9 empty/decorative. This is the production truth gate and is not negotiable in CODEX15.

## 6. Windows commands when ready

Only after SA re-pins actual CODEX14 head and Codex creates the new worktree:

    Set-Location packages/v2-events
    npm.cmd ci
    npm.cmd test
    npm.cmd run build
    Set-Location ../../apps/v2-viewer
    npm.cmd ci
    npm.cmd run assets:p08
    npm.cmd run assets:p012b
    npm.cmd run assets:p012d
    npm.cmd test
    npm.cmd run build

Actual \`?ambience=rich&seats=rings&shots=hero\` switches are **proposals, not present on PR #15 or CODEX14 baseline**; implement, prove and document them before advertising. No unverified \`evidence:p10b3b\` command until package.json contains a tested script.

**Success only at new PR:** \`P10B3B_SA_REVIEW_REQUIRED\` with full SHA/pixels/seed/seat/gift/perf provenance; no merge/live assertion or new R17 artwork by Codex.
