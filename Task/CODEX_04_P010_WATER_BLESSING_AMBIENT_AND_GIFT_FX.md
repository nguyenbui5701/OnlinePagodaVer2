# CODEX 04 — P0.10 Water, Blessing Tree Ambient & Gift Celebration FX

**SA issued:** 2026-11-22. **Status:** ASSIGNED TO CODEX for a **new, isolated P0.10 runtime visual-FX iteration**. **Not a merge, deployment, LIVE/TikTok integration, Blender task, GPU performance sign-off or production-release approval.**

## 1. Role, objective, exact scope, STOP/GATE

**Owner direction:** After accepting P0.9 tree-facing characters and seeded multi-direction camera, owner explicitly **paused the suggested RTX/LIVE benchmark phase** and requested better pond water plus effects appropriate for the blessing Sakura: gentle flying fireflies/glowing motes, softly falling leaves and blossoms, gift celebration effects and other small, relevant life/atmosphere details.

**CODEX (AI Code) owns shader and runtime FX** only. **SA** specifies scope/invariants and reviews code, evidence and graphics tradeoffs; **Owner** evaluates the real browser visual. **AI Visual** is not assigned. Do not ask AI Visual to rerun historical Blender or make a new GLB for procedural shader/particle work.

**Target:** turn the already approved P0.9 *real 3D DEMO* into a calm, living blessing-tree scene: readable water and a soft reflected glow under the tree; low-density, depth-aware floating light points; occasional drifting petals/leaves; **correctly targeted** gift-response glow/ripple/sparkle that gracefully fades and never hides a viewer, actor or name.

**STOP at `P010_SA_REVIEW_REQUIRED`** after Codex commits a new separate PR, passing regression tests and native WebGL evidence, then SA review → **Owner P0.10 visual GO**. Do not begin hardware/LIVE benchmark or merge any stacked PR automatically.

**Hard out-of-scope:** modify V1, production TikTok worker/transport, event queue/identity/totals, gift payment semantics, scene/camera route or actor orientation, asset GLB meshes/hair/materials/animations, scene expansion or new avatars/crowd, Blender/Cycles rerenders, video cloning, paid textures/services, full-screen bloom/expensive SSR/planar reflection, production LIVE, unrelated dashboard/ritual features. Correctness or regressions require an explicit SA blocker report, not scope creep.

## 2. Repository and immutable stack

- Repository: https://github.com/nguyenbui5701/OnlinePagodaVer2
- **Exact approved runtime baseline:** P0.9 [PR #6](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/6), branch `feature/v2-p09-tree-facing-cinematic`, HEAD **`675675cdf4d1a6868f370e6417ac689a15c1054b`**.
- [Formal SA P0.9 review #6013179439](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/6#pullrequestreview-6013179439) = **TECH PASS / OWNER VISUAL GO**. It does **not** cover water/ambient particles/gift celebration. Preserve this decision; no reopening P0.9 orientation/camera.
- P0.9 PR #6 is stacked on P0.8 [PR #5](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/5) at `844361b5edd8ca1c2498ee1e708c66b634312069`; PR #5 is based on `main`. PRs #1–#4 are separate.
- **Create a new Codex feature branch from the exact P0.9 HEAD** (suggest `feature/v2-p010-water-blessing-gift-fx`). Open a new **stacked PR targeting `feature/v2-p09-tree-facing-cinematic`**, not `main`, P0.8 or PR #6's existing head branch. Verify base is still at the pinned SHA before opening PR. If P0.9 branch moved unexpectedly, STOP and report new head/base to SA; never force-push or overwrite someone else's branch.
- Scope the diff to `apps/v2-viewer/**`, mainly existing `src/water.ts`, viewer scene entry `src/main.ts`, a small isolated FX controller or two, viewer-level tests, diagnostics and `apps/v2-viewer/evidence/p010/**`. Update `apps/v2-viewer/package.json` **only** to add a real, tested evidence script if needed. **Do not modify `packages/v2-events/**`** or any canonical `Assets3D/**` content. Keep all approved manifests unchanged.

**Frozen original GLBs (SHA-256):**
- Sakura R16 QUALITY: `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`, 5,055,232 bytes.
- Sakura R16 ECO: `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`, 1,393,492 bytes.
- Lotus P02: `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`, 262,108 bytes.
- Male cross P07b1: `4e8c8d082352d67d0eaf637df7973931442c724a0f7db598ea8fde8de3873097`, 589,932 bytes.

## 3. Required reading order — do not skip

1. [Design/07_WORK_RULES.md](../Design/07_WORK_RULES.md), [Design/16_P0_APPROVAL_AND_HANDOFF.md](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00_P0_EXECUTION_ORDER.md](00_P0_EXECUTION_ORDER.md), [Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md).
2. [Design/09_GIFT_CAMERA_DIRECTOR.md](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design/13_3D_EVENT_INTEGRATION_CONTRACT.md](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/10_GRAPHICS_PROFILES.md](../Design/10_GRAPHICS_PROFILES.md), [Design/12_CORE_PRIORITIES_AND_AI_ROLES.md](../Design/12_CORE_PRIORITIES_AND_AI_ROLES.md).
3. Previous task [CODEX 03 — P0.9](CODEX_03_P09_TREE_FACING_CONTROLLED_CINEMATIC.md), P0.9 [Windows guide](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/675675cdf4d1a6868f370e6417ac689a15c1054b/apps/v2-viewer/P09.md), [native browser evidence](https://github.com/nguyenbui5701/OnlinePagodaVer2/tree/675675cdf4d1a6868f370e6417ac689a15c1054b/apps/v2-viewer/evidence/p09) and formal SA review above.
4. At the exact P0.9 SHA read `apps/v2-viewer/src/{water,main,lighting,slice-overlay,slice-driver,seat-scene,camera,slice-camera}.ts`, `apps/v2-viewer/src/style.css`, `src/{sakura-r16,p08-assets}.json`, viewer tests and evidence runner, and `packages/v2-events/src/{engine,protocol,fixture}.ts` **read-only**. Derive FX only from the existing typed snapshot/effect/seat anchors; never read raw provider private IDs.
5. `chuav2.mp4` is **not available to this SA review**. If Codex also lacks it, say so; do not claim direct video parity or invent timestamps. Owner's current browser view and committed PR #6 images are the legitimate comparison baseline.

## 4. SA grounded review: what exists vs missing

| Scope / gate | Status at pinned P0.9 | Evidence / precise action |
|---|---|---|
| Scene + actor direction | **PASS / FREEZE** | P0.9 actor-only tree-facing, native GLB SHA checks, three lotus seats, 2 s `sit_idle` |
| Cinematic variation | **PASS / FREEZE** | Four seeded east/west × low/high routes, continuous 40 s loops, shot family CLOSE/COMMUNITY/AERIAL/UNDER_TREE |
| Water shader | **EXISTS / VISUAL POLISH NEEDED** | `src/water.ts` already uses 800×800 plane at waterY=0, fragment ripple, Fresnel/color/haze and moving glint; **do not replace working water with a new static lake** |
| Ambient FX around tree | **MISSING IN VIEWER** | No dedicated 3D procedural fireflies, drifting leaf/petal systems in the audited P0.9 viewer scene |
| Gift celebration | **PARTIAL** | `src/slice-overlay.ts` displays name + gift label, `style.css` provides label glow; no actor-anchored 3D gift sparkle/ripple. P07b1 does **not** have a mandated `react_gift` clip; don't pretend one exists |
| Gift business semantics | **PASS / FREEZE** | `SliceDriver` uses Engine `FocusIntent`, `giftFx`, `requestId`, `actorId`, `roomSessionId`, confirmed/observed and fallback; 17 baseline tests |
| Performance | **PENDING Owner GPU/LIVE** | P0.9 Edge/SwiftShader rolling ~13.96 FPS at 720×1280, LIVE closed; this is **not** a result for RTX 3050Ti or RTX 3060. P0.10 must avoid uncontrolled extra work |

**Priority:** P0 water + restrained tree ambience + honest correctly targeted gift FX. Extras should be permitted **only if** they improve this scene and preserve legibility; no unrelated feature expansion.

## 5. Implementation phases and concrete visual behavior

### Phase 1 — Inventory, spec and baseline captures before changing code

1. Pin and log Git SHA, PR stack, existing profile (ECO/QUALITY), fixed seed `9`, and exact original GLB hashes. Capture matched **existing** P0.9 browser frames/metrics at 720×1280 for no-gift, aerial, under-tree, near-water and gift A/B/C; record URL/seed/time/shot/profile rather than relying on subjective description alone.
2. Inspect water world Y=0 vs seat/pad world transforms, camera near-water clips and FogExp2/AgX tone mapping. **Use the existing `water.ts` shader as baseline**; verify what is actually missing visually and preserve stable fog/lighting.
3. From `SliceDriver.update()`, trace `GIFT_TRANSITION`, `GIFT_FOCUS`, `CINE_RETURN`, `active`, `overlay` and correct mapping `actorId → seatId → actual FXAnchor/HeadAnchor/world transform`. Separate visual event lifecycle from business event count and document the source of each trigger.
4. Prepare an implementation table showing estimated and then **measured** (not promised) active particles, draw calls and short-lived effect pools in ECO/QUALITY. Do not commit guessed benchmark claims.

### Phase 2 — Make existing pond water feel alive (required)

1. Keep the existing actual Three.js plane/shader with time uniform and 0 water height. Improve smooth, **slow** ripples in more than one direction, non-repeating fine-scale breakup and **subtle** color/fresnel motion; the movement must be perceptible in video and calm, without banding, strobe, large high-contrast stripes or flashing.
2. Add **stylized approximate reflection / warm highlight of the Sakura canopy and golden trunk** projected around the tree onto water, with horizontal distortion and falloff. A physically correct reflection/SSR is NOT demanded. If an inexpensive tree-grounded glow/glint is more robust than a true mirror, choose and **label it as stylized approximation**. The water should visibly sit under the model rather than obscure Sakura roots and the seated lotus.
3. When a gift has a real visible seat, permit a **small, short, fading ripple at its water X/Z position** as a visual layer, anchored correctly to waterY=0. No water ripple/flash at the *wrong seat* when capacity fallback occurs. Preserve calm ambient ripple if no gifts.
4. Preserve original shading language: muted dusk lavender/rose water, warm golden tree glints, soft reflections and depth; no neon ocean, intense foam, giant mirror texture, costly full-scene planar pass, fake static screenshot or geometry replacement.
5. Expose bounded parameters (amplitude, speed, wave scale, reflection intensity, ripple radius/duration) as named config with an ECO/QUALITY budget; no one-off magic values in event/domain logic. Keep shader compilation, tone mapping and dispose correct.

### Phase 3 — Blessing-tree ambience (required)

Create lightweight **procedural runtime visual primitives** (GPU Points, small pooled billboards or instanced planes; choose the cheapest maintainable approach), not production GLB vertex art.

**Ambient layer A — fireflies / blessing motes (required):**
- Warm cream/gold/pink motes float **slowly** around the lower trunk and under-canopy, with a few gently traversing the root/pond boundary. Use deterministic seeded phase offsets and time-driven drift, not random teleport or per-frame respawn. Gentle pulse, not hard blinking; vary sizes and depth, no full-screen bright flares.
- Keep motes away from characters' faces and gift overlays where possible; fade with scene depth/distance. Layer stays alive in both idle cinematic and gift focus, but can dim during celebration so the intended gift remains readable.

**Ambient layer B — falling Sakura petals (required):**
- Sparse, visible petals originate near canopy volume, drift downward and sideways with a mild wind field; turn/float and recycle smoothly without popping in front of the lens. Pedals should be **petals**, not rectangular rain or flat confetti. Use simple runtime stylization and camera/viewport tests.
- Prefer a small number of foreground/readable petals and many fewer distant particles; budget within quality profile.

**Ambient layer C — drifting leaves (required but minimal):**
- A **distinct, scarce** soft falling-leaf motion, colored subtly and not a green downpour. Keep it visually secondary to Sakura petals. If leaf color conflicts with Sakura, tune to warm muted tones; document the choice.
- Avoid generating a cloud that blocks the tree canopy, actor face, nameplate or gift feedback.

**Optional, only when cheap and evidence-backed:** faint upward golden wisps near bark/gold seams; a soft pool of luminescence at roots; occasional ambient water twinkle. Do not add fog overhaul, birds, lanterns, mountains, stream ambience, audio, physically simulated foliage or screen-space bloom merely because "etc." was mentioned.

**Lifecycle and topology:** Every particle set has a **hard simultaneous capacity** and bounded lifetime/cyclic wrapping. **Proposed starter caps (NOT measured):** ECO ≤ 70 fireflies + 55 petals + 15 leaves; QUALITY ≤ 160 fireflies + 130 petals + 30 leaves. These are upper bounds for tuning, not mandatory counts and **not frame-rate guarantees**. Keep a common single scene implementation with profile knobs; CPU update must not allocate per particle every frame. No unbounded object births or new texture loads per event. Use generated/material-free colors or local generated sprite texture when necessary; if third-party assets are proposed, require explicit provenance and commercial rights, no paid services.

### Phase 4 — Gift celebration around exact actor and gentle return (required)

1. Use **existing authoritative `SliceDriver.update` / Engine snapshot and typed `giftFx`**. FX controllers may only *consume* confirmed/observed status; they must never change gift queue, confirmation count, dedup logic or focus clock. Maintain exact mapping by `roomSessionId + requestId + actorId + seatId`. The 3D origin is the selected **real** seat FXAnchor/head area or water X/Z near pad, obtained from runtime transforms; do NOT place FX using camera-screen coordinates or a guessed user name.
2. During **provisional/observed** combo, permit a modest acknowledgement (faint single halo/tiny motes) **without** claiming confirmed gift count or firing a full final celebration. At **first confirmed state transition** for that stable request, emit one bounded short burst of warm sparks/petals/halo (e.g. 0.8–2.0 s; tune visually), optionally water ripple. The same progress/final/replayed packet must **not restart** the celebration each rAF frame; record deduped lifecycle in the visual effect controller.
3. For queued B/C while A is focused, **do not play B/C's actor-specific focus celebration on A**, and do not silently lose a pending confirmed acknowledgement. A/B/C should each receive a readable, brief reaction at their own actor when active, driven by the exact request lifecycle. Any queued event display policy must be documented and tested.
4. Keep celebration spatially **around the body/lotus edge** and below or beside the nameplate, not through the face/palms, not covering text or turning into camera-wide confetti. Do not change camera shot sequence to showcase the FX. A few sparks may rise toward Sakura while the effect decays.
5. On `CINE_RETURN` smoothly fade actor-specific gift FX, leaving ambient elements continuing in world time with no reset/pop. If a new gift arrives during return, transition to the correct actor without cross-person ghost FX.
6. **No-seat/expired/stale/reconnect:** preserve truthful text overlay only when no actor/seat is allocated; **do not attach 3D gift FX or ripple to the wrong actor or pad**. On room/session change, clear stale pools and dedup ledger; tests ensure no cross-session leak. For DOM name/gift labels keep `textContent`/sanitization; do not turn user text into HTML.
7. No fake `react_gift` action/GLB animation. This task is strictly renderer particles and shader response.

### Phase 5 — Optimization discipline, evidence, and handoff

1. Deliver a small typed visual controller API with `update(sceneTime, snapshot/presentation)` or equivalent, explicit `dispose()`, no direct event-worker calls and no hidden shader state that cannot be reset. Ensure WebGL context lost/restored, HMR/pagehide disposal, forward time and deterministic review sampling behave correctly. Fixed seed+time+event trace must reproduce positions/emission outcomes.
2. ECO and QUALITY settings must differ in **measured visible density/expense**, not event correctness. Favor batched draw calls and pooled resources. Never allocate a new material/geometry for each gift event. Declare active counts, allocated pools, drawcalls, triangles, textures, JS heap (when available) and frame-time median/p95/p99, compared with the **same-environment** P0.9 baseline.
3. Test long no-gift camera ≥ 85 s (two 40 s loops + margin), full DEMO ≥ 66 s A→B→C and return, repeat burst/confirmation, B/C queued, capacity fallback, disconnected session, lost-and-restored graphics context. If slow software SwiftShader causes render-frames to differ from virtual 60Hz, **log virtual time vs wall-clock and don't misstate FPS**.
4. Provide honest visual tests: actual native 720×1280 WebGL screenshots (not generated images or Cycles):
   - A matched before/after of **water** from near-water and aerial/under-tree (at least 3 views including a 2-timestamp ripple difference).
   - Ambient fireflies near trunk in low angle; petals/leaves clearly identifiable, both ECO and QUALITY (at least 4 time/angle combinations).
   - **Gift observed**, confirmed A, confirmed B, confirmed C; return/fade; no-seat fallback (at least 6 views). Provide timeline/log anchors and the real actor identity for every effect.
   - Include **clean** scene screenshots with no diagnostics overlaid; keep a separate machine-readable report and direct viewer reproduction URL/seed.
   - Do not claim "contains visible particles" solely from JSON counts; inspect actual rendered pixels to see that they are visible and not occluding people/labels.
5. Test/build logs must show actual commands and exits; browser report must include repo source SHA, seed, WebGL vendor, viewport, ECO/QUALITY, event sequence, runtime counts, errors, 0/V1/GLB modifications and comparison artifacts. Capture enough images to audit scene, not only a single flattering frame.
6. Request a focused **stacked PR** (against current P0.9 branch pinned above) with exact base/head, changed files, test/build commands, evidence paths, known limits and source/asset hashes. **STOP `P010_SA_REVIEW_REQUIRED`**. SA reviews → Owner P0.10 visual decision → hardware profiling gate only after later instruction.

## 6. Required acceptance gates

| Gate | PASS condition | BLOCKER example |
|---|---|---|
| **W1: Water** | Visible calm animated multi-scale water, tree-grounded warm distorted reflection/glow; proper y=0 and tone mapping; no excessive high-contrast bands | Giant flat/static water, strobe, roots/lotus hidden, shader error |
| **A1: Ambience** | Three distinct visible layers: soft luminous motes, scarce Sakura petals, scarce leaves; anchored to Sakura region; no clutter | All particles invisible, random popping, particle rain or nameplate obscured |
| **G1: Gift semantics** | Observed vs confirmed visually distinguished; exact actor A→B→C each reacts once, FIFO maintained, no wrong seat FX and truthful fallback | Wrong actor reacts, progress repeats trigger bursts, confirmed count changed |
| **G2: UX** | Effect starts and decays smoothly, readable face/palms/nameplate/gift text, ambience persists through gift/return | Flash/strobe, camera overridden, effect stuck after gift |
| **R1: Regression** | P0.9 tree-facing and all 4 seeded camera routes unchanged, asset SHA pinned; all prior viewer/event tests/builds PASS | Camera/actor GLB change, event count/identity regression |
| **P1: Bounded resources** | ECO/QUALITY controlled pool caps, counts & draw calls recorded; measured ΔFPS/frametime vs *same host* no-FX baseline, no unbounded growth | Unbounded FX objects or unmeasured/false RTX claims |
| **E1: Evidence** | Real native WebGL PNGs and logs, correct seeded timeline, reproducible Windows commands; documented PBR and missing video | Concept image presented as native browser screenshot, invented GPU numbers |

**Performance truth:** Target hardware remains RTX 3050 Ti 4GB ECO and RTX 3060 8GB QUALITY at 720×1280, with LIVE Studio separate. The *later* target is ~30 FPS, but this task **does not grant RTX or LIVE pass**. On software SwiftShader, prioritize reporting exact renderer/browser context and same-system before/after frame timings without claiming that those figures predict RTX results. If ECO FX visibly degrades native Owner browser, tune counts to restore smoothness before requesting visual approval; do not run LIVE in this phase.

## 7. Known valid Windows PowerShell commands

These scripts are **verified at P0.9 baseline**; Node >=24. Execute the commands actually available on the implementation branch and capture real outputs:

```powershell
# In P0.10 code checkout (based exactly on P0.9 SHA)
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

Open `http://127.0.0.1:5173/?seed=9&clean=1` (idle) or `http://127.0.0.1:5173/?seed=9&demo=gifts&clean=1` (A/B/C). The baseline viewer already declares `evidence:p09`, **not `evidence:p010`**. Codex may add `evidence:p010` only after implementing and running the script, with its required browser configuration and true logged output. Add an optional debug `?fx=off` or equivalent in viewer **if actually implemented** for exact before/after screenshot/FPS comparisons; never misrepresent an unimplemented option. Comparison cameras `?view=...` should remain unbiased by ambient FX unless explicitly requested.

## 8. Submission report format — required

1. **SA finding → concrete Codex fix → evidence → status** for water, fireflies/motes, Sakura petals, leaves, gift FX, fallback, performance.
2. New branch, PR URL, exact P0.9 base SHA, new HEAD SHA, files changed and current stack. State all PR #1–#6 remain unmerged and unchanged.
3. Original binary SHA/bytes unchanged, Event Engine byte equality, anchor and P0.9 camera invariants.
4. Seeded particle caps/active counts, event dedup keys, A/B/C visual lifecycle trace, reference screenshot path list. Distinguish **provisional** vs **confirmed** and no-seat/expired cases.
5. Exact tested commands/build outputs, capture resolution, vendor/browser, before/after FPS+p50/p95/p99 (where available), leaks/repeated-run findings, known visual/PBR limitations, video absent if not available.
6. Explicit tools/cost **0 VND**; no Blender, LIVE, V1 or asset rework. State real owner actions pending.
7. **STOP: P010_SA_REVIEW_REQUIRED.** Request SA review and then Owner visual GO. **No merge, deployment, hardware/LIVE claiming, or automatic next phase.**
