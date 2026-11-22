# CODEX 03 — P0.9 Tree-Facing Characters & Controlled Cinematic Variation

**SA assigned:** 2026-11-22. **Status:** ASSIGNED TO CODEX, pending new implementation PR and SA/Owner review. **Not** a merge, LIVE deployment, hardware benchmark approval, asset re-authoring or permission to edit other workstreams.

## 1. Role, scope, objective and STOP/GATE

**Owner visual decision on P0.8:** Owner considers the integrated scene acceptable when viewed directly at `http://127.0.0.1:5173`; the recorded preview video looked choppy, but the owner reports smooth local playback. Two requested refinements: **(a)** seated people should face the blessing Sakura tree; **(b)** when not serving a gift, camera should explore in varied/randomized directions rather than the same repeated orbit.

**Codex / AI Code owns this task:** modify V2 scene placement/orientation and **cinematic camera routing only**; keep runtime, tests and native browser evidence truthful. **SA** owns acceptance and scope. **AI Visual is NOT assigned**: no Blender/mesh/GLB/model work. **Owner** assesses native playback and visual result.

**STOP at P09_SA_REVIEW_REQUIRED** after a focused PR, reproducible tests, real browser captures, and exact source/binary identity evidence. Do not merge or deploy; do not mark P0.9 owner-approved on your own. If existing asset transforms prevent correct facing without authoring a new GLB, STOP and report a concrete reproducible blocker to SA; do not silently modify meshes or re-export art.

**Out of scope:** gift-domain Event Engine rewrites, model variants/hair, additional seats/crowds/characters, new animations, TikTok LIVE/worker, any V1 changes, root workspace redesign, shader/PBR overhaul, scenery rebuilding, paid services, 3D generation and historical Blender rerenders. Keep P0.8 functionality intact.

## 2. Repo, immutable reviewed inputs, PR policy

- Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2
- **Exact P0.8 implementation baseline:** PR #5, branch `integration/v2-p08-real-vertical-slice`, SHA **`844361b5edd8ca1c2498ee1e708c66b634312069`**: https://github.com/nguyenbui5701/OnlinePagodaVer2/tree/844361b5edd8ca1c2498ee1e708c66b634312069
- **Formal SA review:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/5#pullrequestreview-6012992887
- PR #5 base `main` at `fadf278830719be0185e1fe80d7074c466b5fa16` at P0.8 review; PRs #1–#4 remain independent, and P0.8 PR #5 **must not be merged merely to start P0.9**.
- **Create a new feature branch from the exact P0.8 SHA** (suggest `feature/v2-p09-tree-facing-cinematic`). Open a **stacked PR targeting `integration/v2-p08-real-vertical-slice`**, not a duplicate large diff targeting `main`. Record the actual new branch/PR and base/head; STOP if PR #5 head has advanced unexpectedly and reconcile with SA before claiming the SHA is still reviewed. Do **not** push to PR #5 branch or rewrite its history. No force push.
- Keep `packages/v2-events/**` byte-identical to P0.8 unless a concrete, SA-approved interface blocker demands an isolated follow-up. P0.9 should be concentrated in `apps/v2-viewer/src/{seat-scene,camera,slice-camera,main}.ts`, related targeted viewer tests, and `apps/v2-viewer/evidence/p09/**` or documentation. These are expected areas, not permission to perform unrelated refactors.

**Freeze canonical assets:** existing P0.8 `apps/v2-viewer/src/p08-assets.json` and `sakura-r16.json`. Do not modify verified original four GLB binaries. Approved actor: `Assets3D/Review/lotus_pad_chibi/p7b1/meditator_male_cross_prayer_sidepart73_p07b1.glb`, 589,932 bytes, SHA-256 `4e8c8d082352d67d0eaf637df7973931442c724a0f7db598ea8fde8de3873097`; pad P02 262,108 bytes SHA-256 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`; Sakura original R16 QUALITY/ECO via pinned PR #1 hashes in `sakura-r16.json`. Respect the actual GLB's `+Y` up / `+Z` forward, parent transforms, `SeatRoot` / `PadSeatAnchor` and animations.

## 3. Required reading order (before touching source)

1. [Design/07_WORK_RULES.md](../Design/07_WORK_RULES.md), [Design/16_P0_APPROVAL_AND_HANDOFF.md](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Task/00_P0_EXECUTION_ORDER.md](00_P0_EXECUTION_ORDER.md).
2. [Design/09_GIFT_CAMERA_DIRECTOR.md](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design/13_3D_EVENT_INTEGRATION_CONTRACT.md](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/10_GRAPHICS_PROFILES.md](../Design/10_GRAPHICS_PROFILES.md), [Design/12_CORE_PRIORITIES_AND_AI_ROLES.md](../Design/12_CORE_PRIORITIES_AND_AI_ROLES.md).
3. [Task/INTEGRATION_02_P08_REAL_3D_VERTICAL_SLICE.md](INTEGRATION_02_P08_REAL_3D_VERTICAL_SLICE.md), [PR #5 SA review](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/5#pullrequestreview-6012992887), [P0.8 Windows guide](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/844361b5edd8ca1c2498ee1e708c66b634312069/apps/v2-viewer/P08.md), [P0.8 runtime evidence](https://github.com/nguyenbui5701/OnlinePagodaVer2/tree/844361b5edd8ca1c2498ee1e708c66b634312069/apps/v2-viewer/evidence/p08).
4. Read **exact P0.8 SHA** `apps/v2-viewer/src/seat-scene.ts`, `camera.ts`, `slice-camera.ts`, `main.ts`, `slice-driver.ts`, `slice-overlay.ts`, existing `test/{camera,slice}.test.ts` and `packages/v2-events/src/{engine,protocol}.ts` to understand which layer owns identity/focus and which owns geometry and routes.
5. Original owner `chuav2.mp4` only **if actually accessible**; it was unavailable in P0.8 handoff. Never invent reference-frame verification or source video access.

## 4. SA assessment and priorities (known at pinned SHA)

| Gate | Decision | Concrete basis |
|---|---|---|
| P0.8 asset integrity/anchors/animation | PASS on committed browser evidence; preserve | 4 pinned GLBs; P02 pad anchor `[0,0.195,0]` and P07b1 root; 17-sample 2 s idle |
| P0.8 event FIFO/dedup/focus | PASS on submitted tests and browser evidence; protect | 8 domain + 4 viewer unit tests; 45.75 s no-gift then A→B→C; 7 confirmed gift total |
| P0.8 camera movement / return | FUNCTIONAL PASS, visual refinement needed | `SliceCamera` uses eased handoff/return; owner says overall playback acceptable |
| P1 orientation | NEEDS CHANGE, visual request not GLB defect | `seat-scene.ts` places 3 seats at positive Z with root yaw `0.14, -0.19, 0.32`; asset forward is +Z, Sakura centered near origin; actor mostly faces away from tree |
| P1 cinematic diversity | NEEDS CHANGE | `camera.ts` samples one closed `CatmullRomCurve3` orbit with `loopSeconds=40` and repeated fixed shot order |
| Native PBR parity | PARTIAL, **not in this scope** | Canopy paler; harder bark shadows versus Cycles |
| GPU/stream performance | PENDING hardware gate | P0.8 8.15 FPS was **Edge/SwiftShader**, 720×1280, LIVE Studio closed; not a result for owner RTX/LIVE |

**Priorities:** P1-A tree-facing is first, P1-B controlled variation second. Preserve all existing P0 gates. Video-recording stutter alone is not proof of native runtime camera stutter.

## 5. Focused implementation phases

### Phase 1 — Audit and plan (no edits until understood)

1. Pin baseline SHA, inspect actual world-transform hierarchy (`seat root → pad → PadSeatAnchor → actor → SeatRoot`) and R16 root. Locate a stable **tree target** in world X/Z (Sakura trunk/root, not an arbitrary camera aim point 13 m above ground). Confirm direction of actor +Z after all parents/seat yaw are applied.
2. Document an A/B against P0.8: for each of three seats record center/world position, current actor forward vector, desired horizontal vector to tree, pre-change yaw error, chosen way to rotate **actor only** without rotating or repositioning its lotus pad. Document why gift focus will remain front/3/4 after change.
3. For cinema, inspect P0.8 `sampleCinematic`, `sliceCinematic`, `SliceCamera.routeSeconds` / `move`, boundaries, loop seam and handoffs. Design a small fixed bank (recommended 2–4) of safe path variants before adding any seed-selection logic; do not do per-frame random offsets. Preserve the four recognizable shot families and the natural no-gift looping behavior.

### Phase 2 — Actor faces Sakura tree

1. Calculate desired horizontal facing from **actor/seat world position → Sakura tree root focus**, using world transforms with correct parent-space quaternion or local yaw conversion. Actor local +Z forward should align horizontally toward tree, with an explicit measured signed angle tolerance **≤ 5°** in the three test seats (or tighter if justified). Handle zero-length direction defensively.
2. Rotate the **actor hierarchy/actor pivot** at its existing seat contact point. Keep pad transform, `SeatRoot` position, `PadSeatAnchor`, idle channels, `HeadAnchor`, `NameplateAnchor`, `FXAnchor`, `UpperBodyBreath`, material variants, original GLB hashes and actor/seat IDs unchanged. Preserve contact error within the P0.8 tolerance; prevent foot/body clipping and don't put face through tree geometry.
3. Refactor camera target/focus composition if needed: `seatPose` and P0.8 preview logic must derive a correctly framed **front or 3/4 camera for the rotated actor**, with full seated body and leaf visible, safe 9:16 margins, readable nameplate/effect and no trunk occlusion. Don't reverse the character just to keep the old camera view. Validate all 3 seats, not only preview seat 1. Avoid gift-camera clipping and abrupt camera teleports.

### Phase 3 — Controlled, seed-repeatable camera variation

1. Keep `CINEMATIC` active indefinitely without gifts. Preserve conceptually `CLOSE → COMMUNITY → AERIAL → UNDER_TREE → repeat` across each cycle, yet create varied viewpoints/height/sweep direction so at least **two** contrasting clockwise/counter-clockwise or left/right camera paths exist. Preserve visibility of main Sakura and readable foreground when a close shot is chosen.
2. Select a **path variant once per cinematic cycle or at a planned safe transition**, not each render frame; implement deterministic seeded pseudo-random scheduling with an observable seed (e.g. documented `?seed=...` in dev/demo). For an identical seed and virtual time/event schedule, report and sampled poses must reproduce. At least three test seeds should demonstrate nonidentical safe trajectories in aggregate (do not assert every adjacent cycle differs by accident; avoid immediate same-route repetition when the bank allows).
3. Enforce positions/lookAt/FOV continuous through shot changes, path changes, loop boundaries, gift interruption, FIFO handoffs and `CINE_RETURN`. No snap/teleport, violent camera speed, sudden aim jump, water penetration, trunk collision or 9:16 frame clipping. Explicitly check closure **position and approximate tangent** where relevant; if a candidate route fails constraints, choose a known-safe route, log the fallback, and do not hide failure.
4. **Gift always overrides random cinema.** Event Engine's actor identity, per-giver FIFO order, bounded transition/hold, dedup, session validity, exhausted-seat fallback and overlay remain authoritative. The randomizer must never select a different gift actor or change domain event processing. After final gift, re-enter a safe cinematic anchor from the *actual current camera pose*, blending back smoothly rather than resuming a far-away random point.
5. Keep orbit parameters/timings/seed/clearance in localized viewer configuration, not business/event logic. Minimize new modules. Keep camera performance low-overhead (no allocation-heavy path regeneration each frame).

### Phase 4 — Evidence, regression, PR handoff, STOP

1. Execute existing event and viewer tests and builds, then focused new tests. Add deterministic tests for 3 seat angles, actor root/anchor invariants across idle t=0/0.5/1/1.5/2 s, expected gift focus framing and safe camera construction on each seat.
2. Run a virtual 60 Hz **≥ 85 s no-gift** trace (2 full 40 s P0.8-sized cycles plus margin, or longer if a changed explicit cycle duration requires it). Capture the actual route variant ID/seed, camera position, target, FOV, shot ID, orbit-direction label, boundary/gift-return events, and continuity metrics. Assert all four shot families visited per applicable cycle, two opposing sweep paths reachable across seeded runs, no freeze/teleport, bounded camera target/position/FOV deltas and frame-to-frame aim changes comparable to P0.8 baseline. Do not fake "random" using only changing labels.
3. Re-run P0.8 gift scenario with **A → B → C → cinematic**, plus duplicate/progress/final, reconnect/stale, malicious name rendering, missing/corrupt GLB and exhausted seat fallback. Capture actual actor/seat IDs and observable focus transitions. No unintended modifications to `packages/v2-events/**`.
4. Generate **native browser WebGL**, not concept/Blender, proof at 720×1280: at least 3 tree-facing seat views (side/three-quarter/integrated), 6 distinct cinematic frames spanning both direction variants, plus gift focus A/B/C and return. Pair matched P0.8/P0.9 camera views where possible; label whether frames are real Chromium/Edge at their recorded seed/time and list GPU/browser. Screenshots must show actor orientation, not merely camera UI/log labels.
5. Commit `apps/v2-viewer/evidence/p09/` with source revision, test logs, route trace/seed, screenshots, browser report, baseline comparison and limitations. If video capture stutters but live viewer is smooth, preserve underlying browser frame times instead of calling camera defect. Never claim owner RTX 3050 Ti/3060 or LIVE Studio performance PASS without owner-run diagnostics. Avoid unnecessary large binaries.
6. Create a small focused **stacked** PR targeting P0.8 integration branch; include base/head exact SHAs, files changed, seed reproduction instructions, test results, screenshot paths, GIF/video provenance if any, original GLB checksum nonchange, outstanding visual issues and performance truth. **STOP: P09_SA_REVIEW_REQUIRED**; no merge and no production/LIVE.

## 6. Objective acceptance matrix (SA review checklist)

- **A/Tree facing:** three seats show forward-vs-tree angle **≤ 5°** (horizontal world-space), actor rotates instead of lotus pad or entire island. Original asset bytes/hash preserved. Anchors and 2 s idle intact. Front/3/4 actor and lotus fit at gift focus, names/FX on screen.
- **B/Variety:** same seed + clock = exactly reproducible route; multiple seeds can select different safe paths; both left/right directions visible in *actual camera positions*; still covers CLOSE/COMMUNITY/AERIAL/UNDER_TREE and ≥2 continuous no-gift loops.
- **C/Continuity:** no route/loop seam teleport, lookAt snap, FOV spike, water/tree obstruction. Gift interruption and return from live camera position are smooth. Preserve bounded move/aim metrics from `test/camera.test.ts` or document a justified new bound with real evidence. Camera remains fully driven by typed event state.
- **D/Regression:** all P0.8 tests/builds continue PASS; 3 correct persons A/B/C in FIFO, correct seat actor/overlays and confirmed gift totals, duplicate protection, truthful no-seat fallback; checksum failure still explicit; browser render at 720×1280 for ECO/QUALITY when feasible.
- **E/Truth & scope:** source SHA, commands, screenshots and browser data attached. No use of paid tools; amount **0 VND**. No art rework, V1, LIVE transport or unauthorized merge. P0.9 technical acceptance and Owner visual approval are **separate gates**.

## 7. Confirmed commands and reproducibility guidance

At P0.8 SHA, standalone `package.json` scripts are verified; **Node 24+**:

```powershell
# From an implementation checkout of P0.8-derived branch:
Set-Location packages/v2-events
node --version
npm.cmd ci
npm.cmd test
npm.cmd run build

Set-Location ../../apps/v2-viewer
npm.cmd ci
npm.cmd run assets:p08
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Baseline viewer path: `http://127.0.0.1:5173/`; gift demo: `http://127.0.0.1:5173/?demo=gifts&clean=1`; profile `&profile=quality`. A new `seed` query parameter is proposed, not present at baseline: implement, document, test if chosen. `npm.cmd run evidence:p08` exists at baseline; P0.9 may provide a **new** `evidence:p09` script only after adding it to viewer package.json and executing it; do not claim a nonexistent script worked. Only run tests/commands you actually have and log their exit codes.

GPU gate after SA code/visual review: Owner may run native playback and diagnostics with RTX 3050 Ti ECO / RTX 3060 QUALITY, separately with LIVE Studio. That gate is not a condition to invent software-only FPS PASS.

## 8. Submission format / owner handoff

Return exactly:
1. **SA finding → Codex action → evidence** for both facing and camera diversity, with PASS/PARTIAL/BLOCKED/PENDING as actually observed.
2. Branch/new PR **link**, P0.8 source **baseline SHA**, new **HEAD SHA**, changed paths; confirm PR #5 and #1–#4 untouched and no merges.
3. Per-seat before/after heading error, unchanged transform/contact/animation proofs, original GLB SHA/byte assertions.
4. Seeds, variant IDs, 2-loop traces, measured camera continuity metrics and at least six true native 3D frames; A/B/C gift screenshot and camera/identity logs.
5. Exact commands/test logs, environment/browser/GPU/capture resolution; known visual/performance limitations; **0 VND**.
6. Any owner actions (hardware check only when requested) and precise remaining blockers.
7. **Stop and request SA review → Owner P0.9 visual GO.** Do not mark complete/merge/deploy because tests alone passed.
