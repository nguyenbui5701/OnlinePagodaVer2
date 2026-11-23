# CODEX 09 — P0.13-A Gift Blessing Choreography

> SA ASSIGNED, 2026-11-23. Owner said “done, continue” after [PR #12 SA Technical PASS #6018115256](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/12#pullrequestreview-6018115256), granting OWNER_P012D_VISUAL_GO for the approved 12-slot community. NEXT: Codex-only timed gift effects under [Design 22](../Design/22_P013_GIFT_BLESSING_CHOREOGRAPHY_CONTRACT.md). **Hard STOP: P013A_SA_REVIEW_REQUIRED. NO MERGE.**

## 1. Role, objective, scope, STOP

**Codex / AI Code only.** Improve the existing validated P0.10 observed/confirmed gift visual into a staged blessing narrative: provisional cue; confirmed warm light at the *correct* P02 pad; three to five restrained luminous petal/orb halo FX rising near the actor; a short bounded spark trail toward the original R16 Sakura/gold veins; fade as the existing camera returns to cinematic. Existing actor identity and gift FIFO remain authoritative, not visualized based on any guessed viewer.

**No new asset or sprite generation.** Use existing Three.js shaders/particle pools, NOT artist GLB, bespoke rose art, AI-generated images, SVG rose badges, borrowed TikTok icons or any generated production geometry. Design 17 shows rose-in-ring symbols in the Owner reference, but these are **deferred** for a separate AI Visual/Owner art contract. Report P013_ROSE_ICON_VISUAL_FIDELITY_DEFERRED honestly. Optional short original blessing caption must be fixed/sanitized and pass crop checks.

**Do not modify:** original P07b1/P05f/P02/R16/bloom/bud meshes or material art; twelve placement positions (3 real occupied-capable hero seats, 9 anonymous); gender/clothing slot look; P0.9 camera choreography; P0.11 sky/water appearance; V2 Event Engine or protocol; LIVE adapter, TikTok identity/gift commerce, V1, production deployment or merges. No Blender, paid service or unmeasured GPU claims.

## 2. Exact Git and source pins

- Repository: https://github.com/nguyenbui5701/OnlinePagodaVer2
- **Baseline:** [PR #12](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/12), head branch feature/v2-p012d-character-diversity, exact HEAD **385816518987b2a0ea6ef094bb0f65bfb363e720**, previously [SA TECH PASS](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/12#pullrequestreview-6018115256), now Owner Visual GO.
- PR #12 bases [PR #11](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/11) exact 5aadf1e603aa0c82369aa1abc60c807c6ce1748c. Original PR #2 GLB artist SHA ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced, approved botanical PR #10 SHA 9a01b39afde642d55dcf9bc7639f3a84ef913e4d; all frozen and unmerged.
- **Branch:** create a NEW clean worktree/branch feature/v2-p013a-gift-blessing starting from exact PR #12 HEAD, and a NEW stacked PR whose base is feature/v2-p012d-character-diversity. Do not change existing PR branches or cherry-pick artist sources. Reconfirm all pinned heads before work; if any moved, STOP and ask SA to re-pin.
- **Allowed paths only:** apps/v2-viewer/**, including a small new src/gift-blessing.ts or equivalent planner, focused gift-fx.ts, fx-profiles.ts, main.ts and safe overlay additions if needed, tests/gift-blessing.test.ts, evidence/p013a/**, and P013A.md. Do not edit packages/v2-events/**, Assets3D/**, camera.ts or older frozen configs without specific proven SA-approved necessity.

## 3. Required reading and evidence — exact source, not summaries

Read in order:
1. [Design/07 Rules](../Design/07_WORK_RULES.md), [Design/14 Zero Cost](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16 Owner approval](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 Execution order](00_P0_EXECUTION_ORDER.md).
2. **[Design/22 P0.13 Gift Choreography — authoritative contract](../Design/22_P013_GIFT_BLESSING_CHOREOGRAPHY_CONTRACT.md)**; [Design/17 reference roadmap](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md) Step 3; [Design/09 Gift Camera](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design/10 Profiles](../Design/10_GRAPHICS_PROFILES.md), [Design/13 Typed identity](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/21 character look](../Design/21_P012D_CHARACTER_DIVERSITY_CONTRACT.md).
3. At exact PR #12 HEAD read apps/v2-viewer/src/gift-fx.ts, fx-profiles.ts, main.ts, slice-overlay.ts, slice-driver.ts, lighting.ts, twilight.ts, water.ts, camera.ts, seat-scene.ts and test/gift-fx.test.ts. Read packages/v2-events/src/protocol.ts, engine.ts, fixture.ts READ-ONLY. Read P012D.md and original P0.12-D and P0.10 native WebGL evidence.
4. Owner's original chuav2(1).mp4 is NOT present in the Codex repository; use Design 17's 00:20–00:25 gift-focus observations. Do not claim to have watched unavailable bytes or copy platform overlays.

## 4. SA grounded PASS / gap assessment

**PASS baseline:** existing GiftFxLifecycle validates roomSessionId, requestId, actorId, seatId, visible AvatarPresentation, active focus + dedicated confirmed or observed ack; bounded 256-request dedup ledger. Current timing values from fx-profiles.ts: observed 950ms, confirmed 1650ms, return fade 260ms, plus ECO 18 / QUALITY 30 original spark capacity, one halo and water ripple. A→B→C FIFO, confirmed-once and Duyên no-seat text-only fallback have already passed regression evidence. P05f female at seat-1 has correct source NameplateAnchor and FXAnchor; no new actor art needed. Old 8 Event +31 Viewer =39 tests and both builds passed on Codex's prior logs, but MUST be rerun on new PR.

**P0 gap:** existing event-linked effect is a simple one-stage ring/sparks/ripple, without the multi-step choreography visible in Design 17's description. We need a deterministic *subphase presentation*, NOT a new scheduler or gift economy.

**P1 art gap:** bespoke rose-in-ring graphic is not approved and is out of this task. Abstract shader orbs must not be advertised as the final rose icon or complete P0.13 video fidelity.

## 5. Phased implementation and objective gates

### Phase 1 — confirm baseline / read current typed FX lifecycle

Verify clean worktree, exact PR #12 HEAD, source GLB checksum pins, existing A/B/C gift trace, two seeds 9 and 71 and old native screenshots. Identify observed versus confirmed boundaries and source actor/FX anchors. Add explicit query option blessing=on|off, default OFF, DEMO gifts/capacity/community only; fx=off and idle must remain unchanged. Record current baseline image hashes and rendering performance before modifying shaders.

### Phase 2 — isolated deterministic choreography

Implement one pure time-based planner using existing GiftFxLifecycle returned cue with room+request+actor+seat+phase+progress+opacity and snapshot virtual time. No second gift ledger. On confirmed: (a) ~0–220ms warm under-seat light; (b) ~180–1100ms 3 ECO / 5 QUALITY original abstract luminous halos/petals orbit and rise; (c) ~650–1350ms bounded sparks toward Sakura, optional small pulse of existing gold-vein clone using its normal P0.11 appearance multiplier; (d) ~1350–1650ms fade, then old camera return. For observed, only short provisional cue. Durations/tints are tunable proposals backed by actual screenshots, not measurements copied from source video.

Respect portrait-safe 720×1280 margins (capture.safeMargin .08), face/palms/name/gift label and legitimate male/female source anchor. Reuse fixed Points buffers/shader materials; avoid per-frame material/geometry allocations and full-screen bloom. Never turn ornamental halo count into confirmed gift count or generate image/model art. Dedupe repeated final and reconnect. No-seat and stale/expired/room-changed request must emit no spatial blessing; new actor B/C must not retain old A's orb and gift label.

Only if it fits and does not obscure actual name/gift, optionally show a short original safe fixed blessing sentence in UI, with textContent and no user raw comment content. With blessing=off all old P0.12-D pixels, body pose, look, shadows and text must be unchanged. Record separate scene and resource disposal including context loss/restore.

### Phase 3 — tests, native browser evidence, performance

Run old 39 tests plus new planner/integration tests: observed is not confirmed; confirmed gate only once; repeated/late ack; A→B→C; active A then B; D no-seat; missing seat, expired/old room, reconnect, TTL, ledger cap; profile counts, seed determinism, unchanged 12/3 seats, female and male FX/name anchor; blessing OFF/fx OFF/idle pixel parity; context-loss restore and resource cleanup. Both Event and Viewer builds must pass.

Capture original **native 720×1280 browser WebGL** screenshots in ECO and QUALITY at exact virtual times: provisional observed, confirmed warm, halo ascent, toward-tree response, fading, camera return, A→B→C different actors, P05f An with original name and 2 hoa hồng, Duyên no-seat text fallback. Provide at least six camera frames per profile, paired blessing OFF/ON where meaningful. Record an actual continuous native browser video OR a dense precisely timestamped true frame sequence that demonstrates subphase animation (do NOT label stills a video). Preserve fixed seed/camera/FOV and original 85s idle, 66s gift/capacity/community traces, two seeds.

Same-host A/B measure exact OFF vs ON at active confirmation for ECO and QUALITY: browser+ANGLE renderer, GPU software/hardware distinction, sample count, FPS, p50/p95/p99 rAF time, draw calls, triangles/geometry/material/texture/shadow, JS heap and memory cap. Initial extra draw targets ≤3 ECO and ≤5 QUALITY; measure actual figures, reduce FX density if excessive. Native context restore should render multiple normal frames without GL errors, while logging inherited synthetic-teardown INVALID_OPERATION warnings honestly rather than suppressing them. No fictitious RTX/LIVE benchmark.

### Phase 4 — PR submission and STOP

Open only one new stacked Code PR onto PR #12 branch. Deliver apps/v2-viewer/P013A.md with the exact implementation, 0-VND provenance, source/new HEAD, reproducible Windows PowerShell runbook, implemented scripts, shot-time and state tables, native screenshot/video SHA ledger, test/build logs, regression traces, budgets and GL lifecycle limitations. Clearly label **P013_ROSE_ICON_VISUAL_FIDELITY_DEFERRED** and Owner P0.13-A Visual GO pending.

Final Codex report: **SA finding → code action → actual evidence → PASS/PARTIAL/HOLD**, new PR URL and immutable HEAD, precise changed paths, no fake identity/asset, and STOP **P013A_SA_REVIEW_REQUIRED**. Do not merge, enable by default, launch P0.13-B art/P0.14/RTX/LIVE or mutate existing PRs.

## 6. Owner-runnable PowerShell commands — scripts verified on PR #12

    Set-Location packages/v2-events
    node --version
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
    npm.cmd run dev -- --port 5185 --strictPort

New script evidence:p013a must be implemented before claiming it exists. New proposed preview URL after code lands:
http://127.0.0.1:5185/?demo=community&seed=9&profile=quality&clean=1&botanicals=on&diversity=on&blessing=on
For old A/B/C demo use demo=capacity or demo=gifts. Compare blessing=off with same seed/time. This URL parameter does **NOT** currently exist on PR #12.

## 7. Acceptance summary

- **PASS correctness:** real A/B/C actor focus, confirmed once, 3 real/9 anonymous, no-seat is text-only, no replay and pure deterministic phases.
- **PASS visuals:** original native ECO/QUALITY 9:16 moving multi-stage effect, original name/gift readable, camera route preserved, OFF pixel-identical.
- **PASS scope:** only Viewer code, no source meshes, new icon art, Event Engine, V1, LIVE, RTX claims or merges; original rose glyph explicitly deferred.
- **STOP:** P013A_SA_REVIEW_REQUIRED → SA technical review → separate Owner visual GO.


## 8. Owner P0.13-A Visual GO and task close — 2026-11-23

**Historic pending resolved:** Formal [PR #13 SA Tech PASS #6018488791](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/13#pullrequestreview-6018488791), reviewed immutable HEAD `0810f537a7cbffd539c8acb9b8cd6ba2715bbc9f`; Owner subsequently wrote **“duyệt, tiếp tục”**. Record **`OWNER_P013A_VISUAL_GO`** for CodeX 09's abstract halo/spark gift sequence. **No additional P0.13-A code changes or Blender/AI Visual rework required**; reference rose glyph remains **`P013_ROSE_ICON_VISUAL_FIDELITY_DEFERRED`**, not a hidden technical blocker. Preserve PR #13 source and native screenshot evidence without merging.

**Next authorized task:** [CODEX 10 — P0.14 Seven-Shot Parity / QA](CODEX_10_P014_SEVEN_SHOT_PARITY_QA.md) under [Design 23](../Design/23_P014_SEVEN_SHOT_PARITY_AND_QA_CONTRACT.md), new small stacked Viewer PR pinned to PR #13 HEAD, original 7 video shot intentions vs actual DEMO 9:16, no new art generation, Event Engine/V1/LIVE/RTX, or merger. **STOP `P014_SA_REVIEW_REQUIRED`**.
