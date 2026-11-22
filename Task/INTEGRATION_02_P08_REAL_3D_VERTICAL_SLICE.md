# INTEGRATION 02 — P0.8 REAL 3D VERTICAL SLICE (SA-assigned after owner ART GO)

**SA issued:** 2026-11-22. **Status:** ASSIGNED TO CODEX FOR IMPLEMENTATION; **NOT** a merge, deployment, benchmark, or release approval.

## 1. Authority / gate transition
Owner explicitly accepted the current P0.7b1 male Side Part 7/3 appearance and requested the next phase after reviewing AI Visual branch `13f818b..ce0db94`. Formal SA [PR #2 review #6012870577](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6012870577): technical GLB and invariant checks PASS, real new Blender Cycles evidence present, **OWNER ART GO**, with nonblocking rounded-cap visual debt. No new P07b2/hair polish and **do not rerun historical Blender**.

This task **supersedes the 2026-11-21 OWNER HOLD opening** of [INTEGRATION_01_VERTICAL_SLICE](INTEGRATION_01_VERTICAL_SLICE.md) **only for authorization/specific accepted asset versions**. All remaining applicable requirements from INTEGRATION_01 and normative design remain in force. DO NOT merge PR #1/#2/#3/#4; DO NOT modify V1 or production LIVE. Original owner source/video may be used as reference only if actually available.

**Next minimum outcome:** a real runnable V2 DEMO scene: **Sakura R16 + one original P02 lotus pad + one approved male P07b1 cross-legged chibi**, native imported GLBs, idle animation, 720×1280 cinematic and correctly targeted synthetic A/B/C gift focus. Later alternate poses/hair/female/catalog, crowds, and GPU/LIVE Studio are distinct gates, not automatic scope.

## 2. Roles and reading order
**SA** owns Design/Task, asset/architecture acceptance and PR review. **Codex / AI Code** owns the integration runtime, typed adapters and tests; must not generate, sculpt, silently change/re-export any production GLB or art. **AI Visual** stops modeling unless SA+owner establish a concrete art blocker. **Owner** runs Windows hardware/visual acceptance and authorizes merges separately.

Read in order:
1. `Design/07_WORK_RULES.md`, `Design/16_P0_APPROVAL_AND_HANDOFF.md`, `Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md`, `Task/00_P0_EXECUTION_ORDER.md`.
2. `Design/09_GIFT_CAMERA_DIRECTOR.md`, `Design/13_3D_EVENT_INTEGRATION_CONTRACT.md`, `Design/10_GRAPHICS_PROFILES.md`, `Design/11_3D_ASSET_PRODUCTION_PIPELINE.md`.
3. `Task/CODEX_01_RENDERER_CAMERA_SPIKE.md`, `Task/CODEX_02_DEMO_EVENT_ENGINE.md`, `Task/INTEGRATION_01_VERTICAL_SLICE.md`, PR #3/#4 existing source/tests/reviews.
4. Approved asset manifests/reports from `p7b1/`, `p5f/` (leaf), `r16/` (Sakura). Review current remote heads and actual binary bytes, not old pending-upload text as truth.

## 3. Pinned inputs; stop on missing/mismatch
Repository `nguyenbui5701/OnlinePagodaVer2`. Review anchors at task issue:
- **AI Visual [PR #2](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2), Draft, head** `ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced`.
  - Selected P07b1 male cross actor: `Assets3D/Review/lotus_pad_chibi/p7b1/meditator_male_cross_prayer_sidepart73_p07b1.glb`; **589,932 B; SHA-256 `4e8c8d082352d67d0eaf637df7973931442c724a0f7db598ea8fde8de3873097`**.
  - P07b1 kneel **approved art option, NOT required first slice**: `p7b1/meditator_male_kneel_prayer_sidepart73_p07b1.glb`; **456,348 B; SHA-256 `3707ec76f311b10f4b672940edbda211c2d021f12c8c5300367f7fb4d2e1f96c`**.
  - Frozen original lotus `Assets3D/Review/lotus_pad_chibi/p5f/p02_baseline/lotus_pad_01.glb`; **262,108 B; SHA-256 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`**. Verify full path and bytes before use.
  - Freeze female cross P05f, female kneel P05c, male P06c baseline, accepted P07a1 undercut and all other releases; NO modifications.
- **Sakura [PR #1](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1), Draft, observed head** `d9dbeb6a81d1e667d471b8f62910829bb1ce2bd9`.
  - QUALITY `Assets3D/Review/sakura_hero/r16/sakura_hero.glb`; **5,055,232 B; SHA-256 `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`**.
  - ECO `Assets3D/Review/sakura_hero/r16/sakura_hero_eco.glb`; **1,393,492 B; SHA-256 `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`**.
  - Paths are visible on GitHub; **SA did not independently rehash current large remote R16 GLB bytes in this review**. Codex must verify copied canonical binaries raw SHA+length and fail closed if missing, LFS pointer-only, corrupted or different. Do not rely on machine-local `D:/...` paths as runtime deployment source.
- **Event [PR #3](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/3), code-reviewed head** `308f8a3ba88a8ebd18c511ddf8cbd161061e8e14` in `packages/v2-events/**`. Existing deterministic domain review: prototype accepted for integration, no production TikTok.
- **Renderer [PR #4](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/4), code-reviewed head** `9a75a82df7be8de7906a416fcc5925ae572ff5f0` in `apps/v2-viewer/**`. Existing Three.js R16 import + 46s cinematic prototype; native PBR parity partial, no real pad/chibi/gift integrated.

**Git discipline:** New dedicated `integration/v2-p08-real-vertical-slice` branch/PR from a recorded main baseline SHA. Integrate reviewed PR #3/#4 changes by a documented safe strategy (inspect current git merge-base and verify no conflicting edits); **DO NOT merge them to `main`, rewrite other branches, switch their live worktrees, force push, or modify V1**. Version and hash any approved binary copies included in runnable integration package. No concurrent edits to same files by separate agents.

## 4. Implementation scope — only first integrated vertical slice
1. Native Three.js GLTFLoader imports **exact verified** R16 QUALITY/ECO, P02 leaf and P07b1 cross actor. Actor is a real GLB, not a screenshot, mesh placeholder or geometry code. Manifest uses stable asset ID, path, SHA, byte length, animations, material variants, world conventions and selected revision. Renderer must show a visible failure on missing/mismatched required assets; no silent fallback to the wrong actor.
2. **Seat and animation contract:** +Y up, +Z actor forward, `SeatRoot` at local origin, actual original lotus `PadSeatAnchor` at **[0,0.195,0] local to pad**, actor root aligned via parent/world transforms; verify `HeadAnchor`, `NameplateAnchor`, `FXAnchor`, `UpperBodyBreath`. Play real `sit_idle` 2-second/17-sample clip via `AnimationMixer` and demonstrate 0/0.5/1/1.5/2s fit; do not fake a `react_gift` animation if GLB lacks it. The same actor/seat reused for A/B/C as capacity allows; test multiple seats only as needed to demonstrate correct identity.
3. **One authoritative typed protocol adapter:** connect PR #3 versioned `AvatarPresentation`/`FocusIntent` and room revision to PR #4 presentation/camera state without duplicate divergent definitions. `actorId → seatId → actual actor world transform + nameplate/FX anchors`. Event Engine owns gift count, dedup and FIFO; renderer owns only visual scene/focus. Never use raw usernames as HTML or surface private TikTok IDs.
4. **DEMO cinematic and gifts:** with no gift camera runs ≥45 seconds through CLOSE→COMMUNITY→AERIAL→UNDER_TREE→repeat continuously with parallax and no teleport. A unseen giver spawns/ensures real seat or truthful fallback; while A focuses, B then C queue, **focus A→B→C→return** with real camera transition, bounded hold, valid displayed name/gift FX. Duplicate progress/final must not duplicate focus or gift count. Session reconnect/expired actor/seat capacity must not focus wrong person. Scene remains demo-only, no network TikTok IO.
5. **Visual parity:** 720×1280 genuine browser screenshots at six reference camera times/angles and gift focus/return. Compare R16 original Cycles and owner `chuav2.mp4` views if accessible, concentrating on pale canopy/dark bark and camera framing; fix renderer lighting/tonemap only, not asset geometry. Basic pink-violet pond, fog, depth, water shader permitted by Codex. Do not require more AI Visual Blender.
6. **Performance instrumentation:** collect actual browser frame times/FPS/drawcalls/triangle counts and record machine, viewport, render profile. SwiftShader FPS is not owner GPU result; owner RTX 3050Ti/ECO and RTX 3060/QUALITY with LIVE Studio **remain future separate gate**. No unsupported production performance claims.

## 5. Test/evidence acceptance matrix (must actually execute)
- **Asset integrity:** log all remote/current SHA, byte counts, GLB parse/import validation, R16 ECO/QUALITY selection, P02 + actor names and mesh/material counts; correct mismatch failure; do not classify ZIP/Blender evidence as native browser proof.
- **Functional:** deterministic automated tests for v0.1.0 protocol serialization, actor-seat mapping, queue fairness A→B→C, progress/final exactly-once, reconnect/stale revision, exhausted seats, malicious display text, and `focusSkipped` fallback.
- **3D/animation:** original browser WebGL screenshots of actor seated on real lotus; camera-facing face/palms and seat-contact front/side/3Q, five idle timestamps; head/nameplate/FX world positions and correct target logged.
- **Cinematic and gift:** timestamped ≥45s no-gift trace/video across four shots + gift A/B/C at 720×1280; screenshots prove correct targeted chibi and smooth return, no stuck/frozen camera.
- **Code tests:** reproducible local commands and committed output/trace/screenshots, no extraneous root workspace changes except specifically justified integration wiring and no V1 edits. Distinguish actually executed browser evidence from planned owner tests.
- **PR:** dedicated integration branch/PR description includes base/head SHAs, exact files changed, tests run, dependencies, known PBR gaps, remaining owner/GPU gates. STOP after handoff for **SA REVIEW → OWNER INTEGRATED-SCENE VISUAL GO**. No merge or LIVE deployment.

## 6. Verified pre-existing Windows PowerShell commands and request to Codex
Existing standalone packages declare Node **>=24**, verified scripts:
```powershell
cd apps/v2-viewer
node --version
npm.cmd ci
npm.cmd test
npm.cmd run build
# Current renderer-only: npm.cmd run assets -- "<path-to-owner-R16-directory>" (when required locally)
cd ../../packages/v2-events
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run demo
```
These are **existing individual package commands**, **not guaranteed integrated-root commands**. Codex must document actual new integration commands only after creating/checking the integration package.json. Prefer no unnecessary root workspace. Provide exact Windows steps and request user’s screenshot/log for tests run on user hardware. Do not claim tools were executed unless actual evidence exists.

## 7. Required Codex completion report
State **(a)** exact integration PR/head/base and preserved PRs, **(b)** authentic binary SHA and THREE import facts, **(c)** screenshot and timestamped camera trace plus targeted A/B/C proof, **(d)** test/build commands and real outputs, **(e)** known native PBR/fidelity/performance limitations, **(f)** NO merged PRs, paid services, V1 changes, or invented GPU/LIVE proof. **STOP: P08_SA_REVIEW_REQUIRED**.